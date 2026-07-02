import { Mail, Phone } from "lucide-react";
import { focusRing } from "@/components/ui/shared";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
} from "@/components/portal/layout/footer/social-config";
import { iconSizes } from "@/design";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

interface PortalPersonSocialProps {
  email?: string;
  phone?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  name: string;
  className?: string;
}

type SocialIconProps = { size?: number; className?: string };

function socialHref(value: string, type: "linkedin" | "facebook" | "instagram"): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (type === "linkedin") return `https://linkedin.com/in/${trimmed.replace(/^@/, "")}`;
  if (type === "facebook") return `https://facebook.com/${trimmed.replace(/^@/, "")}`;
  return `https://instagram.com/${trimmed.replace(/^@/, "")}`;
}

export function PortalPersonSocial({
  email,
  phone,
  linkedin,
  facebook,
  instagram,
  name,
  className,
}: PortalPersonSocialProps) {
  const links = [
    email
      ? { href: `mailto:${email}`, label: `Correo de ${name}`, Icon: Mail as ComponentType<SocialIconProps> }
      : null,
    phone
      ? {
          href: `tel:${phone.replace(/\s/g, "")}`,
          label: `Teléfono de ${name}`,
          Icon: Phone as ComponentType<SocialIconProps>,
        }
      : null,
    linkedin
      ? {
          href: socialHref(linkedin, "linkedin"),
          label: `LinkedIn de ${name}`,
          Icon: LinkedinIcon,
        }
      : null,
    facebook
      ? {
          href: socialHref(facebook, "facebook"),
          label: `Facebook de ${name}`,
          Icon: FacebookIcon,
        }
      : null,
    instagram
      ? {
          href: socialHref(instagram, "instagram"),
          label: `Instagram de ${name}`,
          Icon: InstagramIcon,
        }
      : null,
  ].filter(Boolean) as Array<{ href: string; label: string; Icon: ComponentType<SocialIconProps> }>;

  if (links.length === 0) return null;

  return (
    <ul className={cn("portal-person-card__social", className)} aria-label={`Redes de ${name}`}>
      {links.map(({ href, label, Icon }) => (
        <li key={href}>
          <a
            href={href}
            className={cn("portal-person-card__social-link", focusRing)}
            aria-label={label}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            <Icon size={iconSizes.sm} aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
