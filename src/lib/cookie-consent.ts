export const CONSENT_KEY = "beecah:privacy:v1";
export const CONSENT_EVENT = "beecah:privacy-change";
export const OPEN_CONSENT_EVENT = "beecah:privacy-open";
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
let memory: string | null = null;

export function parseConsent(
  raw: string | null,
  now = Date.now(),
): { analytics: boolean; savedAt: number } | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value?.version === 1 &&
      typeof value.analytics === "boolean" &&
      typeof value.savedAt === "number" &&
      Number.isFinite(value.savedAt) &&
      value.savedAt <= now &&
      now - value.savedAt < MAX_AGE
      ? { analytics: value.analytics, savedAt: value.savedAt }
      : null;
  } catch {
    return null;
  }
}

export function consentSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CONSENT_KEY) ?? memory;
  } catch {
    return memory;
  }
}
export function hasAnalyticsConsent(): boolean {
  return parseConsent(consentSnapshot())?.analytics === true;
}
export function saveConsent(analytics: boolean) {
  memory = JSON.stringify({ version: 1, analytics, savedAt: Date.now() });
  try {
    localStorage.setItem(CONSENT_KEY, memory);
  } catch {
    /* Keep the choice for this page when storage is unavailable. */
  }
  if (!analytics) {
    try {
      sessionStorage.removeItem("beecah:click-session");
    } catch {}
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
export function subscribeConsent(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_KEY || event.key === null) {
      memory = null;
      listener();
    }
  };
  window.addEventListener(CONSENT_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
