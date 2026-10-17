import L from 'leaflet';

export type ClusterSize = 'small' | 'medium' | 'large';

const ICON_SIZES: Record<ClusterSize, number> = { small: 36, medium: 44, large: 52 };

export const clusterSizeClass = (count: number): ClusterSize => {
  if (count < 10) return 'small';
  if (count < 100) return 'medium';
  return 'large';
};

export const createClusterIcon = (count: number): L.DivIcon => {
  const size = clusterSizeClass(count);
  const px = ICON_SIZES[size];
  return L.divIcon({
    className: `remembermap-cluster remembermap-cluster--${size}`,
    html: `<span>${count}</span>`,
    iconSize: [px, px],
  });
};

// Touch-friendly defaults: no hover-only coverage polygons, spiderfy co-located markers at max zoom,
// and chunked insertion so large memory sets don't freeze the UI thread.
export const CLUSTER_OPTIONS: L.MarkerClusterGroupOptions = {
  showCoverageOnHover: false,
  spiderfyOnMaxZoom: true,
  zoomToBoundsOnClick: true,
  chunkedLoading: true,
  maxClusterRadius: 60,
  iconCreateFunction: (cluster) => createClusterIcon(cluster.getChildCount()),
};
