import { TestBed } from '@angular/core/testing';
import * as L from 'leaflet';
import { Dom } from '../../../testing/dom';
import {
  FakeAuthService,
  fakeMediaService,
  fakeModificationService,
  fakeNoteService,
  provideFake,
  provideFakeAuth,
} from '../../../testing/fakes';
import { MapStateService } from '../../core/map-state.service';
import { MediaService } from '../../core/media.service';
import { ModificationService } from '../../core/modification.service';
import { NoteService } from '../../core/note.service';
import { BoundaryItem } from '../../models/boundary';
import { MapView } from './map-view';

describe('MapView', () => {
  let state: MapStateService;
  let auth: FakeAuthService;

  const belgium: BoundaryItem = {
    osmId: 100,
    name: 'Belgium',
    displayName: 'Kingdom of Belgium',
    boundaryType: 'administrative',
    adminLevel: 2,
    geojson: '{"type":"Polygon","coordinates":[[[4.0,50.0],[5.0,50.0],[5.0,51.0],[4.0,51.0],[4.0,50.0]]]}',
  };

  beforeEach(() => {
    auth = new FakeAuthService();
    TestBed.configureTestingModule({
      providers: [
        provideFakeAuth(auth),
        provideFake(ModificationService, fakeModificationService()),
        provideFake(MediaService, fakeMediaService()),
        provideFake(NoteService, fakeNoteService()),
      ],
    });
    state = TestBed.inject(MapStateService);
  });

  const render = async () => {
    const fixture = TestBed.createComponent(MapView);
    await fixture.whenStable();
    const settle = () => fixture.whenStable();
    const leaflet = () => fixture.componentInstance['map']() as L.Map;
    return { fixture, dom: Dom.of(fixture), settle, leaflet };
  };

  const markers = (dom: Dom) => dom.queryAll('.leaflet-marker-icon');
  const paths = (dom: Dom) => dom.queryAll('path.leaflet-interactive');

  it('renders the Leaflet map container', async () => {
    const { dom } = await render();
    expect(dom.query('.leaflet-container')).not.toBeNull();
  });

  it('shows the OpenStreetMap attribution', async () => {
    const { dom } = await render();
    expect(dom.queryAll('a').some((a) => /OpenStreetMap/.test(a.textContent ?? ''))).toBe(true);
  });

  it('drops a default pin (marker + 1 km circle) where the map is clicked', async () => {
    const { dom, settle } = await render();

    dom.get('.leaflet-container').click();
    await settle();

    expect(state.pins()).toHaveLength(1);
    expect(markers(dom)).toHaveLength(1);
    expect(paths(dom)).toHaveLength(1);
  });

  it('draws a coloured pin icon', async () => {
    const { dom, settle } = await render();
    state.addPin(48.85, 2.35);
    await settle();

    expect(markers(dom)[0].innerHTML).toContain('background-color: #3B82F6');
  });

  it('does not draw a circle when the radius is 0', async () => {
    const { dom, settle } = await render();
    state.addPin(48.85, 2.35);
    state.setRadius(state.pins()[0].id, 0);
    await settle();

    expect(markers(dom)).toHaveLength(1);
    expect(paths(dom)).toHaveLength(0);
  });

  it('updates layers in place when a pin changes, and removes them when it is deleted', async () => {
    const { dom, settle } = await render();
    state.addPin(48.85, 2.35);
    await settle();
    const id = state.pins()[0].id;
    const markerElement = markers(dom)[0];

    state.setRadius(id, 5000);
    state.setPinColor(id, '#EF4444');
    await settle();
    expect(markers(dom)[0]).toBe(markerElement);
    expect(markerElement.innerHTML).toContain('background-color: #EF4444');
    expect(paths(dom)[0].getAttribute('stroke')).toBe('#EF4444');

    state.removePin(id);
    await settle();
    expect(markers(dom)).toHaveLength(0);
    expect(paths(dom)).toHaveLength(0);
  });

  it('selects the pin when its marker is clicked', async () => {
    const { dom, settle } = await render();
    state.addPin(48.8566, 2.3522);
    await settle();

    markers(dom)[0].click();
    await settle();

    expect(state.selectedElement()).toEqual(expect.objectContaining({ id: state.pins()[0].id, type: 'RADIUS' }));
  });

  it('opens the pin configuration popup and wires its actions to the store', async () => {
    const { dom, settle } = await render();
    state.addPin(48.85, 2.35);
    await settle();

    markers(dom)[0].click();
    await settle();
    const popup = Dom.document();
    expect(popup.query('.leaflet-popup-content app-pin-config-panel')).not.toBeNull();

    popup.button('5km').click();
    await settle();
    expect(state.pins()[0].radiusMeters).toBe(5000);
    expect(popup.text()).toContain('5 km (5000 m)');

    popup.button('Delete pin').click();
    await settle();
    expect(state.pins()).toHaveLength(0);
    expect(popup.query('app-pin-config-panel')).toBeNull();
  });

  it('keeps the dragged position of a pin', async () => {
    const { settle, fixture } = await render();
    state.addPin(48.85, 2.35);
    await settle();
    const marker = fixture.componentInstance['pinLayers'].get(state.pins()[0].id)!.marker as L.Marker;
    expect(marker.options.draggable).toBe(true);

    marker.setLatLng([45.76, 4.84]);
    marker.fire('dragend');

    expect(state.pins()[0]).toEqual(expect.objectContaining({ lat: 45.76, lng: 4.84 }));
  });

  it('draws saved boundaries, fits the view to them and opens their popup', async () => {
    auth.signIn();
    const { dom, settle, leaflet } = await render();
    const fitBounds = vi.spyOn(leaflet(), 'fitBounds');

    state.addBoundary(belgium);
    await settle();

    expect(paths(dom)).toHaveLength(1);
    expect(fitBounds).toHaveBeenCalledWith(expect.any(L.LatLngBounds), { padding: [20, 20], maxZoom: 14 });

    paths(dom)[0].dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 1, clientY: 1 }));
    await settle();
    const popup = Dom.document();
    expect(popup.query('app-boundary-config-panel')).not.toBeNull();
    expect(state.selectedElement()?.type).toBe('BOUNDARY');

    popup.button('Red').click();
    await settle();
    expect(state.savedBoundaries()[0].color).toBe('#ef4444');
    expect(paths(dom)[0].getAttribute('stroke')).toBe('#ef4444');

    popup.button('Delete boundary').click();
    await settle();
    expect(state.savedBoundaries()).toHaveLength(0);
    expect(paths(dom)).toHaveLength(0);
  });

  it('ignores boundaries with invalid GeoJSON', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    auth.signIn();
    const { dom, settle } = await render();

    state.addBoundary({ ...belgium, geojson: 'not json' });
    await settle();

    expect(paths(dom)).toHaveLength(0);
  });

  it('flies to the store centre and zoom', async () => {
    const { settle, leaflet } = await render();
    const flyTo = vi.spyOn(leaflet(), 'flyTo');

    state.selectLocation({ id: 1, displayName: 'Lyon', lat: 45.764, lon: 4.8357 });
    await settle();

    expect(flyTo).toHaveBeenCalledWith([45.764, 4.8357], 15, { duration: 1.5 });
  });

  it('removes the Leaflet map when destroyed', async () => {
    const { fixture, leaflet } = await render();
    const remove = vi.spyOn(leaflet(), 'remove');

    fixture.destroy();

    expect(remove).toHaveBeenCalled();
  });

  describe('marker clustering', () => {
    const addColocatedPins = (count: number, radiusMeters: number) => {
      for (let i = 0; i < count; i++) {
        state.addPin(48.8566, 2.3522);
        state.setRadius(state.pins()[i].id, radiusMeters);
      }
    };
    const clusters = (dom: Dom) => dom.queryAll('.remembermap-cluster');

    it('groups overlapping markers into a single cluster showing their count', async () => {
      const { dom, settle } = await render();
      addColocatedPins(5, 0);
      await settle();

      expect(clusters(dom)).toHaveLength(1);
      expect(clusters(dom)[0].textContent).toContain('5');
      expect(dom.queryAll('.custom-pin-marker')).toHaveLength(0);
    });

    it('keeps radius circles visible for pins hidden inside a cluster', async () => {
      const { dom, settle } = await render();
      addColocatedPins(3, 500);
      await settle();

      expect(clusters(dom)).toHaveLength(1);
      expect(paths(dom)).toHaveLength(3);
    });

    it('updates the cluster count when pins are removed', async () => {
      const { dom, settle } = await render();
      addColocatedPins(4, 0);
      await settle();
      expect(clusters(dom)[0].textContent).toContain('4');

      state.removePin(state.pins()[0].id);
      await settle();
      expect(clusters(dom)[0].textContent).toContain('3');
    });
  });

  describe('mobile-friendly controls', () => {
    it('places the zoom control bottom-right, clear of the search header overlay', async () => {
      const { dom } = await render();
      expect(dom.query('.leaflet-bottom.leaflet-right .leaflet-control-zoom')).not.toBeNull();
      expect(dom.query('.leaflet-top.leaflet-left .leaflet-control-zoom')).toBeNull();
    });
  });
});
