"use client";

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
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              CMS
            </p>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Configuration Hub
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <SaveIndicator status={saveStatus} isDirty={isDirty} />
            <button
              type="button"
              onClick={onSave}
              disabled={saveStatus === "saving" || !isDirty}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {saveStatus === "saving" ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row sm:px-6">
        <aside className="lg:w-64 lg:shrink-0">
          <nav className="rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
            {CONFIG_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
                  activeSection === section.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                <span className="text-base">{sectionIcons[section.id]}</span>
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
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
    return <span className="text-sm text-zinc-500">Guardando…</span>;
  }

  if (status === "saved") {
    return <span className="text-sm text-emerald-600">Cambios guardados</span>;
  }

  if (status === "error") {
    return <span className="text-sm text-red-600">Error al guardar</span>;
  }

  if (isDirty) {
    return <span className="text-sm text-amber-600">Cambios sin guardar</span>;
  }

  return <span className="text-sm text-zinc-400">Sin cambios</span>;
}
