import Link from "next/link";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { can } from "@/core/identity/policies/engine";
import { readMyWork, type CommercialQueueRow } from "@/lib/growth/commercial-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function Section({
  id,
  title,
  rows,
}: {
  id: string;
  title: string;
  rows: CommercialQueueRow[];
}) {
  if (rows.length === 0) return null;
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-2 text-sm font-semibold text-foreground">{title}</h2>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={row.href}
              className="block rounded-[var(--radius-md)] border border-[var(--admin-border-subtle)] bg-white px-4 py-3"
            >
              <p className="font-medium text-foreground">{row.personaLabel}</p>
              <p className="mt-1 text-sm text-muted">
                {row.funnelName} · {row.stageLabel} · {row.bandLabel}
                {row.dueAt ? ` · vence ${row.dueAt.slice(0, 10)}` : ""}
              </p>
              {row.relationLabel ? (
                <p className="mt-1 text-xs font-medium text-foreground">{row.relationLabel}</p>
              ) : null}
              <p className="mt-1 text-sm text-foreground">{row.nextActionSummary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function AdminMyWorkPage() {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/login?next=/admin/ventas/mi-trabajo");
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
  if (
    !can(authCtx, "growth.sales.view") &&
    !can(authCtx, "growth.sales.read") &&
    !can(authCtx, "growth.sales.operate")
  ) {
    redirect("/admin");
  }
  const work = await readMyWork(tenantId, session.user._id);

  return (
    <AdminModulePage
      title="Mi trabajo"
      description="Oportunidades abiertas donde eres responsable o tienes la próxima acción. Cada una abre su ficha de Ventas."
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Ventas", href: "/admin/ventas" },
        { label: "Mi trabajo" },
      ]}
    >
      {work.empty ? (
        <p className="text-sm text-muted">Nada asignado</p>
      ) : (
        <div className="flex flex-col gap-6">
          <Section id="overdue" title="Vencidas" rows={work.overdue} />
          <Section id="unfollowed" title="Sin seguimiento" rows={work.unfollowed} />
          <Section id="stale" title="Estancadas" rows={work.stale} />
          <Section id="current" title="Al día" rows={work.current} />
        </div>
      )}
    </AdminModulePage>
  );
}
