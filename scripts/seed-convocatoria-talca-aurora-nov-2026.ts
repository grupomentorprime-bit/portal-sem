/**
 * Crea la convocatoria de cierre 7 nov 2026 en Talca Aurora,
 * con la misma nómina de julio y sin respuestas previas.
 *
 * Uso: npx tsx --env-file=.env scripts/seed-convocatoria-talca-aurora-nov-2026.ts
 */
import { MongoClient } from "mongodb";
import { createSemDefaultForms } from "../src/core/experience/forms/defaults";
import { SEM_TENANT_ID } from "../src/core/tenant/constants";
import type { ConvocatoriaRosterStudent } from "../src/types/convocatoria-roster";

const SOURCE_SLUG = "talca-aurora-jul-2026";
const SOURCE_FORM_ID = "convocatoria-talca-aurora-jul-2026";
const TARGET_SLUG = "talca-aurora-nov-2026";
const TARGET_FORM_ID = "convocatoria-talca-aurora-nov-2026";
const TENANT = SEM_TENANT_ID;

function copyStudents(
  students: ConvocatoriaRosterStudent[]
): ConvocatoriaRosterStudent[] {
  return students.map((student) => {
    const next: ConvocatoriaRosterStudent = {
      id: student.id,
      fullName: student.fullName,
      generation: student.generation,
    };
    if (student.rut) next.rut = student.rut;
    if (student.phone) next.phone = student.phone;
    if (student.email) next.email = student.email;
    return next;
  });
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!uri || !dbName) {
    console.error("Faltan MONGODB_URI / MONGODB_DB");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date().toISOString();

  try {
    const defaults = createSemDefaultForms(TENANT);
    const targetForm = defaults.find((form) => form._id === TARGET_FORM_ID);
    const sourceForm = defaults.find((form) => form._id === SOURCE_FORM_ID);
    if (!targetForm || !sourceForm) {
      throw new Error("No están las definiciones base de julio/noviembre.");
    }

    const { createdAt: _createdAt, ...targetWithoutCreated } = targetForm;
    await db.collection("experience_forms").updateOne(
      { _id: TARGET_FORM_ID as never, tenant: TENANT },
      {
        $set: {
          ...targetWithoutCreated,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: targetForm.createdAt || now },
      },
      { upsert: true }
    );

    await db.collection("experience_forms").updateOne(
      { _id: SOURCE_FORM_ID as never, tenant: TENANT },
      {
        $set: {
          active: false,
          visible: false,
          updatedAt: now,
        },
      }
    );

    const sourceRoster = await db.collection("convocatoria_rosters").findOne({
      tenant: TENANT,
      convocatoriaSlug: SOURCE_SLUG,
    });
    if (!sourceRoster?.students?.length) {
      throw new Error(
        `Sin nómina en ${SOURCE_SLUG}. No se copia un listado vacío.`
      );
    }

    const students = copyStudents(
      sourceRoster.students as ConvocatoriaRosterStudent[]
    );
    await db.collection("convocatoria_rosters").updateOne(
      { tenant: TENANT, convocatoriaSlug: TARGET_SLUG },
      {
        $set: {
          tenant: TENANT,
          convocatoriaSlug: TARGET_SLUG,
          formId: TARGET_FORM_ID,
          students,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    const submissions = await db
      .collection("experience_form_submissions")
      .countDocuments({ tenant: TENANT, formId: TARGET_FORM_ID });

    console.log(
      JSON.stringify(
        {
          tenant: TENANT,
          formId: TARGET_FORM_ID,
          slug: TARGET_SLUG,
          students: students.length,
          submissions,
          source: SOURCE_SLUG,
          publicUrl: `/formularios/${TARGET_FORM_ID}`,
          adminUrl: `/admin/portal/forms/convocatorias/${TARGET_SLUG}`,
        },
        null,
        2
      )
    );

    if (submissions > 0) {
      console.warn(
        "Hay respuestas previas en el formulario de noviembre; no se borraron."
      );
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
