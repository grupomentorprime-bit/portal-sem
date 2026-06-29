import { PortalCmsPage, buildPortalPageMetadata } from "@/components/portal/PortalCmsPage";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return buildPortalPageMetadata("institucion", "Institución");
}

export default function InstitucionPage() {
  return (
    <PortalCmsPage
      slug="institucion"
      fallbackTitle="Institución"
      fallbackDescription="Historia, misión y valores del Seminario Eclesiástico Mayor."
    />
  );
}
