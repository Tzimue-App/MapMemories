import React, { useState } from 'react';
import { NoteItem } from '../../types/media';

interface NoteListProps {
  notes: NoteItem[];
  onAddNote: (content: string) => Promise<void>;
  onDeleteNote?: (noteId: number) => Promise<void>;
}

export const NoteList: React.FC<NoteListProps> = ({ notes, onAddNote, onDeleteNote }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsLoading(true);
      await onAddNote(content.trim());
      setContent('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3 text-xs" data-testid="note-list">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a detailed note or memory..."
          rows={3}
          className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
        />
        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded shadow transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving Note...' : '💾 Save Note'}
        </button>
      </form>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <div className="text-center py-2 text-slate-400">No notes added yet.</div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="group relative p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
            >
              <p className="whitespace-pre-wrap pr-4">{note.content}</p>
              {onDeleteNote && (
                <button
                  type="button"
                  onClick={() => onDeleteNote(note.id)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-[10px]"
                  title="Delete Note"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
