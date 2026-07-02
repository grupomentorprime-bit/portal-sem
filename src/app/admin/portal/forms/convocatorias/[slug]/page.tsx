import { ConvocatoriaAdminPanel } from "@/components/admin/forms/ConvocatoriaAdminPanel";
import { getConvocatoriaBySlug } from "@/lib/admin/forms-center";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface ConvocatoriaPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ConvocatoriaAdminPage({ params }: ConvocatoriaPageProps) {
  const { slug } = await params;
  const convocatoria = getConvocatoriaBySlug(slug);
  if (!convocatoria) notFound();

  return <ConvocatoriaAdminPanel convocatoria={convocatoria} />;
}
