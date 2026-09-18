import React, { useState, useEffect, useRef } from 'react';
import { searchBoundaries } from '../../services/boundaryService';
import { BoundaryItem } from '../../types/boundary';

interface BoundarySearchProps {
  onSelectBoundary: (boundary: BoundaryItem) => void;
  onClearBoundary?: () => void;
  activeBoundary?: BoundaryItem | null;
}

export const BoundarySearch: React.FC<BoundarySearchProps> = ({
  onSelectBoundary,
  onClearBoundary,
  activeBoundary,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BoundaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length >= 2) {
        setIsLoading(true);
        const data = await searchBoundaries(trimmed);
        setResults(data);
        setIsLoading(false);
        setHasSearched(true);
        setShowDropdown(true);
      } else {
        setResults([]);
        setHasSearched(false);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (boundary: BoundaryItem) => {
    onSelectBoundary(boundary);
    setQuery(boundary.name);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    if (onClearBoundary) {
      onClearBoundary();
    }
  };

  const getAdminBadgeInfo = (level: number) => {
    switch (level) {
      case 2:
        return { label: 'Country', colorClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', icon: '🌍' };
      case 4:
        return { label: 'Region', colorClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300', icon: '🏛️' };
      case 6:
        return { label: 'Department', colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300', icon: '🏢' };
      case 8:
        return { label: 'City', colorClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300', icon: '🏙️' };
      default:
        return { label: `Level ${level}`, colorClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: '🗺️' };
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto z-[1000]">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search country, region, or city (e.g. France, BE, Paris)..."
          className="w-full px-4 py-2.5 pr-16 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:focus:ring-purple-400"
        />
        <div className="absolute right-3 flex items-center space-x-1">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-1"></div>
          )}
          {(query || activeBoundary) && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700"
              title="Clear boundary search"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="absolute w-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-72 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {results.map((item) => {
                const badge = getAdminBadgeInfo(item.adminLevel);
                return (
                  <li
                    key={`${item.osmId}-${item.name}`}
                    onClick={() => handleSelect(item)}
                    className="px-4 py-3 hover:bg-purple-50/70 dark:hover:bg-gray-700/50 cursor-pointer text-sm transition-colors flex items-center justify-between group"
                  >
                    <div className="flex flex-col overflow-hidden mr-3">
                      <span className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {item.displayName}
                      </span>
                    </div>

                    <span className={`shrink-0 text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1 border border-transparent ${badge.colorClass}`}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            hasSearched && !isLoading && (
              <div className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 text-center flex flex-col items-center gap-1">
                <span>🗺️ No administrative boundaries found</span>
                <span className="text-xs text-gray-400">Try searching for full country name (e.g. France, Belgium) or city</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
