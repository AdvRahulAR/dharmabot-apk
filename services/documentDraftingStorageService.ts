import { SavedDraft } from '../types';

const SAVED_DRAFTS_KEY = 'dharmabotSavedDrafts';

export const getAllSavedDrafts = (): SavedDraft[] => {
  try {
    const draftsJson = localStorage.getItem(SAVED_DRAFTS_KEY);
    if (draftsJson) {
      const drafts = JSON.parse(draftsJson) as SavedDraft[];
      return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  } catch (error) {
    console.error("Error loading saved drafts from localStorage:", error);
  }
  return [];
};

export const getSavedDraft = (draftId: string): SavedDraft | null => {
  const drafts = getAllSavedDrafts();
  return drafts.find(draft => draft.id === draftId) || null;
};

export const saveDraft = (draft: SavedDraft): void => {
  try {
    const drafts = getAllSavedDrafts();
    const existingIndex = drafts.findIndex(d => d.id === draft.id);
    if (existingIndex > -1) {
      drafts[existingIndex] = draft;
    } else {
      drafts.push(draft);
    }
    localStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error("Error saving draft to localStorage:", error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('Could not save draft: Local storage quota exceeded.');
    }
  }
};

export const deleteSavedDraft = (draftId: string): void => {
  try {
    let drafts = getAllSavedDrafts();
    drafts = drafts.filter(d => d.id !== draftId);
    localStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error("Error deleting saved draft from localStorage:", error);
  }
};

export const deleteAllSavedDrafts = (): void => {
  try {
    localStorage.removeItem(SAVED_DRAFTS_KEY);
  } catch (error) {
    console.error("Error deleting all saved drafts from localStorage:", error);
  }
};