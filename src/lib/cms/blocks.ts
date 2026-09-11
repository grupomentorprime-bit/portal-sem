import { unstable_cache, revalidateTag } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import { DEFAULT_BLOCK_DEFINITIONS } from "@/lib/cms/page-defaults";
import type { BlockDefinition } from "@/types/page";

/**
 * Catálogo global de plataforma (ADR-008 D5 / SAAS-004).
 * No se aísla por Espacio — no es dato SEM ni se duplica por cliente.
 */
const CMS_BLOCKS_TAG = "cms-blocks";

async function fetchBlocksFromDb(): Promise<BlockDefinition[]> {
  const db = await getDatabase();
  const blocks = await db
    .collection<BlockDefinition>("cms_blocks")
    .find({ enabled: true })
    .sort({ category: 1, name: 1 })
    .toArray();
  return blocks.length > 0 ? blocks : DEFAULT_BLOCK_DEFINITIONS;
}

export const getBlockLibrary = unstable_cache(
  fetchBlocksFromDb,
  ["cms-blocks-all"],
  { tags: [CMS_BLOCKS_TAG], revalidate: 300 }
);

export async function getBlockLibraryUncached(): Promise<BlockDefinition[]> {
  return fetchBlocksFromDb();
}

export async function seedBlockLibrary(): Promise<BlockDefinition[]> {
  const db = await getDatabase();
  const collection = db.collection<BlockDefinition>("cms_blocks");

  for (const block of DEFAULT_BLOCK_DEFINITIONS) {
    await collection.updateOne(
      { _id: block._id },
      { $setOnInsert: block },
      { upsert: true }
    );
  }

  return fetchBlocksFromDb();
}

/** Invalidar caché — solo en Route Handlers / Server Actions, no durante render */
export function revalidateBlockLibraryCache(): void {
  revalidateTag(CMS_BLOCKS_TAG, "max");
}
