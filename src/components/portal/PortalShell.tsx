import { getPortalContext } from "@/lib/portal/site";
import { PortalFooter, PortalHeader } from "@/components/portal/layout";

interface PortalShellProps {
  children: React.ReactNode;
}

export async function PortalShell({ children }: PortalShellProps) {
  const ctx = await getPortalContext();

  if (!ctx) {
    return <main>{children}</main>;
  }

  const { config, navLinks, navigation, logos } = ctx;
  const { institution, contact, seo } = config;

  const applyLink = navigation.quickLinks.find((l) => l.highlighted) ?? navigation.quickLinks[0];
  const campusLink = navigation.quickLinks.find((l) => l.target === "_blank") ?? navigation.quickLinks[1];

  return (
    <>
      <PortalHeader
        links={navigation.mobile.length ? navigation.mobile : navLinks}
        logoPrimary={logos.primary}
        logoSecondary={logos.secondary}
        institutionShortName={institution.shortName}
        applyHref={applyLink?.href}
        applyLabel={applyLink?.label}
        campusHref={campusLink?.href}
        campusLabel={campusLink?.label}
      />
      <main className="flex-1 pt-16 sm:pt-[4.5rem]">{children}</main>
      <PortalFooter
        institutionName={institution.name}
        description={seo.description}
        organization={institution.organization}
        contact={contact}
        social={config.social}
        logoPrimary={logos.primary}
        logoSecondary={logos.secondary}
        columns={navigation.footer}
        legalLinks={navigation.legal}
      />
    </>
  );
}
