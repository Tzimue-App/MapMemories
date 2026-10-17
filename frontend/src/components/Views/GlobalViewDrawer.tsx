import React, { useState, useMemo } from 'react';
import { UnifiedMapElement, FilterCriteria } from '../../types/view';
import { FilterToolbar } from './FilterToolbar';
import { filterModifications } from '../../utils/filterModifications';
import { formatCoordinates } from '../../utils/geoArea';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';

interface GlobalViewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  elements: UnifiedMapElement[];
  onSelectElement: (element: UnifiedMapElement) => void;
}

export const GlobalViewDrawer: React.FC<GlobalViewDrawerProps> = ({
  isOpen,
  onClose,
  elements,
  onSelectElement,
}) => {
  const [criteria, setCriteria] = useState<FilterCriteria>({
    type: 'ALL',
    dateRange: 'ALL',
    searchQuery: '',
  });

  const swipeHandlers = useSwipeToClose('left', onClose);

  const counts = useMemo(() => {
    return {
      ALL: elements.length,
      PIN: elements.filter((e) => e.type === 'PIN').length,
      RADIUS: elements.filter((e) => e.type === 'RADIUS').length,
      BOUNDARY: elements.filter((e) => e.type === 'BOUNDARY').length,
    };
  }, [elements]);

  const filteredElements = useMemo(() => {
    return filterModifications(elements, criteria);
  }, [elements, criteria]);

  const getTypeBadge = (element: UnifiedMapElement) => {
    switch (element.type) {
      case 'PIN':
        return <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-medium">?? Pin</span>;
      case 'RADIUS':
        return <span className="bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 text-[10px] px-1.5 py-0.5 rounded font-medium">? Circle</span>;
      case 'BOUNDARY':
        return <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 text-[10px] px-1.5 py-0.5 rounded font-medium">??? Boundary</span>;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        data-testid="global-view-drawer"
        {...swipeHandlers}
        className={`fixed top-0 left-0 bottom-0 w-full sm:w-96 pb-[env(safe-area-inset-bottom)] bg-white dark:bg-gray-900 shadow-2xl border-r border-gray-200 dark:border-gray-800 z-40 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">???</span>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Memories Directory</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {filteredElements.length} {filteredElements.length === 1 ? 'element' : 'elements'} listed
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close memories drawer"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors text-sm"
          >
            ?
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="p-3">
          <FilterToolbar criteria={criteria} onChange={setCriteria} counts={counts} />
        </div>

        {/* Elements List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredElements.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-400 dark:text-gray-500">
              No matching elements found.
            </div>
          ) : (
            filteredElements.map((el) => (
              <div
                key={el.id}
                onClick={() => onSelectElement(el)}
                className="group p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md transition-all cursor-pointer flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: el.color }}
                    />
                    <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                      {el.title}
                    </h3>
                  </div>
                  {getTypeBadge(el)}
                </div>

                {el.description && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                    {el.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-800">
                  <span>{formatCoordinates(el.lat, el.lng)}</span>
                  {el.radiusMeters && el.radiusMeters > 0 ? (
                    <span>Radius: {el.radiusMeters}m</span>
                  ) : el.createdAt ? (
                    <span>{new Date(el.createdAt).toLocaleDateString()}</span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};
