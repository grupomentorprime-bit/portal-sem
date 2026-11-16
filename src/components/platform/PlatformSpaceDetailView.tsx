import Link from "next/link";
import { Box, ChevronLeft, ChevronRight, Inbox, Link2, Users } from "lucide-react";
import { PLATFORM_ADMIN_HOME } from "@/core/identity/platform/codes";
import { StatusBadge, type StatusBadgeTone } from "@/components/admin/kit";
import { GrowthOsWelcomeBand } from "@/components/product/GrowthOsWelcomeBand";
import { PlatformEnterSpacePanel } from "@/components/platform/PlatformEnterSpacePanel";
import { PlatformSpaceDomainPanel } from "@/components/platform/PlatformSpaceDomainPanel";
import { customDomainCnameTarget } from "@/core/tenant/custom-domain-records";
import { PlatformSpaceActionsMenu } from "@/components/platform/PlatformSpaceActionsMenu";
import { SpaceAppsPanel } from "@/components/platform/SpaceAppsPanel";
import { SpaceTypeFallbackMark } from "@/components/platform/SpaceTypeFallbackMark";
import type { PlatformSpaceDetail, PlatformSpaceMember } from "@/lib/platform/spaces";
import { cn } from "@/lib/utils";

function Section({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white shadow-[0_10px_28px_-24px_rgba(14,79,144,0.45)]">
      <div className="border-b border-[var(--color-border-default)] px-4 py-3.5 sm:px-5">
        <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[var(--gray-900)]">
          {title}
        </h2>
        {detail ? (
          <p className="text-[12px] text-[var(--gray-500)]">{detail}</p>
        ) : null}
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
  card,
  iconBg,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  card: string;
  iconBg: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-3.5 py-3 shadow-[0_8px_20px_-18px_rgba(14,79,144,0.45)]",
        card
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80",
          iconBg
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2.1} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[1.35rem] font-semibold tabular-nums leading-none tracking-[-0.04em] text-[var(--gray-900)]">
          {value}
        </span>
        <span className="mt-1 block truncate text-[12px] text-[var(--gray-500)]">
          {label}
        </span>
      </span>
    </div>
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
    <div className="flex flex-col gap-4">
      <Link
        href={`${PLATFORM_ADMIN_HOME}#espacios`}
        className="inline-flex items-center gap-0.5 text-[13px] text-[var(--gray-500)] transition hover:text-[var(--gray-900)]"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        Espacios
      </Link>

      <GrowthOsWelcomeBand
        eyebrow={space.typeLabel}
        title={
          <span className="inline-flex items-center gap-3">
            <SpaceMark space={space} />
            <span className="truncate">{space.name}</span>
          </span>
        }
        subtitle={
          space.tagline?.trim() ||
          `${space.site?.name ?? "Sin sitio"} · ${memberLabel}`
        }
        aside={
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <StatusBadge
              tone={tenantStatusTone(space.status)}
              label={space.statusLabel}
            />
            <div className="flex items-center gap-2">
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
        }
      />

      <section aria-label="Resumen del cliente">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Personas con acceso"
            value={space.memberCount}
            icon={Users}
            card="border-[color-mix(in_srgb,var(--growth-os-primary)_16%,white)] bg-[color-mix(in_srgb,var(--growth-os-primary)_7%,white)]"
            iconBg="bg-[color-mix(in_srgb,var(--growth-os-primary)_14%,white)] text-[var(--growth-os-primary)]"
          />
          <MetricTile
            label="Dominios"
            value={space.domains.length}
            icon={Link2}
            card="border-[color-mix(in_srgb,var(--growth-os-light)_22%,white)] bg-[color-mix(in_srgb,var(--growth-os-light)_10%,white)]"
            iconBg="bg-[color-mix(in_srgb,var(--growth-os-light)_18%,white)] text-[var(--growth-os-light)]"
          />
          <MetricTile
            label="Aplicaciones"
            value={space.contractedApps.length}
            icon={Box}
            card="border-[color-mix(in_srgb,var(--growth-os-success)_18%,white)] bg-[color-mix(in_srgb,var(--growth-os-success)_8%,white)]"
            iconBg="bg-[color-mix(in_srgb,var(--growth-os-success)_16%,white)] text-[var(--growth-os-success)]"
          />
          <MetricTile
            label={space.openAppRequests.length === 1 ? "Solicitud abierta" : "Solicitudes abiertas"}
            value={space.openAppRequests.length}
            icon={Inbox}
            card="border-[color-mix(in_srgb,var(--growth-os-accent)_16%,white)] bg-[color-mix(in_srgb,var(--growth-os-accent)_7%,white)]"
            iconBg="bg-[color-mix(in_srgb,var(--growth-os-accent)_14%,white)] text-[var(--growth-os-accent)]"
          />
        </div>
      </section>

      {!operatorHasAccess ? (
        <PlatformEnterSpacePanel
          tenantId={space.tenantId}
          spaceName={space.name}
          hasAccess={operatorHasAccess}
        />
      ) : null}

      <Section
        title="Aplicaciones"
        detail={
          space.contractedApps.length === 1
            ? "1 en el plan"
            : `${space.contractedApps.length} en el plan`
        }
      >
        <SpaceAppsPanel
          tenantId={space.tenantId}
          contractedApps={space.contractedApps}
          aprendeHoyEntryUrl={space.aprendeHoyEntryUrl}
          openAppRequests={space.openAppRequests}
        />
      </Section>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.72fr)]">
        <Section
          title="Dominios"
          detail={
            space.domains.length === 1
              ? "1 dirección"
              : `${space.domains.length} direcciones`
          }
        >
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

        <Section title="Personas" detail={memberLabel}>
          <PeoplePanel
            members={space.principalMembers}
            memberCount={space.memberCount}
            ownerName={space.owner?.displayName ?? null}
          />
        </Section>
      </div>

      {(space.identity || space.tenantId) && (
        <details className="group overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-white px-4 py-3.5 shadow-[0_10px_28px_-24px_rgba(14,79,144,0.45)] sm:px-5">
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
