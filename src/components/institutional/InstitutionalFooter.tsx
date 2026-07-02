/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalFooter
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  Mail,
  MapPin,
  Network,
  Phone,
  Play,
  Share2,
} from "lucide-react";
import { iconSizes } from "@/design";
import { Container, Grid, Stack } from "@/components/layout";
import { CMS_ASSET_PATHS } from "@/lib/cms/asset-paths";
import type { ContactInfo, SocialLinks } from "@/types/cms";

interface FooterColumn {
  title: string;
  links: Array<{ label: string; href: string }>;
}

interface InstitutionalFooterProps {
  institutionName: string;
  organization?: string;
  contact?: ContactInfo;
  social?: SocialLinks;
  columns?: FooterColumn[];
  logoSem?: string;
  logoIpn?: string;
}

const defaultColumns: FooterColumn[] = [
  {
    title: "Institución",
    links: [
      { label: "Quiénes somos", href: "/nosotros" },
      { label: "Historia", href: "/historia" },
      { label: "Equipo", href: "/equipo" },
    ],
  },
  {
    title: "Académico",
    links: [
      { label: "Programas", href: "/programas" },
      { label: "Admisión", href: "/admision" },
      { label: "Biblioteca", href: "/biblioteca" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Aviso de privacidad", href: "/privacidad" },
      { label: "Términos de uso", href: "/terminos" },
    ],
  },
];

const socialConfig = [
  { key: "facebook" as const, icon: Share2, label: "Facebook" },
  { key: "instagram" as const, icon: Camera, label: "Instagram" },
  { key: "youtube" as const, icon: Play, label: "YouTube" },
  { key: "linkedin" as const, icon: Network, label: "LinkedIn" },
];

export function InstitutionalFooter({
  institutionName,
  organization,
  contact,
  social,
  columns = defaultColumns,
  logoSem,
  logoIpn,
}: InstitutionalFooterProps) {
  const semLogo = logoSem || CMS_ASSET_PATHS.logoSem;
  const ipnLogo = logoIpn || CMS_ASSET_PATHS.logoIpn;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-text-inverse">
      <Container>
        <div className="py-16">
          <Grid cols={1} mdCols={2} lgCols={12} gap={8}>
            <div className="lg:col-span-4">
              <div className="flex items-center gap-4">
                <Image
                  src={ipnLogo}
                  alt="IPN"
                  width={48}
                  height={48}
                  className="h-10 w-auto brightness-0 invert"
                />
                <Image
                  src={semLogo}
                  alt="SEM"
                  width={48}
                  height={48}
                  className="h-10 w-auto brightness-0 invert"
                />
              </div>
              <p className="mt-4 text-heading font-semibold">{institutionName}</p>
              {organization ? (
                <p className="mt-1 text-caption text-text-inverse/70">{organization}</p>
              ) : null}

              {social ? (
                <Stack direction="horizontal" gap={2} className="mt-6">
                  {socialConfig.map(({ key, icon: Icon, label }) => {
                    const href = social[key];
                    if (!href) return null;
                    return (
                      <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-text-inverse/20 text-text-inverse transition-colors hover:border-accent hover:text-accent"
                      >
                        <Icon size={iconSizes.md} strokeWidth={2} />
                      </a>
                    );
                  })}
                </Stack>
              ) : null}
            </div>

            {columns.map((col) => (
              <div key={col.title} className="lg:col-span-2">
                <h3 className="text-caption font-semibold uppercase tracking-widest text-accent">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-caption text-text-inverse/70 transition-colors hover:text-accent"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="lg:col-span-2">
              <h3 className="text-caption font-semibold uppercase tracking-widest text-accent">
                Contacto
              </h3>
              <ul className="mt-4 space-y-3">
                {contact?.address ? (
                  <li className="flex gap-2 text-caption text-text-inverse/70">
                    <MapPin size={iconSizes.sm} className="mt-0.5 shrink-0" strokeWidth={2} />
                    <span>
                      {contact.address}
                      {contact.city ? `, ${contact.city}` : ""}
                    </span>
                  </li>
                ) : null}
                {contact?.phone ? (
                  <li>
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 text-caption text-text-inverse/70 hover:text-accent"
                    >
                      <Phone size={iconSizes.sm} strokeWidth={2} />
                      {contact.phone}
                    </a>
                  </li>
                ) : null}
                {contact?.email ? (
                  <li>
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-caption text-text-inverse/70 hover:text-accent"
                    >
                      <Mail size={iconSizes.sm} strokeWidth={2} />
                      {contact.email}
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          </Grid>
        </div>

        <div className="border-t border-text-inverse/10 py-6">
          <p className="text-center text-caption text-text-inverse/50">
            © {year} {institutionName}. Todos los derechos reservados.
          </p>
        </div>
      </Container>
    </footer>
  );
}
