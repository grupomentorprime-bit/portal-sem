import "server-only";

import { ObjectId } from "mongodb";
import { submissionIdKey } from "@/core/congress/form-engagement";
import { getDatabase } from "@/lib/mongodb";

const SUBMISSIONS = "experience_form_submissions";

/**
 * Map submissionId (string) → createdAt ISO del envío.
 * Acepta strings u ObjectId (registros antiguos); las claves del mapa son strings.
 * IDs inválidos o sin documento se omiten del mapa.
 */
export async function loadFormSubmittedAtBySubmissionIds(
  tenantId: string,
  submissionIds: readonly unknown[]
): Promise<Map<string, string>> {
  const unique = [
    ...new Set(
      submissionIds
        .map((id) => submissionIdKey(id))
        .filter((id): id is string => id !== null)
    ),
  ];
  const objectIds: ObjectId[] = [];
  const idByHex = new Map<string, string>();
  for (const id of unique) {
    try {
      const oid = new ObjectId(id);
      objectIds.push(oid);
      idByHex.set(oid.toHexString(), id);
    } catch {
      // skip non-ObjectId strings
    }
  }
  const out = new Map<string, string>();
  if (objectIds.length === 0) return out;

  const db = await getDatabase();
  const rows = await db
    .collection<{ _id: ObjectId; createdAt?: string }>(SUBMISSIONS)
    .find(
      { tenant: tenantId, _id: { $in: objectIds } },
      { projection: { createdAt: 1 } }
    )
    .toArray();

  for (const row of rows) {
    const key = idByHex.get(row._id.toHexString());
    const createdAt = typeof row.createdAt === "string" ? row.createdAt : null;
    if (key && createdAt) out.set(key, createdAt);
  }
  return out;
}
