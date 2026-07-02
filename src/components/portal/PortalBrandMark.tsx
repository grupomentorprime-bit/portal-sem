"use client";

import Image from "next/image";
import { useState } from "react";
import { PLATFORM_ASSET_FALLBACKS } from "@/lib/cms/asset-paths";
import { cn } from "@/lib/utils";

function isConfiguredAsset(src: string | undefined, fallback: string): boolean {
  return Boolean(src && src.trim() && src !== fallback);
}

function splitInstitutionName(name: string): [string, string] {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 2) return [name, ""];
  return [parts.slice(0, -1).join(" "), parts.at(-1) ?? ""];
}

interface PortalBrandMarkProps {
  logoPrimary?: string;
  logoSecondary?: string;
  institutionName?: string;
  institutionShortName?: string;
  organization?: string;
  variant?: "light" | "dark";
  layout?: "default" | "premium-hero" | "partner";
  className?: string;
}

export function PortalBrandMark({
  logoPrimary,
  logoSecondary,
  institutionName = "",
  institutionShortName = "",
  organization = "",
  variant = "light",
  layout = "default",
  className,
}: PortalBrandMarkProps) {
  const [primaryError, setPrimaryError] = useState(false);
  const [secondaryError, setSecondaryError] = useState(false);

  const showPrimaryImage =
    isConfiguredAsset(logoPrimary, PLATFORM_ASSET_FALLBACKS.logo) && !primaryError;
  const showSecondaryImage =
    isConfiguredAsset(logoSecondary, PLATFORM_ASSET_FALLBACKS.secondaryLogo) && !secondaryError;

  const textClass = variant === "light" ? "text-primary" : "text-text-inverse";
  const secondaryFallback = organization
    ? organization.split(/\s+/).slice(0, 2).join(" ")
    : "";

  if (layout === "partner") {
    const partnerLabel = organization || secondaryFallback || institutionName;
    return (
      <div className={cn("portal-brand-mark portal-brand-mark--partner flex items-center", className)}>
        {showSecondaryImage ? (
          <Image
            src={logoSecondary!}
            alt={partnerLabel || "Logo institucional"}
            width={120}
            height={48}
            className="h-9 w-auto max-w-[9rem] object-contain sm:h-10"
            onError={() => setSecondaryError(true)}
            priority
          />
        ) : (
          <span
            className={cn(
              "max-w-[9rem] text-[10px] font-semibold uppercase leading-tight tracking-wider sm:text-xs",
              textClass
            )}
          >
            {partnerLabel}
          </span>
        )}
      </div>
    );
  }

  const [institutionLine1, institutionLine2] = splitInstitutionName(institutionName);
  const logoSrc = showPrimaryImage
    ? logoPrimary!
    : variant === "dark"
      ? PLATFORM_ASSET_FALLBACKS.logoOnDark
      : PLATFORM_ASSET_FALLBACKS.logo;
  const isCompact = layout === "default";

  return (
    <div
      className={cn(
        "portal-brand-mark portal-brand-mark--premium-hero flex items-center",
        isCompact && "portal-brand-mark--compact",
        className
      )}
    >
      <Image
        src={logoSrc}
        alt={institutionName || "Seminario Eclesiástico Mayor"}
        width={48}
        height={54}
        className="portal-brand-mark__premium-logo shrink-0 object-contain"
        onError={() => setPrimaryError(true)}
        priority
      />
      <span className="portal-brand-mark__premium-sem">{institutionShortName || "SEM"}</span>
      {institutionName ? (
        <>
          <span className="portal-brand-mark__premium-divider" aria-hidden />
          <span className="portal-brand-mark__premium-institution">
            <span className="block">{institutionLine1}</span>
            {institutionLine2 ? <span className="block">{institutionLine2}</span> : null}
          </span>
        </>
      ) : null}
    </div>
  );
}
