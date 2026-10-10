import React, { useState, useEffect } from 'react';
import { PinItem, PIN_COLOR_OPTIONS, PIN_RADIUS_PRESETS } from '../../types/pin';
import { PhotoItem, NoteItem } from '../../types/media';
import { mediaService } from '../../services/mediaService';
import { noteService } from '../../services/noteService';
import { modificationService } from '../../services/modificationService';
import { useAuth } from '../../context/AuthContext';
import { PhotoUploader } from '../Media/PhotoUploader';
import { PhotoGallery } from '../Media/PhotoGallery';
import { NoteList } from '../Media/NoteList';

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
  const [activeTab, setActiveTab] = useState<'config' | 'photos' | 'notes'>('config');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const { isAuthenticated } = useAuth();

  const getModificationId = (pinItem: PinItem): number | null => {
    if (pinItem.dbId) return pinItem.dbId;
    if (typeof pinItem.id === 'string' && pinItem.id.startsWith('pin-')) {
      const parsed = parseInt(pinItem.id.replace('pin-', ''), 10);
      if (!isNaN(parsed)) return parsed;
    }
    if (typeof pinItem.id === 'number' && !isNaN(pinItem.id)) return pinItem.id;
    const num = Number(pinItem.id);
    return isNaN(num) ? null : num;
  };

  const modificationId = getModificationId(pin);

  const ensureModificationId = async (): Promise<number> => {
    const existing = getModificationId(pin);
    if (existing) return existing;

    const saved = await modificationService.saveModification({
      type: pin.radiusMeters > 0 ? 'RADIUS' : 'PIN',
      title: pin.label || 'Saved Marker',
      description: `Lat: ${pin.lat}, Lng: ${pin.lng}`,
      lat: pin.lat,
      lng: pin.lng,
      radiusMeters: pin.radiusMeters,
      color: pin.color,
    });
    if (saved && saved.id) {
      pin.dbId = saved.id;
      return saved.id;
    }
    throw new Error('Failed to save pin to database');
  };

  useEffect(() => {
    if (modificationId && isAuthenticated) {
      mediaService.getPhotos(modificationId).then(setPhotos).catch(() => {});
      noteService.getNotes(modificationId).then(setNotes).catch(() => {});
    }
  }, [modificationId, isAuthenticated]);

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

  const handleUploadPhoto = async (file: File, caption?: string) => {
    try {
      setIsUploadingPhoto(true);
      const modId = await ensureModificationId();
      const newPhoto = await mediaService.uploadPhoto(modId, file, caption);
      setPhotos((prev) => [newPhoto, ...prev]);
    } catch (err) {
      console.error('Failed to upload photo:', err);
      throw err;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    const modId = getModificationId(pin);
    if (!modId) return;
    await mediaService.deletePhoto(modId, photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleAddNote = async (content: string) => {
    const modId = await ensureModificationId();
    const newNote = await noteService.createNote(modId, content);
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleDeleteNote = async (noteId: number) => {
    const modId = getModificationId(pin);
    if (!modId) return;
    await noteService.deleteNote(modId, noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  return (
    <div
      className="w-72 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md text-gray-800 dark:text-gray-100 text-sm flex flex-col gap-3"
      onClick={stopEvent}
      onMouseDown={stopEvent}
      onPointerDown={stopEvent}
      onDoubleClick={stopEvent}
    >
      {/* Header Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-1 text-center font-medium text-xs border-b-2 transition-colors ${
            activeTab === 'config'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Config
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('photos')}
          className={`flex-1 py-1 text-center font-medium text-xs border-b-2 transition-colors relative ${
            activeTab === 'photos'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Photos {photos.length > 0 && <span className="ml-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-[10px] px-1.5 py-0.2 rounded-full">{photos.length}</span>}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-1 text-center font-medium text-xs border-b-2 transition-colors relative ${
            activeTab === 'notes'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Notes {notes.length > 0 && <span className="ml-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-[10px] px-1.5 py-0.2 rounded-full">{notes.length}</span>}
        </button>
      </div>

      {activeTab === 'config' && (
        <>
          {/* Radius Status */}
          <div className="flex justify-between items-center">
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
        </>
      )}

      {activeTab === 'photos' && (
        <div className="space-y-3">
          <PhotoUploader onUpload={handleUploadPhoto} isLoading={isUploadingPhoto} />
          <PhotoGallery photos={photos} onDeletePhoto={handleDeletePhoto} />
        </div>
      )}

      {activeTab === 'notes' && (
        <div>
          <NoteList notes={notes} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} />
        </div>
      )}

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
