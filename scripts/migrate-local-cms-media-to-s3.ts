/**
 * Sube a S3 los archivos CMS que aún solo existen en public/media (almacenamiento local).
 * Necesario antes de desplegar en Docker/Dockploy: el contenedor no incluye uploads locales.
 *
 * Uso: npx tsx --env-file=.env scripts/migrate-local-cms-media-to-s3.ts
 *      npx tsx --env-file=.env scripts/migrate-local-cms-media-to-s3.ts --dry-run
 */
import { createDecipheriv, scryptSync } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const dryRun = process.argv.includes("--dry-run");
const STORAGE_INTEGRATION_ID = "storage";

if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI o MONGODB_DB en el entorno.");
  process.exit(1);
}

const LOCAL_MEDIA_ROOT = join(process.cwd(), "public", "media");
const MEDIA_STREAM_PATH = "/api/cms/media/stream";

interface MediaResponsiveUrls {
  [key: string]: string | undefined;
}

interface CmsMediaAsset {
  _id: string;
  tenant: string;
  url: string;
  thumbnail?: string;
  responsive?: MediaResponsiveUrls;
  visibility?: string;
}

interface StorageDocument {
  enabled: boolean;
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKeyEncrypted?: string;
  publicUrl: string;
  forcePathStyle: boolean;
  accessMode?: "public" | "private";
}

interface S3Config {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
  forcePathStyle: boolean;
  accessMode: "public" | "private";
}

function deriveKey(): Buffer {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("SESSION_SECRET es obligatorio para descifrar la clave S3 de MongoDB.");
  }
  return scryptSync(secret, "portal-sem-integration-secrets", 32);
}

function decryptSecret(stored: string): string {
  const [ivHex, tagHex, dataHex] = stored.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Formato de secreto cifrado inválido.");
  }
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function normalizeEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/$/, "");
  return `https://${trimmed.replace(/\/$/, "")}`;
}

function resolveFromEnv(): S3Config | null {
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  if (!bucket || !accessKeyId || !secretAccessKey) return null;

  const publicUrl = process.env.S3_PUBLIC_URL?.trim().replace(/\/$/, "") ?? "";
  return {
    endpoint: normalizeEndpoint(process.env.S3_ENDPOINT?.trim() ?? ""),
    region: process.env.S3_REGION?.trim() || "auto",
    bucket,
    accessKeyId,
    secretAccessKey,
    publicUrl,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    accessMode: publicUrl ? "public" : "private",
  };
}

function resolveFromDocument(doc: StorageDocument): S3Config | null {
  if (!doc.enabled || !doc.bucket?.trim() || !doc.accessKeyId?.trim() || !doc.secretAccessKeyEncrypted) {
    return null;
  }
  try {
    return {
      endpoint: normalizeEndpoint(doc.endpoint),
      region: doc.region.trim() || "auto",
      bucket: doc.bucket.trim(),
      accessKeyId: doc.accessKeyId.trim(),
      secretAccessKey: decryptSecret(doc.secretAccessKeyEncrypted),
      publicUrl: doc.publicUrl.trim().replace(/\/$/, ""),
      forcePathStyle: doc.forcePathStyle,
      accessMode: doc.accessMode ?? (doc.publicUrl?.trim() ? "public" : "private"),
    };
  } catch {
    console.warn(
      "No se pudo descifrar la clave S3 de MongoDB (SESSION_SECRET distinto al de producción). Usa S3_* en .env."
    );
    return null;
  }
}

function buildMediaProxyUrl(storageKey: string): string {
  return `${MEDIA_STREAM_PATH}?key=${encodeURIComponent(storageKey)}`;
}

function buildPublicUrl(s3: S3Config, key: string): string {
  if (s3.accessMode === "private") return buildMediaProxyUrl(key);
  if (s3.publicUrl) return `${s3.publicUrl}/media/${key}`;
  return buildMediaProxyUrl(key);
}

function createS3Client(s3: S3Config): S3Client {
  return new S3Client({
    region: s3.region || "auto",
    endpoint: s3.endpoint || undefined,
    credentials: {
      accessKeyId: s3.accessKeyId,
      secretAccessKey: s3.secretAccessKey,
    },
    forcePathStyle: s3.forcePathStyle,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

async function putS3Object(
  s3: S3Config,
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  const client = createS3Client(s3);
  await client.send(
    new PutObjectCommand({
      Bucket: s3.bucket,
      Key: `media/${key}`,
      Body: buffer,
      ContentType: mimeType,
    })
  );
}

function stripVersionQuery(url: string): string {
  return url.replace(/[?&]v=\d+$/, "").replace(/\?v=\d+&/, "?");
}

function urlToStorageKey(url: string): string | null {
  const pathOnly = stripVersionQuery(url).replace(/^https?:\/\/[^/]+/, "");
  if (!pathOnly.startsWith("/media/")) return null;
  return pathOnly.replace(/^\/media\//, "");
}

function collectUrls(asset: CmsMediaAsset): string[] {
  const urls = new Set<string>();
  if (asset.url?.trim()) urls.add(asset.url.trim());
  if (asset.thumbnail?.trim()) urls.add(asset.thumbnail.trim());
  for (const value of Object.values(asset.responsive ?? {})) {
    if (typeof value === "string" && value.trim()) urls.add(value.trim());
  }
  return [...urls];
}

function rewriteUrl(url: string, keyToPublicUrl: Map<string, string>): string {
  const key = urlToStorageKey(url);
  if (!key) return url;
  const next = keyToPublicUrl.get(key);
  if (!next) return url;

  const versionMatch = url.match(/[?&]v=(\d+)/);
  if (!versionMatch) return next;
  const separator = next.includes("?") ? "&" : "?";
  return `${next}${separator}v=${versionMatch[1]}`;
}

function rewriteResponsive(
  responsive: MediaResponsiveUrls | undefined,
  keyToPublicUrl: Map<string, string>
): MediaResponsiveUrls {
  if (!responsive) return {};
  const next: MediaResponsiveUrls = {};
  for (const [field, value] of Object.entries(responsive)) {
    if (typeof value === "string") {
      next[field] = rewriteUrl(value, keyToPublicUrl);
    }
  }
  return next;
}

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    webp: "image/webp",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    avif: "image/avif",
    mp4: "video/mp4",
    pdf: "application/pdf",
  };
  return map[ext] ?? "application/octet-stream";
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const doc = await db
    .collection<StorageDocument>("platform_integrations")
    .findOne({ _id: STORAGE_INTEGRATION_ID });
  const s3 = (doc ? resolveFromDocument(doc) : null) ?? resolveFromEnv();

  if (!s3) {
    console.error(
      "Almacenamiento S3 no configurado. Actívalo en Admin → Integraciones o define S3_* en .env."
    );
    process.exit(1);
  }

  const assets = await db
    .collection<CmsMediaAsset>("cms_media")
    .find({ visibility: "active" })
    .toArray();

  const keyToPublicUrl = new Map<string, string>();
  let uploaded = 0;
  let skipped = 0;
  let missing = 0;

  for (const asset of assets) {
    for (const url of collectUrls(asset)) {
      const key = urlToStorageKey(url);
      if (!key || keyToPublicUrl.has(key)) continue;

      const localPath = join(LOCAL_MEDIA_ROOT, key);
      if (!existsSync(localPath)) {
        if (url.startsWith("/media/") && !url.includes(MEDIA_STREAM_PATH)) {
          missing += 1;
          console.warn(`  ⚠ Archivo local no encontrado: ${localPath}`);
        }
        continue;
      }

      const publicUrl = buildPublicUrl(s3, key);

      if (dryRun) {
        console.log(`  [dry-run] subiría ${key} → ${publicUrl}`);
        keyToPublicUrl.set(key, publicUrl);
        uploaded += 1;
        continue;
      }

      const buffer = readFileSync(localPath);
      await putS3Object(s3, key, buffer, guessMimeType(key));
      keyToPublicUrl.set(key, publicUrl);
      uploaded += 1;
      console.log(`  ✓ ${key}`);
    }
  }

  let updatedDocs = 0;

  for (const asset of assets) {
    const urls = collectUrls(asset);
    const needsUpdate = urls.some((url) => {
      const key = urlToStorageKey(url);
      return Boolean(key && keyToPublicUrl.has(key) && url.startsWith("/media/"));
    });

    if (!needsUpdate) {
      skipped += 1;
      continue;
    }

    const nextUrl = rewriteUrl(asset.url, keyToPublicUrl);
    const nextThumbnail = rewriteUrl(asset.thumbnail || asset.url, keyToPublicUrl);
    const nextResponsive = rewriteResponsive(asset.responsive, keyToPublicUrl);

    if (dryRun) {
      console.log(`  [dry-run] actualizaría cms_media ${asset._id}`);
      updatedDocs += 1;
      continue;
    }

    await db.collection<CmsMediaAsset>("cms_media").updateOne(
      { _id: asset._id },
      {
        $set: {
          url: nextUrl,
          thumbnail: nextThumbnail,
          responsive: nextResponsive,
          updatedAt: new Date().toISOString(),
        },
      }
    );
    updatedDocs += 1;
    console.log(`  ↻ cms_media ${asset._id}`);
  }

  await client.close();

  console.log("\n--- Resumen ---");
  console.log(`Archivos subidos a S3: ${uploaded}`);
  console.log(`Documentos cms_media actualizados: ${updatedDocs}`);
  console.log(`Activos sin cambios: ${skipped}`);
  if (missing > 0) {
    console.log(`Referencias sin archivo local: ${missing}`);
  }
  if (s3.accessMode === "private") {
    console.log("\nModo bucket privado: las URLs quedan en /api/cms/media/stream?key=…");
  }
  if (dryRun) {
    console.log("\n(dry-run — no se escribió nada. Ejecuta sin --dry-run para aplicar.)");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
