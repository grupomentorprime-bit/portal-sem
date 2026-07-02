import "server-only";

import { seedContentCollections } from "@/lib/content/seed";
import { getDatabase } from "@/lib/mongodb";

/** Garantiza contenido demo en MongoDB antes de renderizar la Home */
export async function ensureHomeInstitutionalContent(tenant: string): Promise<void> {
  if (!tenant) return;

  try {
    const db = await getDatabase();
    const programsCount = await db.collection("academy_programs").countDocuments({ tenant });
    if (programsCount === 0) {
      await seedContentCollections(tenant);
    }
  } catch (error) {
    console.error("[Home] ensureHomeInstitutionalContent:", error);
  }
}
