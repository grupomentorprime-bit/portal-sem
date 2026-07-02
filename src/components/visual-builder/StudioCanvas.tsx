"use client";

import { useEffect } from "react";
import { BlockPreview } from "@/components/page-builder/BlockPreview";
import { PreviewDeviceFrame, type PreviewDevice } from "@/components/page-builder/PreviewDevice";
import type { PageBlock } from "@/types/page";
import type { SiteConfig } from "@/types/cms";
import { cn } from "@/lib/utils";

interface StudioCanvasProps {
  blocks: PageBlock[];
  config: SiteConfig;
  tenant: string;
  pageSlug: string;
  device: PreviewDevice;
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
}

export function StudioCanvas({
  blocks,
  config,
  tenant,
  pageSlug,
  device,
  selectedBlockId,
  onSelectBlock,
}: StudioCanvasProps) {
  useEffect(() => {
    if (!selectedBlockId) return;
    const frame = document.querySelector(`[data-studio-block-id="${selectedBlockId}"]`);
    frame?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedBlockId]);

  return (
    <main className="experience-studio__canvas min-w-0 bg-background-soft p-4">
      <div className={cn("studio-canvas__frame mx-auto", device !== "desktop" && "mx-auto")}>
        <PreviewDeviceFrame device={device}>
        <BlockPreview
          blocks={blocks}
          config={config}
          tenant={tenant}
          pageSlug={pageSlug}
          selectedBlockId={selectedBlockId}
          onSelectBlock={onSelectBlock}
          selectable
        />
        </PreviewDeviceFrame>
      </div>
    </main>
  );
}
