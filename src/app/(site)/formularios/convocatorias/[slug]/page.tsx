import { getConvocatoriaBySlug, publicFormUrl } from "@/lib/admin/forms-center";
import { notFound, permanentRedirect } from "next/navigation";

interface ConvocatoriaAliasPageProps {
  params: Promise<{ slug: string }>;
}

/** Alias legado → URL canónica del formulario (`/formularios/{formId}`). */
export default async function ConvocatoriaAliasPage({ params }: ConvocatoriaAliasPageProps) {
  const { slug } = await params;
  const convocatoria = getConvocatoriaBySlug(slug);
  if (!convocatoria) notFound();

  permanentRedirect(publicFormUrl(convocatoria.formId));
}
