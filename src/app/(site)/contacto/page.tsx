import { Mail, MapPin, Phone } from "lucide-react";
import { iconSizes } from "@/design";
import { PortalBreadcrumb, PortalContainer, PortalSection } from "@/components/portal/layout";
import { PortalPageHeader } from "@/components/portal/PortalSectionHeader";
import { PortalCmsPage, buildPortalPageMetadata } from "@/components/portal/PortalCmsPage";
import { getPublishedPageBySlug } from "@/lib/cms/pages";
import { getActivePortal } from "@/lib/portal/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  return buildPortalPageMetadata("contacto", "Contacto");
}

export default async function ContactoPage() {
  const ctx = await getActivePortal();
  if (!ctx) notFound();

  const page = await getPublishedPageBySlug("/contacto", ctx.tenant);
  if (page?.blocks?.length) {
    return (
      <PortalCmsPage
        slug="contacto"
        fallbackTitle="Contacto"
        fallbackDescription="Comunícate con nosotros."
      />
    );
  }

  const { contact, institution } = ctx.config;

  return (
    <>
      <PortalBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Contacto" },
        ]}
      />
      <PortalPageHeader
        title="Contacto"
        description={`Comunícate con ${institution.name} para postulaciones, información académica o consultas generales.`}
      />
      <PortalSection padding="md">
        <PortalContainer size="sm">
          <div className="rounded-[var(--radius-xl)] border border-border bg-background p-8 shadow-[var(--shadow-md)]">
            <h2 className="text-heading text-foreground">Datos de contacto</h2>
            <ul className="mt-6 space-y-4 text-body text-muted">
              {contact.email ? (
                <li>
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-3 hover:text-secondary">
                    <Mail size={iconSizes.md} strokeWidth={2} />
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {contact.phone ? (
                <li>
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-3 hover:text-secondary">
                    <Phone size={iconSizes.md} strokeWidth={2} />
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact.address ? (
                <li className="flex items-start gap-3">
                  <MapPin size={iconSizes.md} className="mt-0.5 shrink-0" strokeWidth={2} />
                  <span>
                    {contact.address}
                    {contact.city ? `, ${contact.city}` : ""}
                    {contact.country ? `, ${contact.country}` : ""}
                  </span>
                </li>
              ) : null}
            </ul>
          </div>
        </PortalContainer>
      </PortalSection>
    </>
  );
}
