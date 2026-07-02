import "server-only";

import { invalidateS3ClientCache } from "@/lib/cms/storage-s3";
import {
  inferS3Region,
  normalizePublicUrl,
  normalizeS3Endpoint,
  normalizeS3Fields,
} from "@/lib/cms/storage-normalize";
import { getDatabase } from "@/lib/mongodb";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import type {
  ResolvedStorageSettings,
  StorageIntegrationDocument,
  StorageIntegrationPublic,
  StorageIntegrationUpdate,
  StorageProvider,
} from "@/types/integrations";
import { STORAGE_INTEGRATION_ID } from "@/types/integrations";

const COLLECTION = "platform_integrations";
const CACHE_TTL_MS = 30_000;

let cachedSettings: ResolvedStorageSettings | null = null;
let cacheExpiresAt = 0;

export function invalidateStorageConfigCache(): void {
  cachedSettings = null;
  cacheExpiresAt = 0;
}

function normalizeUrl(value: string): string {
  return normalizePublicUrl(value);
}

function resolveFromEnv(): ResolvedStorageSettings | null {
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();

  if (!bucket || !accessKeyId || !secretAccessKey) return null;

  return {
    mode: "s3",
    source: "env",
    s3: normalizeS3Fields({
      endpoint: process.env.S3_ENDPOINT?.trim() ?? "",
      region: process.env.S3_REGION?.trim() || "auto",
      bucket,
      accessKeyId,
      secretAccessKey,
      publicUrl: process.env.S3_PUBLIC_URL ?? "",
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      accessMode: process.env.S3_PUBLIC_URL?.trim() ? "public" : "private",
    }),
  };
}

async function fetchStorageDocument(): Promise<StorageIntegrationDocument | null> {
  const db = await getDatabase();
  return db
    .collection<StorageIntegrationDocument>(COLLECTION)
    .findOne({ _id: STORAGE_INTEGRATION_ID });
}

function resolveFromDocument(doc: StorageIntegrationDocument): ResolvedStorageSettings | null {
  if (!doc.enabled) return null;
  if (!doc.bucket?.trim() || !doc.accessKeyId?.trim() || !doc.secretAccessKeyEncrypted) {
    return null;
  }

  try {
    const secretAccessKey = decryptSecret(doc.secretAccessKeyEncrypted);
    return {
      mode: "s3",
      source: "database",
      s3: normalizeS3Fields({
        endpoint: doc.endpoint,
        region: doc.region.trim() || "auto",
        bucket: doc.bucket,
        accessKeyId: doc.accessKeyId,
        secretAccessKey,
        publicUrl: doc.publicUrl,
        forcePathStyle: doc.forcePathStyle,
        accessMode: doc.accessMode ?? "private",
      }),
    };
  } catch {
    return null;
  }
}

export async function resolveStorageSettings(): Promise<ResolvedStorageSettings> {
  const now = Date.now();
  if (cachedSettings && cacheExpiresAt > now) {
    return cachedSettings;
  }

  const doc = await fetchStorageDocument();
  const fromDb = doc ? resolveFromDocument(doc) : null;
  const resolved = fromDb ?? resolveFromEnv() ?? { mode: "local" as const, source: "none" as const };

  cachedSettings = resolved;
  cacheExpiresAt = now + CACHE_TTL_MS;
  return resolved;
}

export async function getStorageIntegrationPublic(): Promise<StorageIntegrationPublic> {
  const doc = await fetchStorageDocument();
  const envResolved = resolveFromEnv();

  if (doc) {
    return {
      enabled: doc.enabled,
      provider: doc.provider,
      accessMode: doc.accessMode ?? "private",
      endpoint: doc.endpoint,
      region: doc.region,
      bucket: doc.bucket,
      accessKeyId: doc.accessKeyId,
      hasSecretAccessKey: Boolean(doc.secretAccessKeyEncrypted),
      publicUrl: doc.publicUrl,
      forcePathStyle: doc.forcePathStyle,
      configured: Boolean(doc.enabled && doc.bucket && doc.accessKeyId && doc.secretAccessKeyEncrypted),
      source: doc.enabled && doc.bucket && doc.accessKeyId && doc.secretAccessKeyEncrypted ? "database" : "none",
      updatedAt: doc.updatedAt,
    };
  }

  if (envResolved?.s3) {
    return {
      enabled: true,
      provider: "s3-compatible",
      accessMode: envResolved.s3.accessMode,
      endpoint: envResolved.s3.endpoint,
      region: envResolved.s3.region,
      bucket: envResolved.s3.bucket,
      accessKeyId: envResolved.s3.accessKeyId,
      hasSecretAccessKey: true,
      publicUrl: envResolved.s3.publicUrl,
      forcePathStyle: envResolved.s3.forcePathStyle,
      configured: true,
      source: "env",
    };
  }

  return {
    enabled: false,
    provider: "backblaze-b2",
    accessMode: "private",
    endpoint: "",
    region: "auto",
    bucket: "",
    accessKeyId: "",
    hasSecretAccessKey: false,
    publicUrl: "",
    forcePathStyle: true,
    configured: false,
    source: "none",
  };
}

export function providerDefaults(provider: StorageProvider): Partial<StorageIntegrationUpdate> {
  switch (provider) {
    case "backblaze-b2":
      return {
        provider,
        accessMode: "private",
        region: "auto",
        forcePathStyle: true,
        endpoint: "https://s3.us-east-005.backblazeb2.com",
      };
    case "aws":
      return {
        provider,
        region: "us-east-1",
        forcePathStyle: false,
        endpoint: "",
      };
    default:
      return {
        provider,
        region: "auto",
        forcePathStyle: true,
        endpoint: "",
      };
  }
}

export async function updateStorageIntegration(
  update: StorageIntegrationUpdate
): Promise<StorageIntegrationPublic> {
  const db = await getDatabase();
  const existing = await fetchStorageDocument();
  const now = new Date().toISOString();

  let secretAccessKeyEncrypted = existing?.secretAccessKeyEncrypted ?? "";

  if (update.secretAccessKey?.trim()) {
    secretAccessKeyEncrypted = encryptSecret(update.secretAccessKey.trim());
  } else if (!existing && !update.secretAccessKey?.trim()) {
    throw new Error("La clave secreta es obligatoria en la configuración inicial.");
  }

  const document: StorageIntegrationDocument = {
    _id: STORAGE_INTEGRATION_ID,
    enabled: update.enabled,
    provider: update.provider,
    accessMode: update.accessMode ?? "private",
    endpoint: normalizeS3Endpoint(update.endpoint),
    region: inferS3Region(normalizeS3Endpoint(update.endpoint), update.region),
    bucket: update.bucket.trim(),
    accessKeyId: update.accessKeyId.trim(),
    secretAccessKeyEncrypted,
    publicUrl: normalizeUrl(update.publicUrl),
    forcePathStyle: update.forcePathStyle,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await db.collection<StorageIntegrationDocument>(COLLECTION).replaceOne(
    { _id: STORAGE_INTEGRATION_ID },
    document,
    { upsert: true }
  );

  invalidateStorageConfigCache();
  invalidateS3ClientCache();
  return getStorageIntegrationPublic();
}

export async function getResolvedS3SettingsForTest(
  override?: StorageIntegrationUpdate
): Promise<NonNullable<ResolvedStorageSettings["s3"]>> {
  if (override) {
    const existing = await fetchStorageDocument();
    const secret =
      override.secretAccessKey?.trim() ||
      (existing?.secretAccessKeyEncrypted
        ? decryptSecret(existing.secretAccessKeyEncrypted)
        : "");

    if (!override.bucket?.trim() || !override.accessKeyId?.trim() || !secret) {
      throw new Error("Completa bucket, access key y secret key para probar la conexión.");
    }

    return normalizeS3Fields({
      endpoint: override.endpoint,
      region: override.region.trim() || "auto",
      bucket: override.bucket,
      accessKeyId: override.accessKeyId,
      secretAccessKey: secret,
      publicUrl: override.publicUrl,
      forcePathStyle: override.forcePathStyle,
      accessMode: override.accessMode ?? "private",
    });
  }

  const resolved = await resolveStorageSettings();
  if (resolved.mode !== "s3" || !resolved.s3) {
    throw new Error("No hay almacenamiento S3 configurado.");
  }
  return resolved.s3;
}
