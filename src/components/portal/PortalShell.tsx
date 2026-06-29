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

  const { config, navLinks, logos } = ctx;
  const { institution, contact, seo } = config;

  return (
    <>
      <PortalHeader
        links={navLinks}
        logoSem={logos.sem}
        logoIpn={logos.ipn}
        institutionShortName={institution.shortName}
      />
      <main className="flex-1 pt-16 sm:pt-[4.5rem]">{children}</main>
      <PortalFooter
        institutionName={institution.name}
        description={seo.description}
        organization={institution.organization}
        contact={contact}
        social={config.social}
        logoSem={logos.sem}
        logoIpn={logos.ipn}
      />
    </>
  );
}
