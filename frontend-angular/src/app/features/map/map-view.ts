import {
  afterNextRender,
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  createComponent,
  DestroyRef,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  signal,
  Type,
  untracked,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { MapStateService } from '../../core/map-state.service';
import { DEFAULT_BOUNDARY_COLOR, SavedBoundaryItem } from '../../models/boundary';
import { PinItem } from '../../models/pin';
import { CLUSTER_OPTIONS } from '../../shared/cluster';
import { parseGeoJson } from '../../shared/geo-area';
import { BoundaryConfigPanel } from './boundary-config-panel';
import { PinConfigPanel } from './pin-config-panel';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const FIT_BOUNDS_OPTIONS: L.FitBoundsOptions = { padding: [20, 20], maxZoom: 14 };

interface PinLayers {
  pin: PinItem;
  marker: L.Marker;
  circle?: L.Circle;
  panel?: ComponentRef<PinConfigPanel>;
}

interface BoundaryLayers {
  boundary: SavedBoundaryItem;
  layer: L.GeoJSON;
  panel?: ComponentRef<BoundaryConfigPanel>;
}

export function createPinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-pin-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); margin-top: -12px; margin-left: -12px;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

const showsCircle = (pin: PinItem) => pin.radiusMeters > 0 && !pin.radiusDisabled;

const circleStyle = (color: string): L.PathOptions => ({ color, fillColor: color, fillOpacity: 0.2, weight: 2 });

const boundaryStyle = (color: string): L.PathOptions => ({ color, weight: 3, fillColor: color, fillOpacity: 0.25 });

/**
 * Leaflet is driven imperatively: effects diff the store's pins/boundaries against the layers
 * already on the map and add, update or remove only what changed.
 */
@Component({
  selector: 'app-map-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full h-full' },
  template: `<div #mapContainer class="w-full h-full min-h-[400px] z-0"></div>`,
})
export class MapView {
  private readonly state = inject(MapStateService);
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);

  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  private readonly map = signal<L.Map | undefined>(undefined);
  /** Markers live in the cluster group; radius circles go straight on the map so they stay visible. */
  private readonly clusterGroup = L.markerClusterGroup(CLUSTER_OPTIONS);
  private readonly pinLayers = new Map<string, PinLayers>();
  private readonly boundaryLayers = new Map<string, BoundaryLayers>();

  constructor() {
    afterNextRender(() => this.map.set(this.createMap()));

    effect(() => {
      const map = this.map();
      const [lat, lng] = this.state.center();
      const zoom = this.state.zoom();
      map?.flyTo([lat, lng], zoom, { duration: 1.5 });
    });

    effect(() => {
      const map = this.map();
      const pins = this.state.pins();
      if (map) untracked(() => this.syncPins(map, pins));
    });

    effect(() => {
      const map = this.map();
      const boundaries = this.state.savedBoundaries();
      if (map) untracked(() => this.syncBoundaries(map, boundaries));
    });

    inject(DestroyRef).onDestroy(() => {
      this.pinLayers.forEach((entry) => entry.panel?.destroy());
      this.boundaryLayers.forEach((entry) => entry.panel?.destroy());
      this.map()?.remove();
    });
  }

  private createMap(): L.Map {
    const [lat, lng] = this.state.center();
    const map = L.map(this.container().nativeElement, { scrollWheelZoom: true, zoomControl: false }).setView(
      [lat, lng],
      this.state.zoom(),
    );
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);
    // Bottom-right keeps the zoom buttons reachable by thumb and clear of the search header
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    this.clusterGroup.addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => this.state.addPin(e.latlng.lat, e.latlng.lng));
    return map;
  }

  // ─── Pins ─────────────────────────────────────────────────

  private syncPins(map: L.Map, pins: PinItem[]): void {
    const ids = new Set(pins.map((p) => p.id));
    for (const [id, entry] of this.pinLayers) {
      if (!ids.has(id)) this.removePinLayers(id, entry);
    }
    for (const pin of pins) {
      const entry = this.pinLayers.get(pin.id);
      if (!entry) {
        this.pinLayers.set(pin.id, this.addPinLayers(map, pin));
      } else if (entry.pin !== pin) {
        this.updatePinLayers(map, entry, pin);
      }
    }
  }

  private addPinLayers(map: L.Map, pin: PinItem): PinLayers {
    const marker = L.marker([pin.lat, pin.lng], { icon: createPinIcon(pin.color), draggable: true });
    this.clusterGroup.addLayer(marker);
    const entry: PinLayers = { pin, marker };

    marker.on('click', () => this.state.selectElementById(pin.id));
    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      this.state.movePin(pin.id, lat, lng);
    });
    this.bindPanelPopup(marker, entry, PinConfigPanel, 'pin-config-popup', [0, -10], (panel) => {
      panel.setInput('pin', entry.pin);
      panel.instance.radiusChange.subscribe((radius) => this.state.setRadius(pin.id, radius));
      panel.instance.colorChange.subscribe((color) => this.state.setPinColor(pin.id, color));
      panel.instance.delete.subscribe(() => this.state.removePin(pin.id));
    });

    if (showsCircle(pin)) {
      entry.circle = L.circle([pin.lat, pin.lng], { radius: pin.radiusMeters, ...circleStyle(pin.color) }).addTo(map);
    }
    return entry;
  }

  private updatePinLayers(map: L.Map, entry: PinLayers, pin: PinItem): void {
    const previous = entry.pin;
    entry.pin = pin;

    if (previous.lat !== pin.lat || previous.lng !== pin.lng) entry.marker.setLatLng([pin.lat, pin.lng]);
    if (previous.color !== pin.color) entry.marker.setIcon(createPinIcon(pin.color));

    if (!showsCircle(pin)) {
      entry.circle?.remove();
      entry.circle = undefined;
    } else if (!entry.circle) {
      entry.circle = L.circle([pin.lat, pin.lng], { radius: pin.radiusMeters, ...circleStyle(pin.color) }).addTo(map);
    } else {
      entry.circle.setLatLng([pin.lat, pin.lng]).setRadius(pin.radiusMeters).setStyle(circleStyle(pin.color));
    }

    entry.panel?.setInput('pin', pin);
  }

  private removePinLayers(id: string, entry: PinLayers): void {
    entry.marker.closePopup();
    entry.panel?.destroy();
    this.clusterGroup.removeLayer(entry.marker);
    entry.circle?.remove();
    this.pinLayers.delete(id);
  }

  // ─── Boundaries ───────────────────────────────────────────

  private syncBoundaries(map: L.Map, boundaries: SavedBoundaryItem[]): void {
    const visible = boundaries.filter((b) => b.visible !== false);
    const ids = new Set(visible.map((b) => b.id));
    for (const [id, entry] of this.boundaryLayers) {
      if (!ids.has(id)) this.removeBoundaryLayer(map, id, entry);
    }
    for (const boundary of visible) {
      const entry = this.boundaryLayers.get(boundary.id);
      if (!entry || entry.boundary.geojson !== boundary.geojson) {
        if (entry) this.removeBoundaryLayer(map, boundary.id, entry);
        const created = this.addBoundaryLayer(map, boundary);
        if (created) this.boundaryLayers.set(boundary.id, created);
      } else if (entry.boundary !== boundary) {
        entry.boundary = boundary;
        entry.layer.setStyle(boundaryStyle(boundary.color || DEFAULT_BOUNDARY_COLOR));
        entry.panel?.setInput('boundary', boundary);
      }
    }
  }

  private addBoundaryLayer(map: L.Map, boundary: SavedBoundaryItem): BoundaryLayers | null {
    const data = parseGeoJson(boundary.geojson);
    if (!data) {
      console.error('Failed to parse boundary GeoJSON', boundary.id);
      return null;
    }

    let layer: L.GeoJSON;
    try {
      layer = L.geoJSON(data, { style: boundaryStyle(boundary.color || DEFAULT_BOUNDARY_COLOR) }).addTo(map);
    } catch (e) {
      console.error('Invalid boundary GeoJSON', e);
      return null;
    }

    const entry: BoundaryLayers = { boundary, layer };
    layer.on('click', () => this.state.selectElementById(boundary.id));
    this.bindPanelPopup(layer, entry, BoundaryConfigPanel, 'boundary-config-popup', undefined, (panel) => {
      panel.setInput('boundary', entry.boundary);
      panel.instance.colorChange.subscribe((color) => this.state.setBoundaryColor(boundary.id, color));
      panel.instance.delete.subscribe(() => this.state.removeBoundary(boundary.id));
    });

    const bounds = layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, FIT_BOUNDS_OPTIONS);
    return entry;
  }

  private removeBoundaryLayer(map: L.Map, id: string, entry: BoundaryLayers): void {
    entry.layer.closePopup();
    entry.panel?.destroy();
    map.removeLayer(entry.layer);
    this.boundaryLayers.delete(id);
  }

  // ─── Popups hosting Angular components ────────────────────

  /**
   * Leaflet popups are plain DOM, so the Angular panel is created on open, attached to the
   * application for change detection, and destroyed on close.
   */
  private bindPanelPopup<T, E extends { panel?: ComponentRef<T> }>(
    layer: L.Layer,
    entry: E,
    component: Type<T>,
    className: string,
    offset: L.PointExpression | undefined,
    init: (panel: ComponentRef<T>) => void,
  ): void {
    layer.bindPopup(() => this.ensurePanel(entry, component, init).location.nativeElement, {
      className,
      ...(offset ? { offset } : {}),
    });
    layer.on('popupopen', (e: L.PopupEvent) => {
      const panel = this.ensurePanel(entry, component, init);
      e.popup.setContent(panel.location.nativeElement);
      afterNextRender(() => e.popup.update(), { injector: this.environmentInjector });
    });
    layer.on('popupclose', () => {
      entry.panel?.destroy();
      entry.panel = undefined;
    });
  }

  private ensurePanel<T>(
    entry: { panel?: ComponentRef<T> },
    component: Type<T>,
    init: (panel: ComponentRef<T>) => void,
  ): ComponentRef<T> {
    if (!entry.panel) {
      const panel = createComponent(component, { environmentInjector: this.environmentInjector });
      init(panel);
      this.appRef.attachView(panel.hostView);
      L.DomEvent.disableClickPropagation(panel.location.nativeElement);
      L.DomEvent.disableScrollPropagation(panel.location.nativeElement);
      panel.onDestroy(() => this.appRef.detachView(panel.hostView));
      entry.panel = panel;
    }
    return entry.panel;
  }
}
