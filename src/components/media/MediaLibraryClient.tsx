"use client";

import Link from "next/link";
import { FolderOpen, Image, Layers, Upload } from "lucide-react";
import { MediaManager } from "./MediaManager";
import { AdminModuleLayout, AdminQuickActions } from "@/components/admin/AdminModuleLayout";
import {
  AdminModuleCenter,
  AdminModuleHero,
  AdminModuleSectionHeader,
  AdminModuleStats,
} from "@/components/admin/AdminModuleCenter";
import { ADMIN_PANEL_META } from "@/lib/admin/module-panels";
import { MEDIA_LIBRARY_QUICK_LINKS } from "@/lib/admin/institutional";
import { Button } from "@/components/ui/button";

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
      actions={
        <>
          <Link href="/admin/config">
            <Button variant="outline">Identidad visual</Button>
          </Link>
          <Link href="/admin/content">
            <Button variant="outline">Centro editorial</Button>
          </Link>
        </>
      }
    >
      <AdminModuleCenter>
        <AdminModuleHero {...ADMIN_PANEL_META.media} />
        <AdminModuleStats
          items={[
            {
              label: "Colecciones",
              value: MEDIA_LIBRARY_QUICK_LINKS.length,
              icon: FolderOpen,
              tone: "total",
            },
            {
              label: "Categorías activas",
              value: MEDIA_LIBRARY_QUICK_LINKS.length,
              icon: Layers,
              tone: "active",
            },
            {
              label: "Listo para publicar",
              value: "Sí",
              icon: Upload,
              tone: "published",
            },
          ]}
        />
      <section className="mb-6">
        <AdminModuleSectionHeader
          icon={Image}
          title="Colecciones"
          description="Agrupa activos por uso: portal, admisión, comunicaciones y más."
        />
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
      </AdminModuleCenter>
    </AdminModuleLayout>
  );
}

export { MediaManager, MediaLibraryCore } from "./MediaManager";
export type { MediaManagerProps, MediaPickerContext } from "./MediaManager";
