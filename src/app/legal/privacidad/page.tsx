import {
  PlatformLegalPage,
  buildPlatformLegalMetadata,
} from "@/components/legal/PlatformLegalPage";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return buildPlatformLegalMetadata("privacidad");
}

export default function PlatformPrivacyPage() {
  return <PlatformLegalPage slug="privacidad" />;
}
