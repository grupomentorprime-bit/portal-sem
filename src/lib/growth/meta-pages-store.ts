import "server-only";

import type { Db } from "mongodb";
import type { MetaPageConnection, MetaPageChannel } from "@/core/growth/meta-pages/types";
import type { MetaPageConnectionStore } from "@/core/growth/meta-pages/complete";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import { getDatabase } from "@/lib/mongodb";

export const GROWTH_META_PAGE_CONNECTIONS = "growth_meta_page_connections" as const;

interface MetaPageConnectionDocument {
  _id: string;
  tenantId: string;
  channel: MetaPageChannel;
  pageId: string;
  pageName: string;
  instagramId?: string;
  instagramUsername?: string;
  accessTokenEncrypted: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

function toConnection(doc: MetaPageConnectionDocument): MetaPageConnection {
  return {
    tenantId: doc.tenantId,
    channel: doc.channel,
    pageId: doc.pageId,
    pageName: doc.pageName,
    ...(doc.instagramId ? { instagramId: doc.instagramId } : {}),
    ...(doc.instagramUsername ? { instagramUsername: doc.instagramUsername } : {}),
    accessToken: decryptSecret(doc.accessTokenEncrypted),
    enabled: doc.enabled,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function createMongoMetaPageConnectionStore(db: Db): MetaPageConnectionStore {
  const collection = db.collection<MetaPageConnectionDocument>(GROWTH_META_PAGE_CONNECTIONS);
  return {
    async listByTenant(tenantId) {
      const docs = await collection.find({ tenantId }).toArray();
      return docs.map(toConnection);
    },
    async upsert(connection) {
      const _id = `${connection.tenantId}:${connection.channel}`;
      const doc: MetaPageConnectionDocument = {
        _id,
        tenantId: connection.tenantId,
        channel: connection.channel,
        pageId: connection.pageId,
        pageName: connection.pageName,
        ...(connection.instagramId ? { instagramId: connection.instagramId } : {}),
        ...(connection.instagramUsername
          ? { instagramUsername: connection.instagramUsername }
          : {}),
        accessTokenEncrypted: encryptSecret(connection.accessToken),
        enabled: connection.enabled,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
      };
      await collection.replaceOne({ _id }, doc, { upsert: true });
      return connection;
    },
  };
}

export async function openMetaPageConnectionStore(): Promise<MetaPageConnectionStore> {
  const db = await getDatabase();
  return createMongoMetaPageConnectionStore(db);
}
