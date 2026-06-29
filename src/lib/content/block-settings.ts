import type { BlockContentQuery } from "@/types/content";
import { asArray, asNumber } from "@/lib/cms/block-utils";

export function getQueryLimit(settings: Record<string, unknown>, fallback = 10): number {
  const query = settings.query as BlockContentQuery | undefined;
  return asNumber(query?.limit, fallback);
}

export function getResolvedItems<T>(settings: Record<string, unknown>): T[] {
  return asArray<T>(settings.items);
}
