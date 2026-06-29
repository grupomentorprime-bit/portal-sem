import type { CmsMediaAsset } from "@/types/media";

export function mediaHasUsage(asset: CmsMediaAsset): boolean {
  return (asset.usage?.length ?? 0) > 0;
}
