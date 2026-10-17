import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BoundaryItem, DEFAULT_BOUNDARY_COLOR, SavedBoundaryItem } from '../models/boundary';
import { Modification, NewModification } from '../models/modification';
import { DEFAULT_PIN_COLOR, DEFAULT_PIN_RADIUS, PinItem } from '../models/pin';
import { SearchResult } from '../models/search';
import { UnifiedMapElement } from '../models/view';
import { parseGeoJson } from '../shared/geo-area';
import { AuthService } from './auth.service';
import { ModificationService } from './modification.service';

export type LatLngTuple = [number, number];
export type SearchTab = 'address' | 'boundary';

const DEFAULT_CENTER: LatLngTuple = [48.8566, 2.3522];
const DEFAULT_ZOOM = 13;
const FOCUS_ZOOM = 15;
const LEGACY_PIN_COLOR = '#3388ff';

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

/** First vertex of a Polygon outer ring, as [lat, lng]. */
function firstVertex(geojson: string): LatLngTuple | null {
  const vertex = parseGeoJson(geojson)?.coordinates?.[0]?.[0];
  return Array.isArray(vertex) && typeof vertex[0] === 'number' ? [vertex[1], vertex[0]] : null;
}

const localId = (prefix: string) => `${prefix}-local-${crypto.randomUUID()}`;

function pinToModification(pin: PinItem): NewModification {
  return {
    type: pin.radiusMeters > 0 ? 'RADIUS' : 'PIN',
    title: pin.label || 'Saved Marker',
    description: `Lat: ${pin.lat}, Lng: ${pin.lng}`,
    lat: pin.lat,
    lng: pin.lng,
    radiusMeters: pin.radiusMeters,
    color: pin.color,
  };
}

function modificationToPin(mod: Modification): PinItem {
  return {
    id: `pin-${mod.id}`,
    dbId: mod.id,
    lat: mod.lat,
    lng: mod.lng,
    label: mod.title,
    radiusMeters: mod.radiusMeters || 0,
    color: mod.color || LEGACY_PIN_COLOR,
    createdAt: mod.createdAt,
  };
}

function modificationToBoundary(mod: Modification): SavedBoundaryItem {
  return {
    id: `boundary-${mod.id}`,
    dbId: mod.id,
    osmId: mod.osmId ?? 0,
    name: mod.title,
    displayName: mod.description || mod.title,
    // The backend does not store these two fields; the level badge therefore defaults to "Municipality".
    boundaryType: 'administrative',
    adminLevel: 8,
    geojson: mod.geojson!,
    color: mod.color || DEFAULT_BOUNDARY_COLOR,
    visible: true,
    createdAt: mod.createdAt,
  };
}

/**
 * Single source of truth for the map screen (replaces the React App.tsx useState hooks).
 * Every mutation is an explicit method; persistence happens alongside the optimistic update.
 */
@Injectable({ providedIn: 'root' })
export class MapStateService {
  private readonly auth = inject(AuthService);
  private readonly modifications = inject(ModificationService);

  /** In-flight "create in backend" requests, keyed by pin id, so a pin is never saved twice. */
  private readonly pendingPinSaves = new Map<string, Promise<number>>();

  private readonly _center = signal<LatLngTuple>(DEFAULT_CENTER);
  private readonly _zoom = signal(DEFAULT_ZOOM);
  private readonly _selectedPlace = signal<string | null>(null);
  private readonly _pins = signal<PinItem[]>([]);
  private readonly _savedBoundaries = signal<SavedBoundaryItem[]>([]);
  private readonly _activeTab = signal<SearchTab>('address');
  private readonly _showSavedList = signal(false);
  private readonly _isAuthModalOpen = signal(false);
  private readonly _isGlobalDrawerOpen = signal(false);
  private readonly _selectedElement = signal<UnifiedMapElement | null>(null);

  readonly center = this._center.asReadonly();
  readonly zoom = this._zoom.asReadonly();
  readonly selectedPlace = this._selectedPlace.asReadonly();
  readonly pins = this._pins.asReadonly();
  readonly savedBoundaries = this._savedBoundaries.asReadonly();
  readonly activeTab = this._activeTab.asReadonly();
  readonly showSavedList = this._showSavedList.asReadonly();
  readonly isAuthModalOpen = this._isAuthModalOpen.asReadonly();
  readonly isGlobalDrawerOpen = this._isGlobalDrawerOpen.asReadonly();
  readonly selectedElement = this._selectedElement.asReadonly();

  readonly pinsLabel = computed(() => plural(this._pins().length, 'Pin', 'Pins'));
  readonly boundariesLabel = computed(() => plural(this._savedBoundaries().length, 'Boundary', 'Boundaries'));

  readonly unifiedElements = computed<UnifiedMapElement[]>(() => [
    ...this._pins().map((pin) => this.pinToElement(pin)),
    ...this._savedBoundaries().map((boundary) => this.boundaryToElement(boundary)),
  ]);

  constructor() {
    // Load the user's map on sign-in, wipe it on sign-out (transitions only).
    let wasAuthenticated = false;
    effect(() => {
      const authenticated = this.auth.isAuthenticated();
      if (authenticated === wasAuthenticated) return;
      wasAuthenticated = authenticated;
      untracked(() => (authenticated ? void this.loadFromBackend() : this.clear()));
    });

    // Prompt for sign-in as soon as we know nobody is signed in.
    effect(() => {
      if (!this.auth.loading() && !this.auth.isAuthenticated()) {
        untracked(() => this._isAuthModalOpen.set(true));
      }
    });
  }

  // ─── Session ──────────────────────────────────────────────

  async loadFromBackend(): Promise<void> {
    try {
      const mods = await firstValueFrom(this.modifications.getModifications());
      this._pins.set(mods.filter((m) => m.type === 'PIN' || m.type === 'RADIUS').map(modificationToPin));
      this._savedBoundaries.set(mods.filter((m) => m.type === 'BOUNDARY' && m.geojson).map(modificationToBoundary));
    } catch {
      this._pins.set([]);
      this._savedBoundaries.set([]);
    }
  }

  clear(): void {
    this._pins.set([]);
    this._savedBoundaries.set([]);
    this._selectedElement.set(null);
    this._isGlobalDrawerOpen.set(false);
    this.pendingPinSaves.clear();
  }

  // ─── Pins ─────────────────────────────────────────────────

  addPin(lat: number, lng: number): void {
    const pin: PinItem = { id: localId('pin'), lat, lng, radiusMeters: DEFAULT_PIN_RADIUS, color: DEFAULT_PIN_COLOR };
    this._pins.update((pins) => [...pins, pin]);

    if (this.auth.isAuthenticated()) {
      this.savePin(pin).catch(() => undefined);
    }
  }

  movePin(id: string, lat: number, lng: number): void {
    this.updatePin(id, { lat, lng });
  }

  setRadius(id: string, radiusMeters: number): void {
    this.updatePin(id, { radiusMeters, radiusDisabled: radiusMeters === 0 });
  }

  setPinColor(id: string, color: string): void {
    this.updatePin(id, { color });
  }

  removePin(id: string): void {
    const pin = this._pins().find((p) => p.id === id);
    this._pins.update((pins) => pins.filter((p) => p.id !== id));
    this.deselect(id);

    if (pin?.dbId && this.auth.isAuthenticated()) {
      this.modifications.deleteModification(pin.dbId).subscribe({ error: () => undefined });
    }
  }

  /** Returns the pin's database id, creating the pin in the backend first if needed. */
  async ensurePinSaved(id: string): Promise<number> {
    const pin = this._pins().find((p) => p.id === id);
    if (!pin) throw new Error(`Unknown pin ${id}`);
    if (pin.dbId) return pin.dbId;
    return this.pendingPinSaves.get(id) ?? this.savePin(pin);
  }

  private savePin(pin: PinItem): Promise<number> {
    const save = firstValueFrom(this.modifications.saveModification(pinToModification(pin))).then((saved) => {
      if (!saved?.id) throw new Error('Failed to save pin to database');
      this.updatePin(pin.id, { dbId: saved.id });
      return saved.id;
    });
    this.pendingPinSaves.set(pin.id, save);
    save.finally(() => this.pendingPinSaves.delete(pin.id)).catch(() => undefined);
    return save;
  }

  private updatePin(id: string, changes: Partial<PinItem>): void {
    this._pins.update((pins) => pins.map((p) => (p.id === id ? { ...p, ...changes } : p)));
  }

  // ─── Boundaries ───────────────────────────────────────────

  addBoundary(boundary: BoundaryItem): void {
    if (!this.auth.isAuthenticated()) {
      this.openAuthModal();
      return;
    }

    const saved: SavedBoundaryItem = {
      ...boundary,
      id: localId('boundary'),
      color: DEFAULT_BOUNDARY_COLOR,
      visible: true,
    };
    this._savedBoundaries.update((list) => [...list, saved]);

    const [lat, lng] = firstVertex(boundary.geojson) ?? this._center();
    this.modifications
      .saveModification({
        type: 'BOUNDARY',
        title: boundary.name,
        description: boundary.displayName,
        lat,
        lng,
        color: DEFAULT_BOUNDARY_COLOR,
        geojson: boundary.geojson,
        osmId: boundary.osmId,
      })
      .subscribe({
        next: (res) => res?.id && this.updateBoundary(saved.id, { dbId: res.id }),
        error: () => undefined,
      });
  }

  /** Local only: the API has no update route, so the colour is not persisted (same as the React app). */
  setBoundaryColor(id: string, color: string): void {
    this.updateBoundary(id, { color });
  }

  removeBoundary(id: string): void {
    const boundary = this._savedBoundaries().find((b) => b.id === id);
    this._savedBoundaries.update((list) => list.filter((b) => b.id !== id));
    this.deselect(id);

    if (boundary?.dbId && this.auth.isAuthenticated()) {
      this.modifications.deleteModification(boundary.dbId).subscribe({ error: () => undefined });
    }
  }

  private updateBoundary(id: string, changes: Partial<SavedBoundaryItem>): void {
    this._savedBoundaries.update((list) => list.map((b) => (b.id === id ? { ...b, ...changes } : b)));
  }

  // ─── Navigation & UI ──────────────────────────────────────

  selectLocation(result: SearchResult): void {
    this.flyTo([result.lat, result.lon]);
    this._selectedPlace.set(result.displayName);
  }

  openFromDirectory(element: UnifiedMapElement): void {
    this.flyTo([element.lat, element.lng]);
    this._selectedElement.set(element);
    this._isGlobalDrawerOpen.set(false);
  }

  selectElement(element: UnifiedMapElement | null): void {
    this._selectedElement.set(element);
  }

  selectElementById(id: string): void {
    this._selectedElement.set(this.unifiedElements().find((e) => e.id === id) ?? null);
  }

  deleteElement(element: UnifiedMapElement): void {
    if (element.type === 'BOUNDARY') {
      this.removeBoundary(element.id);
    } else {
      this.removePin(element.id);
    }
    this._selectedElement.set(null);
  }

  setActiveTab(tab: SearchTab): void {
    this._activeTab.set(tab);
  }

  toggleSavedList(): void {
    this._showSavedList.update((open) => !open);
  }

  openAuthModal(): void {
    this._isAuthModalOpen.set(true);
  }

  closeAuthModal(): void {
    this._isAuthModalOpen.set(false);
  }

  openGlobalDrawer(): void {
    this._isGlobalDrawerOpen.set(true);
  }

  closeGlobalDrawer(): void {
    this._isGlobalDrawerOpen.set(false);
  }

  private flyTo(center: LatLngTuple): void {
    this._center.set(center);
    this._zoom.set(FOCUS_ZOOM);
  }

  private deselect(id: string): void {
    if (this._selectedElement()?.id === id) {
      this._selectedElement.set(null);
    }
  }

  // ─── Element mapping ──────────────────────────────────────

  private pinToElement(pin: PinItem): UnifiedMapElement {
    const isCircle = pin.radiusMeters > 0;
    return {
      id: pin.id,
      dbId: pin.dbId,
      type: isCircle ? 'RADIUS' : 'PIN',
      title: pin.label || (isCircle ? 'Circle Area' : 'Pin Marker'),
      description: `Coordinates: ${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`,
      lat: pin.lat,
      lng: pin.lng,
      radiusMeters: pin.radiusMeters,
      color: pin.color,
      createdAt: pin.createdAt,
    };
  }

  private boundaryToElement(boundary: SavedBoundaryItem): UnifiedMapElement {
    const [lat, lng] = firstVertex(boundary.geojson) ?? this._center();
    return {
      id: boundary.id,
      dbId: boundary.dbId,
      type: 'BOUNDARY',
      title: boundary.name,
      description: boundary.displayName,
      lat,
      lng,
      color: boundary.color || DEFAULT_BOUNDARY_COLOR,
      geojson: boundary.geojson,
      osmId: boundary.osmId,
      adminLevel: boundary.adminLevel,
      createdAt: boundary.createdAt,
    };
  }
}
