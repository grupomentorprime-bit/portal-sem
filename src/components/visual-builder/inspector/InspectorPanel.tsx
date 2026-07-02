"use client";

import { Drawer } from "@/components/ui/drawer";
import { InspectorEmpty } from "./shared";
import { InspectorFooter } from "./InspectorFooter";
import { InspectorToolbar } from "./InspectorToolbar";
import { inspectorStyles } from "./inspector-styles";
import type { InspectorPanelProps } from "./types";
import { cn } from "@/lib/utils";

/**
 * Panel lateral del Visual Experience Builder.
 * Escritorio: columna fija. Tablet/móvil: drawer.
 */
export function InspectorPanel({
  title,
  subtitle,
  children,
  toolbar,
  footer,
  className,
  mobileOpen = false,
  onMobileClose,
}: InspectorPanelProps) {
  const body = (
    <>
      <div className={inspectorStyles.panelHeader}>
        {toolbar ?? <InspectorToolbar title={title} subtitle={subtitle} />}
      </div>
      <div className={inspectorStyles.panelBody}>
        {children ?? (
          <InspectorEmpty
            title="Selecciona un bloque"
            description="Haz clic en un bloque del canvas para editar sus propiedades."
          />
        )}
      </div>
      {footer ? <InspectorFooter>{footer}</InspectorFooter> : null}
    </>
  );

  return (
    <>
      {/* Escritorio */}
      <aside
        className={cn(
          inspectorStyles.panel,
          "hidden h-full shrink-0 lg:flex lg:flex-col",
          className
        )}
        aria-label="Propiedades del bloque"
      >
        {body}
      </aside>

      {/* Tablet y móvil */}
      <div className="lg:hidden">
        <Drawer
          open={mobileOpen}
          onClose={() => onMobileClose?.()}
          title={title}
          side="right"
        >
          <div className="flex min-h-[70vh] flex-col">{body}</div>
        </Drawer>
      </div>
    </>
  );
}
