"use client";

import { useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { isMediaId } from "@/core/media/types";

export function useResolvedMediaUrl(
  mediaId?: string,
  legacyUrl?: string
): string | undefined {
  const [url, setUrl] = useState<string | undefined>(legacyUrl?.trim() || undefined);

  useDeferredEffect(() => {
    const trimmedLegacy = legacyUrl?.trim();
    if (trimmedLegacy) {
      setUrl(trimmedLegacy);
      return;
    }

    const id = mediaId?.trim();
    if (!id) {
      setUrl(undefined);
      return;
    }

    if (!isMediaId(id)) {
      setUrl(id);
      return;
    }

    let cancelled = false;
    void fetch(`/api/cms/media/${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.ok) return;
        const asset = data.media ?? data.asset;
        if (asset?.thumbnail || asset?.url) {
          setUrl(asset.thumbnail || asset.url);
        }
      })
      .catch(() => {
        if (!cancelled) setUrl(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [mediaId, legacyUrl]);

  return url;
}
