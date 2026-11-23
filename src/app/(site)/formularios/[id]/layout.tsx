import { FormFocusedShell } from "@/components/portal/FormFocusedShell";
import { ensureSpecializedCapabilities } from "@/lib/desktop/register-specialized";
import { getActivePortal } from "@/lib/portal/site";
import { resolvePublicForm } from "@/nelzuri";

/** Experiencia enfocada para cada formulario público (sin menú del portal). */
export default async function FormularioDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  ensureSpecializedCapabilities();
  const { id } = await params;
  const portal = await getActivePortal();
  const publication = portal ? resolvePublicForm(id, portal.tenant) : null;
  const tone = publication && !publication.ambiguous ? publication.tone : "default";
  const showBrandHeader = publication && !publication.ambiguous ? publication.showBrandHeader : true;

  return (
    <FormFocusedShell tone={tone} showBrandHeader={showBrandHeader}>
      {children}
    </FormFocusedShell>
  );
}
