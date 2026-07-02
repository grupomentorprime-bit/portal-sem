import { PortalBrandMark } from "@/components/portal/PortalBrandMark";
import { PortalExperienceProvider } from "@/components/portal/PortalExperienceProvider";
import { ExperienceActionProvider } from "@/components/portal/experience/ExperienceActionProvider";
import { DEFAULT_PORTAL_CURSOR } from "@/lib/portal/cursor-defaults";
import { getPortalContext } from "@/lib/portal/site";

interface FormFocusedShellProps {
  children: React.ReactNode;
}

/** Shell mínimo para completar un formulario sin distracciones (mobile-first). */
export async function FormFocusedShell({ children }: FormFocusedShellProps) {
  const ctx = await getPortalContext();
  const year = new Date().getFullYear();

  if (!ctx) {
    return (
      <div className="form-focused-shell">
        <main className="form-focused-shell__main">{children}</main>
        <footer className="form-focused-shell__legal" aria-label="Aviso legal">
          <p>© {year} Seminario Eclesiástico Mayor. Todos los derechos reservados.</p>
        </footer>
      </div>
    );
  }

  const { config, logos } = ctx;
  const { institution } = config;
  const copyrightSuffix =
    config.portalCopy?.footerCopyrightSuffix?.trim() || "Todos los derechos reservados.";

  return (
    <PortalExperienceProvider cursor={config.portalExperience?.cursor ?? DEFAULT_PORTAL_CURSOR}>
      <ExperienceActionProvider>
        <div className="form-focused-shell">
          <header className="form-focused-shell__header">
            <div className="form-focused-shell__brand" aria-label="Seminario Eclesiástico Mayor">
              <PortalBrandMark
                logoPrimary={logos.primary}
                institutionName={institution.name}
                institutionShortName={institution.shortName}
                variant="light"
                layout="default"
              />
            </div>
          </header>
          <main className="form-focused-shell__main">{children}</main>
          <footer className="form-focused-shell__legal" aria-label="Aviso legal">
            <p>
              © {year} {institution.name}. {copyrightSuffix}
            </p>
          </footer>
        </div>
      </ExperienceActionProvider>
    </PortalExperienceProvider>
  );
}
