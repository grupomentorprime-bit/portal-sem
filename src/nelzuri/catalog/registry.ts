import { SPECIALIZED_MANIFEST_REGISTRATIONS } from "@/lib/nelzuri/specialized-manifests";
import {
  ensureSpecializedCapabilities,
  installPlatformManifests,
  SPECIALIZED_APPS,
  specializedManifests,
  type SpecializedAppId,
} from "@/nelzuri/contracts/capabilities";

installPlatformManifests(SPECIALIZED_MANIFEST_REGISTRATIONS);
import { APP_MANIFESTS, MENTOR_APPS, type MentorAppId } from "@/nelzuri/catalog/manifests";
import type { AppClass, AppManifest } from "@/nelzuri/catalog/types";
import { validateCatalog } from "@/nelzuri/catalog/validate";

export { validateCatalog } from "@/nelzuri/catalog/validate";

validateCatalog(APP_MANIFESTS, MENTOR_APPS);

const transversalById = new Map<string, AppManifest>(APP_MANIFESTS.map((item) => [item.id, item]));

function catalog(): readonly AppManifest[] {
  ensureSpecializedCapabilities();
  return [...APP_MANIFESTS, ...specializedManifests()];
}

export function listManifests(): readonly AppManifest[] {
  return catalog();
}

export function manifestById(appId: string): AppManifest {
  const transversal = transversalById.get(appId);
  if (transversal) return transversal;
  ensureSpecializedCapabilities();
  const specialized = specializedManifests().find((item) => item.id === appId);
  if (!specialized) throw new Error(`Aplicación desconocida: ${appId}`);
  return specialized;
}

export function appsByClass(appClass: AppClass): readonly AppManifest[] {
  return catalog().filter((item) => item.class === appClass);
}

export function isMentorAppId(value: string): value is MentorAppId {
  return (MENTOR_APPS as readonly string[]).includes(value);
}

export function isSpecializedAppId(value: string): value is SpecializedAppId {
  ensureSpecializedCapabilities();
  return SPECIALIZED_APPS.includes(value);
}

export function spaceRequiredBy(appId: MentorAppId): string | null {
  return manifestById(appId).requiresSpaceId ?? null;
}
