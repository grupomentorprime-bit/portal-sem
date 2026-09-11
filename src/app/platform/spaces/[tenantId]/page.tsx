import { notFound } from "next/navigation";
import { getPlatformSpaceDetail } from "@/lib/platform/spaces";
import { PlatformSpaceDetailView } from "@/components/platform/PlatformSpaceDetailView";
import { loadSessionContext } from "@/lib/identity/sessions";
import { operatorHasActiveSpaceAccess } from "@/lib/platform/enter-space";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

/**
 * Ficha operativa de un Espacio. Datos aislados por tenantId.
 */
export default async function PlatformSpaceDetailPage({ params }: PageProps) {
  const { tenantId } = await params;
  const decoded = decodeURIComponent(tenantId);
  const space = await getPlatformSpaceDetail(decoded);
  if (!space) notFound();

  const session = await loadSessionContext();
  const operatorHasAccess = session
    ? await operatorHasActiveSpaceAccess(session.user._id, space.tenantId)
    : false;

  return (
    <PlatformSpaceDetailView
      space={space}
      operatorHasAccess={operatorHasAccess}
    />
  );
}
