import Link from "next/link";
import { getDatabase } from "@/lib/mongodb";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { findDomainsByTenantId, publicOriginFromHost } from "@/core/tenant";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SiteDomainPage() {
  const config = await getOperationalSiteConfig();
  const tenantId = config?.institution.tenant?.trim() ?? "";
  const domains = tenantId
    ? await findDomainsByTenantId(await getDatabase(), tenantId)
    : [];

  const primary = domains.find((d) => d.isPrimary) ?? domains[0] ?? null;
  const others = domains.filter((d) => d.host !== primary?.host);

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Sitio web", href: "/admin/pages" },
        { label: "Dominio" },
      ]}
      title="Dominio"
      description="Dirección pública de tu sitio en este Espacio."
      actions={
        <Link href="/admin/config">
          <Button type="button" variant="outline">
            Ajustes del sitio
          </Button>
        </Link>
      }
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-xl border border-border bg-background p-6">
          <h2 className="text-sm font-semibold text-foreground">Dirección principal</h2>
          <p className="mt-1 text-xs text-muted">
            Es la URL con la que las personas llegan a tu sitio público.
          </p>
          <p className="mt-4 text-lg font-medium text-foreground">
            {primary?.host ?? "Sin dominio configurado"}
          </p>
          {primary?.host ? (
            <p className="mt-2">
              <a
                href={publicOriginFromHost(primary.host) ?? `https://${primary.host}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-secondary underline"
              >
                Abrir sitio
              </a>
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted">
              El dominio se asigna al crear o configurar el Espacio en la plataforma. No se
              gestiona DNS desde aquí.
            </p>
          )}
        </section>

        {others.length > 0 ? (
          <section className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-sm font-semibold text-foreground">Otras direcciones</h2>
            <ul className="mt-3 space-y-2">
              {others.map((domain) => (
                <li key={domain.host} className="text-sm text-foreground">
                  {domain.host}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-xl border border-border bg-background-soft p-6">
          <h2 className="text-sm font-semibold text-foreground">Páginas y direcciones</h2>
          <p className="mt-2 text-sm text-muted">
            Cada página publicada usa una dirección bajo este dominio (por ejemplo{" "}
            <span className="font-medium text-foreground">/contacto</span>). Créalas y
            publícalas en Páginas.
          </p>
          <div className="mt-4">
            <Link href="/admin/pages">
              <Button type="button">Ir a Páginas</Button>
            </Link>
          </div>
        </section>
      </div>
    </AdminModulePage>
  );
}
