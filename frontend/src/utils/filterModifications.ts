import { UnifiedMapElement, FilterCriteria } from '../types/view';

export function filterModifications(
  items: UnifiedMapElement[],
  criteria: FilterCriteria
): UnifiedMapElement[] {
  if (!items || !Array.isArray(items)) return [];

  const now = new Date().getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  return items.filter((item) => {
    // 1. Type filter
    if (criteria.type !== 'ALL') {
      if (item.type !== criteria.type) {
        return false;
      }
    }

    // 2. Search query filter (title and description)
    if (criteria.searchQuery && criteria.searchQuery.trim() !== '') {
      const q = criteria.searchQuery.toLowerCase().trim();
      const titleMatch = item.title ? item.title.toLowerCase().includes(q) : false;
      const descMatch = item.description ? item.description.toLowerCase().includes(q) : false;
      if (!titleMatch && !descMatch) {
        return false;
      }
    }

    // 3. Date range filter
    if (criteria.dateRange !== 'ALL') {
      if (!item.createdAt) return false;
      const itemDate = new Date(item.createdAt).getTime();
      const diffMs = now - itemDate;

      if (criteria.dateRange === 'TODAY' && diffMs > oneDayMs) {
        return false;
      } else if (criteria.dateRange === 'WEEK' && diffMs > 7 * oneDayMs) {
        return false;
      } else if (criteria.dateRange === 'MONTH' && diffMs > 30 * oneDayMs) {
        return false;
      }
    }

    return true;
  });
}
