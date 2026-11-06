import { getDatabase } from "@/lib/mongodb";
import {
  createRosterStudentFromFields,
  findRosterStudentByIdentity,
  rosterStudentMatchesQuery,
  upsertRosterStudent,
} from "@/lib/experience/forms/roster-import";
import { normalizeGenerationValue } from "@/lib/experience/forms/generations";
import { collectPersonSearchSuggestions } from "@/lib/experience/forms/person-search";
import type {
  ConvocatoriaExcludedStudent,
  ConvocatoriaRoster,
  ConvocatoriaRosterStudent,
} from "@/types/convocatoria-roster";
import {
  CONVOCATORIA_EXCLUSION_PUBLIC_MESSAGE,
  findExcludedStudentByIdentity,
  reconcileExcludedStudents,
} from "@/lib/experience/forms/roster-exclusion";

const COLLECTION = "convocatoria_rosters";

export { parseConvocatoriaRosterText } from "@/lib/experience/forms/roster-import";
export {
  CONVOCATORIA_EXCLUSION_PUBLIC_MESSAGE,
  findExcludedStudentByIdentity,
  reconcileExcludedStudents,
} from "@/lib/experience/forms/roster-exclusion";

export async function getConvocatoriaRoster(
  tenant: string,
  convocatoriaSlug: string
): Promise<ConvocatoriaRoster | null> {
  const db = await getDatabase();
  const doc = await db.collection<ConvocatoriaRoster>(COLLECTION).findOne({
    tenant,
    convocatoriaSlug,
  });
  return doc;
}

export async function saveConvocatoriaRoster(
  tenant: string,
  convocatoriaSlug: string,
  formId: string,
  students: ConvocatoriaRosterStudent[],
  options?: {
    excludedStudents?: ConvocatoriaExcludedStudent[];
  }
): Promise<ConvocatoriaRoster> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const existing = await getConvocatoriaRoster(tenant, convocatoriaSlug);
  const excludedStudents = reconcileExcludedStudents(
    students,
    options?.excludedStudents ?? existing?.excludedStudents ?? []
  );
  const document: ConvocatoriaRoster = {
    tenant,
    convocatoriaSlug,
    formId,
    students,
    ...(excludedStudents.length > 0 ? { excludedStudents } : {}),
    updatedAt: now,
  };

  if (excludedStudents.length === 0) {
    await db.collection<ConvocatoriaRoster>(COLLECTION).updateOne(
      { tenant, convocatoriaSlug },
      {
        $set: {
          tenant,
          convocatoriaSlug,
          formId,
          students,
          updatedAt: now,
        },
        $unset: { excludedStudents: "" },
      },
      { upsert: true }
    );
  } else {
    await db.collection<ConvocatoriaRoster>(COLLECTION).updateOne(
      { tenant, convocatoriaSlug },
      { $set: document },
      { upsert: true }
    );
  }

  return document;
}

export async function findExcludedConvocatoriaStudent(
  tenant: string,
  convocatoriaSlug: string,
  identity: { fullName?: string; rut?: string; studentId?: string }
): Promise<ConvocatoriaExcludedStudent | null> {
  const roster = await getConvocatoriaRoster(tenant, convocatoriaSlug);
  if (!roster?.excludedStudents?.length) return null;
  return findExcludedStudentByIdentity(roster.excludedStudents, identity);
}

export async function excludeConvocatoriaRosterStudents(
  tenant: string,
  convocatoriaSlug: string,
  formId: string,
  toExclude: ConvocatoriaExcludedStudent[]
): Promise<ConvocatoriaRoster> {
  const roster = await getConvocatoriaRoster(tenant, convocatoriaSlug);
  const currentStudents = roster?.students ?? [];
  const remainingStudents = currentStudents.filter((student) => {
    if (toExclude.some((blocked) => blocked.id === student.id)) return false;
    return !findRosterStudentByIdentity(toExclude, {
      fullName: student.fullName,
      rut: student.rut,
    });
  });

  const previousExcluded = roster?.excludedStudents ?? [];
  const mergedExcluded = [...previousExcluded];
  for (const blocked of toExclude) {
    const existing = findExcludedStudentByIdentity(mergedExcluded, {
      fullName: blocked.fullName,
      rut: blocked.rut,
      studentId: blocked.id,
    });
    if (existing) {
      const index = mergedExcluded.findIndex((item) => item.id === existing.id);
      if (index >= 0) mergedExcluded[index] = { ...existing, ...blocked };
    } else {
      mergedExcluded.push(blocked);
    }
  }

  return saveConvocatoriaRoster(tenant, convocatoriaSlug, formId, remainingStudents, {
    excludedStudents: mergedExcluded,
  });
}

export async function searchConvocatoriaRoster(
  tenant: string,
  convocatoriaSlug: string,
  query: string,
  limit = 40
): Promise<{
  students: ConvocatoriaRosterStudent[];
  suggestions: ConvocatoriaRosterStudent[];
  hasMore: boolean;
  suggestionsHasMore: boolean;
}> {
  const empty = { students: [], suggestions: [], hasMore: false, suggestionsHasMore: false };
  const roster = await getConvocatoriaRoster(tenant, convocatoriaSlug);
  if (!roster?.students.length) return empty;

  const matches = roster.students.filter((student) => rosterStudentMatchesQuery(student, query));
  const suggestions = collectPersonSearchSuggestions(query, roster.students, (student) => [
    student.fullName,
    student.rut,
  ]);
  return {
    students: matches.slice(0, limit),
    suggestions: suggestions.items.slice(0, 8),
    hasMore: matches.length > limit,
    suggestionsHasMore: suggestions.hasMore,
  };
}

export async function findConvocatoriaRosterStudentByIdentity(
  tenant: string,
  convocatoriaSlug: string,
  identity: { fullName: string; rut?: string }
): Promise<ConvocatoriaRosterStudent | null> {
  const roster = await getConvocatoriaRoster(tenant, convocatoriaSlug);
  if (!roster?.students.length) return null;
  const officialStudents = roster.students.filter(
    (student) => normalizeGenerationValue(student.generation) !== "other"
  );
  return findRosterStudentByIdentity(
    officialStudents.length > 0 ? officialStudents : roster.students,
    identity
  );
}

export async function findConvocatoriaRosterStudent(
  tenant: string,
  convocatoriaSlug: string,
  studentId: string
): Promise<ConvocatoriaRosterStudent | null> {
  const roster = await getConvocatoriaRoster(tenant, convocatoriaSlug);
  if (!roster) return null;
  return roster.students.find((student) => student.id === studentId) ?? null;
}

export async function hasConvocatoriaSubmission(
  tenant: string,
  formId: string,
  studentId: string
): Promise<boolean> {
  const db = await getDatabase();
  const count = await db.collection("experience_form_submissions").countDocuments({
    tenant,
    formId,
    "data.studentId": studentId,
  });
  return count > 0;
}

export function buildSelfRegisteredRosterStudent(input: {
  fullName: string;
  rut?: string;
  phone?: string;
}): ConvocatoriaRosterStudent | null {
  const trimmedName = input.fullName.trim();
  if (!trimmedName) return null;

  const nameParts = trimmedName.split(/\s+/).filter(Boolean);
  return createRosterStudentFromFields({
    rut: input.rut?.trim() || undefined,
    firstName: nameParts[0] ?? trimmedName,
    lastName: nameParts.slice(1).join(" "),
    generation: "other",
    phone: input.phone?.trim() || undefined,
  });
}

export async function upsertConvocatoriaRosterStudent(
  tenant: string,
  convocatoriaSlug: string,
  formId: string,
  incoming: ConvocatoriaRosterStudent
): Promise<ConvocatoriaRoster | { blocked: true; student: ConvocatoriaExcludedStudent }> {
  const roster = await getConvocatoriaRoster(tenant, convocatoriaSlug);
  const blocked = findExcludedStudentByIdentity(roster?.excludedStudents ?? [], {
    fullName: incoming.fullName,
    rut: incoming.rut,
    studentId: incoming.id,
  });
  if (blocked) return { blocked: true, student: blocked };
  const { students } = upsertRosterStudent(roster?.students ?? [], incoming);
  return saveConvocatoriaRoster(tenant, convocatoriaSlug, formId, students);
}

function firstFilledContact(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/** Completa correo y teléfono del listado con la última respuesta conocida de esa persona. */
export async function hydrateRosterStudentContact(
  tenant: string,
  students: ConvocatoriaRosterStudent[]
): Promise<ConvocatoriaRosterStudent[]> {
  const missing = students.filter((student) => !student.email?.trim() || !student.phone?.trim());
  if (missing.length === 0) return students;

  const ids = [...new Set(missing.map((student) => student.id))];
  const db = await getDatabase();
  const prior = await db
    .collection<{
      data?: { studentId?: string; email?: string; phone?: string };
    }>("experience_form_submissions")
    .find({
      tenant,
      "data.studentId": { $in: ids },
    })
    .project({
      "data.studentId": 1,
      "data.email": 1,
      "data.phone": 1,
    })
    .sort({ createdAt: -1 })
    .limit(400)
    .toArray();

  const known = new Map<string, { email?: string; phone?: string }>();
  for (const doc of prior) {
    const studentId = String(doc.data?.studentId ?? "").trim();
    if (!studentId) continue;
    const current = known.get(studentId) ?? {};
    if (!current.email) {
      const email = String(doc.data?.email ?? "").trim();
      if (email) current.email = email;
    }
    if (!current.phone) {
      const phone = String(doc.data?.phone ?? "").trim();
      if (phone) current.phone = phone;
    }
    known.set(studentId, current);
  }

  return students.map((student) => {
    const extra = known.get(student.id);
    if (!extra) return student;
    return {
      ...student,
      email: firstFilledContact(student.email, extra.email),
      phone: firstFilledContact(student.phone, extra.phone),
    };
  });
}

export async function hasConvocatoriaSubmissionByEmail(
  tenant: string,
  formId: string,
  email: string
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;

  const db = await getDatabase();
  const count = await db.collection("experience_form_submissions").countDocuments({
    tenant,
    formId,
    "data.email": { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  });
  return count > 0;
}
