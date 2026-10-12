import React from 'react';
import { FilterCriteria, ElementTypeFilter, DateRangeFilter } from '../../types/view';

interface FilterToolbarProps {
  criteria: FilterCriteria;
  onChange: (criteria: FilterCriteria) => void;
  counts: {
    ALL: number;
    PIN: number;
    RADIUS: number;
    BOUNDARY: number;
  };
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({ criteria, onChange, counts }) => {
  const typeButtons: { type: ElementTypeFilter; label: string; count: number }[] = [
    { type: 'ALL', label: 'All', count: counts.ALL },
    { type: 'PIN', label: 'Pins', count: counts.PIN },
    { type: 'RADIUS', label: 'Circles', count: counts.RADIUS },
    { type: 'BOUNDARY', label: 'Boundaries', count: counts.BOUNDARY },
  ];

  return (
    <div className="flex flex-col gap-2.5 pb-3 border-b border-gray-200 dark:border-gray-700">
      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-2.5 flex items-center text-gray-400 text-xs pointer-events-none">
          ??
        </span>
        <input
          type="text"
          placeholder="Filter memories..."
          value={criteria.searchQuery}
          onChange={(e) => onChange({ ...criteria, searchQuery: e.target.value })}
          className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {criteria.searchQuery && (
          <button
            type="button"
            onClick={() => onChange({ ...criteria, searchQuery: '' })}
            className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
          >
            ?
          </button>
        )}
      </div>

      {/* Type Pill Selector & Date Range Row */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex gap-1 overflow-x-auto py-0.5">
          {typeButtons.map(({ type, label, count }) => (
            <button
              key={type}
              type="button"
              aria-label={label}
              onClick={() => onChange({ ...criteria, type })}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
                criteria.type === type
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Date Filter Dropdown */}
        <select
          aria-label="Date filter"
          value={criteria.dateRange}
          onChange={(e) => onChange({ ...criteria, dateRange: e.target.value as DateRangeFilter })}
          className="py-1 px-1.5 text-[11px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none shrink-0"
        >
          <option value="ALL">All Time</option>
          <option value="TODAY">Today</option>
          <option value="WEEK">Past 7 days</option>
          <option value="MONTH">Past 30 days</option>
        </select>
      </div>
    </div>
  );
};
