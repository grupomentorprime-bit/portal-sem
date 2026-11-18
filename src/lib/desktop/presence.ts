/** Alguien sigue en el escritorio si su último latido tiene menos de esta edad. */
export const PRESENCE_TTL_MS = 45_000;

export interface PresenceBeat {
  userId: string;
  kind: "staff" | "client";
  tenantId: string | null;
  company: string;
  displayName: string;
  seenAt: string;
}

export interface OnlineOrganization {
  tenantId: string;
  company: string;
  names: string[];
}

export function presenceIsFresh(seenAt: string, now: number, ttl = PRESENCE_TTL_MS): boolean {
  const at = Date.parse(seenAt);
  if (!Number.isFinite(at)) return false;
  const age = now - at;
  return age <= ttl && age >= -5_000;
}

export function staffIsOnline(beats: readonly PresenceBeat[], now: number): boolean {
  return beats.some((beat) => beat.kind === "staff" && presenceIsFresh(beat.seenAt, now));
}

/** Una fila por empresa con alguien del cliente en el escritorio. */
export function onlineOrganizations(beats: readonly PresenceBeat[], now: number): OnlineOrganization[] {
  const map = new Map<string, OnlineOrganization>();
  for (const beat of beats) {
    if (beat.kind !== "client" || !beat.tenantId || !presenceIsFresh(beat.seenAt, now)) continue;
    const name = beat.displayName.trim();
    const existing = map.get(beat.tenantId);
    if (!existing) {
      map.set(beat.tenantId, {
        tenantId: beat.tenantId,
        company: beat.company.trim() || beat.tenantId,
        names: name ? [name] : [],
      });
      continue;
    }
    if (name && !existing.names.includes(name)) existing.names.push(name);
    if (!existing.company && beat.company.trim()) existing.company = beat.company.trim();
  }
  return [...map.values()].sort((a, b) => a.company.localeCompare(b.company, "es"));
}
