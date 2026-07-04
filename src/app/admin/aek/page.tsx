import { AekCatalog } from "@/components/admin/kit/catalog/AekCatalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Experience Kit — Catálogo AEK",
  description: "Catálogo visual del Experience Kit Administrativo AprendeHoy v1",
  robots: { index: false, follow: false },
};

export default function AdminAekCatalogPage() {
  return <AekCatalog />;
}
