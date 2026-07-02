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
  layout?: "default" | "premium-hero";
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

  const primaryFallback = institutionShortName || institutionName || "Institución";
  const secondaryFallback = organization
    ? organization.split(/\s+/).slice(0, 2).join(" ")
    : "";

  const textClass = variant === "light" ? "text-primary" : "text-text-inverse";
  const hasPartner = showSecondaryImage || Boolean(secondaryFallback);

  if (layout === "premium-hero") {
    const [institutionLine1, institutionLine2] = splitInstitutionName(institutionName);
    const logoSrc = PLATFORM_ASSET_FALLBACKS.logo;

    return (
      <div className={cn("portal-brand-mark portal-brand-mark--premium-hero flex items-center", className)}>
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

  return (
    <div className={cn("portal-brand-mark flex items-center", className)}>
      {hasPartner ? (
        <div className="flex items-center gap-3 sm:gap-4">
          {showSecondaryImage ? (
            <Image
              src={logoSecondary!}
              alt=""
              width={48}
              height={48}
              className="h-9 w-auto max-w-[5rem] object-contain sm:h-10"
              onError={() => setSecondaryError(true)}
              priority
            />
          ) : (
            <span
              className={cn(
                "hidden max-w-[6rem] text-[10px] font-semibold uppercase leading-tight tracking-wider sm:block sm:text-xs",
                textClass
              )}
            >
              {secondaryFallback}
            </span>
          )}
          <span className="portal-brand-mark__divider hidden sm:block" aria-hidden />
        </div>
      ) : null}

      <div className={cn(hasPartner && "pl-3 sm:pl-4")}>
        {showPrimaryImage ? (
          <Image
            src={logoPrimary!}
            alt={institutionName || "Logo institucional"}
            width={56}
            height={56}
            className="portal-brand-mark__primary h-10 w-auto max-w-[7rem] object-contain sm:h-11 lg:h-12 lg:max-w-[8rem]"
            onError={() => setPrimaryError(true)}
            priority
          />
        ) : (
          <span
            className={cn(
              "portal-brand-mark__primary-text text-base font-bold tracking-tight sm:text-lg lg:text-xl",
              textClass
            )}
          >
            {primaryFallback}
          </span>
        )}
      </div>
    </div>
  );
}
