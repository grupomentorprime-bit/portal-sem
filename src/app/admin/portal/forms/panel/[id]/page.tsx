import { FormsPanelDetailClient } from "@/components/admin/forms/FormsPanelClient";
import { getSessionActiveTenantId } from "@/core/identity";
import { CONGRESS_VARONES_FORM_ID } from "@/lib/experience/forms/already-enrolled";
import { CONGRESS_VARONES_HOME_PATH } from "@/lib/admin/nav-access";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface FormsPanelDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FormsPanelDetailPage({ params }: FormsPanelDetailPageProps) {
  const { id } = await params;
  const [sessionTenantId, config] = await Promise.all([
    getSessionActiveTenantId(),
    getOperationalSiteConfig(),
  ]);
  const tenantId = sessionTenantId?.trim() || config?.institution.tenant?.trim() || "";
  if (!tenantId) {
    return <p className="p-6 text-sm text-muted">Portal no configurado.</p>;
  }

  const form = await getExperienceFormById(tenantId, id);
  if (!form) notFound();

  if (form._id === CONGRESS_VARONES_FORM_ID) {
    redirect(CONGRESS_VARONES_HOME_PATH);
  }

  return (
    <FormsPanelDetailClient formId={form._id} formName={form.name} fields={form.fields} />
  );
}
