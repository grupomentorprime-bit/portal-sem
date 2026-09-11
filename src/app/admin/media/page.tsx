import { MediaLibraryClient } from "@/components/media/MediaLibraryClient";
import { getOperationalSiteConfig } from "@/lib/cms/config";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const config = await getOperationalSiteConfig();
  const tenant = config?.institution.tenant ?? "default";
  return <MediaLibraryClient tenant={tenant} />;
}
