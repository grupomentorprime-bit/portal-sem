import { getConvocatoriaBySlug } from "@/lib/admin/forms-center";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface ConvocatoriaPageProps {
  params: Promise<{ slug: string }>;
}

/** Alias legacy — operación unificada en resultados de convocatorias. */
export default async function ConvocatoriaAdminPage({ params }: ConvocatoriaPageProps) {
  const { slug } = await params;
  const convocatoria = getConvocatoriaBySlug(slug);
  if (!convocatoria) notFound();

  redirect(`/admin/portal/asuntos-estudiantiles/${encodeURIComponent(convocatoria.formId)}`);
}
