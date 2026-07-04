import {
  StudentAffairsFormNotFoundClient,
  StudentAffairsFormPageClient,
} from "@/components/admin/student-affairs/StudentAffairsFormPageClient";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { getTenantContext } from "@/core/tenant";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ formId: string }>;
}

export default async function StudentAffairsFormPage({ params }: PageProps) {
  const { formId } = await params;
  const ctx = await getTenantContext();
  if (!ctx) {
    return <p className="p-6 text-sm text-muted">Portal no configurado.</p>;
  }

  const form = await getExperienceFormById(ctx.tenantId, formId);
  if (!form) {
    return <StudentAffairsFormNotFoundClient />;
  }

  return (
    <StudentAffairsFormPageClient formId={form._id} formName={form.name} />
  );
}
