import {
  PlatformLegalPage,
  buildPlatformLegalMetadata,
} from "@/components/legal/PlatformLegalPage";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return buildPlatformLegalMetadata("terminos");
}

export default function PlatformTermsPage() {
  return <PlatformLegalPage slug="terminos" />;
}
