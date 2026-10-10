import { describe, it, expect } from 'vitest';
import { filterModifications } from './filterModifications';
import { UnifiedMapElement, FilterCriteria } from '../types/view';

describe('filterModifications utility', () => {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const mockItems: UnifiedMapElement[] = [
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
      createdAt: twoDaysAgo,
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
      createdAt: twoWeeksAgo,
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
      createdAt: twoMonthsAgo,
    },
  ];

  it('returns all elements when criteria is set to ALL and query is empty', () => {
    const criteria: FilterCriteria = {
      type: 'ALL',
      dateRange: 'ALL',
      searchQuery: '',
    };
    const result = filterModifications(mockItems, criteria);
    expect(result).toHaveLength(4);
  });

  it('filters strictly by element type', () => {
    expect(filterModifications(mockItems, { type: 'PIN', dateRange: 'ALL', searchQuery: '' })).toHaveLength(1);
    expect(filterModifications(mockItems, { type: 'RADIUS', dateRange: 'ALL', searchQuery: '' })).toHaveLength(1);
    expect(filterModifications(mockItems, { type: 'BOUNDARY', dateRange: 'ALL', searchQuery: '' })).toHaveLength(2);
  });

  it('filters by search query matching title or description (case-insensitive)', () => {
    const resTitle = filterModifications(mockItems, { type: 'ALL', dateRange: 'ALL', searchQuery: 'eiffel' });
    expect(resTitle).toHaveLength(1);
    expect(resTitle[0].title).toBe('Eiffel Tower');

    const resDesc = filterModifications(mockItems, { type: 'ALL', dateRange: 'ALL', searchQuery: 'MUSEUM' });
    expect(resDesc).toHaveLength(1);
    expect(resDesc[0].title).toBe('Louvre Buffer');

    const resCommon = filterModifications(mockItems, { type: 'ALL', dateRange: 'ALL', searchQuery: 'paris' });
    expect(resCommon).toHaveLength(2);
  });

  it('filters by date range (TODAY, WEEK, MONTH)', () => {
    const resToday = filterModifications(mockItems, { type: 'ALL', dateRange: 'TODAY', searchQuery: '' });
    expect(resToday).toHaveLength(1);
    expect(resToday[0].title).toBe('Eiffel Tower');

    const resWeek = filterModifications(mockItems, { type: 'ALL', dateRange: 'WEEK', searchQuery: '' });
    expect(resWeek).toHaveLength(2); // today + twoDaysAgo

    const resMonth = filterModifications(mockItems, { type: 'ALL', dateRange: 'MONTH', searchQuery: '' });
    expect(resMonth).toHaveLength(3); // today + twoDaysAgo + twoWeeksAgo
  });

  it('combines type, date range, and search query filters', () => {
    const result = filterModifications(mockItems, {
      type: 'BOUNDARY',
      dateRange: 'MONTH',
      searchQuery: 'paris',
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Paris Commune');
  });

  it('returns empty list if items array is empty or null', () => {
    expect(filterModifications([], { type: 'ALL', dateRange: 'ALL', searchQuery: '' })).toEqual([]);
    expect(filterModifications(null as any, { type: 'ALL', dateRange: 'ALL', searchQuery: '' })).toEqual([]);
  });
});
