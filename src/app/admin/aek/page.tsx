import { AekCatalog } from "@/components/admin/kit/catalog/AekCatalog";
import type { Metadata } from "next";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";

export const metadata: Metadata = {
  title: "Experience Kit — Catálogo AEK",
  description: `Catálogo visual del Experience Kit Administrativo de ${PLATFORM_DISPLAY_NAME} v1`,
  robots: { index: false, follow: false },
};

export default function AdminAekCatalogPage() {
  return <AekCatalog />;
}
