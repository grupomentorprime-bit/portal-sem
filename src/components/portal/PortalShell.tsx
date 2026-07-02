import { isFeatureEnabled } from "@/lib/portal/feature-flags";
import { getPortalContext } from "@/lib/portal/site";
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

  const loginLink = findQuickLink(navigation.quickLinks, (l) => l.includes("ingresar"));

  const applyLink = isFeatureEnabled(config.features, "applications")
    ? navigation.quickLinks.find((l) => l.highlighted) ??
      findQuickLink(navigation.quickLinks, (l) => l.includes("postul"))
    : undefined;

  return (
    <PortalExperienceProvider cursor={config.portalExperience?.cursor ?? DEFAULT_PORTAL_CURSOR}>
      <ExperienceActionProvider>
      <PortalHeader
        links={navLinks}
        mobileLinks={navigation.mobile.length ? navigation.mobile : navLinks}
        logoPrimary={logos.primary}
        logoSecondary={logos.secondary}
        institutionName={institution.name}
        institutionShortName={institution.shortName}
        organization={institution.organization}
        loginHref={loginLink?.href ?? "/ingresar"}
        loginLabel={loginLink?.label ?? "Ingresar"}
        applyHref={applyLink?.href}
        applyLabel={applyLink?.label}
        variant="premium"
      />
      <main
        className="flex-1 pt-[var(--portal-header-offset,90px)]"
        style={{ "--portal-header-offset": "90px" } as React.CSSProperties}
      >
        {children}
      </main>
      <FooterPremiumShell
        institution={institution}
        seo={seo}
        contact={contact}
        social={config.social}
        portalCopy={config.portalCopy}
        logos={{ primary: logos.primary, secondary: logos.secondary }}
        footerColumns={navigation.footer}
        legalLinks={navigation.legal}
        programs={featuredPrograms}
        footerSettings={config.portalExperience?.footerPremium}
      />
      </ExperienceActionProvider>
    </PortalExperienceProvider>
  );
}
