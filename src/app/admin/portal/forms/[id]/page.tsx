import { FormDetailClient } from "@/components/admin/forms/FormDetailClient";
import { getConvocatoriaByFormId } from "@/lib/admin/forms-center";
import { getExperienceFormById } from "@/lib/experience/forms/repository";
import { getTenantContext } from "@/core/tenant";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface FormDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminFormDetailPage({ params }: FormDetailPageProps) {
  const { id } = await params;
  const ctx = await getTenantContext();
  if (!ctx) {
    return <p className="p-6 text-sm text-muted">Portal no configurado.</p>;
  }

  const form = await getExperienceFormById(ctx.tenantId, id);
  if (!form) notFound();

  const convocatoria = getConvocatoriaByFormId(id);

  return <FormDetailClient form={form} convocatoria={convocatoria} tenantId={ctx.tenantId} />;
}
