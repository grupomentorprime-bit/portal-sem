import { getDatabase } from "@/lib/mongodb";
import {
  createRosterStudentFromFields,
  rosterStudentMatchesQuery,
  upsertRosterStudent,
} from "@/lib/experience/forms/roster-import";
import type {
  ConvocatoriaRoster,
  ConvocatoriaRosterStudent,
} from "@/types/convocatoria-roster";

const COLLECTION = "convocatoria_rosters";

export { parseConvocatoriaRosterText } from "@/lib/experience/forms/roster-import";

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
  students: ConvocatoriaRosterStudent[]
): Promise<ConvocatoriaRoster> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const document: ConvocatoriaRoster = {
    tenant,
    convocatoriaSlug,
    formId,
    students,
    updatedAt: now,
  };

  await db.collection<ConvocatoriaRoster>(COLLECTION).updateOne(
    { tenant, convocatoriaSlug },
    { $set: document },
    { upsert: true }
  );

  return document;
}

export async function searchConvocatoriaRoster(
  tenant: string,
  convocatoriaSlug: string,
  query: string,
  limit = 12
): Promise<ConvocatoriaRosterStudent[]> {
  const roster = await getConvocatoriaRoster(tenant, convocatoriaSlug);
  if (!roster?.students.length) return [];

  return roster.students
    .filter((student) => rosterStudentMatchesQuery(student, query))
    .slice(0, limit);
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
): Promise<ConvocatoriaRoster> {
  const roster = await getConvocatoriaRoster(tenant, convocatoriaSlug);
  const { students } = upsertRosterStudent(roster?.students ?? [], incoming);
  return saveConvocatoriaRoster(tenant, convocatoriaSlug, formId, students);
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
