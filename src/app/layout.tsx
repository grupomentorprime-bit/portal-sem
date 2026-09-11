import { getTenantContext } from "@/core/tenant";
import { buildBrandThemeStyle } from "@/core/branding";
import { getSiteMetadata } from "@/lib/cms/metadata";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  const themeStyle = buildBrandThemeStyle(ctx?.config.branding) as
    | CSSProperties
    | undefined;

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
