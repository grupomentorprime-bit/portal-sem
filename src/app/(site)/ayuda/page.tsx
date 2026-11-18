import { PublicHelpForm } from "@/components/help/PublicHelpForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedir ayuda",
  description: "Abre un caso con NELZURI y síguelo con el correlativo.",
};

export default function AyudaPage() {
  return <PublicHelpForm />;
}
