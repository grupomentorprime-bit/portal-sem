import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone, Share2 } from "lucide-react";
import { iconSizes } from "@/design";
import type { FooterColumn } from "@/core/navigation";
import { PortalContainer } from "./PortalContainer";
import type { ContactInfo, SocialLinks } from "@/types/cms";

interface PortalFooterProps {
  institutionName: string;
  description?: string;
  organization?: string;
  contact?: ContactInfo;
  social?: SocialLinks;
  logoPrimary: string;
  logoSecondary?: string;
  columns?: FooterColumn[];
  legalLinks?: Array<{ label: string; href: string }>;
}

const socialConfig = [
  { key: "facebook" as const, label: "Facebook" },
  { key: "instagram" as const, label: "Instagram" },
  { key: "youtube" as const, label: "YouTube" },
  { key: "linkedin" as const, label: "LinkedIn" },
];

export function PortalFooter({
  institutionName,
  description,
  organization,
  contact,
  social,
  logoPrimary,
  logoSecondary,
  columns = [],
  legalLinks = [],
}: PortalFooterProps) {
  const year = new Date().getFullYear();
  const activeSocial = social
    ? socialConfig.filter((item) => social[item.key])
    : [];

  return (
    <footer className="border-t border-border bg-primary text-text-inverse">
      <PortalContainer className="py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              {logoSecondary ? (
                <Image
                  src={logoSecondary}
                  alt=""
                  width={40}
                  height={40}
                  className="h-9 w-auto brightness-0 invert"
                />
              ) : null}
              <Image
                src={logoPrimary}
                alt={institutionName}
                width={40}
                height={40}
                className="h-9 w-auto brightness-0 invert"
              />
            </div>
            <p className="mt-4 text-lg font-semibold">{institutionName}</p>
            {organization ? (
              <p className="mt-1 text-sm text-text-inverse/70">{organization}</p>
            ) : null}
            {description ? (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-text-inverse/70">
                {description}
              </p>
            ) : null}
            {activeSocial.length > 0 ? (
              <div className="mt-4 flex gap-3">
                {activeSocial.map(({ key, label }) => (
                  <a
                    key={key}
                    href={social![key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="rounded-[var(--radius-md)] p-2 text-text-inverse/60 transition-colors hover:bg-text-inverse/10 hover:text-accent"
                  >
                    <Share2 size={iconSizes.md} strokeWidth={2} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {columns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-inverse/70 transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">
              Contacto
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-text-inverse/70">
              {contact?.address ? (
                <li className="flex gap-2">
                  <MapPin size={iconSizes.sm} className="mt-0.5 shrink-0" strokeWidth={2} />
                  <span>
                    {contact.address}
                    {contact.city ? `, ${contact.city}` : ""}
                  </span>
                </li>
              ) : null}
              {contact?.phone ? (
                <li>
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-accent">
                    <Phone size={iconSizes.sm} strokeWidth={2} />
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact?.email ? (
                <li>
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-accent">
                    <Mail size={iconSizes.sm} strokeWidth={2} />
                    {contact.email}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </PortalContainer>

      <div className="border-t border-text-inverse/10">
        <PortalContainer className="flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
          <p className="text-center text-xs text-text-inverse/50 sm:text-left">
            © {year} {institutionName}. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-text-inverse/50 transition-colors hover:text-text-inverse/70"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin/config"
              className="text-[10px] text-text-inverse/30 transition-colors hover:text-text-inverse/50"
            >
              Administración
            </Link>
          </div>
        </PortalContainer>
      </div>
    </footer>
  );
}
