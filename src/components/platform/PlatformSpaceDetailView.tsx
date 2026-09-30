import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PLATFORM_ADMIN_HOME } from "@/core/identity/platform/codes";
import { StatusBadge, type StatusBadgeTone } from "@/components/admin/kit";
import { PlatformEnterSpacePanel } from "@/components/platform/PlatformEnterSpacePanel";
import { PlatformSpaceDomainPanel } from "@/components/platform/PlatformSpaceDomainPanel";
import { customDomainCnameTarget } from "@/core/tenant/custom-domain-records";
import { PlatformSpaceActionsMenu } from "@/components/platform/PlatformSpaceActionsMenu";
import { SpaceTypeFallbackMark } from "@/components/platform/SpaceTypeFallbackMark";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { PlatformSpaceDetail, PlatformSpaceMember } from "@/lib/platform/spaces";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[10px] border-[var(--color-border-default)] bg-white p-0 shadow-none">
      <CardHeader className="mb-0 border-b border-[var(--color-border-default)] px-4 py-2.5">
        <CardTitle className="text-[13px] font-semibold text-[var(--gray-800)]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3">{children}</CardContent>
    </Card>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "·";
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
        className="h-9 w-9 rounded-[10px] object-contain bg-[var(--color-background-default)] p-1"
      />
    );
  }
  return (
    <SpaceTypeFallbackMark
      type={space.type}
      typeLabel={space.typeLabel}
      size="row"
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
  const memberLabel =
    space.memberCount === 1 ? "1 miembro" : `${space.memberCount} miembros`;
  const subdomainHosts = space.domains
    .filter((domain) => domain.kind === "platform_subdomain")
    .map((domain) => ({ host: domain.host, isPrimary: domain.isPrimary }));
  const custom =
    space.domains.find((domain) => domain.kind === "custom" && domain.isPrimary) ??
    space.domains.find((domain) => domain.kind === "custom") ??
    null;

  return (
    <div className="space-y-3">
      <Link
        href={`${PLATFORM_ADMIN_HOME}#espacios`}
        className="inline-flex items-center gap-0.5 text-[13px] text-[var(--gray-500)] transition hover:text-[var(--gray-900)]"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        Espacios
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <SpaceMark space={space} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[18px] font-semibold tracking-[-0.02em] text-[var(--gray-900)]">
                {space.name}
              </h1>
              <StatusBadge
                tone={tenantStatusTone(space.status)}
                label={space.statusLabel}
              />
            </div>
            <p className="mt-0.5 truncate text-[13px] text-[var(--gray-500)]">
              {space.typeLabel}
              <span className="mx-1.5 text-[var(--gray-300)]" aria-hidden>
                ·
              </span>
              {space.site?.name ?? "Sin Sitio"}
              <span className="mx-1.5 text-[var(--gray-300)]" aria-hidden>
                ·
              </span>
              {memberLabel}
            </p>
            {space.tagline ? (
              <p className="mt-0.5 truncate text-[13px] text-[var(--gray-500)]">
                {space.tagline}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
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
      </header>

      {!operatorHasAccess ? (
        <PlatformEnterSpacePanel
          tenantId={space.tenantId}
          spaceName={space.name}
          hasAccess={operatorHasAccess}
        />
      ) : null}

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.72fr)]">
        <Section title="Dominios">
          <PlatformSpaceDomainPanel
            tenantId={space.tenantId}
            subdomain={subdomainHosts[0]?.host ?? null}
            subdomainHosts={subdomainHosts}
            customDomain={custom?.host ?? null}
            customIsPrimary={Boolean(custom?.isPrimary)}
            cnameTarget={customDomainCnameTarget()}
            layout="both"
          />
        </Section>

        <Section title="Personas con acceso">
          <PeoplePanel
            members={space.principalMembers}
            memberCount={space.memberCount}
            ownerName={space.owner?.displayName ?? null}
          />
        </Section>
      </div>

      {(space.identity || space.tenantId) && (
        <details className="group rounded-[10px] border border-[var(--color-border-default)] bg-white px-4 py-2.5">
          <summary className="cursor-pointer list-none text-[13px] text-[var(--gray-600)] transition hover:text-[var(--gray-900)] [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 text-[var(--gray-400)] transition group-open:rotate-90" />
              Más datos
            </span>
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

function PeoplePanel({
  members,
  memberCount,
  ownerName,
}: {
  members: PlatformSpaceMember[];
  memberCount: number;
  ownerName: string | null;
}) {
  return (
    <div className="space-y-3">
      <dl className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-[13px] text-[var(--gray-500)]">Miembros</dt>
          <dd className="text-[13px] font-medium tabular-nums text-[var(--gray-900)]">
            {memberCount}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-[13px] text-[var(--gray-500)]">Dueño del Espacio</dt>
          <dd className="text-right text-[13px] font-medium text-[var(--gray-900)]">
            {ownerName ?? "Sin asignar"}
          </dd>
        </div>
      </dl>

      {members.length === 0 ? (
        <p className="border-t border-[var(--color-border-default)] pt-3 text-[13px] text-[var(--gray-500)]">
          Todavía no hay un contacto principal.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border-default)] border-t border-[var(--color-border-default)] pt-3">
          {members.map((member) => (
            <li
              key={`${member.userId}-${member.roleCode ?? "role"}`}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--growth-os-primary)_10%,white)] text-[11px] font-semibold text-[var(--growth-os-primary)]">
                {initials(member.displayName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[var(--gray-900)]">
                  {member.displayName}
                </p>
                <p className="truncate text-[12px] text-[var(--gray-500)]">
                  {member.email}
                </p>
              </div>
              <p className="shrink-0 text-[12px] text-[var(--gray-500)]">
                {member.roleLabel}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
