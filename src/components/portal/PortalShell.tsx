import { isSemTenant } from "@/core/tenant/is-sem";
import { isFeatureEnabled } from "@/lib/portal/feature-flags";
import { getPortalContext } from "@/lib/portal/site";
import {
  officialCampusHref,
  publicSemContact,
  SEM_ISOTIPO_ON_DARK_SRC,
  SEM_ISOTIPO_SRC,
  SEM_PUBLIC_NAV,
} from "@/lib/portal/sem-identity-v7";
import { fetchPrograms } from "@/lib/portal/content";
import { FooterPremiumShell } from "@/components/portal/experience/footer-premium/FooterPremiumShell";
import { PortalHeader } from "@/components/portal/layout";
import { PortalExperienceProvider } from "@/components/portal/PortalExperienceProvider";
import { ExperienceActionProvider } from "@/components/portal/experience/ExperienceActionProvider";
import { DEFAULT_PORTAL_CURSOR } from "@/lib/portal/cursor-defaults";

function findQuickLink(
  links: Array<{ label: string; href: string; highlighted?: boolean }>,
  matcher: (label: string) => boolean
) {
  return links.find((l) => matcher(l.label.toLowerCase()));
}

interface PortalShellProps {
  children: React.ReactNode;
}

export async function PortalShell({ children }: PortalShellProps) {
  const ctx = await getPortalContext();

  if (!ctx) {
    return <main>{children}</main>;
  }

  const { config, navLinks, navigation, logos, tenant } = ctx;
  const { institution, contact, seo } = config;

  const [featuredPrograms] = await Promise.all([
    fetchPrograms(tenant, { featured: true, limit: 6 }),
  ]);

  const semTenant = isSemTenant(tenant);
  const headerLinks = semTenant ? [...SEM_PUBLIC_NAV] : navLinks;
  const loginLink = findQuickLink(navigation.quickLinks, (l) => l.includes("ingresar"));

  const applyLink = isFeatureEnabled(config.features, "applications")
    ? navigation.quickLinks.find((l) => l.highlighted) ??
      findQuickLink(navigation.quickLinks, (l) => l.includes("postul"))
    : undefined;
  const campusHref = semTenant
    ? officialCampusHref(config.topBar?.virtualCampusHref)
    : undefined;
  const publicContact = publicSemContact(contact, tenant);

  return (
    <PortalExperienceProvider cursor={config.portalExperience?.cursor ?? DEFAULT_PORTAL_CURSOR}>
      <ExperienceActionProvider>
      <PortalHeader
        links={headerLinks}
        mobileLinks={headerLinks}
        logoPrimary={semTenant ? SEM_ISOTIPO_SRC : logos.primary}
        logoSecondary={semTenant ? undefined : logos.secondary}
        institutionName={institution.name}
        institutionShortName={institution.shortName}
        organization={institution.organization}
        loginHref={loginLink?.href ?? "/ingresar"}
        loginLabel={loginLink?.label ?? "Ingresar"}
        applyHref={applyLink?.href ?? (semTenant ? "/admision" : undefined)}
        applyLabel={semTenant ? "Postular" : applyLink?.label}
        campusHref={campusHref}
        campusLabel="Campus"
        variant="premium"
      />
      <main
        className="flex-1 pt-[var(--portal-header-offset,90px)]"
        style={{ "--portal-header-offset": "90px" } as React.CSSProperties}
      >
        {children}
      </main>
      <FooterPremiumShell
        tenantId={tenant}
        institution={institution}
        seo={seo}
        contact={publicContact}
        social={config.social}
        portalCopy={config.portalCopy}
        logos={{
          primary: semTenant ? SEM_ISOTIPO_ON_DARK_SRC : logos.primary,
          secondary: semTenant ? undefined : logos.secondary,
        }}
        footerColumns={navigation.footer}
        legalLinks={navigation.legal}
        programs={featuredPrograms}
        footerSettings={config.portalExperience?.footerPremium}
      />
      </ExperienceActionProvider>
    </PortalExperienceProvider>
  );
}
