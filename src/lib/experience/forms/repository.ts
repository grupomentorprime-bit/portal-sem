import { ObjectId } from "mongodb";
import { revalidateTag, unstable_cache } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import { createSemDefaultForms } from "@/core/experience/forms/defaults";
import { resolveFormId } from "@/core/experience/forms/engine";
import type {
  ExperienceFormCreate,
  ExperienceFormDefinition,
  ExperienceFormSubmission,
  ExperienceFormUpdate,
} from "@/types/experience-forms";

const COLLECTION = "experience_forms";
const SUBMISSIONS = "experience_form_submissions";
const CACHE_TAG = "experience-forms";

function tenantFilter(tenant: string) {
  return { tenant };
}

export async function listExperienceForms(tenant: string): Promise<ExperienceFormDefinition[]> {
  const db = await getDatabase();
  const forms = await db
    .collection<ExperienceFormDefinition>(COLLECTION)
    .find(tenantFilter(tenant))
    .sort({ name: 1 })
    .toArray();
  return forms;
}

export async function getExperienceFormById(
  tenant: string,
  id: string
): Promise<ExperienceFormDefinition | null> {
  const resolvedId = resolveFormId(id);
  const db = await getDatabase();
  const form = await db.collection<ExperienceFormDefinition>(COLLECTION).findOne({
    _id: resolvedId,
    ...tenantFilter(tenant),
  });
  return form;
}

export async function getPublicExperienceForm(
  tenant: string,
  id: string
): Promise<ExperienceFormDefinition | null> {
  const form = await getExperienceFormById(tenant, id);
  if (!form || !form.active || !form.visible) return null;
  return form;
}

export const getPublicExperienceFormCached = (tenant: string, id: string) =>
  unstable_cache(
    async () => getPublicExperienceForm(tenant, id),
    [`experience-form-public-${tenant}-${resolveFormId(id)}`],
    { tags: [CACHE_TAG, `experience-form-${resolveFormId(id)}`], revalidate: 60 }
  );

export async function createExperienceForm(data: ExperienceFormCreate): Promise<ExperienceFormDefinition> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const document: ExperienceFormDefinition = {
    ...data,
    _id: data._id,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection<ExperienceFormDefinition>(COLLECTION).insertOne(document);
  revalidateTag(CACHE_TAG, "max");
  revalidateTag(`experience-form-${document._id}`, "max");
  return document;
}

export async function updateExperienceForm(
  tenant: string,
  id: string,
  update: ExperienceFormUpdate
): Promise<ExperienceFormDefinition | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.collection<ExperienceFormDefinition>(COLLECTION).findOneAndUpdate(
    { _id: id, ...tenantFilter(tenant) },
    { $set: { ...update, updatedAt: now } },
    { returnDocument: "after" }
  );
  revalidateTag(CACHE_TAG, "max");
  revalidateTag(`experience-form-${id}`, "max");
  return result ?? null;
}

export async function duplicateExperienceForm(
  tenant: string,
  id: string
): Promise<ExperienceFormDefinition | null> {
  const source = await getExperienceFormById(tenant, id);
  if (!source) return null;

  const newId = `${source._id}-copy-${Date.now()}`;
  return createExperienceForm({
    ...source,
    _id: newId,
    name: `${source.name} (copia)`,
    active: false,
  });
}

export async function saveFormSubmission(
  submission: ExperienceFormSubmission
): Promise<{ id: string }> {
  const db = await getDatabase();
  const _id = new ObjectId();
  await db.collection(SUBMISSIONS).insertOne({
    ...submission,
    _id,
  });
  return { id: _id.toString() };
}

export async function seedExperienceForms(tenant: string): Promise<ExperienceFormDefinition[]> {
  const db = await getDatabase();
  const existing = await db.collection(COLLECTION).countDocuments(tenantFilter(tenant));
  if (existing > 0) {
    await ensureDefaultExperienceForms(tenant);
    return listExperienceForms(tenant);
  }

  const defaults = createSemDefaultForms(tenant);
  await db.collection<ExperienceFormDefinition>(COLLECTION).insertMany(defaults);
  revalidateTag(CACHE_TAG, "max");
  return defaults;
}

/** Inserta formularios base que falten (p. ej. nuevas convocatorias). */
export async function ensureDefaultExperienceForms(tenant: string): Promise<void> {
  const db = await getDatabase();
  const defaults = createSemDefaultForms(tenant);

  for (const form of defaults) {
    const exists = await db.collection<ExperienceFormDefinition>(COLLECTION).countDocuments({
      _id: form._id,
      ...tenantFilter(tenant),
    });
    if (exists === 0) {
      await db.collection<ExperienceFormDefinition>(COLLECTION).insertOne(form);
    }
  }

  revalidateTag(CACHE_TAG, "max");
}

export interface FormSubmissionListOptions {
  formId?: string;
  destination?: ExperienceFormSubmission["destination"];
  limit?: number;
  skip?: number;
}

export interface FormSubmissionStats {
  total: number;
  attending: number;
  notAttending: number;
  other: number;
}

export async function listFormSubmissions(
  tenant: string,
  options: FormSubmissionListOptions = {}
): Promise<{ submissions: ExperienceFormSubmission[]; total: number }> {
  const db = await getDatabase();
  const filter: Record<string, unknown> = { tenant };

  if (options.formId) filter.formId = options.formId;
  if (options.destination) filter.destination = options.destination;

  const limit = options.limit ?? 100;
  const skip = options.skip ?? 0;

  const collection = db.collection<ExperienceFormSubmission & { _id: ObjectId }>(SUBMISSIONS);

  const [submissions, total] = await Promise.all([
    collection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    submissions: submissions.map((doc) => ({
      ...doc,
      _id: doc._id?.toString(),
    })),
    total,
  };
}

export async function getFormSubmissionStats(
  tenant: string,
  formId: string
): Promise<FormSubmissionStats> {
  const db = await getDatabase();
  const filter = { tenant, formId };

  const [total, attending, notAttending] = await Promise.all([
    db.collection(SUBMISSIONS).countDocuments(filter),
    db.collection(SUBMISSIONS).countDocuments({ ...filter, "data.attendance": "yes" }),
    db.collection(SUBMISSIONS).countDocuments({ ...filter, "data.attendance": "no" }),
  ]);

  return {
    total,
    attending,
    notAttending,
    other: total - attending - notAttending,
  };
}
