"use client";

import { adminUi } from "@/lib/admin/admin-ui";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import {
  spacePublicHref,
  useSpacePublicOrigin,
} from "@/components/admin/SpacePublicOrigin";
import { Badge } from "@/components/ui";
import { configSectionHref, LEGACY_CONFIG_SECTION_NAV } from "@/lib/admin/config-nav";
import { getConfigSectionLabel } from "@/lib/admin/institutional";
import { cn } from "@/lib/utils";
import { disabledStyles, focusRing } from "@/components/ui/shared";
import { ExternalLink } from "lucide-react";
import type { ConfigSectionId } from "@/types/cms";

interface ConfigurationLayoutProps {
  activeSection: ConfigSectionId;
  onSectionChange: (section: ConfigSectionId) => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  isDirty: boolean;
  onSave: () => void;
  sitePublished: boolean;
  onSitePublishedChange: (published: boolean) => void;
  /** Shell V2: navegación vive en AdminSidebar — ocultar menú interno duplicado */
  hideSectionNav?: boolean;
  children: React.ReactNode;
}

const sectionIcons: Record<ConfigSectionId, string> = {
  general: "◎",
  branding: "◆",
  seo: "⌕",
  contact: "✉",
  social: "◉",
  features: "⚙",
  experience: "✦",
  status: "●",
};

export function ConfigurationLayout({
  activeSection,
  onSectionChange,
  saveStatus,
  isDirty,
  onSave,
  sitePublished,
  onSitePublishedChange,
  hideSectionNav = false,
  children,
}: ConfigurationLayoutProps) {
  const sectionLabel = getConfigSectionLabel(activeSection);

  const legacySidebar = hideSectionNav ? null : (
    <nav className={adminUi.sidebarNav} aria-label="Secciones de institución">
      {LEGACY_CONFIG_SECTION_NAV.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onSectionChange(section.id)}
          className={cn(
            adminUi.navBtn,
            activeSection === section.id ? adminUi.navActive : adminUi.navIdle
          )}
        >
          <span className="text-base">{sectionIcons[section.id]}</span>
          {getConfigSectionLabel(section.id)}
        </button>
      ))}
    </nav>
  );

  return (
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Institución", href: configSectionHref("general") },
        { label: sectionLabel },
      ]}
      title={sectionLabel}
      description="Datos, identidad y funcionamiento del portal institucional"
      actions={
        <>
          <SitePublishControl
            published={sitePublished}
            onChange={onSitePublishedChange}
          />
          <SitePreviewLink />
          <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
          <SaveIndicator status={saveStatus} isDirty={isDirty} />
          <button
            type="button"
            onClick={onSave}
            disabled={saveStatus === "saving" || !isDirty}
            className={adminUi.primaryBtn}
          >
            {saveStatus === "saving" ? "Guardando…" : "Guardar cambios"}
          </button>
        </>
      }
      sidebar={legacySidebar}
    >
      {children}
    </AdminModuleLayout>
  );
}

function SitePreviewLink() {
  const origin = useSpacePublicOrigin();
  const href = spacePublicHref(origin, "/");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background-muted",
        focusRing
      )}
    >
      <ExternalLink className="h-4 w-4" aria-hidden />
      Vista previa
    </a>
  );
}

function SitePublishControl({
  published,
  onChange,
}: {
  published: boolean;
  onChange: (published: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-1.5">
      <Badge variant={published ? "success" : "warning"}>
        {published ? "En línea" : "Por comenzar"}
      </Badge>
      <button
        type="button"
        role="switch"
        aria-checked={published}
        aria-label={published ? "Despublicar sitio" : "Publicar sitio"}
        title={
          published
            ? "El dominio muestra el sitio. Guarda para aplicar."
            : "El dominio muestra «Este sitio está por comenzar». Guarda para aplicar."
        }
        onClick={() => onChange(!published)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-[var(--transition-fast)]",
          focusRing,
          disabledStyles,
          published ? "bg-primary" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow-[var(--shadow-sm)] transition-transform duration-[var(--transition-fast)]",
            published && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

function SaveIndicator({
  status,
  isDirty,
}: {
  status: ConfigurationLayoutProps["saveStatus"];
  isDirty: boolean;
}) {
  if (status === "saving") {
    return <span className={adminUi.mutedText}>Guardando…</span>;
  }

  if (status === "saved") {
    return <span className={adminUi.successText}>Cambios guardados</span>;
  }

  if (status === "error") {
    return <span className={adminUi.errorText}>Error al guardar</span>;
  }

  if (isDirty) {
    return <span className={adminUi.warningText}>Cambios sin guardar</span>;
  }

  return <span className={adminUi.faintText}>Sin cambios</span>;
}
