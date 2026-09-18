import React from 'react';
import { SavedBoundaryItem, BOUNDARY_COLOR_OPTIONS } from '../../types/boundary';

interface BoundaryConfigPanelProps {
  boundary: SavedBoundaryItem;
  onColorChange: (color: string) => void;
  onDelete: (id: string) => void;
}

export const BoundaryConfigPanel: React.FC<BoundaryConfigPanelProps> = ({
  boundary,
  onColorChange,
  onDelete,
}) => {
  const getAdminBadgeText = (level: number) => {
    switch (level) {
      case 2:
        return 'Country';
      case 4:
        return 'Region';
      case 6:
        return 'Department';
      case 8:
        return 'Municipality';
      default:
        return `Level ${level}`;
    }
  };

  const stopEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopPropagation();
      if ('stopImmediatePropagation' in e.nativeEvent) {
        (e.nativeEvent as Event).stopImmediatePropagation();
      }
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    stopEvent(e);
    e.preventDefault();
    onDelete(boundary.id);
  };

  return (
    <div
      className="w-64 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md text-gray-800 dark:text-gray-100 text-sm flex flex-col gap-3"
      onClick={stopEvent}
      onMouseDown={stopEvent}
      onPointerDown={stopEvent}
      onDoubleClick={stopEvent}
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
        <h3 className="font-semibold text-base truncate max-w-[150px]">{boundary.name}</h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
          {getAdminBadgeText(boundary.adminLevel)}
        </span>
      </div>

      {/* Color Selection */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Boundary Highlight Color</span>
        <div className="flex gap-2 items-center mt-1 flex-wrap">
          {BOUNDARY_COLOR_OPTIONS.map((colorOption) => (
            <button
              key={colorOption.value}
              type="button"
              title={colorOption.label}
              aria-label={colorOption.label}
              onClick={(e) => {
                stopEvent(e);
                onColorChange(colorOption.value);
              }}
              className={`w-6 h-6 rounded-full transition-transform border-2 ${
                boundary.color === colorOption.value
                  ? 'scale-110 border-gray-900 dark:border-white shadow-md'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: colorOption.value }}
            />
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button
          type="button"
          aria-label="Delete boundary"
          onClick={handleDelete}
          className="w-full py-1 px-3 bg-red-500 hover:bg-red-600 text-white rounded font-medium text-xs transition-colors flex items-center justify-center gap-1"
        >
          <span>Delete Boundary</span>
        </button>
      </div>
    </div>
  );
};
