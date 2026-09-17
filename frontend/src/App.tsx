import React, { useState } from 'react';
import { MapView } from './components/Map/MapView';
import { AddressSearch } from './components/Search/AddressSearch';
import { SearchResult } from './services/nominatimService';
import { PinItem } from './types/pin';

export const App: React.FC = () => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [pins, setPins] = useState<PinItem[]>([]);

  const handleSelectLocation = (result: SearchResult) => {
    setMapCenter([result.lat, result.lon]);
    setMapZoom(15);
    setSelectedPlace(result.displayName);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-gray-900">
      {/* Search Header Overlay */}
      <header className="absolute top-4 left-4 right-4 z-10 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          <AddressSearch onSelectLocation={handleSelectLocation} />
          <div className="mt-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 px-2">
            {selectedPlace ? (
              <span className="truncate max-w-[70%]">📍 {selectedPlace}</span>
            ) : (
              <span>Click on map to drop a pin & configure radius</span>
            )}
            <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium ml-auto">
              📍 {pins.length} {pins.length === 1 ? 'Pin' : 'Pins'}
            </span>
          </div>
        </div>
      </header>

      {/* Fullscreen Map */}
      <main className="flex-1 w-full h-full">
        <MapView
          center={mapCenter}
          zoom={mapZoom}
          initialPins={pins}
          onPinsChange={setPins}
        />
      </main>
    </div>
  );
};

export default App;
