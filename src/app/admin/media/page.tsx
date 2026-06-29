import { MediaLibraryClient } from "@/components/media/MediaLibraryClient";
import { getSiteConfigUncached } from "@/lib/cms/config";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const config = await getSiteConfigUncached();
  const tenant = config?.institution.tenant ?? "default";
  return <MediaLibraryClient tenant={tenant} />;
}
