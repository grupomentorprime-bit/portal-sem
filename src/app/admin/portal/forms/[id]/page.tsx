import { FormDetailClient } from "@/components/admin/forms/FormDetailClient";
import { getConvocatoriaByFormId, publicFormUrl } from "@/lib/admin/forms-center";
import { publicUrlForPath } from "@/core/tenant/hosts";
import { getSessionActiveTenantId } from "@/core/identity";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { resolvePublishedOriginForTenant } from "@/lib/portal/public-origin";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface FormDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminFormDetailPage({ params, searchParams }: FormDetailPageProps) {
  const { id } = await params;
  const { tab } = await searchParams;
  if (tab === "respuestas") {
    redirect(`/admin/portal/forms/panel/${encodeURIComponent(id)}`);
  }
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

  const convocatoria = getConvocatoriaByFormId(id, tenantId);
  const publishedOrigin = await resolvePublishedOriginForTenant(tenantId).catch(() => null);
  const publishedFormHref = publishedOrigin
    ? publicUrlForPath(publishedOrigin, publicFormUrl(form._id))
    : null;

  return (
    <FormDetailClient
      form={form}
      convocatoria={convocatoria}
      tenantId={tenantId}
      publishedFormHref={publishedFormHref}
    />
  );
}
