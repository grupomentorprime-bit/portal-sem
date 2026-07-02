"use client";

import { AdminModuleLayout, type AdminModuleLayoutProps } from "@/components/admin/AdminModuleLayout";
import { AdminModuleCenter, AdminModuleHero } from "@/components/admin/AdminModuleCenter";
import type { AdminPanelMeta } from "@/lib/admin/module-panels";

interface AdminSystemPanelProps {
  meta: AdminPanelMeta;
  breadcrumbs: AdminModuleLayoutProps["breadcrumbs"];
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminSystemPanel({
  meta,
  breadcrumbs,
  title,
  description,
  actions,
  children,
}: AdminSystemPanelProps) {
  return (
    <AdminModuleLayout
      breadcrumbs={breadcrumbs}
      title={title}
      description={description}
      actions={actions}
      maxWidth="6xl"
    >
      <AdminModuleCenter>
        <AdminModuleHero {...meta} />
        {children}
      </AdminModuleCenter>
    </AdminModuleLayout>
  );
}
