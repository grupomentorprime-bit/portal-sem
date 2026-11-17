import type { CSSProperties } from "react";
import { PortalBrandMark } from "@/components/portal/PortalBrandMark";
import { PublicVendorCredit } from "@/components/portal/PublicVendorCredit";
import { PortalExperienceProvider } from "@/components/portal/PortalExperienceProvider";
import { ExperienceActionProvider } from "@/components/portal/experience/ExperienceActionProvider";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding";
import { ipnDepartmentColors } from "@/design/tokens/colors";
import { DEFAULT_PORTAL_CURSOR } from "@/lib/portal/cursor-defaults";
import { getPortalContext } from "@/lib/portal/site";

interface FormFocusedShellProps {
  children: React.ReactNode;
  /** Marca propia del formulario. Si viene, reemplaza el logo del Espacio en la cabecera. */
  brandLogo?: string;
  brandLogoAlt?: string;
  /** Azul noche y oro del manual de departamentos. */
  tone?: "default" | "corporate";
  /** Con un banner de portada, la barra fija duplica la marca y se omite. */
  showBrandHeader?: boolean;
}

/** Shell mínimo para completar un formulario sin distracciones (mobile-first). */
export async function FormFocusedShell({
  children,
  brandLogo,
  brandLogoAlt,
  tone = "default",
  showBrandHeader = true,
}: FormFocusedShellProps) {
  const ctx = await getPortalContext();
  const year = new Date().getFullYear();
  const corporate = tone === "corporate" || Boolean(brandLogo);
  const corporateStyle = corporate
    ? ({
        "--dept-navy": ipnDepartmentColors.navy,
        "--dept-gold": ipnDepartmentColors.gold,
        "--dept-gray": ipnDepartmentColors.gray,
        "--dept-ink": ipnDepartmentColors.ink,
        "--dept-soft": ipnDepartmentColors.soft,
        "--dept-cream": ipnDepartmentColors.cream,
        "--dept-cream-from": ipnDepartmentColors.creamFrom,
        "--dept-cream-to": ipnDepartmentColors.creamTo,
        "--dept-navy-mid": ipnDepartmentColors.navyMid,
      } as CSSProperties)
    : undefined;

  if (!ctx) {
    return (
      <div
        className={["form-focused-shell", corporate ? "form-focused-shell--corporate" : ""]
          .filter(Boolean)
          .join(" ")}
        style={corporateStyle}
      >
        <main className="form-focused-shell__main" suppressHydrationWarning>
          {children}
        </main>
        <footer className="form-focused-shell__legal" aria-label="Aviso legal">
          <p>© {year} {PLATFORM_DISPLAY_NAME}. Todos los derechos reservados.</p>
          <PublicVendorCredit className="form-focused-shell__vendor" />
        </footer>
      </div>
    );
  }

  const { config, logos } = ctx;
  const { institution } = config;
  const copyrightSuffix =
    config.portalCopy?.footerCopyrightSuffix?.trim() || "Todos los derechos reservados.";

  const shellClassName = [
    "form-focused-shell",
    corporate ? "form-focused-shell--corporate" : "",
    showBrandHeader && brandLogo ? "form-focused-shell--mark" : "",
    corporate && !showBrandHeader ? "form-focused-shell--banner" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <PortalExperienceProvider cursor={config.portalExperience?.cursor ?? DEFAULT_PORTAL_CURSOR}>
      <ExperienceActionProvider>
        <div className={shellClassName} style={corporateStyle}>
          {showBrandHeader ? (
            <header className="form-focused-shell__header">
              <div
                className="form-focused-shell__brand"
                aria-label={brandLogoAlt || institution.name || PLATFORM_DISPLAY_NAME}
              >
                {brandLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brandLogo}
                    alt={brandLogoAlt || institution.name || "Logo"}
                    className="form-focused-shell__mark"
                  />
                ) : (
                  <PortalBrandMark
                    logoPrimary={logos.primary}
                    institutionName={institution.name}
                    institutionShortName={institution.shortName}
                    variant="light"
                    layout="default"
                  />
                )}
              </div>
            </header>
          ) : null}
          <main className="form-focused-shell__main" suppressHydrationWarning>
            {children}
          </main>
          <footer className="form-focused-shell__legal" aria-label="Aviso legal">
            <p>
              © {year} {institution.name}. {copyrightSuffix}
            </p>
            <PublicVendorCredit className="form-focused-shell__vendor" />
          </footer>
        </div>
      </ExperienceActionProvider>
    </PortalExperienceProvider>
  );
}
