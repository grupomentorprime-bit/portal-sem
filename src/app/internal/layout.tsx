import type { Metadata } from "next";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Design System | Growth OS",
  description: "Catálogo visual interno del Experience Kit — OT-BRANDING-005",
  robots: { index: false, follow: false },
};

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const session = await loadSessionContext();
  if (!session) {
    redirect("/admin/login?next=/internal/design-system");
  }

  return children;
}
