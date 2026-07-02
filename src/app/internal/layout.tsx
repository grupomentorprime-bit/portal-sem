import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design System | AprendeHoy",
  description: "Catálogo visual interno del Experience Kit — OT-BRANDING-005",
  robots: { index: false, follow: false },
};

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
