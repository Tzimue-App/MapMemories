import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Dom, typeInto } from '../../../testing/dom';
import { fakeMediaService, fakeNoteService, provideFake } from '../../../testing/fakes';
import { photo } from '../../../testing/photos';
import { MediaService } from '../../core/media.service';
import { NoteService } from '../../core/note.service';
import { UnifiedMapElement } from '../../models/view';
import { DetailSideDrawer } from './detail-side-drawer';

describe('DetailSideDrawer', () => {
  let media: ReturnType<typeof fakeMediaService>;
  let notes: ReturnType<typeof fakeNoteService>;

  const pinElement: UnifiedMapElement = {
    id: 'pin-10',
    dbId: 10,
    type: 'PIN',
    title: 'Eiffel Tower Visit',
    description: 'Trip to Paris in spring',
    lat: 48.8584,
    lng: 2.2945,
    color: '#3B82F6',
    createdAt: '2026-10-10T12:00:00Z',
    photos: [photo(101, 'Looking up', 'tower.jpg')],
    notes: [{ id: 201, modificationId: 10, content: 'Remember to book summit tickets early!', createdAt: '' }],
  };

  const circleElement: UnifiedMapElement = {
    id: 'pin-11',
    dbId: 11,
    type: 'RADIUS',
    title: 'Safety Perimeter',
    lat: 48.8584,
    lng: 2.2945,
    radiusMeters: 1000,
    color: '#EF4444',
  };

  const boundaryElement: UnifiedMapElement = {
    id: 'boundary-12',
    dbId: 12,
    type: 'BOUNDARY',
    title: 'Monaco District',
    lat: 43.7384,
    lng: 7.4246,
    color: '#8B5CF6',
    adminLevel: 2,
    geojson: JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [7.41, 43.73],
          [7.43, 43.73],
          [7.43, 43.75],
          [7.41, 43.75],
          [7.41, 43.73],
        ],
      ],
    }),
  };

  beforeEach(() => {
    media = fakeMediaService();
    notes = fakeNoteService();
    TestBed.configureTestingModule({
      providers: [provideFake(MediaService, media), provideFake(NoteService, notes)],
    });
  });

  const render = async (element: UnifiedMapElement | null, isOpen = true) => {
    const fixture = TestBed.createComponent(DetailSideDrawer);
    fixture.componentRef.setInput('isOpen', isOpen);
    fixture.componentRef.setInput('element', element);
    const closed = vi.fn();
    const deleted = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentInstance.delete.subscribe(deleted);
    await fixture.whenStable();
    const dom = Dom.of(fixture);
    const click = async (el: HTMLElement) => {
      el.click();
      await fixture.whenStable();
    };
    return { fixture, dom, closed, deleted, click };
  };

  it('renders nothing without an element', async () => {
    const { dom } = await render(null, false);
    expect(dom.query('[data-testid="detail-side-drawer"]')).toBeNull();
  });

  it('renders pin details, coordinates, photo carousel and notes', async () => {
    const { dom } = await render(pinElement);

    expect(dom.byText('Eiffel Tower Visit')).toBeTruthy();
    expect(dom.byText('Trip to Paris in spring')).toBeTruthy();
    expect(dom.text()).toContain('48.8584° N, 2.2945° E');
    expect(dom.text()).toContain('Looking up');
    expect(dom.byText('Remember to book summit tickets early!')).toBeTruthy();
    expect(media.getPhotos).not.toHaveBeenCalled();
  });

  it('fetches photos and notes when the element does not carry them', async () => {
    media.getPhotos.mockReturnValue(of([photo(1, 'Fetched photo')]));
    notes.getNotes.mockReturnValue(of([{ id: 1, modificationId: 11, content: 'Fetched note', createdAt: '' }]));

    const { dom } = await render(circleElement);

    expect(media.getPhotos).toHaveBeenCalledWith(11);
    expect(notes.getNotes).toHaveBeenCalledWith(11);
    expect(dom.text()).toContain('Fetched photo');
    expect(dom.text()).toContain('Fetched note');
  });

  it('shows the computed area of a circle', async () => {
    const { dom } = await render(circleElement);

    expect(dom.text()).toContain('3.1 km²');
    expect(dom.text()).toContain('Radius: 1 km');
  });

  it('shows the computed area and level of a boundary', async () => {
    const { dom } = await render(boundaryElement);

    expect(dom.text()).toContain('Surface Area');
    expect(dom.text()).toContain('Boundary (Level 2)');
  });

  it('emits delete with the element', async () => {
    const { dom, deleted } = await render(pinElement);
    dom.button('Delete memory').click();
    expect(deleted).toHaveBeenCalledWith(pinElement);
  });

  it('closes from the close button', async () => {
    const { dom, closed } = await render(pinElement);
    dom.button('Close detail panel').click();
    expect(closed).toHaveBeenCalled();
  });

  it('copies the coordinates to the clipboard', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { dom, click } = await render(pinElement);

    await click(dom.button(/Copy Coords/));

    expect(writeText).toHaveBeenCalledWith('48.858400, 2.294500');
    expect(dom.text()).toContain('Copied!');
  });

  it('offers photo upload only for saved elements', async () => {
    const saved = await render(pinElement);
    await saved.click(saved.dom.button(/^Photos/));
    expect(saved.dom.text()).toContain('Add Photo');

    const unsaved = await render({ ...pinElement, dbId: undefined });
    await unsaved.click(unsaved.dom.button(/^Photos/));
    expect(unsaved.dom.text()).not.toContain('Add Photo');
  });

  it('adds and deletes notes on the Notes tab', async () => {
    notes.createNote.mockReturnValue(of({ id: 300, modificationId: 10, content: 'New note', createdAt: '' }));
    const { fixture, dom, click } = await render(pinElement);
    await click(dom.button(/^Notes/));

    typeInto(dom.byPlaceholder<HTMLTextAreaElement>(/add a detailed note/i), 'New note');
    await fixture.whenStable();
    await click(dom.button(/Save Note/));
    expect(notes.createNote).toHaveBeenCalledWith(10, 'New note');
    expect(dom.byText('New note', 'p')).toBeTruthy();

    await click(dom.allButtons('Delete Note')[0]);
    expect(notes.deleteNote).toHaveBeenCalledWith(10, 300);
    expect(dom.queryByText('New note', 'p')).toBeNull();
  });
});
