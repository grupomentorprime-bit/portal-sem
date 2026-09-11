import { unstable_cache, revalidateTag } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import { isSemTenant } from "@/core/tenant/is-sem";
import {
  ADMISSION_CONFIG_ID,
  DEFAULT_ADMISSION_CONFIG,
} from "@/lib/portal/admission-content";
import { mergeClosingConfig } from "@/lib/portal/admission-closing-utils";
import { migrateAdmissionConfig } from "@/lib/portal/admission-migration";
import {
  createEmptyAdmissionConfig,
  EMPTY_ADMISSION_CLOSING,
} from "@/lib/portal/empty-admission";
import type { AdmissionConfig, AdmissionSuccessContent } from "@/types/admission";
import type { CmsVersionSnapshot } from "@/types/cms-shared";
import { createCmsId } from "@/types/cms-shared";

const COLLECTION = "portal_admission_config";
const CACHE_TAG = "portal-admission-config";
const MAX_VERSIONS = 20;

function admissionBaseForTenant(tenant: string): Omit<AdmissionConfig, "tenant" | "updatedAt"> {
  if (isSemTenant(tenant)) return DEFAULT_ADMISSION_CONFIG;
  const empty = createEmptyAdmissionConfig(tenant);
  const { tenant: _t, updatedAt: _u, ...rest } = empty;
  return rest;
}

function mergeConfig(
  tenant: string,
  partial: Partial<AdmissionConfig> | null
): AdmissionConfig {
  const now = new Date().toISOString();
  const base = admissionBaseForTenant(tenant);

  if (!partial) {
    if (isSemTenant(tenant)) {
      return migrateAdmissionConfig({
        ...base,
        tenant,
        updatedAt: now,
      });
    }
    return createEmptyAdmissionConfig(tenant);
  }

  const closingFallback = isSemTenant(tenant)
    ? base.closing
    : EMPTY_ADMISSION_CLOSING;

  const merged: AdmissionConfig = {
    ...base,
    ...partial,
    tenant,
    hero: { ...base.hero, ...partial.hero },
    datesHighlight: {
      ...base.datesHighlight,
      ...partial.datesHighlight,
    },
    heroPrograms: {
      ...base.programsSection,
      ...partial.programsSection,
      ...partial.heroPrograms,
    },
    programsSection: {
      ...base.programsSection,
      ...partial.programsSection,
      ...partial.heroPrograms,
    },
    calendarLabels: {
      ...base.calendarLabels,
      ...partial.calendarLabels,
    },
    intro: { ...base.intro, ...partial.intro },
    calendar: { ...base.calendar, ...partial.calendar },
    sections: partial.sections ?? base.sections,
    sectionLayouts: {
      ...base.sectionLayouts,
      ...partial.sectionLayouts,
    },
    sectionSeo: {
      ...base.sectionSeo,
      ...partial.sectionSeo,
    },
    formFields: partial.formFields ?? base.formFields,
    successContent: {
      ...base.successContent,
      ...partial.successContent,
    } as AdmissionSuccessContent,
    closing: mergeClosingConfig(partial.closing ?? closingFallback, { tenant }),
    updatedAt: partial.updatedAt ?? now,
  };

  return migrateAdmissionConfig(merged);
}
async function fetchAdmissionConfig(tenant: string): Promise<AdmissionConfig> {
  const db = await getDatabase();
  const doc = await db.collection<AdmissionConfig>(COLLECTION).findOne({
    _id: ADMISSION_CONFIG_ID,
    tenant,
  });
  return mergeConfig(tenant, doc);
}

export async function getAdmissionConfig(tenant: string): Promise<AdmissionConfig> {
  return unstable_cache(
    async () => fetchAdmissionConfig(tenant),
    [`admission-config-${tenant}`],
    { tags: [CACHE_TAG, `${CACHE_TAG}-${tenant}`], revalidate: 60 }
  )();
}

export async function getAdmissionConfigUncached(tenant: string): Promise<AdmissionConfig> {
  return fetchAdmissionConfig(tenant);
}

export async function updateAdmissionConfig(
  tenant: string,
  update: Partial<AdmissionConfig> & { publish?: boolean; saveDraft?: boolean }
): Promise<AdmissionConfig> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const existing = await fetchAdmissionConfig(tenant);

  const { publish, saveDraft, ...configUpdate } = update;
  const merged = mergeConfig(tenant, {
    ...configUpdate,
    _id: ADMISSION_CONFIG_ID,
    tenant,
    updatedAt: now,
  });

  let versions = [...(existing.versions ?? [])];

  if (saveDraft || publish) {
    const snapshot: CmsVersionSnapshot<Partial<AdmissionConfig>> = {
      id: createCmsId("ver"),
      label: publish ? "Publicado" : "Borrador",
      savedAt: now,
      status: publish ? "published" : "draft",
      data: merged,
    };
    versions = [snapshot, ...versions].slice(0, MAX_VERSIONS);
    merged.versions = versions;
    merged.publishStatus = publish ? "published" : "draft";
  }

  await db.collection<AdmissionConfig>(COLLECTION).replaceOne(
    { _id: ADMISSION_CONFIG_ID, tenant },
    merged,
    { upsert: true }
  );

  revalidateTag(CACHE_TAG, "max");
  revalidateTag(`${CACHE_TAG}-${tenant}`, "max");
  return merged;
}

export async function seedAdmissionConfig(tenant: string): Promise<AdmissionConfig> {
  const db = await getDatabase();
  const existing = await db.collection<AdmissionConfig>(COLLECTION).countDocuments({
    _id: ADMISSION_CONFIG_ID,
    tenant,
  });
  if (existing > 0) return fetchAdmissionConfig(tenant);

  const document = mergeConfig(tenant, null);
  await db.collection<AdmissionConfig>(COLLECTION).insertOne(document);
  revalidateTag(CACHE_TAG, "max");
  return document;
}
