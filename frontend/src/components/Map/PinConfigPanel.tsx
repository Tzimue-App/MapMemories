import React from 'react';
import { PinItem, PIN_COLOR_OPTIONS, PIN_RADIUS_PRESETS } from '../../types/pin';

interface PinConfigPanelProps {
  pin: PinItem;
  onRadiusChange: (radius: number) => void;
  onColorChange: (color: string) => void;
  onDelete: (id: string) => void;
}

export const PinConfigPanel: React.FC<PinConfigPanelProps> = ({
  pin,
  onRadiusChange,
  onColorChange,
  onDelete,
}) => {
  const isRadiusDisabled = pin.radiusMeters === 0 || pin.radiusDisabled === true;

  const formatRadius = (meters: number, disabled?: boolean): string => {
    if (meters === 0 || disabled) {
      return 'Radius Disabled (0 m)';
    }
    if (meters >= 1000) {
      return `${(meters / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km (${meters} m)`;
    }
    return `${meters} m`;
  };

  const formatPresetLabel = (meters: number): string => {
    if (meters === 0) {
      return 'Off';
    }
    if (meters >= 1000) {
      return `${meters / 1000}km`;
    }
    return `${meters}m`;
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
    onDelete(pin.id);
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
        <h3 className="font-semibold text-base">Pin & Radius Config</h3>
        <span
          className={`text-xs px-2 py-0.5 rounded font-medium ${
            isRadiusDisabled
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
          }`}
        >
          {formatRadius(pin.radiusMeters, isRadiusDisabled)}
        </span>
      </div>

      {/* Radius Slider & Controls */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label htmlFor="radius-slider" className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Radius: {formatRadius(pin.radiusMeters, isRadiusDisabled)}
          </label>
        </div>

        <input
          id="radius-slider"
          aria-label="Radius"
          type="range"
          min="0"
          max="20000"
          step="50"
          value={pin.radiusMeters}
          onChange={(e) => {
            stopEvent(e);
            onRadiusChange(Number(e.target.value));
          }}
          className="w-full accent-blue-600 cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none dark:bg-gray-700"
        />

        {/* Preset Buttons */}
        <div className="flex justify-between gap-1 mt-1">
          {PIN_RADIUS_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={formatPresetLabel(preset)}
              onClick={(e) => {
                stopEvent(e);
                onRadiusChange(preset);
              }}
              className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                pin.radiusMeters === preset
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              {formatPresetLabel(preset)}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Circle & Pin Color</span>
        <div className="flex gap-2 items-center mt-1">
          {PIN_COLOR_OPTIONS.map((color) => (
            <button
              key={color.value}
              type="button"
              title={color.label}
              aria-label={color.label}
              onClick={(e) => {
                stopEvent(e);
                onColorChange(color.value);
              }}
              className={`w-6 h-6 rounded-full transition-transform border-2 ${
                pin.color === color.value
                  ? 'scale-110 border-gray-900 dark:border-white shadow-md'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button
          type="button"
          aria-label="Delete pin"
          onClick={handleDelete}
          className="w-full py-1 px-3 bg-red-500 hover:bg-red-600 text-white rounded font-medium text-xs transition-colors flex items-center justify-center gap-1"
        >
          <span>Delete Pin</span>
        </button>
      </div>
    </div>
  );
};
