import { getSiteConfig } from "@/lib/cms/config";
import { getSiteMetadata } from "@/lib/cms/metadata";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

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
  const config = await getSiteConfig();
  const branding = config?.branding;

  const themeStyle = branding
    ? ({
        "--brand-primary": branding.primaryColor,
        "--brand-secondary": branding.secondaryColor,
        "--brand-background": branding.backgroundColor,
        "--brand-text": branding.textColor,
      } as React.CSSProperties)
    : undefined;

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
