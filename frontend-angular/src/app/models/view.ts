import { ModificationType } from './modification';
import { NoteItem, PhotoItem } from './media';

export type ElementTypeFilter = 'ALL' | 'PIN' | 'RADIUS' | 'BOUNDARY';

export type DateRangeFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';

export interface FilterCriteria {
  type: ElementTypeFilter;
  dateRange: DateRangeFilter;
  searchQuery: string;
}

export interface UnifiedMapElement {
  id: string; // e.g. "pin-1" or "boundary-2"
  dbId?: number;
  type: ModificationType;
  title: string;
  description?: string;
  lat: number;
  lng: number;
  radiusMeters?: number;
  color: string;
  geojson?: string;
  osmId?: number;
  adminLevel?: number;
  createdAt?: string;
  photos?: PhotoItem[];
  notes?: NoteItem[];
}
