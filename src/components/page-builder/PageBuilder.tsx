"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardHeader, CardTitle } from "@/components/ui";
import { BlockEditor } from "./BlockEditor";
import { BlockPalette } from "./BlockPalette";
import { BlockPreview } from "./BlockPreview";
import { duplicateBlockInList, BlockToolbar } from "./BlockToolbar";
import { PageSettings } from "./PageSettings";
import { PreviewDeviceFrame, PreviewDeviceSwitcher, type PreviewDevice } from "./PreviewDevice";
import { SortableBlocks } from "./SortableBlocks";
import { TemplateSelector } from "./TemplateSelector";
import { sortBlocks } from "@/lib/cms/page-utils";
import type { BlockDefinition, CmsPage, CmsTemplate, PageBlock } from "@/types/page";
import type { SiteConfig } from "@/types/cms";

interface PageBuilderProps {
  initialPage: CmsPage;
  blockLibrary: BlockDefinition[];
  templates: CmsTemplate[];
  config: SiteConfig;
  onSave: (page: CmsPage, options?: { publish?: boolean }) => Promise<void>;
}

export function PageBuilder({
  initialPage,
  blockLibrary,
  templates,
  config,
  onSave,
}: PageBuilderProps) {
  const [page, setPage] = useState(initialPage);
  const [selectedId, setSelectedId] = useState<string | null>(page.blocks[0]?.id ?? null);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"blocks" | "settings">("blocks");

  const isDirty = useMemo(
    () => JSON.stringify(page) !== JSON.stringify(initialPage),
    [page, initialPage]
  );

  const selectedBlock = page.blocks.find((b) => b.id === selectedId) ?? null;

  const updateBlocks = (blocks: PageBlock[]) => {
    setPage((p) => ({ ...p, blocks: sortBlocks(blocks) }));
  };

  const handleSave = async (publish = false) => {
    setSaving(true);
    try {
      const status = publish ? "published" : page.status;
      await onSave({ ...page, status }, { publish });
    } finally {
      setSaving(false);
    }
  };

  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <PreviewDeviceSwitcher device={device} onChange={setDevice} />
          <Button type="button" variant="outline" onClick={() => setShowPreview(false)}>
            Cerrar vista previa
          </Button>
        </div>
        <PreviewDeviceFrame device={device}>
          <BlockPreview blocks={page.blocks} config={config} tenant={page.tenant} />
        </PreviewDeviceFrame>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px]">
      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-heading">Bloques</CardTitle>
          </CardHeader>
          <SortableBlocks
            blocks={page.blocks}
            blockLibrary={blockLibrary}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={updateBlocks}
          />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-heading">Agregar bloque</CardTitle>
          </CardHeader>
          <BlockPalette
            library={blockLibrary}
            onAdd={(block) => {
              const next = sortBlocks([...page.blocks, { ...block, order: page.blocks.length }]);
              updateBlocks(next);
              setSelectedId(block.id);
            }}
          />
        </Card>
      </aside>

      <main className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-display-l text-foreground">{page.title}</h1>
            <p className="text-caption text-muted">
              {page.slug} · {page.status}
              {isDirty ? " · Cambios sin guardar" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
              Vista previa
            </Button>
            <Button type="button" variant="outline" disabled={saving || !isDirty} onClick={() => handleSave(false)}>
              Guardar borrador
            </Button>
            <Button type="button" disabled={saving} onClick={() => handleSave(true)}>
              Publicar
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={tab === "blocks" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setTab("blocks")}
          >
            Editor
          </Button>
          <Button
            type="button"
            variant={tab === "settings" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setTab("settings")}
          >
            Configuración
          </Button>
        </div>

        {tab === "settings" ? (
          <Card>
            <PageSettings
              page={page}
              onChange={(updates) => setPage((p) => ({ ...p, ...updates }))}
            />
            <div className="mt-6 border-t border-border pt-4">
              <TemplateSelector
                templates={templates}
                onApply={(blocks) => updateBlocks(blocks)}
              />
            </div>
          </Card>
        ) : selectedBlock ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">Configurar bloque</CardTitle>
            </CardHeader>
            <BlockToolbar
              block={selectedBlock}
              onChange={(updated) =>
                updateBlocks(page.blocks.map((b) => (b.id === updated.id ? updated : b)))
              }
              onDelete={() => {
                updateBlocks(page.blocks.filter((b) => b.id !== selectedBlock.id));
                setSelectedId(null);
              }}
              onDuplicate={() => updateBlocks(duplicateBlockInList(page.blocks, selectedBlock.id))}
            />
            <div className="mt-4">
              <BlockEditor
                block={selectedBlock}
                onChange={(updated) =>
                  updateBlocks(page.blocks.map((b) => (b.id === updated.id ? updated : b)))
                }
              />
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center text-muted">
            Selecciona un bloque para configurarlo.
          </Card>
        )}
      </main>

      <aside className="hidden xl:block">
        <Card className="sticky top-24 overflow-hidden p-0">
          <div className="max-h-[70vh] overflow-y-auto">
            <BlockPreview blocks={page.blocks} config={config} tenant={page.tenant} />
          </div>
        </Card>
      </aside>
    </div>
  );
}
