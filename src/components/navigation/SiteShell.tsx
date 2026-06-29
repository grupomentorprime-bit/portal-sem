import { getActiveMenuById } from "@/lib/cms/menus";
import { getSiteConfig } from "@/lib/cms/config";
import { SiteFooter } from "@/components/navigation/SiteFooter";
import { SiteHeader } from "@/components/navigation/SiteHeader";

interface SiteShellProps {
  children: React.ReactNode;
}

export async function SiteShell({ children }: SiteShellProps) {
  const [config, mainMenu, footerMenu, mobileMenu] = await Promise.all([
    getSiteConfig(),
    getActiveMenuById("main"),
    getActiveMenuById("footer"),
    getActiveMenuById("mobile"),
  ]);

  return (
    <>
      <SiteHeader config={config} mainMenu={mainMenu} mobileMenu={mobileMenu} />
      {children}
      <SiteFooter config={config} footerMenu={footerMenu} />
    </>
  );
}
