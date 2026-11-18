import "server-only";

import {
  CONGRESS_EVENT_ID,
  CONGRESS_FORM_ID,
} from "@/core/congress/constants";
import { CONGRESS_COLLECTIONS } from "@/core/congress/constants";
import { enrolleeIdentity } from "@/lib/experience/forms/already-enrolled";
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

  for (const submission of submissions) {
    const existingBySubmission = await db
      .collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations)
      .findOne({
        tenantId,
        eventId: CONGRESS_EVENT_ID,
        submissionId: submission._id,
      });
    if (existingBySubmission) {
      skipped += 1;
      continue;
    }

    const data = (submission.data ?? {}) as Record<string, unknown>;
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
      const existingByRut = await db
        .collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations)
        .findOne({
          tenantId,
          eventId: CONGRESS_EVENT_ID,
          "identity.rut": identity.rut,
        });
      if (existingByRut) {
        if (!existingByRut.submissionId) {
          await db.collection<CongressRegistration>(CONGRESS_COLLECTIONS.registrations).updateOne(
            { _id: existingByRut._id },
            {
              $set: {
                submissionId: submission._id,
                updatedAt: new Date().toISOString(),
              },
              $inc: { version: 1 },
            }
          );
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
      submissionId: submission._id,
      needsReview: !identity.rut,
    });

    try {
      await insertCongressRegistration(reg);
      linked += 1;
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
