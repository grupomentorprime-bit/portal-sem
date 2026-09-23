import { PortalBreadcrumb } from "@/components/portal/layout";
import { AdmissionSuccess } from "@/components/portal/admission";
import { isSemTenant } from "@/core/tenant/is-sem";
import { getAdmissionConfig } from "@/lib/cms/admission-config";
import { isWithheldSemPublicHref } from "@/lib/portal/sem-identity-v7";
import { getActivePortal } from "@/lib/portal/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await getActivePortal();
  return {
    title: ctx ? `Postulación enviada | ${ctx.config.seo.title}` : "Postulación enviada",
    description: "Hemos recibido tu solicitud de postulación al SEM.",
    robots: { index: false, follow: false },
  };
}

export default async function PostulacionEnviadaPage() {
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  const config = await getAdmissionConfig(ctx.tenant);
  const storedSuccess = config.successContent;
  const successContent =
    storedSuccess && isSemTenant(ctx.tenant)
      ? {
          ...storedSuccess,
          links: storedSuccess.links.filter((link) => !isWithheldSemPublicHref(link.href)),
        }
      : storedSuccess;

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Admisión", href: "/admision" },
          { label: "Solicitud enviada" },
        ]}
      />
      <AdmissionSuccess content={successContent} />
    </>
  );
}
