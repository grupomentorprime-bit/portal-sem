import { DesignSystemShowcase } from "@/components/design-system/DesignSystemShowcase";
import type { Metadata } from "next";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";

export const metadata: Metadata = {
  title: "Experience Kit — Catálogo interno",
  description: `Catálogo visual del Design System de ${PLATFORM_DISPLAY_NAME}. Variantes, estados, tokens y ejemplos.`,
  robots: { index: false, follow: false },
};

export default function InternalDesignSystemPage() {
  return <DesignSystemShowcase variant="internal" />;
}
