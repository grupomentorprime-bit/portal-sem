import { notFound } from "next/navigation";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { AdminDashboardLegacyPreview } from "@/components/admin/preview/AdminDashboardLegacyPreview";
import { DashboardVisualPreviewShell } from "@/components/admin/preview/DashboardVisualPreviewShell";
import {
  MOCK_BRANDING,
  MOCK_DASHBOARD_PROPS,
  MOCK_PERMISSIONS,
  MOCK_USER,
} from "@/components/admin/preview/mock-dashboard-props";
import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ variant?: string }>;
}

/**
 * Vista previa visual — solo desarrollo.
 * `/dev-preview/admin-dashboard` → DESPUÉS (Shell V2 + dashboard AEK)
 * `/dev-preview/admin-dashboard?variant=legacy` → ANTES (Shell V1 + dashboard legacy)
 */
export default async function AdminDashboardVisualPreviewPage({ searchParams }: PageProps) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const { variant } = await searchParams;
  const isLegacy = variant === "legacy";

  if (isLegacy) {
    return (
      <DashboardVisualPreviewShell
        shellV2={false}
        branding={MOCK_BRANDING}
        user={MOCK_USER}
        permissions={MOCK_PERMISSIONS}
      >
        <AdminPageFrame
          title="Centro de administración"
          description="Panel institucional del Seminario Eclesiástico Mayor"
          breadcrumbs={[{ label: "Inicio" }]}
          backHref="/"
          backLabel="Ver portal público"
        >
          <AdminDashboardLegacyPreview {...MOCK_DASHBOARD_PROPS} />
        </AdminPageFrame>
      </DashboardVisualPreviewShell>
    );
  }

  return (
    <DashboardVisualPreviewShell
      shellV2={true}
      branding={MOCK_BRANDING}
      user={MOCK_USER}
      permissions={MOCK_PERMISSIONS}
    >
      <AdminDashboardClient {...MOCK_DASHBOARD_PROPS} />
    </DashboardVisualPreviewShell>
  );
}
