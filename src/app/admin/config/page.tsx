import { ConfigurationHub } from "@/components/config/ConfigurationHub";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { isAdminShellV2Enabled } from "@/lib/admin/feature-flags";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

function ConfigLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <p className="text-sm text-muted">Cargando configuración…</p>
    </div>
  );
}

export default async function AdminConfigPage() {
  const config = await getOperationalSiteConfig();

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-foreground dark:text-gray-50">
            Configuración no encontrada
          </h1>
          <p className="mt-2 text-sm text-muted">
            No existe configuración de Site para este Espacio.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-muted underline">
            Volver al portal
          </Link>
        </div>
      </div>
    );
  }

  const shellV2 = isAdminShellV2Enabled();

  return (
    <Suspense fallback={<ConfigLoading />}>
      <ConfigurationHub initialConfig={config} hideSectionNav={shellV2} />
    </Suspense>
  );
}
