import Link from "next/link";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { can } from "@/core/identity/policies/engine";
import { readCommercialPanel } from "@/lib/growth/commercial-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const LINKS = [
  { key: "overdue", label: "Vencidas", param: "overdue" },
  { key: "unfollowed", label: "Sin seguimiento", param: "unfollowed" },
  { key: "stale", label: "Estancadas", param: "stale" },
] as const;

export default async function AdminCommercialPanelPage() {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/login?next=/admin/conversion");
  }
  const { resolvePermissionsForMembership } = await import("@/lib/identity/permission-resolver");
  const { readPlatformRoles } = await import("@/core/identity/platform/capability");
  const permissions = await resolvePermissionsForMembership(tenantId, session.membership);
  const authCtx = {
    user: session.user,
    session: session.session,
    membership: session.membership,
    permissions,
    tenantId,
    platformRoles: readPlatformRoles(session.user),
    compatMode: false,
  };
  const canView = can(authCtx, "growth.sales.view") || can(authCtx, "growth.sales.read");
  const canOperate = can(authCtx, "growth.sales.operate");
  if (!canView && !canOperate) redirect("/admin");

  const panel = await readCommercialPanel(tenantId, session.user._id, canView);
  const hrefFor = (param: string) =>
    panel.scope === "space"
      ? `/admin/ventas?banda=${param}`
      : `/admin/ventas/mi-trabajo#${param}`;

  const counts = [
    ...LINKS.map((item) => ({
      ...item,
      count: panel[item.key],
      href: hrefFor(item.param),
    })),
    ...(panel.scope === "space"
      ? [
          {
            key: "unassigned" as const,
            label: "Sin responsable",
            count: panel.unassigned,
            href: "/admin/ventas?banda=unassigned",
          },
        ]
      : []),
  ];

  return (
    <AdminModulePage
      title="Panel comercial"
      description={
        panel.scope === "space"
          ? "Oportunidades abiertas de este Espacio que necesitan atención."
          : "Oportunidades abiertas bajo tu responsabilidad o tu próxima acción."
      }
      breadcrumbs={[{ label: "Inicio", href: "/admin" }, { label: "Panel comercial" }]}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {counts.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="rounded-[var(--radius-lg)] border border-[var(--admin-border-subtle)] bg-white px-4 py-4 shadow-[var(--admin-shadow-card)]"
          >
            <p className="text-sm text-muted">{item.label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{item.count}</p>
          </Link>
        ))}
      </div>
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Prioritarias</h2>
        {panel.rows.length === 0 ? (
          <p className="text-sm text-muted">No hay oportunidades en las bandas de atención.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {panel.rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={row.href}
                  className="block rounded-[var(--radius-md)] border border-[var(--admin-border-subtle)] bg-white px-4 py-3"
                >
                  <p className="font-medium text-foreground">{row.personaLabel}</p>
                  <p className="mt-1 text-sm text-muted">
                    {row.funnelName} · {row.stageLabel} · {row.bandLabel}
                  </p>
                  <p className="mt-1 text-sm text-foreground">{row.nextActionSummary}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminModulePage>
  );
}
