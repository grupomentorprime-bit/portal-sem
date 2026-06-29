/**
 * OT-CORE-MEDIA-001 — Migra referencias URL a mediaId.
 *
 * Uso: npx tsx scripts/migrate-media-ids.ts
 * Idempotente: no sobrescribe *MediaId existentes.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";

interface MigrationIncident {
  module: string;
  entityId: string;
  field: string;
  legacyUrl: string;
  reason: string;
}

interface CmsMediaAsset {
  _id: string;
  tenant: string;
  url: string;
  thumbnail?: string;
  responsive?: Record<string, string>;
  visibility: string;
}

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function findMediaByUrl(
  db: ReturnType<MongoClient["db"]>,
  tenant: string,
  url: string
): Promise<CmsMediaAsset | null> {
  if (!url?.trim()) return null;
  return db.collection<CmsMediaAsset>("cms_media").findOne({
    tenant,
    $or: [
      { url },
      { thumbnail: url },
      { "responsive.thumbnail": url },
      { "responsive.webp": url },
      { "responsive.w400": url },
      { "responsive.w800": url },
      { "responsive.w1200": url },
      { "responsive.w1920": url },
    ],
    visibility: "active",
  });
}

async function resolveMediaId(
  db: ReturnType<MongoClient["db"]>,
  tenant: string,
  url: string | undefined,
  incidents: MigrationIncident[],
  module: string,
  entityId: string,
  field: string
): Promise<string | undefined> {
  if (!url?.trim()) return undefined;
  const asset = await findMediaByUrl(db, tenant, url);
  if (!asset) {
    incidents.push({
      module,
      entityId,
      field,
      legacyUrl: url,
      reason: "No se encontró asset en cms_media para la URL",
    });
    return undefined;
  }
  return asset._id;
}

async function migrateBranding(
  db: ReturnType<MongoClient["db"]>,
  tenant: string,
  incidents: MigrationIncident[]
): Promise<number> {
  const config = await db.collection("cms_config").findOne({ _id: "site" });
  if (!config?.branding) return 0;

  const branding = { ...config.branding };
  const seo = { ...config.seo };
  let changed = 0;

  const brandingMap: Array<[string, string | undefined, string]> = [
    ["logoMediaId", branding.logo, "branding.logo"],
    ["secondaryLogoMediaId", branding.secondaryLogo, "branding.secondaryLogo"],
    ["faviconMediaId", branding.favicon, "branding.favicon"],
    ["heroMediaId", branding.heroImage, "branding.heroImage"],
  ];

  for (const [targetField, url, label] of brandingMap) {
    if (branding[targetField]) continue;
    const mediaId = await resolveMediaId(db, tenant, url, incidents, "cms_config", "site", label);
    if (mediaId) {
      branding[targetField] = mediaId;
      changed++;
    }
  }

  const seoMap: Array<[string, string | undefined, string]> = [
    ["ogImageMediaId", seo.ogImage, "seo.ogImage"],
    ["twitterImageMediaId", seo.twitterImage, "seo.twitterImage"],
  ];

  for (const [targetField, url, label] of seoMap) {
    if (seo[targetField]) continue;
    const mediaId = await resolveMediaId(db, tenant, url, incidents, "cms_config", "site", label);
    if (mediaId) {
      seo[targetField] = mediaId;
      changed++;
    }
  }

  if (changed > 0) {
    await db.collection("cms_config").updateOne(
      { _id: "site" },
      { $set: { branding, seo, updatedAt: new Date().toISOString() } }
    );
  }

  return changed;
}

async function migratePages(
  db: ReturnType<MongoClient["db"]>,
  tenant: string,
  incidents: MigrationIncident[]
): Promise<number> {
  const pages = await db.collection("cms_pages").find({ tenant }).toArray();
  let changed = 0;

  for (const page of pages) {
    const updates: Record<string, unknown> = {};
    const seo = { ...page.seo };

    if (!seo?.ogImageMediaId && seo?.ogImage) {
      const mediaId = await resolveMediaId(
        db,
        tenant,
        seo.ogImage,
        incidents,
        "cms_pages",
        page._id,
        "seo.ogImage"
      );
      if (mediaId) {
        seo.ogImageMediaId = mediaId;
        updates.seo = seo;
        changed++;
      }
    }

    const blocks = [...(page.blocks ?? [])];
    let blocksChanged = false;

    for (const block of blocks) {
      if (block.type !== "hero") continue;
      const s = { ...block.settings };

      if (!s.heroMediaId && s.heroImage) {
        const mediaId = await resolveMediaId(
          db,
          tenant,
          s.heroImage,
          incidents,
          "cms_pages",
          page._id,
          `blocks.${block.id}.heroImage`
        );
        if (mediaId) {
          s.heroMediaId = mediaId;
          blocksChanged = true;
          changed++;
        }
      }

      if (!s.logoMediaId && s.logoSrc) {
        const mediaId = await resolveMediaId(
          db,
          tenant,
          s.logoSrc,
          incidents,
          "cms_pages",
          page._id,
          `blocks.${block.id}.logoSrc`
        );
        if (mediaId) {
          s.logoMediaId = mediaId;
          blocksChanged = true;
          changed++;
        }
      }

      if (blocksChanged) block.settings = s;
    }

    if (blocksChanged) updates.blocks = blocks;
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString();
      await db.collection("cms_pages").updateOne({ _id: page._id }, { $set: updates });
    }
  }

  return changed;
}

async function migrateContentCollection(
  db: ReturnType<MongoClient["db"]>,
  collection: string,
  tenant: string,
  incidents: MigrationIncident[],
  fieldMap: Array<{ urlField: string; mediaIdField: string }>
): Promise<number> {
  const docs = await db.collection(collection).find({ tenant }).toArray();
  let changed = 0;

  for (const doc of docs) {
    const updates: Record<string, string> = {};

    for (const { urlField, mediaIdField } of fieldMap) {
      if (doc[mediaIdField] || !doc[urlField]) continue;
      const mediaId = await resolveMediaId(
        db,
        tenant,
        doc[urlField],
        incidents,
        collection,
        doc._id,
        urlField
      );
      if (mediaId) {
        updates[mediaIdField] = mediaId;
        changed++;
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.collection(collection).updateOne(
        { _id: doc._id },
        { $set: { ...updates, updatedAt: new Date().toISOString() } }
      );
    }
  }

  return changed;
}

async function main(): Promise<void> {
  loadEnvLocal();

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri || !dbName) {
    console.error("MONGODB_URI y MONGODB_DB son requeridos (.env.local).");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  const incidents: MigrationIncident[] = [];

  try {
    await client.connect();
    const db = client.db(dbName);

    const config = await db.collection("cms_config").findOne({ _id: "site" });
    const tenant = config?.institution?.tenant as string | undefined;

    if (!tenant) {
      console.error("No se encontró tenant en cms_config.");
      process.exit(1);
    }

    console.log(`Migrando referencias multimedia para tenant: ${tenant}`);

    const counts = {
      branding: await migrateBranding(db, tenant, incidents),
      pages: await migratePages(db, tenant, incidents),
      programs: await migrateContentCollection(db, "academy_programs", tenant, incidents, [
        { urlField: "image", mediaIdField: "coverMediaId" },
      ]),
      news: await migrateContentCollection(db, "content_news", tenant, incidents, [
        { urlField: "image", mediaIdField: "featuredMediaId" },
      ]),
      events: await migrateContentCollection(db, "content_events", tenant, incidents, [
        { urlField: "image", mediaIdField: "featuredMediaId" },
      ]),
      teachers: await migrateContentCollection(db, "academy_teachers", tenant, incidents, [
        { urlField: "image", mediaIdField: "photoMediaId" },
      ]),
      team: await migrateContentCollection(db, "academy_team", tenant, incidents, [
        { urlField: "image", mediaIdField: "photoMediaId" },
      ]),
      gallery: await migrateContentCollection(db, "academy_gallery", tenant, incidents, [
        { urlField: "src", mediaIdField: "srcMediaId" },
        { urlField: "image", mediaIdField: "imageMediaId" },
      ]),
    };

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log("Campos migrados:", counts);
    console.log(`Total: ${total}`);

    if (incidents.length > 0) {
      console.log(`\nIncidencias (${incidents.length}):`);
      for (const i of incidents) {
        console.log(`  [${i.module}/${i.entityId}] ${i.field}: ${i.reason} (${i.legacyUrl})`);
      }
    } else {
      console.log("Sin incidencias.");
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
