import {
  StudentAffairsFormNotFoundClient,
  StudentAffairsFormPageClient,
} from "@/components/admin/student-affairs/StudentAffairsFormPageClient";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { getExperienceFormById } from "@/lib/experience/forms/repository";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ formId: string }>;
}

export default async function StudentAffairsFormPage({ params }: PageProps) {
  const { formId } = await params;
  const config = await getOperationalSiteConfig();
  const tenantId = config?.institution.tenant?.trim() ?? "";
  if (!config || !tenantId) {
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
      institutionName={config.institution.name}
    />
  );
}
