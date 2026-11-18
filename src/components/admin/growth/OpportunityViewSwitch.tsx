"use client";

import Link from "next/link";
import { Activity, LayoutGrid, List, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type OpportunityWorkspaceView = "cola" | "kanban" | "lista" | "actividad";

const VIEWS = [
  { id: "cola" as const, label: "Cola", href: "/admin/ventas", icon: Rows3 },
  { id: "kanban" as const, label: "Kanban", href: "/admin/ventas?vista=kanban", icon: LayoutGrid },
  { id: "lista" as const, label: "Lista", href: "/admin/ventas?vista=lista", icon: List },
  { id: "actividad" as const, label: "Actividad", href: "/admin/actividad", icon: Activity },
];

export function OpportunityViewSwitch({
  current,
  onSelect,
}: {
  current: OpportunityWorkspaceView;
  /** En Ventas conserva los filtros. En Actividad se navega por enlace. */
  onSelect?: (view: "cola" | "kanban" | "lista") => void;
}) {
  return (
    <div
      className="inline-flex max-w-full overflow-x-auto rounded-xl bg-white p-1 shadow-sm ring-1 ring-[var(--admin-border-subtle)]"
      role="group"
      aria-label="Vista de oportunidades"
    >
      {VIEWS.map((view) => {
        const active = current === view.id;
        const className = cn(
          "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition",
          active
            ? "bg-[var(--growth-os-primary)] text-white"
            : "text-muted hover:text-foreground"
        );
        const Icon = view.icon;
        const content = (
          <>
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {view.label}
          </>
        );
        if (view.id === "actividad" || !onSelect) {
          return (
            <Link
              key={view.id}
              href={view.href}
              aria-current={active ? "page" : undefined}
              className={className}
            >
              {content}
            </Link>
          );
        }
        return (
          <button
            key={view.id}
            type="button"
            aria-pressed={active}
            className={className}
            onClick={() => onSelect(view.id)}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
