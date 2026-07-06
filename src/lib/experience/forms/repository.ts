import { ObjectId } from "mongodb";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import { createSemDefaultForms, SEM_DEFAULT_FORM_IDS } from "@/core/experience/forms/defaults";
import { resolveFormId } from "@/core/experience/forms/engine";
import { isExperienceFormPublished, isExperienceFormDirectAccessible } from "@/lib/experience/forms/status";
import type {
  ExperienceFormAbsenceReview,
  ExperienceFormCreate,
  ExperienceFormDayCheckIn,
  ExperienceFormDefinition,
  ExperienceFormSubmission,
  ExperienceFormTestimonialReview,
  ExperienceFormUpdate,
} from "@/types/experience-forms";
import type { FormSubmissionAttachment } from "@/lib/experience/forms/attachments";
import { buildOperatorAbsenceMarked } from "@/lib/experience/forms/absence-justification-deadline";

const COLLECTION = "experience_forms";
const SUBMISSIONS = "experience_form_submissions";
const SUPPRESSIONS = "experience_form_suppressions";
const CACHE_TAG = "experience-forms";

function tenantFilter(tenant: string) {
  return { tenant };
}

function revalidateExperienceFormsCache(formId?: string): void {
  revalidateTag(CACHE_TAG, "max");
  if (formId) {
    revalidateTag(`experience-form-${formId}`, "max");
  }
  revalidatePath("/formularios", "layout");
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

async function getPurgedFormIds(tenant: string): Promise<Set<string>> {
  const db = await getDatabase();
  const docs = await db
    .collection<{ formId: string }>(SUPPRESSIONS)
    .find(tenantFilter(tenant))
    .toArray();
  return new Set(docs.map((doc) => doc.formId));
}

async function recordPurgedForm(tenant: string, formId: string): Promise<void> {
  const db = await getDatabase();
  const resolvedId = resolveFormId(formId);
  await db.collection(SUPPRESSIONS).updateOne(
    { tenant, formId: resolvedId },
    { $set: { tenant, formId: resolvedId, purgedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

async function clearPurgedForm(tenant: string, formId: string): Promise<void> {
  const db = await getDatabase();
  const resolvedId = resolveFormId(formId);
  await db.collection(SUPPRESSIONS).deleteOne({ tenant, formId: resolvedId });
}

export async function listPublicExperienceForms(
  tenant: string
): Promise<ExperienceFormDefinition[]> {
  const db = await getDatabase();
  const forms = await db
    .collection<ExperienceFormDefinition>(COLLECTION)
    .find({
      ...tenantFilter(tenant),
      active: true,
      visible: true,
      archived: { $ne: true },
      private: { $ne: true },
    })
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
  if (!form || !isExperienceFormPublished(form)) return null;
  return form;
}

export async function getDirectAccessibleExperienceForm(
  tenant: string,
  id: string
): Promise<ExperienceFormDefinition | null> {
  const form = await getExperienceFormById(tenant, id);
  if (!form || !isExperienceFormDirectAccessible(form)) return null;
  return form;
}

export const getDirectAccessibleExperienceFormCached = (tenant: string, id: string) =>
  unstable_cache(
    async () => getDirectAccessibleExperienceForm(tenant, id),
    [`experience-form-direct-${tenant}-${resolveFormId(id)}`],
    { tags: [CACHE_TAG, `experience-form-${resolveFormId(id)}`], revalidate: 60 }
  );

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
  revalidateExperienceFormsCache(document._id);
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
  revalidateExperienceFormsCache(id);
  return result ?? null;
}

export async function archiveExperienceForm(
  tenant: string,
  id: string
): Promise<ExperienceFormDefinition | null> {
  return updateExperienceForm(tenant, id, {
    archived: true,
    active: false,
    visible: false,
  });
}

export async function restoreExperienceForm(
  tenant: string,
  id: string
): Promise<ExperienceFormDefinition | null> {
  return updateExperienceForm(tenant, id, {
    archived: false,
    active: true,
    visible: false,
  });
}

export async function purgeExperienceForm(
  tenant: string,
  id: string,
  options: { deleteSubmissions?: boolean } = {}
): Promise<boolean> {
  const db = await getDatabase();
  const resolvedId = resolveFormId(id);
  const deleteSubmissions = options.deleteSubmissions ?? true;

  const result = await db.collection<ExperienceFormDefinition>(COLLECTION).deleteOne({
    _id: resolvedId,
    ...tenantFilter(tenant),
  });

  if (result.deletedCount === 0) return false;

  await recordPurgedForm(tenant, resolvedId);

  if (deleteSubmissions) {
    await db.collection(SUBMISSIONS).deleteMany({ tenant, formId: resolvedId });
  }

  revalidateExperienceFormsCache(resolvedId);
  return true;
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

export async function updateFormSubmissionAbsenceReview(
  tenant: string,
  submissionId: string,
  review: ExperienceFormAbsenceReview,
  reviewerName?: string
): Promise<ExperienceFormSubmission | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const absenceReview: ExperienceFormAbsenceReview = {
    ...review,
    reviewedAt: now,
    reviewedByName: reviewerName?.trim() || review.reviewedByName,
  };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(submissionId);
  } catch {
    return null;
  }

  const result = await db.collection(SUBMISSIONS).findOneAndUpdate(
    { _id: objectId, tenant },
    { $set: { absenceReview } },
    { returnDocument: "after" }
  );

  if (!result) return null;

  const doc = result as ExperienceFormSubmission & { _id: ObjectId };

  return {
    ...doc,
    _id: doc._id?.toString(),
  };
}

export async function updateFormSubmissionTestimonialReview(
  tenant: string,
  submissionId: string,
  review: ExperienceFormTestimonialReview,
  reviewerName?: string
): Promise<ExperienceFormSubmission | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const testimonialReview: ExperienceFormTestimonialReview = {
    ...review,
    reviewedAt: now,
    reviewedByName: reviewerName?.trim() || review.reviewedByName,
  };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(submissionId);
  } catch {
    return null;
  }

  const result = await db.collection(SUBMISSIONS).findOneAndUpdate(
    { _id: objectId, tenant },
    { $set: { testimonialReview } },
    { returnDocument: "after" }
  );

  if (!result) return null;

  const doc = result as ExperienceFormSubmission & { _id: ObjectId };

  return {
    ...doc,
    _id: doc._id?.toString(),
  };
}

export async function getFormSubmissionById(
  tenant: string,
  submissionId: string
): Promise<ExperienceFormSubmission | null> {
  const db = await getDatabase();

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(submissionId);
  } catch {
    return null;
  }

  const doc = await db
    .collection(SUBMISSIONS)
    .findOne({ _id: objectId, tenant });

  if (!doc) return null;

  const submission = doc as ExperienceFormSubmission & { _id: ObjectId };

  return {
    ...submission,
    _id: submission._id?.toString(),
  };
}

export async function updateFormSubmissionGeneration(
  tenant: string,
  submissionId: string,
  generation: string
): Promise<ExperienceFormSubmission | null> {
  const db = await getDatabase();

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(submissionId);
  } catch {
    return null;
  }

  const result = await db.collection(SUBMISSIONS).findOneAndUpdate(
    { _id: objectId, tenant },
    {
      $set: {
        "data.generation": generation,
        "data.program": generation,
      },
    },
    { returnDocument: "after" }
  );

  if (!result) return null;

  const doc = result as ExperienceFormSubmission & { _id: ObjectId };

  return {
    ...doc,
    _id: doc._id?.toString(),
  };
}

export async function updateFormSubmissionDayCheckIn(
  tenant: string,
  submissionId: string,
  checkIn: ExperienceFormDayCheckIn,
  operatorName?: string
): Promise<ExperienceFormSubmission | null> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const dayCheckIn: ExperienceFormDayCheckIn = {
    present: checkIn.present,
    notes: checkIn.notes?.trim() || undefined,
    checkedInAt: checkIn.present ? now : undefined,
    checkedInByName: checkIn.present ? operatorName?.trim() || checkIn.checkedInByName : undefined,
  };

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(submissionId);
  } catch {
    return null;
  }

  const result = await db.collection(SUBMISSIONS).findOneAndUpdate(
    { _id: objectId, tenant },
    { $set: { dayCheckIn } },
    { returnDocument: "after" }
  );

  if (!result) return null;

  const doc = result as ExperienceFormSubmission & { _id: ObjectId };

  return {
    ...doc,
    _id: doc._id?.toString(),
  };
}

export type EventDayStatusAction =
  | "check-in"
  | "undo-check-in"
  | "mark-absent"
  | "mark-arrived-from-absence";

export async function updateFormSubmissionEventDayStatus(
  tenant: string,
  submissionId: string,
  action: EventDayStatusAction,
  operatorName?: string,
  operatorNotes?: string
): Promise<ExperienceFormSubmission | null> {
  const existing = await getFormSubmissionById(tenant, submissionId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const attendance = String(existing.data.attendance ?? "");
  const operator = operatorName?.trim() || undefined;
  const notes = operatorNotes?.trim() || undefined;

  let update: Record<string, unknown> = {};
  let unset: Record<string, ""> = {};

  switch (action) {
    case "check-in": {
      if (attendance !== "yes") return null;
      const dayCheckIn: ExperienceFormDayCheckIn = {
        present: true,
        checkedInAt: now,
        checkedInByName: operator,
      };
      update = { dayCheckIn };
      break;
    }
    case "undo-check-in": {
      if (attendance !== "yes") return null;
      update = {
        dayCheckIn: {
          present: false,
          notes: notes,
        } satisfies ExperienceFormDayCheckIn,
      };
      break;
    }
    case "mark-absent": {
      if (attendance !== "yes") return null;
      const absenceReview = buildOperatorAbsenceMarked({
        operatorName: operator,
        operatorNotes: notes,
      });
      update = {
        "data.attendance": "no",
        "data.operatorNoShow": true,
        absenceReview,
      };
      unset = { dayCheckIn: "" };
      break;
    }
    case "mark-arrived-from-absence": {
      if (attendance !== "no") return null;
      update = {
        "data.attendance": "yes",
        dayCheckIn: {
          present: true,
          checkedInAt: now,
          checkedInByName: operator,
        } satisfies ExperienceFormDayCheckIn,
      };
      unset = { absenceReview: "" };
      break;
    }
    default:
      return null;
  }

  const db = await getDatabase();
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(submissionId);
  } catch {
    return null;
  }

  const result = await db.collection(SUBMISSIONS).findOneAndUpdate(
    { _id: objectId, tenant },
    {
      $set: update,
      ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
    },
    { returnDocument: "after" }
  );

  if (!result) return null;

  const doc = result as ExperienceFormSubmission & { _id: ObjectId };
  return {
    ...doc,
    _id: doc._id?.toString(),
  };
}

export async function updateFormSubmissionParticipantJustification(
  tenant: string,
  submissionId: string,
  input: { justification: string; justificationAttachment: FormSubmissionAttachment }
): Promise<ExperienceFormSubmission | null> {
  const db = await getDatabase();
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(submissionId);
  } catch {
    return null;
  }

  const result = await db.collection(SUBMISSIONS).findOneAndUpdate(
    { _id: objectId, tenant, "data.attendance": "no" },
    {
      $set: {
        "data.justification": input.justification.trim(),
        "data.justificationAttachment": input.justificationAttachment,
        absenceReview: {
          status: "pending",
          reviewedAt: new Date().toISOString(),
        } satisfies ExperienceFormAbsenceReview,
      },
    },
    { returnDocument: "after" }
  );

  if (!result) return null;

  const doc = result as ExperienceFormSubmission & { _id: ObjectId };
  return {
    ...doc,
    _id: doc._id?.toString(),
  };
}

export async function deleteFormSubmission(
  tenant: string,
  submissionId: string
): Promise<boolean> {
  const db = await getDatabase();

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(submissionId);
  } catch {
    return false;
  }

  const result = await db.collection(SUBMISSIONS).deleteOne({ _id: objectId, tenant });
  return result.deletedCount === 1;
}

export async function seedExperienceForms(tenant: string): Promise<ExperienceFormDefinition[]> {
  const db = await getDatabase();
  const purged = await getPurgedFormIds(tenant);
  const existing = await db.collection(COLLECTION).countDocuments(tenantFilter(tenant));

  if (existing === 0) {
    const defaults = createSemDefaultForms(tenant).filter((form) => !purged.has(form._id));
    if (defaults.length > 0) {
      await db.collection<ExperienceFormDefinition>(COLLECTION).insertMany(defaults);
    }
    return listExperienceForms(tenant);
  }

  await ensureDefaultExperienceForms(tenant);
  return listExperienceForms(tenant);
}

/** Inserta formularios base que falten. Respeta eliminaciones definitivas del admin. */
export async function ensureDefaultExperienceForms(tenant: string): Promise<void> {
  const db = await getDatabase();
  const defaults = createSemDefaultForms(tenant);
  const purged = await getPurgedFormIds(tenant);

  for (const form of defaults) {
    if (purged.has(form._id)) continue;

    const exists = await db.collection<ExperienceFormDefinition>(COLLECTION).countDocuments({
      _id: form._id,
      ...tenantFilter(tenant),
    });
    if (exists === 0) {
      await db.collection<ExperienceFormDefinition>(COLLECTION).insertOne(form);
    } else if (form._id === "testimonial-submission") {
      await db.collection<ExperienceFormDefinition>(COLLECTION).updateOne(
        { _id: form._id, ...tenantFilter(tenant) },
        {
          $set: {
            private: true,
            visible: false,
            active: true,
            fields: form.fields,
            updatedAt: new Date().toISOString(),
          },
        }
      );
    }
  }
}

/** Restaura un formulario base eliminado (p. ej. convocatoria). */
export async function restoreDefaultExperienceForm(
  tenant: string,
  formId: string
): Promise<ExperienceFormDefinition | null> {
  const resolvedId = resolveFormId(formId);
  if (!(SEM_DEFAULT_FORM_IDS as readonly string[]).includes(resolvedId)) {
    return null;
  }

  const existing = await getExperienceFormById(tenant, resolvedId);
  if (existing) return existing;

  await clearPurgedForm(tenant, resolvedId);

  const template = createSemDefaultForms(tenant).find((form) => form._id === resolvedId);
  if (!template) return null;

  const db = await getDatabase();
  await db.collection<ExperienceFormDefinition>(COLLECTION).insertOne(template);
  revalidateExperienceFormsCache(resolvedId);
  return template;
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
