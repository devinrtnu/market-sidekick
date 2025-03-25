'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useCollection } from '@/hooks/useLocalStorage';

// Define a schema for a note item
const NoteSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  content: z.string(),
  createdAt: z.number(),
  updatedAt: z.number()
});

// Infer TypeScript type from the schema
type Note = z.infer<typeof NoteSchema>;

export default function LocalStorageExample() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Use our custom hook with the schema
  const {
    items: notes,
    addItem: addNote,
    updateItem: updateNote,
    removeItem: removeNote,
    removeAll: clearNotes
  } = useCollection<Note>('notes', NoteSchema, { prefix: 'spark-foundation' });

  // Set isClient to true on mount to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    
    if (editingId) {
      const note = notes.find(n => n.id === editingId);
      if (note) {
        updateNote({
          ...note,
          title,
          content,
          updatedAt: now
        });
      }
      setEditingId(null);
    } else {
      addNote({
        id: crypto.randomUUID(),
        title,
        content,
        createdAt: now,
        updatedAt: now
      });
    }
    
    setTitle('');
    setContent('');
  };

  const handleEdit = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note.id);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // If we're server-side rendering or not yet hydrated, show a simpler UI
  if (!isClient) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Local Storage Example</h1>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Local Storage Example</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Note' : 'Add Note'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-1">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-2 border rounded min-h-[100px]"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!title}
              >
                {editingId ? 'Update Note' : 'Add Note'}
              </button>
              
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setTitle('');
                    setContent('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Notes ({notes.length})</h2>
            
            {notes.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all notes?')) {
                    clearNotes();
                  }
                }}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear All
              </button>
            )}
          </div>
          
          {notes.length === 0 ? (
            <p className="text-gray-500">No notes yet. Add one to get started!</p>
          ) : (
            <div className="space-y-4">
              {[...notes]
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map(note => (
                  <div key={note.id} className="border rounded p-4">
                    <h3 className="font-medium">{note.title}</h3>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{note.content}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Last updated: {formatDate(note.updatedAt)}
                    </div>
                    
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(note)}
                        className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this note?')) {
                            removeNote(note.id);
                          }
                        }}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-2">How It Works</h2>
        <p>
          This example demonstrates persistent data storage using the browser&apos;s localStorage.
          The data is validated using Zod schema and persists between page refreshes.
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Notes are stored in localStorage with prefix &apos;spark-foundation&apos;</li>
          <li>Data is validated with Zod schema before saving</li>
          <li>Works across browser refreshes</li>
          <li>Syncs across multiple tabs</li>
        </ul>
      </div>
    </div>
  );
} 