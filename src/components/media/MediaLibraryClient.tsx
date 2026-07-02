"use client";

import { MediaManager } from "./MediaManager";
import { AdminModuleLayout, AdminQuickActions } from "@/components/admin/AdminModuleLayout";
import { MEDIA_LIBRARY_QUICK_LINKS } from "@/lib/admin/institutional";

interface MediaLibraryClientProps {
  tenant: string;
}

export function MediaLibraryClient({ tenant }: MediaLibraryClientProps) {
  return (
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Biblioteca de medios" },
      ]}
      title="Biblioteca de medios"
      description="Imágenes, documentos y piezas gráficas del seminario — organizadas por carpetas y categorías"
      maxWidth="7xl"
    >
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">
          Colecciones
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MEDIA_LIBRARY_QUICK_LINKS.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-background p-4"
            >
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="mt-1 text-sm text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <MediaManager tenant={tenant} />

      <section className="mt-8">
        <AdminQuickActions
          items={[
            { href: "/admin/content", label: "Centro editorial", description: "Volver a comunicaciones" },
            { href: "/admin/config", label: "Identidad visual", description: "Logos y colores institucionales" },
          ]}
        />
      </section>
    </AdminModuleLayout>
  );
}

export { MediaManager, MediaLibraryCore } from "./MediaManager";
export type { MediaManagerProps, MediaPickerContext } from "./MediaManager";
