import { unstable_cache, revalidateTag } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import { DEFAULT_BLOCK_DEFINITIONS } from "@/lib/cms/page-defaults";
import type { BlockDefinition } from "@/types/page";

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

  revalidateTag(CMS_BLOCKS_TAG, "max");
  return fetchBlocksFromDb();
}
