import * as L from 'leaflet';
import 'leaflet.markercluster';

export type ClusterSize = 'small' | 'medium' | 'large';

const ICON_SIZES: Record<ClusterSize, number> = { small: 36, medium: 44, large: 52 };

export function clusterSizeClass(count: number): ClusterSize {
  if (count < 10) return 'small';
  if (count < 100) return 'medium';
  return 'large';
}

export function createClusterIcon(count: number): L.DivIcon {
  const size = clusterSizeClass(count);
  const px = ICON_SIZES[size];
  return L.divIcon({
    className: `remembermap-cluster remembermap-cluster--${size}`,
    html: `<span>${count}</span>`,
    iconSize: [px, px],
  });
}

/**
 * Touch-friendly defaults: no hover-only coverage polygons, spiderfy co-located markers at max zoom,
 * and chunked insertion so large memory sets don't freeze the UI thread.
 */
export const CLUSTER_OPTIONS: L.MarkerClusterGroupOptions = {
  showCoverageOnHover: false,
  spiderfyOnMaxZoom: true,
  zoomToBoundsOnClick: true,
  chunkedLoading: true,
  maxClusterRadius: 60,
  iconCreateFunction: (cluster) => createClusterIcon(cluster.getChildCount()),
};

type ClusterFactory = (options?: L.MarkerClusterGroupOptions) => L.MarkerClusterGroup;
type ClusterHost = { markerClusterGroup?: ClusterFactory };

/**
 * leaflet.markercluster registers itself on the global `L`. The production bundle hands
 * `import * as L` a snapshot copy of Leaflet's CommonJS exports taken before the plugin ran,
 * so the factory is only reachable through the global there.
 */
export function resolveClusterFactory(namespace: ClusterHost, global: ClusterHost | undefined): ClusterFactory {
  const factory = namespace.markerClusterGroup ?? global?.markerClusterGroup;
  if (!factory) throw new Error('leaflet.markercluster is not loaded: markerClusterGroup is unavailable');
  return factory;
}

export function createClusterGroup(options: L.MarkerClusterGroupOptions = CLUSTER_OPTIONS): L.MarkerClusterGroup {
  const global = (globalThis as { L?: ClusterHost }).L;
  return resolveClusterFactory(L as ClusterHost, global)(options);
}
