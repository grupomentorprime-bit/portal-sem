import { PortalShell } from "@/components/portal/PortalShell";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalShell>{children}</PortalShell>;
}
