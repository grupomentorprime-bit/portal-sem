import { ProgramsPageContent } from "@/components/portal/ProgramsPageContent";
import { PortalBreadcrumb } from "@/components/portal/layout";
import { fetchPrograms } from "@/lib/portal/content";
import { resolvePageTitle } from "@/core/seo";
import { getActivePortal } from "@/lib/portal/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getActivePortal();
  if (!ctx) return { title: "Programas formativos" };
  return {
    title: resolvePageTitle("Programas formativos", ctx.config),
    description:
      "Programas formativos en Teología Bíblica del Seminario Eclesiástico Mayor — formación para el servicio cristiano.",
  };
}

export default async function ProgramasPage() {
  const ctx = await getActivePortal();
  if (!ctx) notFound();
  const programs = await fetchPrograms(ctx.tenant);

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Programas" },
        ]}
      />
      <ProgramsPageContent programs={programs} />
    </>
  );
}
