import Link from "next/link";
import { Mail, Monitor, Phone } from "lucide-react";
import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { PortalTopBarConfig } from "@/types/cms";

interface PortalTopBarProps {
  config: PortalTopBarConfig;
}

export function PortalTopBar({ config }: PortalTopBarProps) {
  if (!config.enabled) return null;

  const emailHref = config.email ? `mailto:${config.email}` : undefined;
  const phoneHref = config.phone ? `tel:${config.phone.replace(/\s/g, "")}` : undefined;

  return (
    <div className="portal-topbar" role="region" aria-label="Información institucional">
      <div className="portal-topbar__inner mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="portal-topbar__content">
          {config.tagline ? (
            <span className="portal-topbar__item portal-topbar__tagline">{config.tagline}</span>
          ) : null}

          {config.email ? (
            <a
              href={emailHref}
              className={cn("portal-topbar__item portal-topbar__link", focusRing)}
            >
              <Mail size={iconSizes.sm} strokeWidth={2} aria-hidden />
              <span>{config.email}</span>
            </a>
          ) : null}

          {config.phone ? (
            <a
              href={phoneHref}
              className={cn("portal-topbar__item portal-topbar__link", focusRing)}
            >
              <Phone size={iconSizes.sm} strokeWidth={2} aria-hidden />
              <span>{config.phone}</span>
            </a>
          ) : null}

          {config.virtualCampusLabel && config.virtualCampusHref ? (
            <Link
              href={config.virtualCampusHref}
              className={cn("portal-topbar__item portal-topbar__link", focusRing)}
              {...(config.virtualCampusHref.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <Monitor size={iconSizes.sm} strokeWidth={2} aria-hidden />
              <span>{config.virtualCampusLabel}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
