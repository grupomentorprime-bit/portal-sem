import { unstable_cache, revalidateTag } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import {
  counterDateInputValue,
  DEFAULT_CHILE_EVENT_TIME,
  formatConvocatoriaFechaLabel,
  formatConvocatoriaHorarioLabel,
  normalizeChileEventTime,
} from "@/lib/experience/forms/convocatoria-event-datetime";
import { FORM_CONVOCATORIAS } from "@/lib/admin/forms-center";
import {
  applyFormExperienceTemplate,
  buildDefaultFormExperience,
} from "@/lib/cms/form-experience-defaults";
import type {
  ExperienceFormExperience,
  FormExperienceBlock,
  FormExperienceTemplateId,
} from "@/types/experience-form-experience";
import type { CmsVersionSnapshot } from "@/types/cms-shared";
import { createCmsId } from "@/types/cms-shared";

export { toFormLandingConfig, reorderFormExperienceBlocks } from "@/lib/cms/form-experience-utils";

const COLLECTION = "experience_form_experience";
const CACHE_TAG = "form-experience";
const MAX_VERSIONS = 20;

function sortBlocks(blocks: FormExperienceBlock[]): FormExperienceBlock[] {
  return [...blocks].sort((a, b) => a.order - b.order);
}

function sortInfoCards(experience: ExperienceFormExperience): ExperienceFormExperience {
  return {
    ...experience,
    infoCards: [...experience.infoCards].sort((a, b) => a.order - b.order),
    banners: [...experience.banners].sort((a, b) => a.order - b.order || b.priority - a.priority),
    blocks: sortBlocks(experience.blocks),
  };
}

const TALCA_MAPS_HREF =
  "https://www.google.com/maps/search/?api=1&query=Aurora+Talca+Chile";

function enhanceConvocatoriaExperience(
  experience: ExperienceFormExperience,
  formId: string
): ExperienceFormExperience {
  const convocatoria = FORM_CONVOCATORIAS.find((item) => item.formId === formId);
  if (!convocatoria) return experience;

  const eventDate =
    counterDateInputValue(experience.counter.targetDate) || convocatoria.date;
  const eventTime = normalizeChileEventTime(
    experience.counter.targetTime ?? DEFAULT_CHILE_EVENT_TIME
  );

  const hero = {
    ...experience.hero,
    height: experience.hero.height === "compact" ? "default" : experience.hero.height,
    secondaryCtas: [],
  };

  const horarioLabel = formatConvocatoriaHorarioLabel(eventTime);
  const fechaLabel = formatConvocatoriaFechaLabel(eventDate);

  const infoCards = experience.infoCards.map((card) => {
    if (card.icon === "map-pin" && !card.href) {
      return { ...card, href: TALCA_MAPS_HREF };
    }
    if (card.icon === "clock") {
      return { ...card, value: horarioLabel };
    }
    if (card.icon === "calendar") {
      return { ...card, value: fechaLabel };
    }
    return card;
  });

  return sortInfoCards({
    ...experience,
    hero,
    counter: {
      ...experience.counter,
      enabled: true,
      mode: "days_until" as const,
      label: experience.counter.label?.trim() || "Faltan para la jornada",
      targetDate: eventDate,
      targetTime: eventTime,
    },
    blocks: experience.blocks.map((block) =>
      block.type === "counter" ? { ...block, enabled: false } : block
    ),
    infoCards,
  });
}

export function mergeFormExperience(
  tenant: string,
  formId: string,
  partial: Partial<ExperienceFormExperience> | null,
  formName?: string
): ExperienceFormExperience {
  const defaults = buildDefaultFormExperience(tenant, formId, formName);
  if (!partial) return enhanceConvocatoriaExperience(defaults, formId);

  return enhanceConvocatoriaExperience(
    sortInfoCards({
      ...defaults,
      ...partial,
      _id: formId,
      tenant,
      hero: { ...defaults.hero, ...partial.hero },
      editorial: { ...defaults.editorial, ...partial.editorial },
      formShell: { ...defaults.formShell, ...partial.formShell },
      states: { ...defaults.states, ...partial.states },
      counter: { ...defaults.counter, ...partial.counter },
      footer: {
        ...defaults.footer,
        ...partial.footer,
        socialLinks: partial.footer?.socialLinks ?? defaults.footer.socialLinks,
      },
      faq: {
        ...defaults.faq,
        ...partial.faq,
        items: partial.faq?.items ?? defaults.faq.items,
      },
      contact: { ...defaults.contact, ...partial.contact },
      seo: {
        ...defaults.seo,
        ...partial.seo,
        keywords: partial.seo?.keywords ?? defaults.seo.keywords,
      },
      share: { ...defaults.share, ...partial.share },
      appearance: { ...defaults.appearance, ...partial.appearance },
      infoCards: partial.infoCards ?? defaults.infoCards,
      banners: partial.banners ?? defaults.banners,
      blocks: partial.blocks ?? defaults.blocks,
      updatedAt: partial.updatedAt ?? defaults.updatedAt,
    }),
    formId
  );
}

async function fetchFormExperience(
  tenant: string,
  formId: string,
  formName?: string
): Promise<ExperienceFormExperience> {
  const db = await getDatabase();
  const doc = await db.collection<ExperienceFormExperience>(COLLECTION).findOne({
    _id: formId,
    tenant,
  });
  return mergeFormExperience(tenant, formId, doc, formName);
}

export async function getFormExperience(
  tenant: string,
  formId: string,
  formName?: string
): Promise<ExperienceFormExperience> {
  return unstable_cache(
    async () => fetchFormExperience(tenant, formId, formName),
    [`form-experience-${tenant}-${formId}`],
    { tags: [CACHE_TAG, `${CACHE_TAG}-${tenant}`, `${CACHE_TAG}-${tenant}-${formId}`], revalidate: 60 }
  )();
}

export async function getFormExperienceUncached(
  tenant: string,
  formId: string,
  formName?: string
): Promise<ExperienceFormExperience> {
  return fetchFormExperience(tenant, formId, formName);
}

export async function seedFormExperience(
  tenant: string,
  formId: string,
  formName?: string
): Promise<ExperienceFormExperience> {
  const db = await getDatabase();
  const existing = await db.collection<ExperienceFormExperience>(COLLECTION).findOne({
    _id: formId,
    tenant,
  });
  if (existing) return mergeFormExperience(tenant, formId, existing, formName);

  const config = buildDefaultFormExperience(tenant, formId, formName);
  await db.collection<ExperienceFormExperience>(COLLECTION).insertOne(config);
  return config;
}

export async function updateFormExperience(
  tenant: string,
  formId: string,
  update: Partial<ExperienceFormExperience> & { publish?: boolean; saveDraft?: boolean },
  formName?: string
): Promise<ExperienceFormExperience> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const existing = await fetchFormExperience(tenant, formId, formName);

  const { publish, saveDraft, ...configUpdate } = update;
  const merged = mergeFormExperience(tenant, formId, {
    ...configUpdate,
    _id: formId,
    tenant,
    publishStatus: publish ? "published" : saveDraft ? "draft" : existing.publishStatus,
    updatedAt: now,
  }, formName);

  let versions = [...(existing.versions ?? [])];
  if (saveDraft || publish) {
    const snapshot: CmsVersionSnapshot<Partial<ExperienceFormExperience>> = {
      id: createCmsId("ver"),
      label: publish ? "Publicado" : "Borrador",
      savedAt: now,
      status: publish ? "published" : "draft",
      data: {
        hero: merged.hero,
        infoCards: merged.infoCards,
        editorial: merged.editorial,
        formShell: merged.formShell,
        states: merged.states,
        banners: merged.banners,
        counter: merged.counter,
        footer: merged.footer,
        seo: merged.seo,
        share: merged.share,
        appearance: merged.appearance,
        blocks: merged.blocks,
      },
    };
    versions = [snapshot, ...versions].slice(0, MAX_VERSIONS);
  }

  const toSave: ExperienceFormExperience = { ...merged, versions };
  await db.collection<ExperienceFormExperience>(COLLECTION).updateOne(
    { _id: formId, tenant },
    { $set: toSave },
    { upsert: true }
  );

  revalidateTag(CACHE_TAG, "max");
  revalidateTag(`${CACHE_TAG}-${tenant}`, "max");
  revalidateTag(`${CACHE_TAG}-${tenant}-${formId}`, "max");

  return toSave;
}

export async function applyFormExperienceTemplateForForm(
  tenant: string,
  formId: string,
  templateId: FormExperienceTemplateId,
  formName?: string
): Promise<ExperienceFormExperience> {
  const existing = await fetchFormExperience(tenant, formId, formName);
  const merged = applyFormExperienceTemplate(existing, templateId);
  return updateFormExperience(tenant, formId, merged, formName);
}
