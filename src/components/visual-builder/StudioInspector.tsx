"use client";

import {
  InspectorActions,
  InspectorEmpty,
  InspectorPanel,
} from "@/components/visual-builder";
import { getStudioComponent } from "@/lib/experience-studio/registry";
import { BlockEditor } from "@/components/page-builder/BlockEditor";
import { getBlockSchema } from "@/lib/experience-studio/schema/definitions";
import { SchemaInspector } from "@/components/visual-builder/SchemaInspector";
import type { BlockDefinition, PageBlock } from "@/types/page";

interface StudioInspectorProps {
  block: PageBlock | null;
  blockLibrary: BlockDefinition[];
  tenant: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onChange: (block: PageBlock) => void;
  onDuplicate: () => void;
  onHide: () => void;
  onDelete: () => void;
}

export function StudioInspector({
  block,
  blockLibrary,
  tenant,
  mobileOpen,
  onMobileClose,
  onChange,
  onDuplicate,
  onHide,
  onDelete,
}: StudioInspectorProps) {
  const component = block ? getStudioComponent(block.type, blockLibrary) : undefined;
  const schema = block ? getBlockSchema(block.type) : undefined;

  return (
    <InspectorPanel
      title={block ? (component?.name ?? block.type) : "Propiedades"}
      subtitle={component?.description}
      mobileOpen={mobileOpen ?? false}
      onMobileClose={onMobileClose}
    >
      {!block ? (
        <InspectorEmpty
          title="Selecciona un bloque"
          description="Haz clic en un bloque del canvas para editar sus propiedades."
        />
      ) : (
        <div className="space-y-6">
          {schema && !schema.useLegacyEditor ? (
            <SchemaInspector block={block} tenant={tenant} onChange={onChange} />
          ) : (
            <>
              {schema ? (
                <SchemaInspector block={block} tenant={tenant} onChange={onChange} />
              ) : null}
              <div className="space-y-4 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Configuración del componente
                </p>
                <BlockEditor block={block} tenant={tenant} onChange={onChange} />
              </div>
            </>
          )}

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Acciones
            </p>
            <InspectorActions
              onDuplicate={onDuplicate}
              onHide={onHide}
              onDelete={onDelete}
              hidden={!block.visible}
            />
          </div>
        </div>
      )}
    </InspectorPanel>
  );
}
