import { FilterCriteria, UnifiedMapElement } from '../models/view';
import { filterModifications } from './filter-modifications';

describe('filterModifications utility', () => {
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const items: UnifiedMapElement[] = [
    {
      id: 'pin-1',
      dbId: 1,
      type: 'PIN',
      title: 'Eiffel Tower',
      description: 'Iconic iron tower in Paris',
      lat: 48.8584,
      lng: 2.2945,
      color: '#3B82F6',
      createdAt: now.toISOString(),
    },
    {
      id: 'pin-2',
      dbId: 2,
      type: 'RADIUS',
      title: 'Louvre Buffer',
      description: 'Surrounding radius around museum',
      lat: 48.8606,
      lng: 2.3376,
      radiusMeters: 500,
      color: '#EF4444',
      createdAt: daysAgo(2),
    },
    {
      id: 'boundary-3',
      dbId: 3,
      type: 'BOUNDARY',
      title: 'Paris Commune',
      description: 'City border of Paris',
      lat: 48.8566,
      lng: 2.3522,
      color: '#8B5CF6',
      createdAt: daysAgo(14),
    },
    {
      id: 'boundary-4',
      dbId: 4,
      type: 'BOUNDARY',
      title: 'Lyon Region',
      description: 'Historical district',
      lat: 45.764,
      lng: 4.8357,
      color: '#10B981',
      createdAt: daysAgo(60),
    },
  ];

  const criteria = (overrides: Partial<FilterCriteria> = {}): FilterCriteria => ({
    type: 'ALL',
    dateRange: 'ALL',
    searchQuery: '',
    ...overrides,
  });

  it('returns all elements when criteria is set to ALL and query is empty', () => {
    expect(filterModifications(items, criteria())).toHaveLength(4);
  });

  it('filters strictly by element type', () => {
    expect(filterModifications(items, criteria({ type: 'PIN' }))).toHaveLength(1);
    expect(filterModifications(items, criteria({ type: 'RADIUS' }))).toHaveLength(1);
    expect(filterModifications(items, criteria({ type: 'BOUNDARY' }))).toHaveLength(2);
  });

  it('filters by search query matching title or description (case-insensitive)', () => {
    const byTitle = filterModifications(items, criteria({ searchQuery: 'eiffel' }));
    expect(byTitle.map((i) => i.title)).toEqual(['Eiffel Tower']);

    const byDescription = filterModifications(items, criteria({ searchQuery: 'MUSEUM' }));
    expect(byDescription.map((i) => i.title)).toEqual(['Louvre Buffer']);

    expect(filterModifications(items, criteria({ searchQuery: 'paris' }))).toHaveLength(2);
  });

  it('filters by date range (TODAY, WEEK, MONTH)', () => {
    expect(filterModifications(items, criteria({ dateRange: 'TODAY' })).map((i) => i.title)).toEqual(['Eiffel Tower']);
    expect(filterModifications(items, criteria({ dateRange: 'WEEK' }))).toHaveLength(2);
    expect(filterModifications(items, criteria({ dateRange: 'MONTH' }))).toHaveLength(3);
  });

  it('excludes undated elements when a date range is selected', () => {
    const undated: UnifiedMapElement = { ...items[0], id: 'pin-x', createdAt: undefined };
    expect(filterModifications([undated], criteria({ dateRange: 'MONTH' }))).toEqual([]);
  });

  it('combines type, date range, and search query filters', () => {
    const result = filterModifications(items, criteria({ type: 'BOUNDARY', dateRange: 'MONTH', searchQuery: 'paris' }));
    expect(result.map((i) => i.title)).toEqual(['Paris Commune']);
  });

  it('returns empty list if items array is empty or null', () => {
    expect(filterModifications([], criteria())).toEqual([]);
    expect(filterModifications(null as unknown as UnifiedMapElement[], criteria())).toEqual([]);
  });
});
