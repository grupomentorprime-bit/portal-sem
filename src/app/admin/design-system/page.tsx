import { DesignSystemShowcase } from "@/components/design-system/DesignSystemShowcase";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design System | SEM",
  description: "Catálogo visual del Design System institucional del Seminario Eclesiástico Mayor.",
};

export default function DesignSystemPage() {
  return <DesignSystemShowcase />;
}
