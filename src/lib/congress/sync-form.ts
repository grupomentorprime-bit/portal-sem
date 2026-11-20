import "server-only";

import {
  CONGRESS_EVENT_ID,
  CONGRESS_FORM_ID,
} from "@/core/congress/constants";
import { CONGRESS_COLLECTIONS } from "@/core/congress/constants";
import { enrolleeIdentity } from "@/lib/experience/forms/already-enrolled";
import { shouldCreateFormRegistrationFromSubmission } from "@/core/congress/claim";
import {
  buildRegistrationDraft,
  insertCongressRegistration,
} from "@/lib/congress/repository";
import { getDatabase } from "@/lib/mongodb";
import type { CongressRegistration } from "@/core/congress/types";
import type { ExperienceFormSubmission } from "@/types/experience-forms";

/**
 * Enlaza respuestas del formulario público como inscripciones `source=form`.
 * No copia la respuesta ni crea duplicados por submissionId ni por RUT.
 * No fusiona por nombre con otras fuentes.
 */
export async function syncCongressFormSubmissions(tenantId: string): Promise<{
  linked: number;
  skipped: number;
}> {
  const db = await getDatabase();
  const submissions = await db
    .collection<ExperienceFormSubmission>("experience_form_submissions")
    .find({ tenant: tenantId, formId: CONGRESS_FORM_ID })
    .toArray();

  let linked = 0;
  let skipped = 0;
  if (submissions.length === 0) return { linked, skipped };

  const regs = db.collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations);
  const known = await regs
    .find(
      { tenantId, eventId: CONGRESS_EVENT_ID },
      { projection: { _id: 1, submissionId: 1, identity: 1 } }
    )
    .toArray();

  const submissionIds = new Set<string>();
  const byRut = new Map<string, { _id: string; submissionId?: string | null }>();
  for (const row of known) {
    if (row.submissionId != null && String(row.submissionId).trim()) {
      submissionIds.add(String(row.submissionId));
    }
    const rut = row.identity?.rut?.trim();
    if (rut) byRut.set(rut, { _id: row._id, submissionId: row.submissionId ?? null });
  }

  for (const submission of submissions) {
    // En runtime _id es ObjectId; guardamos siempre string.
    const submissionIdStr = String(submission._id);
    if (submissionIds.has(submissionIdStr)) {
      skipped += 1;
      continue;
    }

    const data = (submission.data ?? {}) as Record<string, unknown>;
    // Submit con registrationId ya reclamó (o debe reclamarse); no crear source=form.
    if (!shouldCreateFormRegistrationFromSubmission(data)) {
      skipped += 1;
      continue;
    }

    const identity = enrolleeIdentity(data);
    const fullName = String(
      data.fullName ?? data.nombre ?? data.name ?? ""
    ).trim();
    if (!fullName) {
      skipped += 1;
      continue;
    }

    // Misma persona ya inscrita (otra fuente / sync previo): enlazar sin duplicar.
    if (identity.rut) {
      const existingByRut = byRut.get(identity.rut);
      if (existingByRut) {
        if (!existingByRut.submissionId) {
          await regs.updateOne(
            { _id: existingByRut._id },
            {
              $set: {
                submissionId: submissionIdStr,
                updatedAt: new Date().toISOString(),
              },
              $inc: { version: 1 },
            }
          );
          existingByRut.submissionId = submissionIdStr;
          submissionIds.add(submissionIdStr);
        }
        skipped += 1;
        continue;
      }
    }

    const reg = buildRegistrationDraft({
      tenantId,
      source: "form",
      zoneId: String(data.zona ?? data.zone ?? "").trim() || "sin-zona",
      churchName: String(data.iglesia ?? data.church ?? "").trim() || "Sin iglesia",
      fullName,
      rut: identity.rut,
      email: identity.email,
      phone: String(data.phone ?? data.telefono ?? "").trim() || null,
      identityStatus: identity.rut ? "verified" : "provisional",
      submissionId: submissionIdStr,
      needsReview: !identity.rut,
    });

    try {
      const saved = await insertCongressRegistration(reg);
      linked += 1;
      submissionIds.add(submissionIdStr);
      if (identity.rut) {
        byRut.set(identity.rut, { _id: saved._id, submissionId: submissionIdStr });
      }
    } catch (error) {
      // Carrera o índice único: no tumbar summary/listados.
      const code =
        error && typeof error === "object" && "code" in error
          ? (error as { code?: number }).code
          : undefined;
      if (code === 11000) {
        skipped += 1;
        continue;
      }
      throw error;
    }
  }

  return { linked, skipped };
}
