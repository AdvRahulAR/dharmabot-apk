
import { Voicenote } from '../types';

const VOICENOTES_KEY = 'dharmabotVoicenotes';

export const getAllVoicenotes = (): Voicenote[] => {
  try {
    const notesJson = localStorage.getItem(VOICENOTES_KEY);
    if (notesJson) {
      const notes = JSON.parse(notesJson) as Voicenote[];
      return notes.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  } catch (error) {
    console.error("Error loading voicenotes from localStorage:", error);
  }
  return [];
};

export const getVoicenote = (noteId: string): Voicenote | null => {
  const notes = getAllVoicenotes();
  return notes.find(note => note.id === noteId) || null;
};

export const saveVoicenote = (note: Voicenote): void => {
  try {
    const notes = getAllVoicenotes();
    const existingIndex = notes.findIndex(n => n.id === note.id);
    if (existingIndex > -1) {
      notes[existingIndex] = note;
    } else {
      notes.push(note);
    }
    localStorage.setItem(VOICENOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error("Error saving voicenote to localStorage:", error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert('Could not save voicenote: Local storage quota exceeded.');
    }
  }
};

export const deleteVoicenote = (noteId: string): void => {
  try {
    let notes = getAllVoicenotes();
    notes = notes.filter(n => n.id !== noteId);
    localStorage.setItem(VOICENOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error("Error deleting voicenote from localStorage:", error);
  }
};

export const deleteAllVoicenotes = (): void => {
    try {
        localStorage.removeItem(VOICENOTES_KEY);
    } catch (error) {
        console.error("Error deleting all voicenotes from localStorage:", error);
    }
}
