export const STORAGE_INTEGRATION_ID = "storage" as const;

export type StorageProvider = "backblaze-b2" | "s3-compatible" | "aws";

/** public = URLs directas al bucket/CDN; private = proxy vía el servidor (bucket no público) */
export type StorageAccessMode = "public" | "private";

export interface StorageIntegrationDocument {
  _id: typeof STORAGE_INTEGRATION_ID;
  enabled: boolean;
  provider: StorageProvider;
  accessMode: StorageAccessMode;
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  /** Cifrado AES-256-GCM — nunca exponer en API pública */
  secretAccessKeyEncrypted: string;
  publicUrl: string;
  forcePathStyle: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StorageIntegrationUpdate {
  enabled: boolean;
  provider: StorageProvider;
  accessMode: StorageAccessMode;
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  /** Vacío = mantener clave existente */
  secretAccessKey?: string;
  publicUrl: string;
  forcePathStyle: boolean;
}

export interface StorageIntegrationPublic {
  enabled: boolean;
  provider: StorageProvider;
  accessMode: StorageAccessMode;
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  hasSecretAccessKey: boolean;
  publicUrl: string;
  forcePathStyle: boolean;
  configured: boolean;
  source: "database" | "env" | "none";
  updatedAt?: string;
}

export interface ResolvedStorageSettings {
  mode: "s3" | "local";
  source: "database" | "env" | "none";
  s3?: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicUrl: string;
    forcePathStyle: boolean;
    accessMode: StorageAccessMode;
  };
}
