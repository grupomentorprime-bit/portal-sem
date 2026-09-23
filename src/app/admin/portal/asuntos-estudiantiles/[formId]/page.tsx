import {
  StudentAffairsFormNotFoundClient,
  StudentAffairsFormPageClient,
} from "@/components/admin/student-affairs/StudentAffairsFormPageClient";
import { getSessionActiveTenantId } from "@/core/identity";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { getExperienceFormById } from "@/lib/experience/forms/repository";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ formId: string }>;
}

export default async function StudentAffairsFormPage({ params }: PageProps) {
  const { formId } = await params;
  const [sessionTenantId, config] = await Promise.all([
    getSessionActiveTenantId(),
    getOperationalSiteConfig(),
  ]);
  const tenantId =
    sessionTenantId?.trim() || config?.institution.tenant?.trim() || "";
  if (!tenantId) {
    return <p className="p-6 text-sm text-muted">Portal no configurado.</p>;
  }

  const form = await getExperienceFormById(tenantId, formId);
  if (!form) {
    return <StudentAffairsFormNotFoundClient />;
  }

  return (
    <StudentAffairsFormPageClient
      formId={form._id}
      formName={form.name}
      institutionName={config?.institution.name?.trim() || ""}
    />
  );
}
