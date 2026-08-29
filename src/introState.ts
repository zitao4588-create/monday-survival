export const INTRO_STORAGE_KEY = "monday-survival:intro:v1";
export const INTRO_STORAGE_VALUE = "seen";

type IntroStorage = Pick<Storage, "getItem" | "setItem">;

function getBrowserStorage(): IntroStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function hasSeenIntro(storage?: IntroStorage | null) {
  const target = storage === undefined ? getBrowserStorage() : storage;

  try {
    return target?.getItem(INTRO_STORAGE_KEY) === INTRO_STORAGE_VALUE;
  } catch {
    return false;
  }
}

export function markIntroSeen(storage?: IntroStorage | null) {
  const target = storage === undefined ? getBrowserStorage() : storage;

  try {
    target?.setItem(INTRO_STORAGE_KEY, INTRO_STORAGE_VALUE);
    return target !== null;
  } catch {
    return false;
  }
}
