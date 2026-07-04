/**
 * Reclasifica respuestas en Otros que coinciden con la nómina oficial (RUT o nombre sin acentos).
 * npx tsx --env-file=.env scripts/reconcile-otros-submissions.ts
 * npx tsx --env-file=.env scripts/reconcile-otros-submissions.ts --apply
 */
import { getDatabase } from "../src/lib/mongodb";
import { formatGenerationDisplay, normalizeGenerationValue } from "../src/lib/experience/forms/generations";
import {
  findRosterStudentByIdentity,
  normalizeRosterSearchText,
} from "../src/lib/experience/forms/roster-import";
import type { ConvocatoriaRosterStudent } from "../src/types/convocatoria-roster";

const SLUG = "talca-aurora-jul-2026";
const APPLY = process.argv.includes("--apply");

function normalizeRut(value: string): string {
  return value.replace(/\./g, "").replace(/-/g, "").replace(/\s+/g, "").toLowerCase().trim();
}

async function main() {
  const db = await getDatabase();
  const roster = await db.collection("convocatoria_rosters").findOne({ convocatoriaSlug: SLUG });
  if (!roster) throw new Error("Sin nómina");

  const students = (roster.students ?? []) as ConvocatoriaRosterStudent[];
  const formId = roster.formId ?? "convocatoria-talca-aurora-jul-2026";
  const submissions = await db.collection("experience_form_submissions").find({ formId }).toArray();

  const otrosSubs = submissions.filter(
    (sub) => normalizeGenerationValue(sub.data?.generation ?? sub.data?.program) === "other"
  );

  console.log(`Modo: ${APPLY ? "APLICAR" : "vista previa"}`);
  console.log(`Respuestas en Otros: ${otrosSubs.length}\n`);

  const officialStudents = students.filter(
    (student) => normalizeGenerationValue(student.generation) !== "other"
  );

  let fixedSubs = 0;
  let removedFromOtrosRoster = 0;

  for (const submission of otrosSubs) {
    const data = submission.data as Record<string, unknown>;
    const fullName = String(data.fullName ?? data.name ?? "").trim();
    const rut = String(data.rut ?? "").trim() || undefined;

    const match = findRosterStudentByIdentity(officialStudents, { fullName, rut });
    let resolvedMatch = match;

    if (!resolvedMatch) {
      const phone = String(data.phone ?? "").replace(/\D/g, "");
      const phoneTail = phone.slice(-8);
      if (phoneTail.length >= 8) {
        resolvedMatch =
          officialStudents.find((student) =>
            student.phone?.replace(/\D/g, "").endsWith(phoneTail)
          ) ?? null;
      }
    }

    if (!resolvedMatch) {
      const email = String(data.email ?? "").trim().toLowerCase();
      if (email.includes("@")) {
        const local = email.split("@")[0] ?? "";
        resolvedMatch =
          officialStudents.find((student) => {
            const tokens = normalizeRosterSearchText(student.fullName)
              .split(/\s+/)
              .filter((token) => token.length >= 4);
            return tokens.some((token) => local.includes(token));
          }) ?? null;
      }
    }

    if (!resolvedMatch) {
      console.log(`— Sin match: ${fullName} (${rut ?? "sin RUT"})`);
      continue;
    }

    const targetGeneration = normalizeGenerationValue(resolvedMatch.generation);

    console.log(
      `✓ ${fullName} → ${formatGenerationDisplay(targetGeneration)} (${resolvedMatch.fullName}, RUT ${resolvedMatch.rut ?? "—"})`
    );

    if (APPLY) {
      await db.collection("experience_form_submissions").updateOne(
        { _id: submission._id },
        {
          $set: {
            "data.generation": targetGeneration,
            "data.program": targetGeneration,
            "data.studentId": resolvedMatch.id,
            "data.fullName": resolvedMatch.fullName,
            "data.registrationMode": "roster",
            ...(resolvedMatch.rut ? { "data.rut": resolvedMatch.rut } : {}),
          },
        }
      );
      fixedSubs += 1;
    }
  }

  const otrosRoster = students.filter(
    (student) => normalizeGenerationValue(student.generation) === "other"
  );

  console.log(`\n=== Nómina Otros a limpiar: ${otrosRoster.length} ===`);

  const keptStudents = officialStudents;
  const keptRuts = new Set(
    keptStudents.filter((student) => student.rut).map((student) => normalizeRut(student.rut!))
  );

  const nextStudents = [...students];

  for (const otro of otrosRoster) {
    let shouldRemove = false;
    let reason = "";

    if (otro.rut && keptRuts.has(normalizeRut(otro.rut))) {
      shouldRemove = true;
      reason = "RUT ya en generación oficial";
    } else {
      const match = findRosterStudentByIdentity(keptStudents, {
        fullName: otro.fullName,
        rut: otro.rut,
      });
      if (match) {
        shouldRemove = true;
        reason = `duplicado de ${formatGenerationDisplay(match.generation)}`;
      }
    }

    if (!shouldRemove && /^\+?\d[\d\s.-]{6,}$/.test(otro.fullName.trim())) {
      shouldRemove = true;
      reason = "nombre es un teléfono, no una persona";
    }

    if (!shouldRemove && otro.phone) {
      const phoneTail = otro.phone.replace(/\D/g, "").slice(-8);
      const phoneMatch = keptStudents.find((student) =>
        student.phone?.replace(/\D/g, "").endsWith(phoneTail)
      );
      if (phoneMatch) {
        shouldRemove = true;
        reason = `teléfono coincide con ${formatGenerationDisplay(phoneMatch.generation)}`;
      }
    }

    if (!shouldRemove) {
      console.log(`  conservar: ${otro.fullName}`);
      continue;
    }

    console.log(`  quitar: ${otro.fullName} (${reason})`);
    if (APPLY) {
      const index = nextStudents.findIndex((student) => student.id === otro.id);
      if (index >= 0) {
        nextStudents.splice(index, 1);
        removedFromOtrosRoster += 1;
      }
    }
  }

  if (APPLY && removedFromOtrosRoster > 0) {
    await db.collection("convocatoria_rosters").updateOne(
      { convocatoriaSlug: SLUG },
      { $set: { students: nextStudents, updatedAt: new Date().toISOString() } }
    );
  }

  console.log(`\nRespuestas corregidas: ${fixedSubs}`);
  console.log(`Entradas Otros eliminadas de nómina: ${removedFromOtrosRoster}`);
  if (!APPLY) console.log("\nEjecuta con --apply para guardar cambios.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
