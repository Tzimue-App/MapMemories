import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { FakeAuthService, fakeModificationService, provideFake, provideFakeAuth } from '../../testing/fakes';
import { BoundaryItem, DEFAULT_BOUNDARY_COLOR } from '../models/boundary';
import { Modification } from '../models/modification';
import { DEFAULT_PIN_COLOR, DEFAULT_PIN_RADIUS } from '../models/pin';
import { MapStateService } from './map-state.service';
import { ModificationService } from './modification.service';

describe('MapStateService', () => {
  let auth: FakeAuthService;
  let mods: ReturnType<typeof fakeModificationService>;
  let state: MapStateService;

  const polygon = '{"type":"Polygon","coordinates":[[[4.0,50.0],[5.0,50.0],[5.0,51.0],[4.0,51.0],[4.0,50.0]]]}';
  const belgium: BoundaryItem = {
    osmId: 100,
    name: 'Belgium',
    displayName: 'Kingdom of Belgium',
    boundaryType: 'administrative',
    adminLevel: 2,
    geojson: polygon,
  };

  const flush = async () => {
    TestBed.tick();
    await Promise.resolve();
    await Promise.resolve();
  };

  const signedIn = async (backend: Modification[] = []) => {
    mods.getModifications.mockReturnValue(of(backend));
    auth.signIn();
    await flush();
  };

  beforeEach(() => {
    auth = new FakeAuthService();
    mods = fakeModificationService();
    TestBed.configureTestingModule({
      providers: [provideFakeAuth(auth), provideFake(ModificationService, mods)],
    });
    state = TestBed.inject(MapStateService);
  });

  describe('initial state', () => {
    it('starts centred on Paris at zoom 13 with nothing on the map', () => {
      expect(state.center()).toEqual([48.8566, 2.3522]);
      expect(state.zoom()).toBe(13);
      expect(state.pins()).toEqual([]);
      expect(state.savedBoundaries()).toEqual([]);
      expect(state.activeTab()).toBe('address');
      expect(state.selectedElement()).toBeNull();
      expect(state.isGlobalDrawerOpen()).toBe(false);
    });

    it('opens the auth modal once auth has loaded and nobody is signed in', async () => {
      auth.loading.set(true);
      await flush();
      expect(state.isAuthModalOpen()).toBe(false);

      auth.loading.set(false);
      await flush();
      expect(state.isAuthModalOpen()).toBe(true);
    });
  });

  describe('loading from the backend', () => {
    it('loads pins/radii and boundaries when the user signs in', async () => {
      await signedIn([
        {
          id: 1,
          type: 'PIN',
          title: 'Home',
          lat: 48.85,
          lng: 2.35,
          color: '#ff0000',
          createdAt: '2026-10-10T10:00:00Z',
        },
        { id: 2, type: 'RADIUS', title: 'Zone', lat: 48.8, lng: 2.3, radiusMeters: 500 },
        {
          id: 3,
          type: 'BOUNDARY',
          title: 'Belgium',
          description: 'Kingdom of Belgium',
          lat: 50,
          lng: 4,
          geojson: polygon,
          osmId: 100,
        },
        { id: 4, type: 'BOUNDARY', title: 'Broken', lat: 0, lng: 0 },
      ]);

      expect(state.pins()).toEqual([
        {
          id: 'pin-1',
          dbId: 1,
          lat: 48.85,
          lng: 2.35,
          label: 'Home',
          radiusMeters: 0,
          color: '#ff0000',
          createdAt: '2026-10-10T10:00:00Z',
        },
        {
          id: 'pin-2',
          dbId: 2,
          lat: 48.8,
          lng: 2.3,
          label: 'Zone',
          radiusMeters: 500,
          color: '#3388ff',
          createdAt: undefined,
        },
      ]);
      expect(state.savedBoundaries()).toEqual([
        expect.objectContaining({
          id: 'boundary-3',
          dbId: 3,
          osmId: 100,
          name: 'Belgium',
          displayName: 'Kingdom of Belgium',
          adminLevel: 8,
          geojson: polygon,
          color: DEFAULT_BOUNDARY_COLOR,
          visible: true,
        }),
      ]);
    });

    it('clears everything (pins, boundaries, selection, drawer) on sign out', async () => {
      await signedIn([{ id: 1, type: 'PIN', title: 'Home', lat: 1, lng: 2 }]);
      state.openGlobalDrawer();
      state.selectElement(state.unifiedElements()[0]);

      auth.signOut();
      await flush();

      expect(state.pins()).toEqual([]);
      expect(state.savedBoundaries()).toEqual([]);
      expect(state.selectedElement()).toBeNull();
      expect(state.isGlobalDrawerOpen()).toBe(false);
    });

    it('falls back to an empty map when loading fails', async () => {
      mods.getModifications.mockReturnValue(throwError(() => new Error('500')));
      auth.signIn();
      await flush();

      expect(state.pins()).toEqual([]);
      expect(state.savedBoundaries()).toEqual([]);
    });
  });

  describe('pins', () => {
    it('adds a default pin and persists it when signed in, keeping its id stable', async () => {
      await signedIn();
      mods.saveModification.mockReturnValue(of({ id: 42 }));

      state.addPin(48.1, 2.1);
      const [pin] = state.pins();
      expect(pin).toEqual(
        expect.objectContaining({ lat: 48.1, lng: 2.1, radiusMeters: DEFAULT_PIN_RADIUS, color: DEFAULT_PIN_COLOR }),
      );
      expect(mods.saveModification).toHaveBeenCalledWith({
        type: 'RADIUS',
        title: 'Saved Marker',
        description: 'Lat: 48.1, Lng: 2.1',
        lat: 48.1,
        lng: 2.1,
        radiusMeters: DEFAULT_PIN_RADIUS,
        color: DEFAULT_PIN_COLOR,
      });

      await flush();
      expect(state.pins()[0]).toEqual({ ...pin, dbId: 42 });
    });

    it('adds pins locally without calling the API when signed out', async () => {
      state.addPin(1, 2);
      await flush();

      expect(state.pins()).toHaveLength(1);
      expect(mods.saveModification).not.toHaveBeenCalled();
    });

    it('moves a pin, changes its radius (0 disables it) and colour', () => {
      state.addPin(1, 2);
      const id = state.pins()[0].id;

      state.movePin(id, 3, 4);
      state.setRadius(id, 0);
      state.setPinColor(id, '#EF4444');
      expect(state.pins()[0]).toEqual(
        expect.objectContaining({ lat: 3, lng: 4, radiusMeters: 0, radiusDisabled: true, color: '#EF4444' }),
      );

      state.setRadius(id, 2500);
      expect(state.pins()[0]).toEqual(expect.objectContaining({ radiusMeters: 2500, radiusDisabled: false }));
    });

    it('removes a pin, deletes it in the backend and closes its detail panel', async () => {
      await signedIn([{ id: 7, type: 'PIN', title: 'Home', lat: 1, lng: 2 }]);
      state.selectElement(state.unifiedElements()[0]);

      state.removePin('pin-7');

      expect(state.pins()).toEqual([]);
      expect(mods.deleteModification).toHaveBeenCalledWith(7);
      expect(state.selectedElement()).toBeNull();
    });

    it('ensurePinSaved returns the existing database id without saving again', async () => {
      await signedIn([{ id: 7, type: 'PIN', title: 'Home', lat: 1, lng: 2 }]);

      expect(await state.ensurePinSaved('pin-7')).toBe(7);
      expect(mods.saveModification).not.toHaveBeenCalled();
    });

    it('ensurePinSaved creates an unsaved pin in the backend and records its dbId', async () => {
      state.addPin(5, 6);
      const id = state.pins()[0].id;
      mods.saveModification.mockReturnValue(of({ id: 99 }));

      expect(await state.ensurePinSaved(id)).toBe(99);
      expect(state.pins()[0].dbId).toBe(99);
    });

    it('ensurePinSaved reuses an in-flight save instead of creating a duplicate', async () => {
      await signedIn();
      const pending = new Subject<Modification>();
      mods.saveModification.mockReturnValue(pending);

      state.addPin(5, 6);
      const result = state.ensurePinSaved(state.pins()[0].id);
      pending.next({ id: 5, type: 'RADIUS', title: 'x', lat: 5, lng: 6 });
      pending.complete();

      expect(await result).toBe(5);
      expect(mods.saveModification).toHaveBeenCalledTimes(1);
    });
  });

  describe('boundaries', () => {
    it('asks the user to sign in instead of adding a boundary when signed out', () => {
      state.addBoundary(belgium);

      expect(state.savedBoundaries()).toEqual([]);
      expect(state.isAuthModalOpen()).toBe(true);
    });

    it('adds and persists a boundary when signed in', async () => {
      await signedIn();
      mods.saveModification.mockReturnValue(of({ id: 12 }));

      state.addBoundary(belgium);

      expect(state.savedBoundaries()[0]).toEqual(
        expect.objectContaining({ name: 'Belgium', color: DEFAULT_BOUNDARY_COLOR, visible: true }),
      );
      expect(mods.saveModification).toHaveBeenCalledWith({
        type: 'BOUNDARY',
        title: 'Belgium',
        description: 'Kingdom of Belgium',
        lat: 50,
        lng: 4,
        color: DEFAULT_BOUNDARY_COLOR,
        geojson: polygon,
        osmId: 100,
      });
      await flush();
      expect(state.savedBoundaries()[0].dbId).toBe(12);
    });

    it('changes a boundary colour and removes it (deleting it in the backend)', async () => {
      await signedIn([{ id: 3, type: 'BOUNDARY', title: 'Belgium', lat: 50, lng: 4, geojson: polygon }]);

      state.setBoundaryColor('boundary-3', '#ef4444');
      expect(state.savedBoundaries()[0].color).toBe('#ef4444');

      state.removeBoundary('boundary-3');
      expect(state.savedBoundaries()).toEqual([]);
      expect(mods.deleteModification).toHaveBeenCalledWith(3);
    });

    it('toggles the saved boundaries list', () => {
      state.toggleSavedList();
      expect(state.showSavedList()).toBe(true);
      state.toggleSavedList();
      expect(state.showSavedList()).toBe(false);
    });
  });

  describe('derived state', () => {
    it('exposes singular/plural counters', async () => {
      expect(state.pinsLabel()).toBe('0 Pins');
      expect(state.boundariesLabel()).toBe('0 Boundaries');

      await signedIn([
        { id: 1, type: 'PIN', title: 'A', lat: 1, lng: 2 },
        { id: 3, type: 'BOUNDARY', title: 'B', lat: 50, lng: 4, geojson: polygon },
      ]);

      expect(state.pinsLabel()).toBe('1 Pin');
      expect(state.boundariesLabel()).toBe('1 Boundary');
    });

    it('builds the unified directory list from pins and boundaries', async () => {
      await signedIn([
        { id: 1, type: 'PIN', title: '', lat: 48.85661, lng: 2.35222, color: '#3B82F6' },
        { id: 2, type: 'RADIUS', title: 'Zone', lat: 1, lng: 2, radiusMeters: 500, color: '#EF4444' },
        {
          id: 3,
          type: 'BOUNDARY',
          title: 'Belgium',
          description: 'Kingdom',
          lat: 0,
          lng: 0,
          geojson: polygon,
          osmId: 100,
        },
      ]);

      expect(state.unifiedElements()).toEqual([
        expect.objectContaining({
          id: 'pin-1',
          dbId: 1,
          type: 'PIN',
          title: 'Pin Marker',
          description: 'Coordinates: 48.8566, 2.3522',
        }),
        expect.objectContaining({ id: 'pin-2', dbId: 2, type: 'RADIUS', title: 'Zone', radiusMeters: 500 }),
        expect.objectContaining({
          id: 'boundary-3',
          dbId: 3,
          type: 'BOUNDARY',
          title: 'Belgium',
          description: 'Kingdom',
          lat: 50,
          lng: 4,
          geojson: polygon,
          adminLevel: 8,
        }),
      ]);
    });

    it('names an unlabelled circle "Circle Area"', () => {
      state.addPin(1, 2);
      expect(state.unifiedElements()[0]).toEqual(expect.objectContaining({ type: 'RADIUS', title: 'Circle Area' }));
    });
  });

  describe('navigation', () => {
    it('flies to a searched location at zoom 15', () => {
      state.selectLocation({ id: 1, displayName: 'Lyon, France', lat: 45.764, lon: 4.8357 });

      expect(state.center()).toEqual([45.764, 4.8357]);
      expect(state.zoom()).toBe(15);
      expect(state.selectedPlace()).toBe('Lyon, France');
    });

    it('opens an element from the directory: centre, zoom, detail panel, drawer closed', async () => {
      await signedIn([{ id: 1, type: 'PIN', title: 'Louvre', lat: 48.86, lng: 2.33 }]);
      state.openGlobalDrawer();
      const element = state.unifiedElements()[0];

      state.openFromDirectory(element);

      expect(state.center()).toEqual([48.86, 2.33]);
      expect(state.zoom()).toBe(15);
      expect(state.selectedElement()).toBe(element);
      expect(state.isGlobalDrawerOpen()).toBe(false);
    });

    it('deletes the element shown in the detail panel', async () => {
      await signedIn([
        { id: 1, type: 'PIN', title: 'A', lat: 1, lng: 2 },
        { id: 3, type: 'BOUNDARY', title: 'B', lat: 50, lng: 4, geojson: polygon },
      ]);
      const [pin, boundary] = state.unifiedElements();

      state.selectElement(pin);
      state.deleteElement(pin);
      state.deleteElement(boundary);

      expect(state.pins()).toEqual([]);
      expect(state.savedBoundaries()).toEqual([]);
      expect(state.selectedElement()).toBeNull();
      expect(mods.deleteModification).toHaveBeenCalledWith(1);
      expect(mods.deleteModification).toHaveBeenCalledWith(3);
    });
  });
});
