import React, { useState, useEffect, useRef } from 'react';
import { searchLocations, SearchResult } from '../../services/nominatimService';

interface AddressSearchProps {
  onSelectLocation: (result: SearchResult) => void;
}

export const AddressSearch: React.FC<AddressSearchProps> = ({ onSelectLocation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        const data = await searchLocations(query);
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

  const handleSelect = (result: SearchResult) => {
    onSelectLocation(result);
    setQuery(result.displayName);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto z-[1000]">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search address or place..."
          className="w-full px-4 py-2.5 pr-10 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:focus:ring-blue-400"
        />
        {isLoading && (
          <div className="absolute right-3">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="absolute w-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {results.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700/50 cursor-pointer text-sm text-gray-800 dark:text-gray-200 transition-colors"
                >
                  {item.displayName}
                </li>
              ))}
            </ul>
          ) : (
            hasSearched && !isLoading && (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                No results found
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
