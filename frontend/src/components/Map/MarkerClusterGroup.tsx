import { createElementObject, createPathComponent, extendContext } from '@react-leaflet/core';
import type { PropsWithChildren } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { CLUSTER_OPTIONS } from '../../utils/cluster';

type MarkerClusterGroupProps = PropsWithChildren<L.MarkerClusterGroupOptions>;

/**
 * Leaflet.markercluster as a react-leaflet container: child <Marker>s register with the
 * cluster group (via the extended layerContainer context) instead of the map itself.
 */
export const MarkerClusterGroup = createPathComponent<L.MarkerClusterGroup, MarkerClusterGroupProps>(
  ({ children: _children, ...options }, ctx) => {
    const group = L.markerClusterGroup({ ...CLUSTER_OPTIONS, ...options });
    return createElementObject(group, extendContext(ctx, { layerContainer: group }));
  }
);
