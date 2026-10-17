import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Dom, typeInto } from '../../../testing/dom';
import {
  FakeAuthService,
  fakeMediaService,
  fakeNoteService,
  provideFake,
  provideFakeAuth,
} from '../../../testing/fakes';
import { photo } from '../../../testing/photos';
import { MapStateService } from '../../core/map-state.service';
import { MediaService } from '../../core/media.service';
import { NoteService } from '../../core/note.service';
import { PIN_COLOR_OPTIONS, PinItem } from '../../models/pin';
import { PinConfigPanel } from './pin-config-panel';

describe('PinConfigPanel', () => {
  let auth: FakeAuthService;
  let media: ReturnType<typeof fakeMediaService>;
  let notes: ReturnType<typeof fakeNoteService>;
  let mapState: { ensurePinSaved: ReturnType<typeof vi.fn> };

  const pin: PinItem = { id: 'pin-1', lat: 48.8566, lng: 2.3522, radiusMeters: 1000, color: '#3B82F6' };

  beforeEach(() => {
    auth = new FakeAuthService();
    media = fakeMediaService();
    notes = fakeNoteService();
    mapState = { ensurePinSaved: vi.fn(async () => 10) };
    TestBed.configureTestingModule({
      providers: [
        provideFakeAuth(auth),
        provideFake(MediaService, media),
        provideFake(NoteService, notes),
        provideFake(MapStateService, mapState),
      ],
    });
  });

  const render = async (value: PinItem = pin) => {
    const fixture = TestBed.createComponent(PinConfigPanel);
    fixture.componentRef.setInput('pin', value);
    const outputs = { radius: vi.fn(), color: vi.fn(), delete: vi.fn() };
    fixture.componentInstance.radiusChange.subscribe(outputs.radius);
    fixture.componentInstance.colorChange.subscribe(outputs.color);
    fixture.componentInstance.delete.subscribe(outputs.delete);
    await fixture.whenStable();
    return { fixture, dom: Dom.of(fixture), outputs };
  };

  it('renders the radius, slider, colour swatches and delete button', async () => {
    const { dom } = await render();

    expect(dom.allByText(/1000 m/).length).toBeGreaterThan(0);
    const slider = dom.get<HTMLInputElement>('input[type="range"][aria-label="Radius"]');
    expect(slider.value).toBe('1000');
    expect([slider.min, slider.max, slider.step]).toEqual(['0', '20000', '50']);
    PIN_COLOR_OPTIONS.forEach((color) => expect(dom.button(color.label)).toBeTruthy());
    expect(dom.button('Delete pin')).toBeTruthy();
  });

  it('emits radiusChange when the slider moves', async () => {
    const { dom, outputs } = await render();

    typeInto(dom.get<HTMLInputElement>('input[type="range"]'), '2500');

    expect(outputs.radius).toHaveBeenCalledWith(2500);
  });

  it('emits radiusChange for preset buttons, including Off', async () => {
    const { dom, outputs } = await render();

    expect(dom.allButtons(/^(Off|100m|500m|1km|5km|10km)$/).map((b) => b.textContent?.trim())).toEqual([
      'Off',
      '100m',
      '500m',
      '1km',
      '5km',
      '10km',
    ]);
    dom.button('500m').click();
    dom.button('Off').click();

    expect(outputs.radius).toHaveBeenNthCalledWith(1, 500);
    expect(outputs.radius).toHaveBeenNthCalledWith(2, 0);
  });

  it('shows the disabled state when the radius is 0', async () => {
    const { dom } = await render({ ...pin, radiusMeters: 0, radiusDisabled: true });
    expect(dom.allByText(/Radius Disabled/i).length).toBeGreaterThan(0);
  });

  it('formats small radii in metres', async () => {
    const { dom } = await render({ ...pin, radiusMeters: 250 });
    expect(dom.allByText('250 m').length).toBeGreaterThan(0);
  });

  it('emits colorChange when a swatch is clicked', async () => {
    const { dom, outputs } = await render();

    dom.button('Red').click();

    expect(outputs.color).toHaveBeenCalledWith('#EF4444');
  });

  it('emits delete and stops the click from reaching the map', async () => {
    const { dom, outputs } = await render();
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    const stopPropagation = vi.spyOn(click, 'stopPropagation');

    dom.button('Delete pin').dispatchEvent(click);

    expect(outputs.delete).toHaveBeenCalledWith('pin-1');
    expect(stopPropagation).toHaveBeenCalled();
  });

  it('shows the photo uploader on the Photos tab', async () => {
    const { fixture, dom } = await render();

    dom.button(/^Photos/).click();
    await fixture.whenStable();

    expect(dom.text()).toMatch(/add photo/i);
    expect(dom.text()).not.toMatch(/sign in required/i);
  });

  it('shows the note form on the Notes tab', async () => {
    const { fixture, dom } = await render();

    dom.button(/^Notes/).click();
    await fixture.whenStable();

    expect(dom.byPlaceholder(/add a detailed note/i)).toBeTruthy();
    expect(dom.button(/Save Note/)).toBeTruthy();
  });

  it('loads photos and notes of a saved pin when signed in and shows their counts', async () => {
    auth.signIn();
    media.getPhotos.mockReturnValue(of([photo(1, 'A'), photo(2, 'B')]));
    notes.getNotes.mockReturnValue(of([{ id: 3, modificationId: 7, content: 'Hi', createdAt: '' }]));

    const { dom } = await render({ ...pin, dbId: 7 });

    expect(media.getPhotos).toHaveBeenCalledWith(7);
    expect(notes.getNotes).toHaveBeenCalledWith(7);
    expect(dom.button(/^Photos/).textContent).toContain('2');
    expect(dom.button(/^Notes/).textContent).toContain('1');
  });

  it('does not reload media when unrelated pin fields change', async () => {
    auth.signIn();
    const { fixture } = await render({ ...pin, dbId: 7 });

    fixture.componentRef.setInput('pin', { ...pin, dbId: 7, radiusMeters: 2500 });
    await fixture.whenStable();

    expect(media.getPhotos).toHaveBeenCalledTimes(1);
    expect(notes.getNotes).toHaveBeenCalledTimes(1);
  });

  it('does not duplicate a photo returned both by the reload and the upload', async () => {
    const uploaded = photo(5, 'New');
    media.uploadPhoto.mockReturnValue(of(uploaded));
    media.getPhotos.mockReturnValue(of([uploaded]));
    auth.signIn();
    const { fixture, dom } = await render({ ...pin, dbId: 7 });
    dom.button(/^Photos/).click();
    await fixture.whenStable();

    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const input = dom.get<HTMLInputElement>('[data-testid="photo-file-input"]');
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    dom.get('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(dom.queryAll('[data-testid="photo-gallery"] app-auth-image')).toHaveLength(1);
  });

  it('does not load media for unsaved pins or anonymous users', async () => {
    await render({ ...pin, dbId: 7 });
    await render();

    expect(media.getPhotos).not.toHaveBeenCalled();
    expect(notes.getNotes).not.toHaveBeenCalled();
  });

  it('saves the pin first, then adds a note to it', async () => {
    notes.createNote.mockReturnValue(of({ id: 9, modificationId: 10, content: 'Memory', createdAt: '' }));
    const { fixture, dom } = await render();
    dom.button(/^Notes/).click();
    await fixture.whenStable();

    typeInto(dom.byPlaceholder<HTMLTextAreaElement>(/add a detailed note/i), 'Memory');
    await fixture.whenStable();
    dom.button(/Save Note/).click();
    await fixture.whenStable();

    expect(mapState.ensurePinSaved).toHaveBeenCalledWith('pin-1');
    expect(notes.createNote).toHaveBeenCalledWith(10, 'Memory');
    expect(dom.byText('Memory', 'p')).toBeTruthy();
  });

  it('deletes a photo of a saved pin', async () => {
    auth.signIn();
    media.getPhotos.mockReturnValue(of([photo(1, 'A')]));
    const { fixture, dom } = await render({ ...pin, dbId: 7 });
    dom.button(/^Photos/).click();
    await fixture.whenStable();

    dom.button('Delete Photo').click();
    await fixture.whenStable();

    expect(media.deletePhoto).toHaveBeenCalledWith(7, 1);
    expect(dom.text()).toContain('No photos attached yet.');
  });
});
