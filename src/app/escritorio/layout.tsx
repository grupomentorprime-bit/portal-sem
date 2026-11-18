import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { NELZURI_BACKING, NELZURI_NAME, NELZURI_SLOGAN } from "@/lib/desktop/nelzuri";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { absolute: NELZURI_NAME },
  description: `${NELZURI_SLOGAN}. ${NELZURI_BACKING}.`,
  applicationName: NELZURI_NAME,
  manifest: "/branding/nelzuri/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/branding/nelzuri/favicons/favicon.ico" },
      {
        url: "/branding/nelzuri/favicons/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/branding/nelzuri/favicons/favicon-16.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: "/branding/nelzuri/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: NELZURI_NAME,
  },
};

export default function EscritorioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className={`${sora.variable} nelzuri-desk`}>{children}</div>;
}
