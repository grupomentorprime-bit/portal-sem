import { getTenantContext } from "@/core/tenant";
import { isSemTenant } from "@/core/tenant/is-sem";
import { buildBrandThemeStyle } from "@/core/branding";
import { semSiteBrandColors } from "@/design/tokens/colors";
import { getSiteMetadata } from "@/lib/cms/metadata";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  return getSiteMetadata();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ctx = await getTenantContext();
  const semTheme = isSemTenant(ctx?.tenantId)
    ? {
        "--brand-primary": semSiteBrandColors.primary,
        "--brand-secondary": semSiteBrandColors.secondary,
        "--color-accent": semSiteBrandColors.accent,
        "--sem-accent": semSiteBrandColors.accent,
        "--sem-success": semSiteBrandColors.success,
      }
    : undefined;
  const themeStyle = {
    ...buildBrandThemeStyle(ctx?.config.branding),
    ...semTheme,
  } as CSSProperties;

  return (
    <html
      lang="es"
      data-theme="light"
      className={`${manrope.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col font-sans"
        style={themeStyle}
      >
        {children}
      </body>
    </html>
  );
}
