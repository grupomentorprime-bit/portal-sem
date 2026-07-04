"use client";

import { adminUi } from "@/lib/admin/admin-ui";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import { configSectionHref, LEGACY_CONFIG_SECTION_NAV } from "@/lib/admin/config-nav";
import { getConfigSectionLabel } from "@/lib/admin/institutional";
import { cn } from "@/lib/utils";
import type { ConfigSectionId } from "@/types/cms";

interface ConfigurationLayoutProps {
  activeSection: ConfigSectionId;
  onSectionChange: (section: ConfigSectionId) => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  isDirty: boolean;
  onSave: () => void;
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
