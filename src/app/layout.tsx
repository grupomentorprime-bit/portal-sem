import { getSiteConfig } from "@/lib/cms/config";
import { getSiteMetadata } from "@/lib/cms/metadata";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col"
        style={themeStyle}
      >
        {children}
      </body>
    </html>
  );
}
