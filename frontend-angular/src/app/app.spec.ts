import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Dom } from '../testing/dom';
import {
  FakeAuthService,
  fakeMediaService,
  fakeModificationService,
  fakeNoteService,
  fakeSearchService,
  provideFake,
  provideFakeAuth,
} from '../testing/fakes';
import { App } from './app';
import { BoundaryService } from './core/boundary.service';
import { MapStateService } from './core/map-state.service';
import { MediaService } from './core/media.service';
import { ModificationService } from './core/modification.service';
import { NominatimService } from './core/nominatim.service';
import { NoteService } from './core/note.service';
import { Modification } from './models/modification';

describe('App', () => {
  let auth: FakeAuthService;
  let mods: ReturnType<typeof fakeModificationService>;

  const polygon = '{"type":"Polygon","coordinates":[[[4.0,50.0],[5.0,50.0],[5.0,51.0],[4.0,51.0],[4.0,50.0]]]}';

  beforeEach(() => {
    auth = new FakeAuthService();
    mods = fakeModificationService();
    TestBed.configureTestingModule({
      providers: [
        provideFakeAuth(auth),
        provideFake(ModificationService, mods),
        provideFake(MediaService, fakeMediaService()),
        provideFake(NoteService, fakeNoteService()),
        provideFake(NominatimService, fakeSearchService()),
        provideFake(BoundaryService, fakeSearchService()),
      ],
    });
  });

  const render = async (signedInWith?: Modification[]) => {
    if (signedInWith) {
      mods.getModifications.mockReturnValue(of(signedInWith));
      auth.signIn('testuser');
    }
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const dom = Dom.of(fixture);
    const click = async (el: HTMLElement) => {
      el.click();
      await fixture.whenStable();
    };
    return { fixture, dom, click };
  };

  it('renders the map, the search overlay and a Sign In button', async () => {
    const { dom } = await render();

    expect(dom.byPlaceholder(/search address or place.../i)).toBeTruthy();
    expect(dom.query('.leaflet-container')).not.toBeNull();
    expect(dom.allButtons(/Sign In/).length).toBeGreaterThan(0);
  });

  it('prompts anonymous users to sign in (banner + auto-opened modal)', async () => {
    const { dom } = await render();

    expect(dom.text()).toContain('Sign in required to save map modifications.');
    expect(dom.byText('Sign In', 'h2')).toBeTruthy();
  });

  it('opens the auth modal from the Sign In button after it was closed', async () => {
    const { dom, click } = await render();
    await click(dom.button('Close'));
    expect(dom.queryByText('Sign In', 'h2')).toBeNull();

    await click(dom.allButtons(/Sign In/)[0]);

    expect(dom.byText('Sign In', 'h2')).toBeTruthy();
  });

  it('shows the signed-in user with a Logout button', async () => {
    const { dom } = await render([]);

    expect(dom.text()).toContain('testuser');
    expect(dom.button('Logout')).toBeTruthy();
    expect(dom.text()).not.toContain('Sign in required');
    expect(dom.queryByText('Sign In', 'h2')).toBeNull();
  });

  it('switches between address and boundary search', async () => {
    const { dom, click } = await render();

    await click(dom.button(/Boundary Search/));

    expect(dom.byPlaceholder(/search country, region, or city/i)).toBeTruthy();
    expect(dom.queryAll('[placeholder="Search address or place..."]')).toHaveLength(0);
  });

  it('shows pin and boundary counters', async () => {
    const { dom } = await render([
      { id: 1, type: 'PIN', title: 'A', lat: 48.85, lng: 2.35 },
      { id: 2, type: 'PIN', title: 'B', lat: 48.86, lng: 2.36 },
      { id: 3, type: 'BOUNDARY', title: 'Belgium', lat: 50, lng: 4, geojson: polygon },
    ]);

    expect(dom.text()).toContain('2 Pins');
    expect(dom.text()).toContain('1 Boundary');
    expect(dom.button('Open memories directory').textContent).toContain('Directory (3)');
  });

  it('opens the directory drawer and an element’s detail panel from it', async () => {
    const { dom, click } = await render([{ id: 1, type: 'PIN', title: 'Louvre Landmark', lat: 48.86, lng: 2.33 }]);

    await click(dom.button('Open memories directory'));
    expect(dom.byText('Memories Directory')).toBeTruthy();
    expect(dom.get('[data-testid="global-view-drawer"]').classList).toContain('translate-x-0');

    await click(dom.byText('Louvre Landmark', 'h3'));

    expect(dom.get('[data-testid="global-view-drawer"]').classList).toContain('-translate-x-full');
    expect(dom.get('[data-testid="detail-side-drawer"]').classList).toContain('translate-x-0');
    expect(TestBed.inject(MapStateService).zoom()).toBe(15);
  });

  it('deletes an element from its detail panel', async () => {
    const { dom, click } = await render([{ id: 1, type: 'PIN', title: 'Louvre Landmark', lat: 48.86, lng: 2.33 }]);
    await click(dom.button('Open memories directory'));
    await click(dom.byText('Louvre Landmark', 'h3'));

    await click(dom.button('Delete memory'));

    expect(mods.deleteModification).toHaveBeenCalledWith(1);
    expect(dom.button('Open memories directory').textContent).toContain('Directory (0)');
    expect(dom.query('[data-testid="detail-side-drawer"]')).toBeNull();
  });

  it('lists saved boundaries with colour and delete actions', async () => {
    const { dom, click } = await render([
      { id: 3, type: 'BOUNDARY', title: 'Belgium', lat: 50, lng: 4, geojson: polygon },
    ]);

    await click(dom.button(/1 Boundary/));
    expect(dom.byText('Saved Boundaries')).toBeTruthy();

    await click(dom.allButtons('Red')[0]);
    expect(TestBed.inject(MapStateService).savedBoundaries()[0].color).toBe('#ef4444');

    await click(dom.button('Delete boundary'));
    expect(mods.deleteModification).toHaveBeenCalledWith(3);
    expect(dom.text()).toContain('0 Boundaries');
  });

  it('shows the selected place after an address search', async () => {
    const { fixture, dom } = await render();

    TestBed.inject(MapStateService).selectLocation({ id: 1, displayName: 'Lyon, France', lat: 45.76, lon: 4.84 });
    await fixture.whenStable();

    expect(dom.text()).toContain('Lyon, France');
    expect(dom.text()).not.toContain('Click map to drop pin & radius');
  });

  it('clears the map on logout', async () => {
    const { dom, click } = await render([{ id: 1, type: 'PIN', title: 'User 1 Pin', lat: 48.85, lng: 2.35 }]);
    expect(dom.button('Open memories directory').textContent).toContain('Directory (1)');

    await click(dom.button('Logout'));

    expect(auth.logout).toHaveBeenCalled();
    expect(dom.button('Open memories directory').textContent).toContain('Directory (0)');
    expect(dom.queryAll('.leaflet-marker-icon')).toHaveLength(0);
  });
});
