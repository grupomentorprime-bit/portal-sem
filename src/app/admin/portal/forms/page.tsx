import { FormsCenterClient } from "@/components/admin/forms/FormsCenterClient";
import { ensureDefaultExperienceForms, listExperienceForms } from "@/lib/experience/forms/repository";
import { getTenantContext } from "@/core/tenant";

export const dynamic = "force-dynamic";

export default async function AdminFormsCenterPage() {
  const ctx = await getTenantContext();
  if (!ctx) {
    return <p className="p-6 text-sm text-muted">Portal no configurado.</p>;
  }

  await ensureDefaultExperienceForms(ctx.tenantId);
  const forms = await listExperienceForms(ctx.tenantId);

  return <FormsCenterClient initialForms={forms} />;
}
