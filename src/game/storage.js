const STORAGE_KEY = 'ps09_memory_game_results';
const MAX_SAVED_RESULTS = 20;

function resolveStorage(customStorage) {
  if (customStorage) {
    return customStorage;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

// Loads anonymous session history; returns an empty array on missing or corrupt data.
export function loadResults(customStorage) {
  const storage = resolveStorage(customStorage);
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Saves a completed game result, prepending it and retaining at most 20 recent entries.
export function saveResult(result, customStorage) {
  const storage = resolveStorage(customStorage);
  if (!storage) {
    return [];
  }

  try {
    const existing = loadResults(storage);
    const updated = [result, ...existing].slice(0, MAX_SAVED_RESULTS);
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
