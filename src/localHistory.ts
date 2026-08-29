export const LOCAL_HISTORY_STORAGE_KEY = "monday-survival:history:v1";
export const SOUND_SETTING_STORAGE_KEY = "monday-survival:sound:v1";
export const LOCAL_HISTORY_VERSION = 1;
export const LOCAL_HISTORY_LIMIT = 5;

export interface LocalHistoryEntry {
  date: string;
  weekKey: string;
  persona: string;
  outcome: string;
  score: number;
  energy: number;
  mood: number;
}

interface HistoryEnvelope {
  version: typeof LOCAL_HISTORY_VERSION;
  entries: LocalHistoryEntry[];
}

export interface LocalStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getStorage(): LocalStorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizeHistoryEntry(value: unknown): LocalHistoryEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as Partial<LocalHistoryEntry>;
  if (!(typeof entry.date === "string"
    && typeof entry.weekKey === "string"
    && typeof entry.persona === "string"
    && typeof entry.outcome === "string"
    && isFiniteNumber(entry.score)
    && isFiniteNumber(entry.energy)
    && isFiniteNumber(entry.mood))) {
    return null;
  }

  return {
    date: entry.date,
    energy: entry.energy,
    mood: entry.mood,
    outcome: entry.outcome,
    persona: entry.persona,
    score: entry.score,
    weekKey: entry.weekKey
  };
}

export function formatLocalHistoryDate(date = new Date(), timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function readLocalHistory(storage: LocalStorageLike | null = getStorage()): LocalHistoryEntry[] {
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(LOCAL_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Partial<HistoryEnvelope>;
    if (parsed.version !== LOCAL_HISTORY_VERSION || !Array.isArray(parsed.entries)) {
      return [];
    }

    return parsed.entries
      .map(sanitizeHistoryEntry)
      .filter((entry): entry is LocalHistoryEntry => entry !== null)
      .slice(0, LOCAL_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function saveLocalHistoryEntry(
  entry: LocalHistoryEntry,
  storage: LocalStorageLike | null = getStorage()
): LocalHistoryEntry[] {
  const sanitizedEntry = sanitizeHistoryEntry(entry);
  const entries = sanitizedEntry
    ? [sanitizedEntry, ...readLocalHistory(storage)].slice(0, LOCAL_HISTORY_LIMIT)
    : readLocalHistory(storage);

  if (!storage) {
    return entries;
  }

  try {
    const envelope: HistoryEnvelope = { entries, version: LOCAL_HISTORY_VERSION };
    storage.setItem(LOCAL_HISTORY_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Storage may be unavailable or full. The current session can still show the result.
  }

  return entries;
}

export function clearLocalHistory(storage: LocalStorageLike | null = getStorage()) {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(LOCAL_HISTORY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function readSoundEnabled(storage: LocalStorageLike | null = getStorage()) {
  if (!storage) {
    return false;
  }

  try {
    return storage.getItem(SOUND_SETTING_STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function writeSoundEnabled(enabled: boolean, storage: LocalStorageLike | null = getStorage()) {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(SOUND_SETTING_STORAGE_KEY, enabled ? "on" : "off");
    return true;
  } catch {
    return false;
  }
}
