import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { normalizeS3Fields } from "@/lib/cms/storage-normalize";
import type { ResolvedStorageSettings } from "@/types/integrations";

const TEST_OBJECT_KEY = "media/.portal-sem-connection-test";

function createS3Client(s3: NonNullable<ResolvedStorageSettings["s3"]>): S3Client {
  return new S3Client({
    region: s3.region || "auto",
    endpoint: s3.endpoint || undefined,
    credentials: {
      accessKeyId: s3.accessKeyId,
      secretAccessKey: s3.secretAccessKey,
    },
    forcePathStyle: s3.forcePathStyle,
    // B2 / R2 no soportan x-amz-checksum-crc32 del SDK v3 reciente
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

let cachedClientKey = "";
let s3Client: S3Client | null = null;

function buildClientKey(s3: NonNullable<ResolvedStorageSettings["s3"]>): string {
  return [
    s3.endpoint,
    s3.region,
    s3.bucket,
    s3.accessKeyId,
    s3.secretAccessKey,
    String(s3.forcePathStyle),
  ].join("|");
}

export function invalidateS3ClientCache(): void {
  cachedClientKey = "";
  s3Client = null;
}

export function getS3Client(s3: NonNullable<ResolvedStorageSettings["s3"]>): S3Client {
  const normalized = normalizeS3Fields(s3);
  const key = buildClientKey(normalized);
  if (!s3Client || cachedClientKey !== key) {
    s3Client = createS3Client(normalized);
    cachedClientKey = key;
  }
  return s3Client;
}

export async function testS3Connection(
  s3: NonNullable<ResolvedStorageSettings["s3"]>
): Promise<{ ok: true; message: string }> {
  const normalized = normalizeS3Fields(s3);
  const client = getS3Client(normalized);

  // HeadBucket devuelve UnknownError (400) en B2 — probamos lectura y escritura reales
  await client.send(
    new ListObjectsV2Command({
      Bucket: normalized.bucket,
      MaxKeys: 1,
      Prefix: "media/",
    })
  );

  await client.send(
    new PutObjectCommand({
      Bucket: normalized.bucket,
      Key: TEST_OBJECT_KEY,
      Body: Buffer.from("portal-sem-connection-test"),
      ContentType: "text/plain",
    })
  );

  await client.send(
    new DeleteObjectCommand({
      Bucket: normalized.bucket,
      Key: TEST_OBJECT_KEY,
    })
  );

  return {
    ok: true,
    message: `Conexión exitosa con el bucket "${normalized.bucket}" (lectura y escritura verificadas).`,
  };
}

export async function putS3Object(
  s3: NonNullable<ResolvedStorageSettings["s3"]>,
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  const client = getS3Client(s3);
  await client.send(
    new PutObjectCommand({
      Bucket: s3.bucket,
      Key: `media/${key}`,
      Body: buffer,
      ContentType: mimeType,
    })
  );
}

export async function deleteS3Object(
  s3: NonNullable<ResolvedStorageSettings["s3"]>,
  key: string
): Promise<void> {
  const client = getS3Client(s3);
  await client.send(
    new DeleteObjectCommand({
      Bucket: s3.bucket,
      Key: `media/${key}`,
    })
  );
}

export async function getS3ObjectBuffer(
  s3: NonNullable<ResolvedStorageSettings["s3"]>,
  key: string
): Promise<Buffer | null> {
  const client = getS3Client(s3);
  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: s3.bucket,
        Key: `media/${key}`,
      })
    );
    if (!response.Body) return null;
    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  } catch {
    return null;
  }
}
