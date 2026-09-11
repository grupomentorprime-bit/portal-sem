import {
  PlatformLegalPage,
  buildPlatformLegalMetadata,
} from "@/components/legal/PlatformLegalPage";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return buildPlatformLegalMetadata("eliminacion-de-datos");
}

export default function PlatformDataDeletionPage() {
  return <PlatformLegalPage slug="eliminacion-de-datos" />;
}
