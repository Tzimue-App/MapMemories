import React, { useState } from 'react';
import { AuthImage } from './AuthImage';

interface PhotoUploaderProps {
  onUpload: (file: File, caption?: string) => Promise<void>;
  isLoading?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onUpload, isLoading = false }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image file size must be less than 10MB.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setErrorMessage(null);
      await onUpload(selectedFile, caption.trim() ? caption : undefined);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload photo.');
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
      <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Add Photo</h4>
      {errorMessage && (
        <div className="mb-2 p-2 text-red-600 bg-red-50 dark:bg-red-900/30 rounded text-xs">
          {errorMessage}
        </div>
      )}

      {!selectedFile ? (
        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
          <svg className="w-6 h-6 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-slate-600 dark:text-slate-300 font-medium">Click or drag image here</span>
          <span className="text-slate-400 text-[10px] mt-0.5">Max size 10MB</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            data-testid="photo-file-input"
          />
        </label>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          {previewUrl && (
            <div className="relative w-full h-32 rounded overflow-hidden border border-slate-200 dark:border-slate-700">
              <AuthImage src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-1 right-1 bg-slate-900/70 text-white rounded-full p-1 hover:bg-slate-900"
                title="Remove selection"
              >
                ✕
              </button>
            </div>
          )}

          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-[11px] mb-1 font-medium">
              Caption (optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a photo description..."
              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded shadow transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving Photo...' : '💾 Save Photo'}
          </button>
        </form>
      )}
    </div>
  );
};
