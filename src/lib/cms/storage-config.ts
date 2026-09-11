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
import { logServerError } from "@/core/security/redact";
import { SEM_TENANT_ID } from "@/core/tenant/constants";
import {
  LEGACY_STORAGE_INTEGRATION_ID,
  storageIntegrationIdForTenant,
} from "@/core/tenant/resource-ids";
import type {
  ResolvedStorageSettings,
  StorageIntegrationDocument,
  StorageIntegrationPublic,
  StorageIntegrationUpdate,
  StorageProvider,
} from "@/types/integrations";

const COLLECTION = "platform_integrations";
const CACHE_TTL_MS = 30_000;

const cachedByTenant = new Map<string, { settings: ResolvedStorageSettings; expiresAt: number }>();

export function invalidateStorageConfigCache(tenantId?: string): void {
  if (tenantId) {
    cachedByTenant.delete(tenantId);
    return;
  }
  cachedByTenant.clear();
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

/**
 * Lectura por tenant. Compat SEM: si falta `storage:{tenantId}`, intenta
 * el singleton legado `_id: "storage"` solo para T001.
 */
async function fetchStorageDocument(
  tenantId: string
): Promise<StorageIntegrationDocument | null> {
  const db = await getDatabase();
  const col = db.collection<StorageIntegrationDocument>(COLLECTION);
  const scopedId = storageIntegrationIdForTenant(tenantId);

  const scoped = await col.findOne({ _id: scopedId, tenantId });
  if (scoped) return scoped;

  // Compat temporal T001: documento legado sin tenantId.
  if (tenantId === SEM_TENANT_ID) {
    const legacy = await col.findOne({ _id: LEGACY_STORAGE_INTEGRATION_ID });
    if (legacy && (!legacy.tenantId || legacy.tenantId === SEM_TENANT_ID)) {
      return legacy;
    }
  }

  return null;
}

function resolveFromDocument(doc: StorageIntegrationDocument): ResolvedStorageSettings | null {
  if (!doc.enabled) return null;
  if (!doc.bucket?.trim() || !doc.accessKeyId?.trim() || !doc.secretAccessKeyEncrypted) {
    return null;
  }

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
}

export async function resolveStorageSettings(
  tenantId: string
): Promise<ResolvedStorageSettings> {
  const now = Date.now();
  const cached = cachedByTenant.get(tenantId);
  if (cached && cached.expiresAt > now) {
    return cached.settings;
  }

  const doc = await fetchStorageDocument(tenantId);
  if (doc) {
    try {
      const fromDb = resolveFromDocument(doc);
      if (fromDb) {
        cachedByTenant.set(tenantId, { settings: fromDb, expiresAt: now + CACHE_TTL_MS });
        return fromDb;
      }
    } catch (error) {
      logServerError("storage", error);
    }
    // Documento propio del tenant (aunque esté deshabilitado): no usar S3 de proceso.
    const local: ResolvedStorageSettings = { mode: "local", source: "none" };
    cachedByTenant.set(tenantId, { settings: local, expiresAt: now + CACHE_TTL_MS });
    return local;
  }

  const fromEnv = resolveFromEnv();
  const resolved = fromEnv ?? { mode: "local" as const, source: "none" as const };

  cachedByTenant.set(tenantId, { settings: resolved, expiresAt: now + CACHE_TTL_MS });
  return resolved;
}

export const STORAGE_NOT_CONFIGURED_MESSAGE =
  "Configure el almacenamiento en Admin → Integraciones → Almacenamiento y guárdelo activo.";

export const STORAGE_INTEGRATION_INCOMPLETE_MESSAGE =
  "La integración de almacenamiento está incompleta. Revise el bucket y las claves en Integraciones → Almacenamiento.";

export const STORAGE_INTEGRATION_DECRYPT_MESSAGE =
  "No se pudo leer la clave guardada. Vuelva a ingresar la clave secreta en Integraciones → Almacenamiento y pulse Guardar.";

/** @deprecated Usar STORAGE_NOT_CONFIGURED_MESSAGE */
export const STORAGE_S3_REQUIRED_MESSAGE = STORAGE_NOT_CONFIGURED_MESSAGE;

export function isS3StorageReady(
  settings: ResolvedStorageSettings
): settings is ResolvedStorageSettings & { mode: "s3"; s3: NonNullable<ResolvedStorageSettings["s3"]> } {
  return settings.mode === "s3" && Boolean(settings.s3);
}

/** Todas las subidas de archivos deben ir a S3 (local solo para lectura legacy en desarrollo). */
export async function assertS3StorageForUpload(
  tenantId: string
): Promise<NonNullable<ResolvedStorageSettings["s3"]>> {
  const doc = await fetchStorageDocument(tenantId);

  if (doc?.enabled) {
    if (!doc.bucket?.trim() || !doc.accessKeyId?.trim() || !doc.secretAccessKeyEncrypted) {
      throw new Error(STORAGE_INTEGRATION_INCOMPLETE_MESSAGE);
    }

    try {
      const fromDb = resolveFromDocument(doc);
      if (fromDb?.s3) return fromDb.s3;
    } catch (error) {
      logServerError("storage", error);
      throw new Error(STORAGE_INTEGRATION_DECRYPT_MESSAGE);
    }
  }

  const settings = await resolveStorageSettings(tenantId);
  if (isS3StorageReady(settings)) {
    return settings.s3;
  }

  throw new Error(STORAGE_NOT_CONFIGURED_MESSAGE);
}

export async function getStorageIntegrationPublic(
  tenantId: string
): Promise<StorageIntegrationPublic> {
  const doc = await fetchStorageDocument(tenantId);
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
  tenantId: string,
  update: StorageIntegrationUpdate
): Promise<StorageIntegrationPublic> {
  const db = await getDatabase();
  const existing = await fetchStorageDocument(tenantId);
  const now = new Date().toISOString();
  const scopedId = storageIntegrationIdForTenant(tenantId);

  let secretAccessKeyEncrypted = existing?.secretAccessKeyEncrypted ?? "";

  if (update.secretAccessKey?.trim()) {
    secretAccessKeyEncrypted = encryptSecret(update.secretAccessKey.trim());
  } else if (!existing && !update.secretAccessKey?.trim()) {
    throw new Error("La clave secreta es obligatoria en la configuración inicial.");
  }

  const document: StorageIntegrationDocument = {
    _id: scopedId,
    tenantId,
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
    { _id: scopedId },
    document,
    { upsert: true }
  );

  // Si existía el singleton legado SEM, no lo borramos aquí — migración 008 lo mueve.
  invalidateStorageConfigCache(tenantId);
  invalidateS3ClientCache();
  return getStorageIntegrationPublic(tenantId);
}

export async function getResolvedS3SettingsForTest(
  tenantId: string,
  override?: StorageIntegrationUpdate
): Promise<NonNullable<ResolvedStorageSettings["s3"]>> {
  if (override) {
    const existing = await fetchStorageDocument(tenantId);
    const secret =
      override.secretAccessKey?.trim() ||
      (existing?.secretAccessKeyEncrypted
        ? decryptSecret(existing.secretAccessKeyEncrypted)
        : "");

    if (!override.bucket?.trim() || !override.accessKeyId?.trim() || !secret) {
      throw new Error("Complete bucket, ID de clave y clave secreta para probar la conexión.");
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

  const resolved = await resolveStorageSettings(tenantId);
  if (resolved.mode !== "s3" || !resolved.s3) {
    throw new Error("No hay almacenamiento S3 configurado.");
  }
  return resolved.s3;
}
