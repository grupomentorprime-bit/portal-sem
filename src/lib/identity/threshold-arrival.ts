/**
 * Señal de «acaba de cruzar». No guarda la frase.
 * El inicio la consume una vez para asentar la primera pieza.
 */

export const THRESHOLD_ARRIVAL_KEY = "growth-os.threshold-arrival";
export const THRESHOLD_ARRIVAL_WINDOW_MS = 15_000;

export function shouldPlayArrival(storedAt: number, now: number): boolean {
  if (!Number.isFinite(storedAt) || !Number.isFinite(now)) return false;
  const age = now - storedAt;
  return age >= 0 && age < THRESHOLD_ARRIVAL_WINDOW_MS;
}

export interface ThresholdArrivalStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export function markThresholdArrival(storage: ThresholdArrivalStorage, now: number): void {
  storage.set(THRESHOLD_ARRIVAL_KEY, String(now));
}

export function consumeThresholdArrival(
  storage: ThresholdArrivalStorage,
  now: number
): boolean {
  const raw = storage.get(THRESHOLD_ARRIVAL_KEY);
  storage.remove(THRESHOLD_ARRIVAL_KEY);
  if (raw == null) return false;
  return shouldPlayArrival(Number(raw), now);
}

export function browserArrivalStorage(): ThresholdArrivalStorage | null {
  if (typeof sessionStorage === "undefined") return null;
  return {
    get: (key) => sessionStorage.getItem(key),
    set: (key, value) => sessionStorage.setItem(key, value),
    remove: (key) => sessionStorage.removeItem(key),
  };
}
