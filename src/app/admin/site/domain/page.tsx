import Link from "next/link";
import { ChevronDown, Globe } from "lucide-react";
import { getDatabase } from "@/lib/mongodb";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { findDomainsByTenantId, publicOriginFromHost } from "@/core/tenant";
import { customDomainCnameTarget } from "@/core/tenant/custom-domain-records";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { SiteDomainAddressActions } from "@/components/admin/site/SiteDomainAddressActions";
import { PlatformSpaceDomainPanel } from "@/components/platform/PlatformSpaceDomainPanel";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function otherAddressHint(host: string, kind: string): string {
  const name = host.split(":")[0] ?? host;
  if (name === "localhost" || name.endsWith(".localhost")) {
    return "Solo en este computador, mientras revisas el sitio.";
  }
  if (kind === "platform_subdomain") {
    return "Dirección de la plataforma. Sigue activa si conectas un dominio propio.";
  }
  if (kind === "legacy") {
    return "Una dirección anterior que todavía abre el mismo sitio.";
  }
  return "También abre el mismo sitio.";
}

export default async function SiteDomainPage() {
  const config = await getOperationalSiteConfig();
  const tenantId = config?.institution.tenant?.trim() ?? "";
  const domains = tenantId
    ? await findDomainsByTenantId(await getDatabase(), tenantId)
    : [];

  const primary = domains.find((d) => d.isPrimary) ?? domains[0] ?? null;
  const others = domains.filter((d) => d.host !== primary?.host);
  const subdomain =
    domains.find((domain) => domain.kind === "platform_subdomain")?.host ?? null;
  const customDomain =
    domains.find((domain) => domain.kind === "custom" && domain.isPrimary)?.host ??
    domains.find((domain) => domain.kind === "custom")?.host ??
    null;
  const primaryHref = primary?.host
    ? (publicOriginFromHost(primary.host) ?? `https://${primary.host}`)
    : null;

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Sitio web", href: "/admin/config" },
        { label: "Dominio" },
      ]}
      title="Dominio"
      description="La dirección con la que las personas encuentran tu sitio."
      actions={
        <Link href="/admin/config">
          <Button type="button" variant="outline">
            Ajustes del sitio
          </Button>
        </Link>
      }
    >
      <section className="overflow-hidden rounded-2xl border border-border border-t-[3px] border-t-[var(--color-accent)] bg-background">
        <div className="bg-[color-mix(in_srgb,var(--color-primary)_7%,white)] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex items-center gap-2 text-sm font-medium text-muted">
              <Globe className="h-4 w-4 text-primary" aria-hidden />
              Dirección principal
            </p>
            {primary?.host ? (
              <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-success)_40%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-success)_10%,white)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-success)]">
                Activo
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-border bg-background-soft px-2 py-0.5 text-[11px] font-semibold text-muted">
                Pendiente
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="break-all text-2xl font-semibold tracking-tight text-foreground">
                {primary?.host ?? "Sin dominio configurado"}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {primary?.host
                  ? "Listo. Las personas llegan aquí. No hace falta otro dominio para publicar el sitio."
                  : "Cuando haya un dominio, aquí verás la dirección pública del sitio."}
              </p>
            </div>
            {primary?.host && primaryHref ? (
              <SiteDomainAddressActions host={primary.host} href={primaryHref} />
            ) : null}
          </div>
        </div>

        {tenantId ? (
          <div className="border-t border-border px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Tu propio dominio</h2>
              {customDomain ? (
                <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-success)_40%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-success)_10%,white)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-success)]">
                  Conectado
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-border bg-background-soft px-2 py-0.5 text-[11px] font-semibold text-muted">
                  Opcional · No conectado
                </span>
              )}
            </div>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
              Solo si el cliente tiene un dominio suyo (ej. empresa.cl). El subdominio de
              arriba ya sirve; esto es un extra.
            </p>
            <PlatformSpaceDomainPanel
              tenantId={tenantId}
              subdomain={subdomain}
              customDomain={customDomain}
              cnameTarget={customDomainCnameTarget()}
              endpoint="/api/admin/site/domain"
              hideFieldLabel
              placeholder="ej. seminario.cl"
              helper=""
            />
          </div>
        ) : null}

        {others.length > 0 ? (
          <details className="group border-t border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 text-sm font-medium text-foreground sm:px-6 [&::-webkit-details-marker]:hidden">
              <span>Otras direcciones</span>
              <span className="inline-flex items-center gap-2 text-muted">
                {others.length}
                <ChevronDown
                  className="h-4 w-4 transition group-open:rotate-180"
                  aria-hidden
                />
              </span>
            </summary>
            <ul className="space-y-3 px-5 pb-4 sm:px-6">
              {others.map((domain) => (
                <li key={domain.host}>
                  <p className="break-all text-sm font-medium text-foreground">{domain.host}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {otherAddressHint(domain.host, domain.kind)}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-border bg-[color-mix(in_srgb,var(--color-background-soft)_70%,white)] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm leading-relaxed text-muted">
            Cada página publicada cuelga de tu dominio, por ejemplo{" "}
            <span className="font-medium text-foreground">/contacto</span>.
          </p>
        </div>
      </section>
    </AdminModulePage>
  );
}
