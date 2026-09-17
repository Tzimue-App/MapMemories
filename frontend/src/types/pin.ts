export interface PinItem {
  id: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  color: string;
  label?: string;
  radiusDisabled?: boolean;
}

export const DEFAULT_PIN_RADIUS = 1000; // 1 km in meters

export const PIN_RADIUS_PRESETS = [0, 100, 500, 1000, 5000, 10000];

export const PIN_COLOR_OPTIONS = [
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Green', value: '#10B981' },
  { label: 'Yellow', value: '#F59E0B' },
  { label: 'Purple', value: '#8B5CF6' },
];

export const DEFAULT_PIN_COLOR = PIN_COLOR_OPTIONS[0].value;
