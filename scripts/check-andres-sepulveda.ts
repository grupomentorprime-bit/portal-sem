import { getDatabase } from "../src/lib/mongodb";
import { normalizeGenerationValue, formatGenerationDisplay } from "../src/lib/experience/forms/generations";

function norm(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

async function main() {
  const db = await getDatabase();
  const formId = "convocatoria-talca-aurora-jul-2026";
  const roster = await db.collection("convocatoria_rosters").findOne({ convocatoriaSlug: "talca-aurora-jul-2026" });
  const students = roster?.students ?? [];
  const g2023 = students.filter((s) => normalizeGenerationValue(s.generation) === "G-2023");

  const sub = await db.collection("experience_form_submissions").findOne({
    formId,
    "data.email": /ansepulvedar/i,
  });
  const d = sub?.data as Record<string, unknown> | undefined;

  console.log("RESPUESTA:", {
    name: d?.name ?? d?.fullName,
    rut: d?.rut,
    email: d?.email,
    phone: d?.phone,
  });

  console.log("\nSepúlveda en G-2023 nómina:");
  g2023.filter((s) => /sepulveda/i.test(s.fullName)).forEach((s) => console.log(`  ${s.fullName} | ${s.rut}`));

  console.log("\nAndrés en G-2023 nómina:");
  g2023.filter((s) => /andres/i.test(norm(s.fullName))).forEach((s) => console.log(`  ${s.fullName} | ${s.rut}`));

  console.log('\n"Sepúlveda" + "Ramírez" en toda la nómina:');
  students
    .filter((s) => norm(s.fullName).includes("sepulveda") && norm(s.fullName).includes("ramirez"))
    .forEach((s) => console.log(`  ${formatGenerationDisplay(s.generation)}: ${s.fullName}`));

  if (d?.phone) {
    const tail = String(d.phone).replace(/\D/g, "").slice(-8);
    const samePhone = await db
      .collection("experience_form_submissions")
      .find({ formId, "data.phone": { $regex: tail } })
      .toArray();
    console.log("\nMismo teléfono (últimos 8 dígitos):");
    samePhone.forEach((s) =>
      console.log(`  ${s.data?.name} | ${formatGenerationDisplay(s.data?.generation ?? s.data?.program)}`)
    );
  }
}

main();
