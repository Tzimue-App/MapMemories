import { describe, it, expect } from 'vitest';
import { CLUSTER_OPTIONS, clusterSizeClass, createClusterIcon } from './cluster';

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
