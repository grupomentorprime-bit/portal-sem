import type { Metadata } from "next";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: `Design System | ${PLATFORM_DISPLAY_NAME}`,
  description: "Catálogo visual interno del Experience Kit — OT-BRANDING-005",
  robots: { index: false, follow: false },
};

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const session = await loadSessionContext();
  if (!session) {
    redirect("/login?next=/internal/design-system");
  }

  return children;
}
