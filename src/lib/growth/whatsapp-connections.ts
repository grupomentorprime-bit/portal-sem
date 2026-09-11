/**
 * OT-GROWTH-MESSAGING-002/003 — persistencia Mongo de conexiones WhatsApp.
 * Secretos cifrados (AES-256-GCM). Nunca en growth_space_config ni en el cliente.
 */

import "server-only";

import type { Db } from "mongodb";
import {
  ensureGrowthWhatsAppIndexes,
  type GrowthWhatsAppConnection,
  type GrowthWhatsAppConnectionStore,
  GROWTH_WHATSAPP_CONNECTIONS_COLLECTION,
} from "@/core/growth/whatsapp";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import { getDatabase } from "@/lib/mongodb";

interface GrowthWhatsAppConnectionDocument {
  _id: string;
  tenantId: string;
  phoneNumberId: string;
  wabaId?: string;
  displayPhoneNumber?: string;
  verifyTokenEncrypted: string;
  appSecretEncrypted: string;
  accessTokenEncrypted?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

function omitUndefined<T extends object>(doc: T): T {
  const out = { ...doc } as T & Record<string, unknown>;
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

function toConnection(
  doc: GrowthWhatsAppConnectionDocument
): GrowthWhatsAppConnection {
  const connection: GrowthWhatsAppConnection = {
    _id: doc._id,
    tenantId: doc.tenantId,
    phoneNumberId: doc.phoneNumberId,
    verifyToken: decryptSecret(doc.verifyTokenEncrypted),
    appSecret: decryptSecret(doc.appSecretEncrypted),
    enabled: doc.enabled,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  if (doc.wabaId) connection.wabaId = doc.wabaId;
  if (doc.displayPhoneNumber) {
    connection.displayPhoneNumber = doc.displayPhoneNumber;
  }
  if (doc.accessTokenEncrypted) {
    connection.accessToken = decryptSecret(doc.accessTokenEncrypted);
  }
  return connection;
}

function toDocument(
  connection: GrowthWhatsAppConnection
): GrowthWhatsAppConnectionDocument {
  const doc: GrowthWhatsAppConnectionDocument = {
    _id: connection._id,
    tenantId: connection.tenantId,
    phoneNumberId: connection.phoneNumberId,
    verifyTokenEncrypted: encryptSecret(connection.verifyToken),
    appSecretEncrypted: encryptSecret(connection.appSecret),
    enabled: connection.enabled,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  };
  if (connection.wabaId) doc.wabaId = connection.wabaId;
  if (connection.displayPhoneNumber) {
    doc.displayPhoneNumber = connection.displayPhoneNumber;
  }
  if (connection.accessToken?.trim()) {
    doc.accessTokenEncrypted = encryptSecret(connection.accessToken);
  }
  return omitUndefined(doc);
}

export function createMongoGrowthWhatsAppConnectionStore(
  db: Db
): GrowthWhatsAppConnectionStore {
  const col = db.collection<GrowthWhatsAppConnectionDocument>(
    GROWTH_WHATSAPP_CONNECTIONS_COLLECTION
  );

  return {
    async findByPhoneNumberId(phoneNumberId) {
      const doc = await col.findOne({ phoneNumberId });
      return doc ? toConnection(doc) : null;
    },

    async findEnabledByPhoneNumberId(phoneNumberId) {
      const docs = await col
        .find({ phoneNumberId, enabled: true })
        .limit(2)
        .toArray();
      if (docs.length !== 1) return null;
      return toConnection(docs[0]);
    },

    async findByTenantId(tenantId) {
      const doc = await col.findOne({ tenantId });
      return doc ? toConnection(doc) : null;
    },

    async listEnabled() {
      const docs = await col.find({ enabled: true }).toArray();
      return docs.map(toConnection);
    },

    async upsert(connection) {
      const doc = toDocument(connection);
      await col.replaceOne({ tenantId: connection.tenantId }, doc, {
        upsert: true,
      });
      return connection;
    },
  };
}

export async function openGrowthWhatsAppConnectionStore(options?: {
  ensureIndexes?: boolean;
}): Promise<GrowthWhatsAppConnectionStore> {
  const db = await getDatabase();
  if (options?.ensureIndexes !== false) {
    await ensureGrowthWhatsAppIndexes(db);
  }
  return createMongoGrowthWhatsAppConnectionStore(db);
}
