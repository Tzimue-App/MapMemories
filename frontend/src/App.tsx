import React, { useState, useEffect, useMemo } from 'react';
import { MapView } from './components/Map/MapView';
import { AddressSearch } from './components/Search/AddressSearch';
import { BoundarySearch } from './components/Search/BoundarySearch';
import { SearchResult } from './services/nominatimService';
import { BoundaryItem, SavedBoundaryItem, DEFAULT_BOUNDARY_COLOR, BOUNDARY_COLOR_OPTIONS } from './types/boundary';
import { PinItem } from './types/pin';
import { UnifiedMapElement } from './types/view';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/Auth/AuthModal';
import { modificationService } from './services/modificationService';
import { GlobalViewDrawer } from './components/Views/GlobalViewDrawer';
import { DetailSideDrawer } from './components/Views/DetailSideDrawer';

const AppContent: React.FC = () => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [savedBoundaries, setSavedBoundaries] = useState<SavedBoundaryItem[]>([]);
  const [pins, setPins] = useState<PinItem[]>([]);
  const [activeTab, setActiveTab] = useState<'address' | 'boundary'>('address');
  const [showSavedList, setShowSavedList] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Phase 6 State: Global & Detailed Views
  const [isGlobalDrawerOpen, setIsGlobalDrawerOpen] = useState<boolean>(false);
  const [selectedDetailElement, setSelectedDetailElement] = useState<UnifiedMapElement | null>(null);

  const { user, isAuthenticated, loading, logout } = useAuth();

  // Auto-prompt login modal on initial load when not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setIsAuthModalOpen(true);
    }
  }, [loading, isAuthenticated]);

  // Load user modifications from backend when authenticated, or clear when unauthenticated
  useEffect(() => {
    if (isAuthenticated) {
      modificationService.getModifications()
        .then((mods) => {
          const loadedPins: PinItem[] = [];
          const loadedBoundaries: SavedBoundaryItem[] = [];

          mods.forEach((mod) => {
            if (mod.type === 'PIN' || mod.type === 'RADIUS') {
              loadedPins.push({
                id: `pin-${mod.id}`,
                dbId: mod.id,
                lat: mod.lat,
                lng: mod.lng,
                label: mod.title,
                radiusMeters: mod.radiusMeters || 0,
                color: mod.color || '#3388ff',
              });
            } else if (mod.type === 'BOUNDARY' && mod.geojson) {
              try {
                loadedBoundaries.push({
                  id: `boundary-${mod.id}`,
                  osmId: mod.osmId || Date.now(),
                  name: mod.title,
                  displayName: mod.description || mod.title,
                  boundaryType: 'administrative',
                  adminLevel: 8,
                  geojson: mod.geojson,
                  color: mod.color || DEFAULT_BOUNDARY_COLOR,
                  visible: true,
                });
              } catch {
                // handle parse fallback
              }
            }
          });

          setPins(loadedPins);
          setSavedBoundaries(loadedBoundaries);
        })
        .catch(() => {
          setPins([]);
          setSavedBoundaries([]);
        });
    } else {
      setPins([]);
      setSavedBoundaries([]);
      setSelectedDetailElement(null);
      setIsGlobalDrawerOpen(false);
    }
  }, [isAuthenticated]);

  // Unified Elements List for Global Directory
  const unifiedElements = useMemo<UnifiedMapElement[]>(() => {
    const list: UnifiedMapElement[] = [];

    pins.forEach((p) => {
      const dbId = p.dbId || (p.id.startsWith('pin-') ? parseInt(p.id.replace('pin-', ''), 10) : undefined);
      list.push({
        id: p.id,
        dbId: isNaN(dbId as number) ? undefined : dbId,
        type: p.radiusMeters > 0 ? 'RADIUS' : 'PIN',
        title: p.label || (p.radiusMeters > 0 ? 'Circle Area' : 'Pin Marker'),
        description: `Coordinates: ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`,
        lat: p.lat,
        lng: p.lng,
        radiusMeters: p.radiusMeters,
        color: p.color,
      });
    });

    savedBoundaries.forEach((b) => {
      const dbId = b.id.startsWith('boundary-') ? parseInt(b.id.replace('boundary-', ''), 10) : undefined;
      let centerLat = mapCenter[0];
      let centerLng = mapCenter[1];
      try {
        const parsed = typeof b.geojson === 'string' ? JSON.parse(b.geojson) : b.geojson;
        if (parsed?.coordinates?.[0]?.[0]) {
          centerLng = parsed.coordinates[0][0][0];
          centerLat = parsed.coordinates[0][0][1];
        }
      } catch {
        // fallback
      }

      list.push({
        id: b.id,
        dbId: isNaN(dbId as number) ? undefined : dbId,
        type: 'BOUNDARY',
        title: b.name,
        description: b.displayName,
        lat: centerLat,
        lng: centerLng,
        color: b.color || DEFAULT_BOUNDARY_COLOR,
        geojson: typeof b.geojson === 'string' ? b.geojson : JSON.stringify(b.geojson),
        osmId: b.osmId,
        adminLevel: b.adminLevel,
      });
    });

    return list;
  }, [pins, savedBoundaries, mapCenter]);

  const handleSelectLocation = (result: SearchResult) => {
    setMapCenter([result.lat, result.lon]);
    setMapZoom(15);
    setSelectedPlace(result.displayName);
  };

  const handleSelectBoundary = async (boundary: BoundaryItem) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    const newSaved: SavedBoundaryItem = {
      ...boundary,
      id: `boundary-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      color: DEFAULT_BOUNDARY_COLOR,
      visible: true,
    };

    setSavedBoundaries((prev) => [...prev, newSaved]);

    try {
      let parsedGeojson: any = null;
      try {
        parsedGeojson = typeof boundary.geojson === 'string' ? JSON.parse(boundary.geojson) : boundary.geojson;
      } catch {
        // ignore
      }
      const saved = await modificationService.saveModification({
        type: 'BOUNDARY',
        title: boundary.name,
        description: boundary.displayName,
        lat: parsedGeojson?.coordinates?.[0]?.[0]?.[1] ?? mapCenter[0],
        lng: parsedGeojson?.coordinates?.[0]?.[0]?.[0] ?? mapCenter[1],
        color: DEFAULT_BOUNDARY_COLOR,
        geojson: typeof boundary.geojson === 'string' ? boundary.geojson : JSON.stringify(boundary.geojson),
        osmId: boundary.osmId,
      });
      if (saved.id) {
        setSavedBoundaries((prev) =>
          prev.map((b) => (b.id === newSaved.id ? { ...b, id: `boundary-${saved.id}` } : b))
        );
      }
    } catch {
      // Fallback
    }
  };

  const handleUpdateBoundaryColor = (id: string, color: string) => {
    setSavedBoundaries((prev) =>
      prev.map((b) => (b.id === id ? { ...b, color } : b))
    );
  };

  const handleDeleteBoundary = async (id: string) => {
    setSavedBoundaries((prev) => prev.filter((b) => b.id !== id));
    if (selectedDetailElement && selectedDetailElement.id === id) {
      setSelectedDetailElement(null);
    }

    if (isAuthenticated && id.startsWith('boundary-')) {
      const dbId = parseInt(id.replace('boundary-', ''), 10);
      if (!isNaN(dbId)) {
        try {
          await modificationService.deleteModification(dbId);
        } catch {
          // Ignore
        }
      }
    }
  };

  const handlePinsChange = async (newPins: PinItem[]) => {
    if (isAuthenticated && newPins.length < pins.length) {
      const removedPins = pins.filter((p) => !newPins.some((np) => np.id === p.id));
      removedPins.forEach((p) => {
        const dbId = p.dbId || (p.id.startsWith('pin-') ? parseInt(p.id.replace('pin-', ''), 10) : null);
        if (dbId && !isNaN(dbId)) {
          modificationService.deleteModification(dbId).catch(() => {});
        }
        if (selectedDetailElement && selectedDetailElement.id === p.id) {
          setSelectedDetailElement(null);
        }
      });
    }

    setPins(newPins);

    if (isAuthenticated && newPins.length > pins.length) {
      const latestPin = newPins[newPins.length - 1];
      try {
        const saved = await modificationService.saveModification({
          type: latestPin.radiusMeters > 0 ? 'RADIUS' : 'PIN',
          title: latestPin.label || 'Saved Marker',
          description: `Lat: ${latestPin.lat}, Lng: ${latestPin.lng}`,
          lat: latestPin.lat,
          lng: latestPin.lng,
          radiusMeters: latestPin.radiusMeters,
          color: latestPin.color,
        });
        if (saved && saved.id) {
          setPins((prevPins) =>
            prevPins.map((p) =>
              p.id === latestPin.id ? { ...p, dbId: saved.id, id: `pin-${saved.id}` } : p
            )
          );
        }
      } catch {
        // Fallback
      }
    }
  };

  const handleSelectElementFromDirectory = (element: UnifiedMapElement) => {
    setMapCenter([element.lat, element.lng]);
    setMapZoom(15);
    setSelectedDetailElement(element);
    setIsGlobalDrawerOpen(false);
  };

  const handleDeleteElementFromDetail = (element: UnifiedMapElement) => {
    if (element.type === 'BOUNDARY') {
      handleDeleteBoundary(element.id);
    } else {
      const updatedPins = pins.filter((p) => p.id !== element.id);
      handlePinsChange(updatedPins);
    }
    setSelectedDetailElement(null);
  };

  return (
    <div className="relative w-full h-dvh overflow-hidden flex flex-col bg-gray-900">
      {/* Search & Header Overlay */}
      <header className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-10 flex flex-col-reverse sm:flex-row sm:justify-between items-stretch sm:items-start gap-2 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-2.5 sm:p-3.5 rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          {!isAuthenticated && !loading && (
            <div className="mb-2.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 p-2 rounded-lg border border-amber-200 dark:border-amber-800/60 flex justify-between items-center">
              <span>?? Sign in required to save map modifications.</span>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="font-bold underline ml-2 hover:text-amber-900 dark:hover:text-amber-100"
              >
                Sign In
              </button>
            </div>
          )}

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
              ?? Address Search
            </button>
            <button
              onClick={() => setActiveTab('boundary')}
              className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'boundary'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              ??? Boundary Search
            </button>
          </div>

          {activeTab === 'address' ? (
            <AddressSearch onSelectLocation={handleSelectLocation} />
          ) : (
            <BoundarySearch onSelectBoundary={handleSelectBoundary} />
          )}

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-400 px-1">
            {selectedPlace ? (
              <span className="truncate max-w-[45%]">?? {selectedPlace}</span>
            ) : (
              <span>Click map to drop pin & radius</span>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {/* Directory Button */}
              <button
                type="button"
                aria-label="Open memories directory"
                onClick={() => setIsGlobalDrawerOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg font-medium transition-colors text-[11px] flex items-center gap-1 shadow-sm"
              >
                ?? Directory ({unifiedElements.length})
              </button>

              <button
                onClick={() => setShowSavedList(!showSavedList)}
                className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors text-[11px] flex items-center gap-1"
              >
                ??? {savedBoundaries.length} {savedBoundaries.length === 1 ? 'Boundary' : 'Boundaries'}
              </button>
              <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium text-[11px]">
                ?? {pins.length} {pins.length === 1 ? 'Pin' : 'Pins'}
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

        {/* Auth Header Button */}
        <div className="pointer-events-auto self-end sm:self-auto sm:ml-4 shrink-0">
          {isAuthenticated ? (
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 flex items-center space-x-3 text-xs">
              <span className="font-medium text-gray-800 dark:text-gray-200">?? {user?.username}</span>
              <button
                onClick={logout}
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold px-2.5 py-1 rounded-md transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl shadow-xl transition text-xs flex items-center gap-1.5"
            >
              ?? Sign In
            </button>
          )}
        </div>
      </header>

      {/* Fullscreen Map */}
      <main className="flex-1 w-full h-full">
        <MapView
          center={mapCenter}
          zoom={mapZoom}
          initialPins={pins}
          onPinsChange={handlePinsChange}
          savedBoundaries={savedBoundaries}
          onUpdateBoundaryColor={handleUpdateBoundaryColor}
          onDeleteBoundary={handleDeleteBoundary}
          onElementSelect={(elem) => setSelectedDetailElement(elem)}
        />
      </main>

      {/* Phase 6 Global Directory Drawer */}
      <GlobalViewDrawer
        isOpen={isGlobalDrawerOpen}
        onClose={() => setIsGlobalDrawerOpen(false)}
        elements={unifiedElements}
        onSelectElement={handleSelectElementFromDirectory}
      />

      {/* Phase 6 Detailed Side Drawer */}
      <DetailSideDrawer
        isOpen={Boolean(selectedDetailElement)}
        element={selectedDetailElement}
        onClose={() => setSelectedDetailElement(null)}
        onDelete={handleDeleteElementFromDetail}
      />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
