import { mkdir, writeFile, unlink, rm } from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export interface StoragePutResult {
  key: string;
  publicUrl: string;
}

function getStorageMode(): "s3" | "local" {
  if (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID) return "s3";
  return "local";
}

function publicBaseUrl(): string {
  if (process.env.S3_PUBLIC_URL) return process.env.S3_PUBLIC_URL.replace(/\/$/, "");
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "";
  return base.replace(/\/$/, "");
}

function localMediaRoot(): string {
  return path.join(process.cwd(), "public", "media");
}

function buildPublicUrl(key: string): string {
  const base = publicBaseUrl();
  if (base) return `${base}/media/${key}`;
  return `/media/${key}`;
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    });
  }
  return s3Client;
}

export async function putMediaFile(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<StoragePutResult> {
  const mode = getStorageMode();

  if (mode === "s3") {
    const bucket = process.env.S3_BUCKET!;
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `media/${key}`,
        Body: buffer,
        ContentType: mimeType,
        ACL: "public-read",
      })
    );
    const publicUrl = process.env.S3_PUBLIC_URL
      ? `${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/media/${key}`
      : buildPublicUrl(key);
    return { key, publicUrl };
  }

  const filePath = path.join(localMediaRoot(), key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
  return { key, publicUrl: buildPublicUrl(key) };
}

export async function deleteMediaFile(key: string): Promise<void> {
  const mode = getStorageMode();

  if (mode === "s3") {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: `media/${key}`,
      })
    );
    return;
  }

  const filePath = path.join(localMediaRoot(), key);
  try {
    await unlink(filePath);
  } catch {
    /* file may not exist */
  }
}

export async function deleteMediaPrefix(prefix: string): Promise<void> {
  const mode = getStorageMode();
  if (mode === "s3") {
    /* bulk S3 delete omitted — keys deleted individually in service */
    return;
  }
  const dirPath = path.join(localMediaRoot(), prefix);
  try {
    await rm(dirPath, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

export function buildStorageKey(tenant: string, mediaId: string, filename: string): string {
  const safeTenant = tenant.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return `${safeTenant}/${mediaId}/${filename}`;
}
