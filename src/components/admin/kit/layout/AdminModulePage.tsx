"use client";

import { AdminModuleLayout } from "@/components/admin/AdminModuleLayout";
import { useAdminChrome } from "@/components/admin/AdminChromeContext";
import { ModuleHeader } from "@/components/admin/kit/navigation/ModuleHeader";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface AdminModulePageProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  description?: string;
  actions?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  maxWidth?: "6xl" | "7xl";
  className?: string;
}

/**
 * Puente V1/V2: con Shell V2 evita breadcrumb/H1 duplicados; con V1 usa AdminModuleLayout.
 */
export function AdminModulePage({
  breadcrumbs,
  title,
  description,
  actions,
  sidebar,
  children,
  maxWidth = "7xl",
  className,
}: AdminModulePageProps) {
  const { shellV2 } = useAdminChrome();

  if (shellV2) {
    return (
      <div className={cn(className)}>
        <ModuleHeader title={title} description={description} actions={actions} />
        <div className={cn("flex flex-col gap-6", sidebar ? "lg:flex-row" : undefined)}>
          {sidebar ? <aside className="lg:w-64 lg:shrink-0">{sidebar}</aside> : null}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <AdminModuleLayout
      breadcrumbs={breadcrumbs}
      title={title}
      description={description}
      actions={actions}
      sidebar={sidebar}
      maxWidth={maxWidth}
      className={className}
    >
      {children}
    </AdminModuleLayout>
  );
}
