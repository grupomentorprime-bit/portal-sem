import { ConfigurationHub } from "@/components/config/ConfigurationHub";
import { getSiteConfigUncached } from "@/lib/cms/config";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const config = await getSiteConfigUncached();

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Configuración no encontrada
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            No existe el documento cms_config con _id &quot;site&quot;.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-zinc-600 underline">
            Volver al portal
          </Link>
        </div>
      </div>
    );
  }

  return <ConfigurationHub initialConfig={config} />;
}
