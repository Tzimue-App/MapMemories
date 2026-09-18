import React, { useState } from 'react';
import { MapView } from './components/Map/MapView';
import { AddressSearch } from './components/Search/AddressSearch';
import { BoundarySearch } from './components/Search/BoundarySearch';
import { SearchResult } from './services/nominatimService';
import { BoundaryItem, SavedBoundaryItem, DEFAULT_BOUNDARY_COLOR, BOUNDARY_COLOR_OPTIONS } from './types/boundary';
import { PinItem } from './types/pin';

export const App: React.FC = () => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [savedBoundaries, setSavedBoundaries] = useState<SavedBoundaryItem[]>([]);
  const [pins, setPins] = useState<PinItem[]>([]);
  const [activeTab, setActiveTab] = useState<'address' | 'boundary'>('address');
  const [showSavedList, setShowSavedList] = useState<boolean>(false);

  const handleSelectLocation = (result: SearchResult) => {
    setMapCenter([result.lat, result.lon]);
    setMapZoom(15);
    setSelectedPlace(result.displayName);
  };

  const handleSelectBoundary = (boundary: BoundaryItem) => {
    const newSaved: SavedBoundaryItem = {
      ...boundary,
      id: `boundary-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      color: DEFAULT_BOUNDARY_COLOR,
      visible: true,
    };
    setSavedBoundaries((prev) => [...prev, newSaved]);
  };

  const handleUpdateBoundaryColor = (id: string, color: string) => {
    setSavedBoundaries((prev) =>
      prev.map((b) => (b.id === id ? { ...b, color } : b))
    );
  };

  const handleDeleteBoundary = (id: string) => {
    setSavedBoundaries((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-gray-900">
      {/* Search Header Overlay */}
      <header className="absolute top-4 left-4 right-4 z-10 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-3.5 rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          {/* Tab Switcher */}
          <div className="flex space-x-1 mb-2.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('address')}
              className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'address'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              📍 Address Search
            </button>
            <button
              onClick={() => setActiveTab('boundary')}
              className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'boundary'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              🗺️ Boundary Search
            </button>
          </div>

          {activeTab === 'address' ? (
            <AddressSearch onSelectLocation={handleSelectLocation} />
          ) : (
            <BoundarySearch onSelectBoundary={handleSelectBoundary} />
          )}

          <div className="mt-2.5 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 px-1">
            {selectedPlace ? (
              <span className="truncate max-w-[50%]">📍 {selectedPlace}</span>
            ) : (
              <span>Click map to drop pin & radius</span>
            )}

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSavedList(!showSavedList)}
                className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors text-[11px] flex items-center gap-1"
              >
                🗺️ {savedBoundaries.length} {savedBoundaries.length === 1 ? 'Boundary' : 'Boundaries'}
              </button>
              <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium text-[11px]">
                📍 {pins.length} {pins.length === 1 ? 'Pin' : 'Pins'}
              </span>
            </div>
          </div>

          {/* Saved Boundaries Drawer/Panel */}
          {showSavedList && savedBoundaries.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Saved Boundaries</h4>
              <ul className="space-y-1.5">
                {savedBoundaries.map((boundary) => (
                  <li
                    key={boundary.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate mr-2">
                      {/* Color Picker Swatches */}
                      <div className="flex space-x-1 shrink-0">
                        {BOUNDARY_COLOR_OPTIONS.slice(0, 5).map((colorOpt) => (
                          <button
                            key={colorOpt.value}
                            type="button"
                            title={colorOpt.label}
                            onClick={() => handleUpdateBoundaryColor(boundary.id, colorOpt.value)}
                            className={`w-3.5 h-3.5 rounded-full transition-transform border ${
                              boundary.color === colorOpt.value ? 'scale-125 border-black dark:border-white' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: colorOpt.value }}
                          />
                        ))}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {boundary.name}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteBoundary(boundary.id)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-[11px] px-1.5 py-0.5 rounded"
                      title="Delete boundary"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </header>

      {/* Fullscreen Map */}
      <main className="flex-1 w-full h-full">
        <MapView
          center={mapCenter}
          zoom={mapZoom}
          initialPins={pins}
          onPinsChange={setPins}
          savedBoundaries={savedBoundaries}
          onUpdateBoundaryColor={handleUpdateBoundaryColor}
          onDeleteBoundary={handleDeleteBoundary}
        />
      </main>
    </div>
  );
};

export default App;
