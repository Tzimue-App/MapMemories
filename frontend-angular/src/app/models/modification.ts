export type ModificationType = 'PIN' | 'RADIUS' | 'BOUNDARY';

export interface Modification {
  id?: number;
  type: ModificationType;
  title: string;
  description?: string;
  lat: number;
  lng: number;
  radiusMeters?: number;
  color?: string;
  geojson?: string;
  osmId?: number;
  createdAt?: string;
}

export type NewModification = Omit<Modification, 'id' | 'createdAt'>;
