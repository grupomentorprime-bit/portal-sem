"use client";

import { useCallback, useMemo, useState } from "react";
import type { PreviewDevice } from "@/components/page-builder/PreviewDevice";
import { duplicateBlockInList } from "@/components/page-builder/BlockToolbar";
import { downloadPageJson, importPageDocument } from "@/lib/experience-studio/page-engine";
import {
  createUndoRedo,
  pushState,
  redoState,
  undoState,
} from "@/lib/experience-studio/undo-redo";
import { sortBlocks } from "@/lib/cms/page-utils";
import type { BlockDefinition, CmsPage, CmsTemplate, PageBlock } from "@/types/page";
import type { SiteConfig } from "@/types/cms";
import { StudioToolbar } from "./StudioToolbar";
import { StudioComponentLibrary } from "./StudioComponentLibrary";
import { StudioCanvas } from "./StudioCanvas";
import { StudioInspector } from "./StudioInspector";
import { StudioHistoryPanel } from "./StudioHistoryPanel";

interface ExperienceStudioProps {
  initialPage: CmsPage;
  blockLibrary: BlockDefinition[];
  templates: CmsTemplate[];
  config: SiteConfig;
  onSave: (page: CmsPage, options?: { publish?: boolean }) => Promise<CmsPage | void>;
}

export function ExperienceStudio({
  initialPage,
  blockLibrary,
  config,
  onSave,
}: ExperienceStudioProps) {
  const [history, setHistory] = useState(() => createUndoRedo(initialPage));
  const [baseline, setBaseline] = useState(initialPage);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    initialPage.blocks[0]?.id ?? null
  );
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const page = history.present;
  const isDirty = useMemo(
    () => JSON.stringify(page) !== JSON.stringify(baseline),
    [page, baseline]
  );

  const selectedBlock = page.blocks.find((b) => b.id === selectedBlockId) ?? null;

  const updatePage = useCallback((next: CmsPage) => {
    setHistory((prev) => pushState(prev, next));
  }, []);

  const updateBlocks = useCallback(
    (blocks: PageBlock[]) => {
      updatePage({ ...page, blocks: sortBlocks(blocks) });
    },
    [page, updatePage]
  );

  const updateBlock = useCallback(
    (updated: PageBlock) => {
      updateBlocks(page.blocks.map((block) => (block.id === updated.id ? updated : block)));
    },
    [page.blocks, updateBlocks]
  );

  const handleSave = async (publish = false) => {
    setSaving(true);
    try {
      const status = publish ? "published" : page.status;
      const saved = await onSave({ ...page, status }, { publish });
      const nextPage = saved ?? { ...page, status };
      setBaseline(nextPage);
      setHistory(createUndoRedo(nextPage));
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const doc = JSON.parse(text) as Parameters<typeof importPageDocument>[0];
    const imported = importPageDocument(doc, page);
    updatePage(imported);
  };

  const handleRestoreVersion = (index: number) => {
    const version = page.versions[index];
    if (!version) return;
    updatePage({
      ...page,
      title: version.title,
      blocks: version.blocks,
      seo: version.seo,
    });
    setHistoryOpen(false);
  };

  return (
    <div className="experience-studio min-h-screen bg-background">
      <StudioToolbar
        page={page}
        device={device}
        isDirty={isDirty}
        saving={saving}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onDeviceChange={setDevice}
        onSave={(publish) => void handleSave(publish)}
        onUndo={() => setHistory((prev) => undoState(prev))}
        onRedo={() => setHistory((prev) => redoState(prev))}
        onExport={() => downloadPageJson(page)}
        onImport={(file) => void handleImport(file)}
        onToggleHistory={() => setHistoryOpen((open) => !open)}
        historyOpen={historyOpen}
      />

      <div
        className="experience-studio__layout"
        style={
          historyOpen
            ? { gridTemplateColumns: "17rem minmax(0,1fr) 20rem 16rem" }
            : undefined
        }
      >
        <StudioComponentLibrary
          blocks={page.blocks}
          blockLibrary={blockLibrary}
          selectedId={selectedBlockId}
          onSelect={setSelectedBlockId}
          onBlocksChange={updateBlocks}
          onAddBlock={(block) => {
            const next = sortBlocks([...page.blocks, block]);
            updateBlocks(next);
            setSelectedBlockId(block.id);
          }}
        />

        <StudioCanvas
          blocks={page.blocks}
          config={config}
          tenant={page.tenant}
          pageSlug={page.slug}
          device={device}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
        />

        <div className="hidden xl:block">
          <StudioInspector
            block={selectedBlock}
            blockLibrary={blockLibrary}
            tenant={page.tenant}
            onChange={updateBlock}
            onDuplicate={() => {
              if (!selectedBlock) return;
              const next = duplicateBlockInList(page.blocks, selectedBlock.id);
              updateBlocks(next);
            }}
            onHide={() => {
              if (!selectedBlock) return;
              updateBlock({ ...selectedBlock, visible: !selectedBlock.visible });
            }}
            onDelete={() => {
              if (!selectedBlock) return;
              updateBlocks(page.blocks.filter((b) => b.id !== selectedBlock.id));
              setSelectedBlockId(null);
            }}
          />
        </div>

        {historyOpen ? (
          <StudioHistoryPanel
            versions={page.versions}
            onRestore={handleRestoreVersion}
            onClose={() => setHistoryOpen(false)}
          />
        ) : null}
      </div>

      <div className="xl:hidden">
        <StudioInspector
          block={selectedBlock}
          blockLibrary={blockLibrary}
          tenant={page.tenant}
          mobileOpen={Boolean(selectedBlock)}
          onMobileClose={() => setSelectedBlockId(null)}
          onChange={updateBlock}
          onDuplicate={() => {
            if (!selectedBlock) return;
            updateBlocks(duplicateBlockInList(page.blocks, selectedBlock.id));
          }}
          onHide={() => {
            if (!selectedBlock) return;
            updateBlock({ ...selectedBlock, visible: !selectedBlock.visible });
          }}
          onDelete={() => {
            if (!selectedBlock) return;
            updateBlocks(page.blocks.filter((b) => b.id !== selectedBlock.id));
            setSelectedBlockId(null);
          }}
        />
      </div>
    </div>
  );
}
