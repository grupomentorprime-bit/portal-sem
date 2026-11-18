import { foldCongressPersonName } from "@/core/congress/brother-name";
import { foldCongressChurchBase } from "@/core/congress/church-name";
import type { CongressRegistration } from "@/core/congress/types";

export type DedupeCandidate = Pick<
  CongressRegistration,
  | "_id"
  | "identity"
  | "updatedAt"
  | "createdAt"
  | "entryNumber"
  | "submissionId"
  | "zoneId"
  | "churchName"
>;

function personTokens(fullName: string): string[] {
  const folded = foldCongressPersonName(fullName);
  return folded ? folded.split(" ").filter(Boolean) : [];
}

/**
 * Misma persona si el nombre corto (≥2 palabras) está contenido en el largo.
 * Ej.: "Luis Pérez" ⊂ "Luis Benjamín Pérez Saavedra".
 */
export function congressPersonNameContained(a: string, b: string): boolean {
  const left = personTokens(a);
  const right = personTokens(b);
  if (!left.length || !right.length) return false;
  const [short, long] = left.length <= right.length ? [left, right] : [right, left];
  if (short.length < 2) return false;
  return short.every((token) => long.includes(token));
}

/** Prioriza formulario, nombre más completo y luego lo más reciente. */
export function preferFreshestRegistration<T extends DedupeCandidate>(
  a: T,
  b: T
): T {
  const aForm = Boolean(a.submissionId);
  const bForm = Boolean(b.submissionId);
  if (aForm !== bForm) return bForm ? b : a;

  const aLen = personTokens(a.identity.fullName).length;
  const bLen = personTokens(b.identity.fullName).length;
  if (aLen !== bLen) return bLen > aLen ? b : a;

  const byUpdated = b.updatedAt.localeCompare(a.updatedAt);
  if (byUpdated !== 0) return byUpdated > 0 ? b : a;
  const byCreated = b.createdAt.localeCompare(a.createdAt);
  if (byCreated !== 0) return byCreated > 0 ? b : a;
  const ea = typeof a.entryNumber === "number" ? a.entryNumber : 0;
  const eb = typeof b.entryNumber === "number" ? b.entryNumber : 0;
  if (ea !== eb) return eb > ea ? b : a;
  return a._id >= b._id ? a : b;
}

function churchKey(row: Pick<DedupeCandidate, "zoneId" | "churchName">): string {
  return `${row.zoneId.trim().toLowerCase()}|${foldCongressChurchBase(row.churchName)}`;
}

/**
 * Exactos por nombre plegado + contenidos en la misma iglesia/zona.
 * keep = preferida; drop = el resto.
 */
export function planRegistrationNameDedupes<T extends DedupeCandidate>(
  rows: T[]
): Array<{ key: string; keep: T; drop: T[] }> {
  const byExact = new Map<string, T[]>();
  for (const row of rows) {
    const key = foldCongressPersonName(row.identity.fullName);
    if (!key) continue;
    const list = byExact.get(key) ?? [];
    list.push(row);
    byExact.set(key, list);
  }

  const plans: Array<{ key: string; keep: T; drop: T[] }> = [];
  const claimed = new Set<string>();

  for (const [key, list] of byExact) {
    if (list.length < 2) continue;
    let keep = list[0]!;
    for (let i = 1; i < list.length; i += 1) {
      keep = preferFreshestRegistration(keep, list[i]!);
    }
    const drop = list.filter((r) => r._id !== keep._id);
    for (const row of list) claimed.add(row._id);
    plans.push({ key, keep, drop });
  }

  const byChurch = new Map<string, T[]>();
  for (const row of rows) {
    if (claimed.has(row._id)) continue;
    const key = churchKey(row);
    if (!key.endsWith("|") && foldCongressChurchBase(row.churchName)) {
      const list = byChurch.get(key) ?? [];
      list.push(row);
      byChurch.set(key, list);
    }
  }

  for (const [church, list] of byChurch) {
    const parent = new Map<string, string>();
    const find = (id: string): string => {
      const p = parent.get(id);
      if (!p || p === id) {
        parent.set(id, id);
        return id;
      }
      const root = find(p);
      parent.set(id, root);
      return root;
    };
    const union = (a: string, b: string) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent.set(rb, ra);
    };

    for (const row of list) parent.set(row._id, row._id);
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const left = list[i]!;
        const right = list[j]!;
        if (
          congressPersonNameContained(left.identity.fullName, right.identity.fullName)
        ) {
          union(left._id, right._id);
        }
      }
    }

    const groups = new Map<string, T[]>();
    for (const row of list) {
      const root = find(row._id);
      const g = groups.get(root) ?? [];
      g.push(row);
      groups.set(root, g);
    }

    for (const [root, group] of groups) {
      if (group.length < 2) continue;
      let keep = group[0]!;
      for (let i = 1; i < group.length; i += 1) {
        keep = preferFreshestRegistration(keep, group[i]!);
      }
      const drop = group.filter((r) => r._id !== keep._id);
      plans.push({ key: `${church}:${root}`, keep, drop });
    }
  }

  return plans;
}
