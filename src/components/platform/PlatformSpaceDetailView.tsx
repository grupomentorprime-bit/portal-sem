import Link from "next/link";
import {
  Building2,
  Globe2,
  Link2,
  Users,
} from "lucide-react";
import { PLATFORM_ADMIN_HOME } from "@/core/identity/platform/codes";
import { StatusBadge, type StatusBadgeTone } from "@/components/admin/kit";
import { PlatformEnterSpacePanel } from "@/components/platform/PlatformEnterSpacePanel";
import { PlatformDeleteSpacePanel } from "@/components/platform/PlatformDeleteSpacePanel";
import { PlatformSpaceActionsMenu } from "@/components/platform/PlatformSpaceActionsMenu";
import { SpaceTypeFallbackMark } from "@/components/platform/SpaceTypeFallbackMark";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { PlatformSpaceDetail } from "@/lib/platform/spaces";
import { labelDomainKind } from "@/lib/platform/space-labels";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[16px] border-[var(--color-border-default)] bg-white p-0 shadow-[0_12px_28px_-22px_rgba(14,79,144,0.35)]">
      <CardHeader className="mb-0 border-b border-[var(--color-border-default)] px-5 py-4">
        <CardTitle className="text-[15px] font-semibold tracking-tight text-[var(--gray-900)]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 py-4">{children}</CardContent>
    </Card>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-[13px] text-[var(--gray-500)]">{label}</dt>
      <dd className="text-[13px] text-[var(--gray-900)]">{value || "—"}</dd>
    </div>
  );
}

function tenantStatusTone(
  status: PlatformSpaceDetail["status"]
): StatusBadgeTone {
  switch (status) {
    case "active":
      return "active";
    case "suspended":
      return "error";
    case "inactive":
      return "inactive";
    case "archived":
      return "neutral";
    default:
      return "neutral";
  }
}

function SpaceMark({ space }: { space: PlatformSpaceDetail }) {
  if (space.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={space.logoUrl}
        alt=""
        className="h-14 w-14 rounded-[14px] object-contain bg-[var(--color-background-default)] p-1.5"
      />
    );
  }
  return (
    <SpaceTypeFallbackMark
      type={space.type}
      typeLabel={space.typeLabel}
      size="sm"
    />
  );
}

export function PlatformSpaceDetailView({
  space,
  operatorHasAccess,
}: {
  space: PlatformSpaceDetail;
  operatorHasAccess: boolean;
}) {
  const primaryDomain =
    space.domains.find((domain) => domain.isPrimary)?.host ??
    space.domains[0]?.host ??
    null;

  return (
    <div className="space-y-5">
      <Link
        href={`${PLATFORM_ADMIN_HOME}#espacios`}
        className="inline-flex text-[13px] font-medium text-[var(--gray-500)] transition hover:text-[var(--gray-900)]"
      >
        ← Espacios
      </Link>

      <section className="overflow-hidden rounded-[18px] border border-[var(--color-border-default)] bg-white shadow-[0_18px_40px_-28px_rgba(14,79,144,0.35)]">
        <div
          className="relative h-[72px] overflow-hidden bg-gradient-to-r from-[var(--growth-os-primary)] to-[var(--growth-os-secondary)] sm:h-20"
          aria-hidden
        >
          {space.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={space.coverUrl}
              alt=""
              className="h-full w-full object-cover opacity-55"
            />
          ) : (
            <>
              <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/15 blur-xl" />
              <div className="absolute bottom-0 left-8 h-16 w-16 rounded-full bg-white/10 blur-lg" />
            </>
          )}
        </div>

        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-6">
          <div className="flex min-w-0 items-start gap-3.5">
            <SpaceMark space={space} />
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <h1 className="text-[1.55rem] font-bold tracking-[-0.03em] text-[var(--gray-900)] sm:text-[1.75rem]">
                  {space.name}
                </h1>
                <span className="text-[var(--gray-400)]" aria-hidden>
                  ·
                </span>
                <span className="text-[13px] font-medium text-[var(--gray-700)]">
                  {space.typeLabel}
                </span>
                <span className="text-[var(--gray-400)]" aria-hidden>
                  ·
                </span>
                <StatusBadge
                  tone={tenantStatusTone(space.status)}
                  label={space.statusLabel}
                />
              </div>
              {space.tagline ? (
                <p className="max-w-2xl text-[13px] leading-relaxed text-[var(--gray-500)] sm:text-[14px]">
                  {space.tagline}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-start gap-2 sm:pt-0.5">
            <PlatformEnterSpacePanel
              tenantId={space.tenantId}
              spaceName={space.name}
              hasAccess={operatorHasAccess}
              compact
            />
            <PlatformSpaceActionsMenu
              tenantId={space.tenantId}
              spaceName={space.name}
              status={space.status}
            />
          </div>
        </div>

        <div className="grid gap-4 border-t border-[var(--color-border-default)] px-5 py-4 sm:grid-cols-3 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--gray-100)] text-[var(--growth-os-primary)]">
              <Building2 className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] text-[var(--gray-500)]">Sitio</p>
              <p className="text-[13px] font-semibold text-[var(--gray-900)]">
                {space.site?.name ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--gray-100)] text-[var(--growth-os-primary)]">
              <Globe2 className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] text-[var(--gray-500)]">
                {space.domains.find((domain) => domain.isPrimary)?.kind ===
                "custom"
                  ? "Dominio propio"
                  : "Subdominio"}
              </p>
              <p
                className="break-all text-[13px] font-semibold text-[var(--gray-900)]"
                title={primaryDomain ?? undefined}
              >
                {primaryDomain ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--gray-100)] text-[var(--growth-os-primary)]">
              <Users className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] text-[var(--gray-500)]">Miembros</p>
              <p className="text-[13px] font-semibold tabular-nums text-[var(--gray-900)]">
                {space.memberCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!operatorHasAccess ? (
        <PlatformEnterSpacePanel
          tenantId={space.tenantId}
          spaceName={space.name}
          hasAccess={operatorHasAccess}
        />
      ) : null}

      <PlatformDeleteSpacePanel
        tenantId={space.tenantId}
        spaceName={space.name}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Sitio y dominios">
          <dl className="space-y-2.5">
            <MetaRow
              label="Sitio"
              value={
                space.site
                  ? `${space.site.name} · ${space.site.statusLabel}`
                  : null
              }
            />
            <MetaRow label="Tipo" value={space.typeLabel} />
          </dl>
          <div className="mt-3.5 border-t border-[var(--color-border-default)] pt-3.5">
            {space.domains.length === 0 ? (
              <p className="text-[13px] text-[var(--gray-500)]">
                Sin dominios registrados.
              </p>
            ) : (
              <ul className="space-y-2">
                {space.domains.map((domain) => (
                  <li
                    key={domain.host}
                    className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--gray-900)]"
                  >
                    <Link2
                      className="h-3.5 w-3.5 text-[var(--gray-500)]"
                      aria-hidden
                    />
                    <span>{domain.host}</span>
                    {domain.isPrimary ? (
                      <span className="rounded-full bg-[var(--gray-100)] px-2 py-0.5 text-[11px] font-medium text-[var(--growth-os-primary)]">
                        principal
                      </span>
                    ) : null}
                    <span className="rounded-full bg-[var(--gray-100)] px-2 py-0.5 text-[11px] font-medium text-[var(--gray-500)]">
                      {labelDomainKind(domain.kind)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        <Section title="Personas con acceso">
          {space.principalMembers.length === 0 ? (
            <p className="text-[13px] text-[var(--gray-500)]">
              Sin personas principales.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border-default)]">
              {space.principalMembers.map((member) => (
                <li
                  key={`${member.userId}-${member.roleCode ?? "role"}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-[13px] font-medium text-[var(--gray-900)]">
                      {member.displayName}
                    </p>
                    <p className="text-[12px] text-[var(--gray-500)]">
                      {member.email}
                    </p>
                  </div>
                  <p className="text-[12px] text-[var(--gray-500)]">
                    {member.roleLabel}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[12px] text-[var(--gray-500)]">
            Total de miembros: {space.memberCount}
          </p>
          {space.owner ? (
            <p className="mt-1.5 text-[12px] text-[var(--gray-500)]">
              Dueño del Espacio: {space.owner.displayName}
            </p>
          ) : (
            <p className="mt-1.5 text-[12px] text-[var(--gray-500)]">
              Sin Dueño del Espacio asignado.
            </p>
          )}
        </Section>
      </div>

      {(space.identity || space.tenantId) && (
        <details className="rounded-[16px] border border-[var(--color-border-default)] bg-white px-5 py-3.5 shadow-[0_8px_20px_-18px_rgba(14,79,144,0.25)]">
          <summary className="cursor-pointer text-[13px] font-medium text-[var(--gray-500)] transition hover:text-[var(--gray-900)]">
            Detalles adicionales
          </summary>
          <dl className="mt-3.5 space-y-2.5 border-t border-[var(--color-border-default)] pt-3.5">
            {space.identity ? (
              <>
                <MetaRow label="Nombre" value={space.identity.name} />
                <MetaRow label="Nombre corto" value={space.identity.shortName} />
                <MetaRow
                  label="Organización"
                  value={space.identity.organization}
                />
                <MetaRow label="Sitio web" value={space.identity.website} />
                <MetaRow label="Estado portal" value={space.identity.status} />
              </>
            ) : (
              <p className="text-[13px] text-[var(--gray-500)]">
                Sin identidad adicional en la configuración del Sitio.
              </p>
            )}
            <MetaRow
              label="Referencia interna"
              value={
                <code className="rounded bg-[var(--color-background-default)] px-1.5 py-0.5 text-[11px] text-[var(--gray-500)]">
                  {space.tenantId}
                </code>
              }
            />
          </dl>
        </details>
      )}
    </div>
  );
}
