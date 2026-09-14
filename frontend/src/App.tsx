import React, { useState } from 'react';
import { MapView } from './components/Map/MapView';
import { AddressSearch } from './components/Search/AddressSearch';
import { SearchResult } from './services/nominatimService';

export const App: React.FC = () => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);

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
          {selectedPlace && (
            <p className="mt-2 text-xs text-center text-gray-600 dark:text-gray-400 truncate px-2">
              📍 {selectedPlace}
            </p>
          )}
        </div>
      </header>

      {/* Fullscreen Map */}
      <main className="flex-1 w-full h-full">
        <MapView center={mapCenter} zoom={mapZoom} />
      </main>
    </div>
  );
};

export default App;
