import { FormDetailClient } from "@/components/admin/forms/FormDetailClient";
import { getConvocatoriaByFormId } from "@/lib/admin/forms-center";
import { getSessionActiveTenantId } from "@/core/identity";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface FormDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminFormDetailPage({ params }: FormDetailPageProps) {
  const { id } = await params;
  const [sessionTenantId, config] = await Promise.all([
    getSessionActiveTenantId(),
    getOperationalSiteConfig(),
  ]);
  const tenantId =
    sessionTenantId?.trim() || config?.institution.tenant?.trim() || "";
  if (!tenantId) {
    return <p className="p-6 text-sm text-muted">Portal no configurado.</p>;
  }

  const form = await getExperienceFormById(tenantId, id);
  if (!form) notFound();

  const convocatoria = getConvocatoriaByFormId(id);

  return <FormDetailClient form={form} convocatoria={convocatoria} tenantId={tenantId} />;
}
