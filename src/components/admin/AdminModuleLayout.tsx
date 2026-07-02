import Link from "next/link";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export interface AdminModuleLayoutProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  description?: string;
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "6xl" | "7xl";
  className?: string;
}

/**
 * OT-CMSV2-001A — Shell compartido para módulos del Centro de Administración.
 * No incluye header global (AdminInstitutionalHeader); solo contexto de módulo.
 */
export function AdminModuleLayout({
  breadcrumbs,
  title,
  description,
  actions,
  sidebar,
  children,
  maxWidth = "7xl",
  className,
}: AdminModuleLayoutProps) {
  const widthClass = maxWidth === "6xl" ? "max-w-6xl" : "max-w-7xl";

  return (
    <div className={cn("bg-background-soft", className)}>
      <div className={cn("mx-auto px-4 py-5 sm:px-6", widthClass)}>
        <Breadcrumb items={breadcrumbs} className="mb-3" />

        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
        </div>

        <div className={cn("flex flex-col gap-6 py-6", sidebar ? "lg:flex-row" : undefined)}>
          {sidebar ? <aside className="lg:w-64 lg:shrink-0">{sidebar}</aside> : null}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function AdminQuickActions({
  items,
}: {
  items: Array<{ href: string; label: string; description?: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-xl border border-border bg-background p-4 transition hover:border-primary/30 hover:shadow-sm"
        >
          <p className="font-medium text-foreground">{item.label}</p>
          {item.description ? <p className="mt-1 text-sm text-muted">{item.description}</p> : null}
        </Link>
      ))}
    </div>
  );
}
