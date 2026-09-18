export interface BoundaryItem {
  osmId: number;
  name: string;
  displayName: string;
  boundaryType: string;
  adminLevel: number;
  geojson: string;
}

export interface SavedBoundaryItem extends BoundaryItem {
  id: string;
  color: string;
  visible?: boolean;
}

export const DEFAULT_BOUNDARY_COLOR = '#8b5cf6'; // Purple

export const BOUNDARY_COLOR_OPTIONS = [
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#64748b', label: 'Slate' },
];
