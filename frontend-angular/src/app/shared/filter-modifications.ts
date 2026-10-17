import { DateRangeFilter, FilterCriteria, UnifiedMapElement } from '../models/view';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const MAX_AGE_MS: Record<Exclude<DateRangeFilter, 'ALL'>, number> = {
  TODAY: ONE_DAY_MS,
  WEEK: 7 * ONE_DAY_MS,
  MONTH: 30 * ONE_DAY_MS,
};

export function filterModifications(items: UnifiedMapElement[], criteria: FilterCriteria): UnifiedMapElement[] {
  if (!Array.isArray(items)) return [];

  const now = Date.now();
  const query = criteria.searchQuery?.trim().toLowerCase() ?? '';

  return items.filter((item) => {
    if (criteria.type !== 'ALL' && item.type !== criteria.type) {
      return false;
    }

    if (query) {
      const titleMatch = item.title?.toLowerCase().includes(query) ?? false;
      const descMatch = item.description?.toLowerCase().includes(query) ?? false;
      if (!titleMatch && !descMatch) return false;
    }

    if (criteria.dateRange !== 'ALL') {
      if (!item.createdAt) return false;
      if (now - new Date(item.createdAt).getTime() > MAX_AGE_MS[criteria.dateRange]) return false;
    }

    return true;
  });
}
