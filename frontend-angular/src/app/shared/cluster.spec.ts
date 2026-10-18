import * as L from 'leaflet';
import { CLUSTER_OPTIONS, clusterSizeClass, createClusterGroup, createClusterIcon, resolveClusterFactory } from './cluster';

describe('resolveClusterFactory', () => {
  const factory = () => ({}) as L.MarkerClusterGroup;

  it('uses the factory on the imported Leaflet namespace when present', () => {
    expect(resolveClusterFactory({ markerClusterGroup: factory }, undefined)).toBe(factory);
  });

  it('falls back to the global L when the bundled namespace is a copy without the plugin (production build)', () => {
    expect(resolveClusterFactory({}, { markerClusterGroup: factory })).toBe(factory);
  });

  it('fails with an explicit message when leaflet.markercluster is not loaded', () => {
    expect(() => resolveClusterFactory({}, undefined)).toThrow(/leaflet\.markercluster/);
  });
});

describe('createClusterGroup', () => {
  it('builds a marker cluster group with the shared options', () => {
    const group = createClusterGroup();
    expect(group).toBeInstanceOf(L.FeatureGroup);
    expect(group.options).toEqual(expect.objectContaining({ spiderfyOnMaxZoom: true, showCoverageOnHover: false }));
  });
});

describe('cluster utilities', () => {
  it('buckets cluster sizes into small, medium and large', () => {
    expect(clusterSizeClass(2)).toBe('small');
    expect(clusterSizeClass(9)).toBe('small');
    expect(clusterSizeClass(10)).toBe('medium');
    expect(clusterSizeClass(99)).toBe('medium');
    expect(clusterSizeClass(100)).toBe('large');
  });

  it('builds a div icon showing the child count with a size-specific class', () => {
    const icon = createClusterIcon(42);
    expect(icon.options.html).toContain('42');
    expect(icon.options.className).toContain('remembermap-cluster');
    expect(icon.options.className).toContain('remembermap-cluster--medium');
  });

  it('grows the icon with the cluster size so large clusters stay readable', () => {
    const small = createClusterIcon(3).options.iconSize as [number, number];
    const large = createClusterIcon(250).options.iconSize as [number, number];
    expect(large[0]).toBeGreaterThan(small[0]);
  });

  it('uses touch-friendly defaults: spiderfy at max zoom, no hover polygons, chunked loading', () => {
    expect(CLUSTER_OPTIONS.spiderfyOnMaxZoom).toBe(true);
    expect(CLUSTER_OPTIONS.showCoverageOnHover).toBe(false);
    expect(CLUSTER_OPTIONS.chunkedLoading).toBe(true);
    expect(CLUSTER_OPTIONS.zoomToBoundsOnClick).toBe(true);
  });
});
