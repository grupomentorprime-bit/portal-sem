import { CongressOpsPanel } from "@/components/admin/congress/CongressOpsPanel";
import { FormsPanelDetailClient } from "@/components/admin/forms/FormsPanelClient";
import { getSessionActiveTenantId } from "@/core/identity";
import { CONGRESS_VARONES_FORM_ID } from "@/lib/experience/forms/already-enrolled";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { resolvePermissionsForMembership } from "@/lib/identity/permission-resolver";
import { ensureTenantRoles } from "@/lib/identity/roles";
import { loadSessionContext } from "@/lib/identity/sessions";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface FormsPanelDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FormsPanelDetailPage({ params }: FormsPanelDetailPageProps) {
  const { id } = await params;
  const [sessionTenantId, config, session] = await Promise.all([
    getSessionActiveTenantId(),
    getOperationalSiteConfig(),
    loadSessionContext(),
  ]);
  const tenantId = sessionTenantId?.trim() || config?.institution.tenant?.trim() || "";
  if (!tenantId) {
    return <p className="p-6 text-sm text-muted">Portal no configurado.</p>;
  }

  const form = await getExperienceFormById(tenantId, id);
  if (!form) notFound();

  if (form._id === CONGRESS_VARONES_FORM_ID) {
    if (!session?.membership) {
      redirect(`/login?next=${encodeURIComponent(`/admin/portal/forms/panel/${form._id}`)}`);
    }
    await ensureTenantRoles(tenantId);
    const permissions = await resolvePermissionsForMembership(tenantId, session.membership);
    const canOperateCongress = permissions.some(
      (p) => p === "congress.view" || p === "congress.operate"
    );
    if (canOperateCongress) {
      return <CongressOpsPanel />;
    }
  }

  return (
    <FormsPanelDetailClient formId={form._id} formName={form.name} fields={form.fields} />
  );
}
