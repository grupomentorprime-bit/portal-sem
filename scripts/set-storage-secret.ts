/**
 * Actualiza la clave S3 cifrada en MongoDB (sin pasar por el admin).
 * Uso: npx tsx --env-file=.env scripts/set-storage-secret.ts <applicationKey> [tenantId]
 */
import { createCipheriv, randomBytes, scryptSync } from "node:crypto";
import { MongoClient } from "mongodb";
import { SEM_TENANT_ID } from "../src/core/tenant/constants";
import {
  LEGACY_STORAGE_INTEGRATION_ID,
  storageIntegrationIdForTenant,
} from "../src/core/tenant/resource-ids";

function deriveKey(): Buffer {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) throw new Error("SESSION_SECRET es obligatorio.");
  return scryptSync(secret, "portal-sem-integration-secrets", 32);
}

function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

async function main() {
  const applicationKey = process.argv[2]?.trim();
  if (!applicationKey) {
    console.error(
      "Uso: npx tsx --env-file=.env scripts/set-storage-secret.ts <applicationKey> [tenantId]"
    );
    process.exit(1);
  }

  const tenantId = process.argv[3]?.trim() || SEM_TENANT_ID;
  const scopedId = storageIntegrationIdForTenant(tenantId);

  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB!);
  const col = db.collection("platform_integrations");

  const encrypted = encryptSecret(applicationKey);
  const now = new Date().toISOString();

  let result = await col.updateOne(
    { _id: scopedId },
    {
      $set: {
        secretAccessKeyEncrypted: encrypted,
        tenantId,
        updatedAt: now,
      },
    }
  );

  // Compat: documento legado `_id: storage` (pre-migración 008).
  if (result.matchedCount === 0 && tenantId === SEM_TENANT_ID) {
    result = await col.updateOne(
      { _id: LEGACY_STORAGE_INTEGRATION_ID },
      {
        $set: {
          secretAccessKeyEncrypted: encrypted,
          updatedAt: now,
        },
      }
    );
  }

  await client.close();

  if (result.matchedCount === 0) {
    console.error("No existe configuración de almacenamiento en MongoDB.");
    process.exit(1);
  }

  console.log(`✓ Clave S3 actualizada (${scopedId}) con SESSION_SECRET actual.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
