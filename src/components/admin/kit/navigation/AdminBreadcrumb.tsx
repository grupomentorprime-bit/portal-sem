"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { resolveAdminBreadcrumbs } from "@/lib/admin/breadcrumb-from-path";
import { cn } from "@/lib/utils";

export interface AdminBreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function AdminBreadcrumb({ items, className }: AdminBreadcrumbProps) {
  const pathname = usePathname();
  const resolved = items ?? resolveAdminBreadcrumbs(pathname);

  if (resolved.length <= 1 && resolved[0]?.label === "Dashboard") {
    return null;
  }

  return (
    <Breadcrumb
      items={resolved}
      className={cn("mb-4 text-xs sm:text-sm", className)}
    />
  );
}

/** Alias AEK */
export const Breadcrumbs = AdminBreadcrumb;
