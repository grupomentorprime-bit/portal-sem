"use client";

import { adminUi } from "@/lib/admin/admin-ui";
import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import { getConfigSectionLabel } from "@/lib/admin/institutional";
import { cn } from "@/lib/utils";
import { CONFIG_SECTIONS, type ConfigSectionId } from "@/types/cms";

interface ConfigurationLayoutProps {
  activeSection: ConfigSectionId;
  onSectionChange: (section: ConfigSectionId) => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  isDirty: boolean;
  onSave: () => void;
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
  children,
}: ConfigurationLayoutProps) {
  const sectionLabel = getConfigSectionLabel(activeSection);

  return (
    <AdminModuleLayout
      breadcrumbs={[
        { label: "Institución", href: "/admin/config" },
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
      sidebar={
        <nav className={adminUi.sidebarNav} aria-label="Secciones de institución">
          {CONFIG_SECTIONS.map((section) => (
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
      }
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
