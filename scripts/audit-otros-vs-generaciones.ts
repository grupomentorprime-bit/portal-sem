/**
 * Coteja participantes en Otros vs nóminas de todas las generaciones y detecta duplicados.
 * npx tsx --env-file=.env scripts/audit-otros-vs-generaciones.ts
 */
import { getDatabase } from "../src/lib/mongodb";
import { formatGenerationDisplay, normalizeGenerationValue } from "../src/lib/experience/forms/generations";

const SLUG = "talca-aurora-jul-2026";
const FORM_ID = "convocatoria-talca-aurora-jul-2026";

function normalizeRut(value: string): string {
  return value.replace(/\./g, "").replace(/-/g, "").replace(/\s+/g, "").toLowerCase().trim();
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const db = await getDatabase();
  const roster = await db.collection("convocatoria_rosters").findOne({ convocatoriaSlug: SLUG });
  if (!roster) throw new Error("Sin nómina");

  const students = roster.students ?? [];
  const subs = await db.collection("experience_form_submissions").find({ formId: FORM_ID }).toArray();

  const otrosRoster = students.filter(
    (s) => normalizeGenerationValue(s.generation) === "other"
  );
  const otrosSubs = subs.filter(
    (sub) => normalizeGenerationValue(sub.data?.generation ?? sub.data?.program) === "other"
  );

  console.log("=== EN NÓMINA OTROS:", otrosRoster.length, "===");
  for (const s of otrosRoster) {
    console.log(`- ${s.fullName} | RUT: ${s.rut ?? "—"}`);
  }

  console.log("\n=== RESPUESTAS MARCADAS OTROS:", otrosSubs.length, "===");
  for (const sub of otrosSubs) {
    const d = sub.data as Record<string, unknown>;
    console.log(
      `- ${String(d.name ?? d.fullName)} | RUT: ${String(d.rut ?? "—")} | ${String(d.email ?? "—")}`
    );
  }

  // Índice global de nómina por RUT y por nombre
  const rosterByRut = new Map<string, { fullName: string; generation: string }>();
  const rosterByName = new Map<string, { fullName: string; generation: string; rut?: string }>();

  for (const student of students) {
    const gen = formatGenerationDisplay(student.generation);
    if (student.rut) {
      const key = normalizeRut(student.rut);
      if (key.length >= 8) {
        const prev = rosterByRut.get(key);
        if (prev && prev.generation !== gen) {
          console.log("\n⚠ RUT duplicado en nómina:", key, prev, "vs", { fullName: student.fullName, generation: gen });
        }
        rosterByRut.set(key, { fullName: student.fullName, generation: gen });
      }
    }
    const nameKey = normalizeName(student.fullName);
    if (nameKey.length > 3) {
      rosterByName.set(nameKey, { fullName: student.fullName, generation: gen, rut: student.rut });
    }
  }

  console.log("\n=== COTEJO: OTROS → ¿PERTENECE A ALGUNA GENERACIÓN? ===");

  for (const sub of otrosSubs) {
    const d = sub.data as Record<string, unknown>;
    const name = String(d.name ?? d.fullName ?? "");
    const rut = String(d.rut ?? "").trim();
    const email = String(d.email ?? "");
    const rutKey = rut ? normalizeRut(rut) : "";
    const nameKey = normalizeName(name);

    console.log(`\n▸ ${name}`);
    console.log(`  RUT respuesta: ${rut || "—"} | Email: ${email}`);

    let match: { fullName: string; generation: string; via: string } | null = null;

    if (rutKey.length >= 8 && rosterByRut.has(rutKey)) {
      const hit = rosterByRut.get(rutKey)!;
      if (!/otros/i.test(hit.generation)) {
        match = { ...hit, via: "RUT exacto" };
      }
    }

    if (!match && nameKey.length > 3) {
      // Buscar por nombre en toda la nómina (no Otros)
      for (const student of students) {
        if (normalizeGenerationValue(student.generation) === "other") continue;
        const sn = normalizeName(student.fullName);
        if (sn === nameKey || sn.includes(nameKey) || nameKey.includes(sn)) {
          match = {
            fullName: student.fullName,
            generation: formatGenerationDisplay(student.generation),
            via: "nombre similar",
          };
          break;
        }
      }
    }

    // Buscar por email en submissions de otras generaciones
    if (!match && email) {
      const emailHit = subs.find((s) => {
        const se = normalizeEmail(String(s.data?.email ?? ""));
        if (se !== normalizeEmail(email)) return false;
        return normalizeGenerationValue(s.data?.generation ?? s.data?.program) !== "other";
      });
      if (emailHit) {
        match = {
          fullName: String(emailHit.data?.name ?? emailHit.data?.fullName),
          generation: formatGenerationDisplay(
            emailHit.data?.generation ?? emailHit.data?.program
          ),
          via: "email en otra respuesta",
        };
      }
    }

    // Email match against roster students - fuzzy name from email local part
    if (!match && email) {
      const local = email.split("@")[0]?.toLowerCase() ?? "";
      for (const student of students) {
        if (normalizeGenerationValue(student.generation) === "other") continue;
        const parts = normalizeName(student.fullName).split(" ");
        const hit = parts.some((p) => p.length > 4 && local.includes(p));
        if (hit) {
          match = {
            fullName: student.fullName,
            generation: formatGenerationDisplay(student.generation),
            via: "email vs nombre nómina",
          };
          break;
        }
      }
    }

    if (match) {
      console.log(`  ✓ Coincide con nómina ${match.generation} (${match.via})`);
      console.log(`    → ${match.fullName}`);
    } else {
      console.log("  ✗ No encontrado en nóminas G-2023…G-2026 ni Equipo");
    }
  }

  // Duplicados en respuestas
  console.log("\n=== DUPLICADOS EN RESPUESTAS ===");
  const subsByRut = new Map<string, typeof subs>();
  const subsByEmail = new Map<string, typeof subs>();

  for (const sub of subs) {
    const rut = normalizeRut(String(sub.data?.rut ?? ""));
    const email = normalizeEmail(String(sub.data?.email ?? ""));
    if (rut.length >= 8) {
      const list = subsByRut.get(rut) ?? [];
      list.push(sub);
      subsByRut.set(rut, list);
    }
    if (email.includes("@")) {
      const list = subsByEmail.get(email) ?? [];
      list.push(sub);
      subsByEmail.set(email, list);
    }
  }

  let dupRut = 0;
  for (const [rut, list] of subsByRut) {
    if (list.length > 1) {
      dupRut += 1;
      console.log(`RUT repetido ${rut}:`);
      list.forEach((s) =>
        console.log(
          `  - ${s.data?.name ?? s.data?.fullName} | ${formatGenerationDisplay(s.data?.generation ?? s.data?.program)}`
        )
      );
    }
  }
  if (dupRut === 0) console.log("Sin RUT duplicados en respuestas ✓");

  let dupEmail = 0;
  for (const [email, list] of subsByEmail) {
    if (list.length > 1) {
      dupEmail += 1;
      console.log(`Email repetido ${email}:`);
      list.forEach((s) =>
        console.log(
          `  - ${s.data?.name ?? s.data?.fullName} | ${formatGenerationDisplay(s.data?.generation ?? s.data?.program)}`
        )
      );
    }
  }
  if (dupEmail === 0) console.log("Sin emails duplicados en respuestas ✓");

  // Duplicados RUT en nómina total
  console.log("\n=== DUPLICADOS RUT EN NÓMINA (todas generaciones) ===");
  const rutCounts = new Map<string, string[]>();
  for (const s of students) {
    if (!s.rut) continue;
    const key = normalizeRut(s.rut);
    const list = rutCounts.get(key) ?? [];
    list.push(`${s.fullName} (${formatGenerationDisplay(s.generation)})`);
    rutCounts.set(key, list);
  }
  let dupRoster = 0;
  for (const [rut, names] of rutCounts) {
    if (names.length > 1) {
      dupRoster += 1;
      console.log(`${rut}:`, names.join(" | "));
    }
  }
  if (dupRoster === 0) console.log("Sin RUT duplicados en nómina ✓");

  // Personas en Otros que también están en otra generación en nómina
  console.log("\n=== MISMA PERSONA EN OTROS Y OTRA GENERACIÓN (nómina) ===");
  let cross = 0;
  for (const otro of otrosRoster) {
    if (!otro.rut) continue;
    const key = normalizeRut(otro.rut);
    const allWithRut = students.filter((s) => s.rut && normalizeRut(s.rut) === key);
    if (allWithRut.length > 1) {
      cross += 1;
      console.log(key + ":", allWithRut.map((s) => `${s.fullName} → ${formatGenerationDisplay(s.generation)}`).join(" | "));
    }
  }
  if (cross === 0) console.log("Ninguno ✓");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
