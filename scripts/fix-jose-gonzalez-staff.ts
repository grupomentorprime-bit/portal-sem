/**
 * José González Yevenes — Equipo docente (director SEM).
 * npx tsx --env-file=.env scripts/fix-jose-gonzalez-staff.ts
 */
import { getDatabase } from "../src/lib/mongodb";
import { normalizeGenerationValue } from "../src/lib/experience/forms/generations";

const SLUG = "talca-aurora-jul-2026";
const FORM_ID = "convocatoria-talca-aurora-jul-2026";
const EMAIL = "jose.romanos8@hotmail.es";
const FULL_NAME = "Jose Gonzalez Yevenes";
const GENERATION = "staff";

function normalizeRut(value: string): string {
  return value.replace(/\./g, "").replace(/-/g, "").replace(/\s+/g, "").toLowerCase().trim();
}

async function main() {
  const db = await getDatabase();
  const roster = await db.collection("convocatoria_rosters").findOne({ convocatoriaSlug: SLUG });
  if (!roster) throw new Error("Sin nómina");

  let students = [...(roster.students ?? [])];

  // Quitar entradas duplicadas en Otros (José González sin Yevenes)
  students = students.filter((s) => {
    if (normalizeGenerationValue(s.generation) !== "other") return true;
    const name = s.fullName.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    if (name === "jose gonzalez" || (name.includes("jose") && name.includes("gonzalez") && !name.includes("yevenes"))) {
      console.log("Eliminado de nómina Otros:", s.fullName);
      return false;
    }
    return true;
  });

  // Actualizar o crear en Equipo
  const staffIndex = students.findIndex(
    (s) =>
      normalizeGenerationValue(s.generation) === "staff" &&
      /gonzalez.*yevenes|yevenes.*gonzalez/i.test(s.fullName)
  );
  if (staffIndex >= 0) {
    students[staffIndex] = {
      ...students[staffIndex],
      fullName: FULL_NAME,
      generation: GENERATION,
    };
    console.log("Nómina Equipo actualizada:", FULL_NAME);
  } else {
    students.push({
      id: "staff-jose-gonzalez-yevenes",
      fullName: FULL_NAME,
      generation: GENERATION,
    });
    console.log("Nómina Equipo agregado:", FULL_NAME);
  }

  await db.collection("convocatoria_rosters").updateOne(
    { convocatoriaSlug: SLUG },
    { $set: { students, updatedAt: new Date().toISOString() } }
  );

  const submission = await db.collection("experience_form_submissions").findOne({
    formId: FORM_ID,
    "data.email": { $regex: new RegExp(`^${EMAIL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  });

  if (submission) {
    await db.collection("experience_form_submissions").updateOne(
      { _id: submission._id },
      {
        $set: {
          "data.generation": GENERATION,
          "data.program": GENERATION,
          "data.name": FULL_NAME,
          "data.fullName": FULL_NAME,
        },
      }
    );
    console.log("Respuesta actualizada:", EMAIL, "→ Equipo");
  } else {
    console.warn("No se encontró respuesta con email:", EMAIL);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
