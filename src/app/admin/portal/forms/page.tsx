import { FormsCenterClient } from "@/components/admin/forms/FormsCenterClient";
import {
  ensureDefaultExperienceForms,
  listExperienceForms,
  seedExperienceForms,
} from "@/lib/experience/forms/repository";
import { getTenantContext } from "@/core/tenant";

export const dynamic = "force-dynamic";

export default async function AdminFormsCenterPage() {
  const ctx = await getTenantContext();
  if (!ctx) {
    return <p className="p-6 text-sm text-muted">Portal no configurado.</p>;
  }

  let forms = await listExperienceForms(ctx.tenantId);
  if (forms.length === 0) {
    forms = await seedExperienceForms(ctx.tenantId);
  } else {
    await ensureDefaultExperienceForms(ctx.tenantId);
    forms = await listExperienceForms(ctx.tenantId);
  }

  return <FormsCenterClient initialForms={forms} />;
}
