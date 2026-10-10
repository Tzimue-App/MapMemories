import React, { useState, useEffect } from 'react';
import { UnifiedMapElement } from '../../types/view';
import { PhotoItem, NoteItem } from '../../types/media';
import { PhotoCarousel } from './PhotoCarousel';
import { NoteList } from '../Media/NoteList';
import { PhotoUploader } from '../Media/PhotoUploader';
import { mediaService } from '../../services/mediaService';
import { noteService } from '../../services/noteService';
import { calculateCircleArea, calculatePolygonArea, formatArea, formatCoordinates } from '../../utils/geoArea';

interface DetailSideDrawerProps {
  isOpen: boolean;
  element: UnifiedMapElement | null;
  onClose: () => void;
  onDelete?: (element: UnifiedMapElement) => void;
  onUpdateColor?: (element: UnifiedMapElement, color: string) => void;
}

export const DetailSideDrawer: React.FC<DetailSideDrawerProps> = ({
  isOpen,
  element,
  onClose,
  onDelete,

}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'notes'>('overview');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

  useEffect(() => {
    if (element) {
      if (element.photos) {
        setPhotos(element.photos);
      } else if (element.dbId) {
        mediaService.getPhotos(element.dbId).then(setPhotos).catch(() => {});
      } else {
        setPhotos([]);
      }

      if (element.notes) {
        setNotes(element.notes);
      } else if (element.dbId) {
        noteService.getNotes(element.dbId).then(setNotes).catch(() => {});
      } else {
        setNotes([]);
      }
    }
  }, [element]);

  if (!element) return null;

  const handleCopyCoordinates = () => {
    const coordsText = `${element.lat.toFixed(6)}, ${element.lng.toFixed(6)}`;
    navigator.clipboard?.writeText(coordsText);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleUploadPhoto = async (file: File, caption?: string) => {
    if (!element.dbId) return;
    try {
      setIsUploadingPhoto(true);
      const newPhoto = await mediaService.uploadPhoto(element.dbId, file, caption);
      setPhotos((prev) => [newPhoto, ...prev]);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAddNote = async (content: string) => {
    if (!element.dbId) return;
    const newNote = await noteService.createNote(element.dbId, content);
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!element.dbId) return;
    await noteService.deleteNote(element.dbId, noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  // Surface area calculation
  let surfaceAreaString: string | null = null;
  if (element.type === 'RADIUS' && element.radiusMeters && element.radiusMeters > 0) {
    const area = calculateCircleArea(element.radiusMeters);
    surfaceAreaString = formatArea(area);
  } else if (element.type === 'BOUNDARY' && element.geojson) {
    const area = calculatePolygonArea(element.geojson);
    surfaceAreaString = formatArea(area);
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-over panel */}
      <aside
        data-testid="detail-side-drawer"
        className={`fixed top-0 right-0 bottom-0 w-84 sm:w-96 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 z-40 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: element.color }}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {element.type === 'BOUNDARY' ? `Boundary (Level ${element.adminLevel || 8})` : element.type}
              </span>
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {element.title}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close detail panel"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors text-sm shrink-0"
          >
            ?
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors relative ${
              activeTab === 'photos'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Photos {photos.length > 0 && <span className="ml-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-[10px] px-1.5 py-0.2 rounded-full">{photos.length}</span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors relative ${
              activeTab === 'notes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Notes {notes.length > 0 && <span className="ml-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-[10px] px-1.5 py-0.2 rounded-full">{notes.length}</span>}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Description */}
              {element.description && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Description
                  </span>
                  <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {element.description}
                  </p>
                </div>
              )}

              {/* Coordinates & Geographic Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      Coordinates
                    </span>
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200 block">
                      {formatCoordinates(element.lat, element.lng)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCoordinates}
                    className="mt-2 text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {copiedCoords ? '? Copied!' : '?? Copy Coords'}
                  </button>
                </div>

                {surfaceAreaString && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      Surface Area
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white block">
                      {surfaceAreaString}
                    </span>
                    {element.radiusMeters ? (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-1">
                        Radius: {element.radiusMeters >= 1000 ? `${element.radiusMeters / 1000} km` : `${element.radiusMeters} m`}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Photos Preview Carousel */}
              <div>
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-2">
                  Photos ({photos.length})
                </span>
                <PhotoCarousel photos={photos} />
              </div>

              {/* Notes Stream in Overview */}
              <div>
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-2">
                  Notes ({notes.length})
                </span>
                <div className="space-y-2">
                  {notes.length === 0 ? (
                    <div className="text-xs text-gray-400 dark:text-gray-500 py-2">No notes added yet.</div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200"
                      >
                        <p className="whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-4">
              {element.dbId && (
                <PhotoUploader onUpload={handleUploadPhoto} isLoading={isUploadingPhoto} />
              )}
              <PhotoCarousel photos={photos} />
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <NoteList
                notes={notes}
                onAddNote={handleAddNote}
                onDeleteNote={element.dbId ? handleDeleteNote : undefined}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {onDelete && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
            <button
              type="button"
              aria-label="Delete memory"
              onClick={() => onDelete(element)}
              className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>??? Delete Memory</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
