"use client";

import Link from "next/link";
import { AuditTimeline, type AuditTimelineEntry } from "@/components/admin/AuditTimeline";
import { AdminQuickActions } from "@/components/admin/AdminModuleLayout";
import { formatRelativeTime } from "@/lib/admin/audit-labels";
import { Badge } from "@/components/ui";

interface AdminDashboardClientProps {
  portalStatus: string;
  institutionName: string;
  displayName: string;
  roleLabel: string;
  lastLoginAt?: string;
  newsCount: number;
  programsCount: number;
  invitationsPending: number;
  recentActivityCount: number;
  memberCount: number;
  auditPreview: AuditTimelineEntry[];
}

export function AdminDashboardClient({
  portalStatus,
  institutionName,
  displayName,
  roleLabel,
  lastLoginAt,
  newsCount,
  programsCount,
  invitationsPending,
  recentActivityCount,
  memberCount,
  auditPreview,
}: AdminDashboardClientProps) {
  const portalActive = portalStatus === "active" || portalStatus === "published";

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-background p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Bienvenido de vuelta</p>
            <h2 className="mt-1 text-2xl font-semibold text-foreground">{displayName}</h2>
            <p className="text-muted">
              {roleLabel} · {institutionName}
            </p>
            {lastLoginAt ? (
              <p className="mt-2 text-xs text-muted">
                Último acceso: {formatRelativeTime(lastLoginAt)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={portalActive ? "success" : "warning"}>
              Portal {portalActive ? "activo" : "en revisión"}
            </Badge>
            <Badge variant="info">CMS operativo</Badge>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Noticias" value={String(newsCount)} href="/admin/content/news" />
        <StatCard label="Programas" value={String(programsCount)} href="/admin/content/programs" />
        <StatCard
          label="Invitaciones pendientes"
          value={String(invitationsPending)}
          href="/admin/settings/users"
        />
        <StatCard label="Usuarios CMS" value={String(memberCount)} href="/admin/settings/users" />
      </section>

      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted">
          Acciones rápidas
        </h3>
        <AdminQuickActions
          items={[
            {
              href: "/admin/portal/admission",
              label: "Centro de admisión",
              description: "Hero, fechas y postulación",
            },
            {
              href: "/admin/content/programs",
              label: "Programas y cursos",
              description: "Oferta académica",
            },
            { href: "/admin/content/news", label: "Publicar noticia", description: "Comunicado institucional" },
            {
              href: "/admin/portal/forms",
              label: "Centro de formularios",
              description: "Convocatorias y asistencia",
            },
            { href: "/admin/media", label: "Subir medios", description: "Biblioteca visual" },
            { href: "/admin/config", label: "Institución", description: "Datos y configuración" },
            { href: "/admin/pages", label: "Páginas del portal", description: "Estructura del sitio" },
            { href: "/admin/settings/users", label: "Usuarios CMS", description: "Accesos y roles" },
          ]}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-background p-5">
          <h3 className="font-semibold">Estado del portal</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-muted">Sitio institucional</span>
              <span className="font-medium">{portalActive ? "Publicado" : "Borrador"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Programas registrados</span>
              <span className="font-medium">{programsCount}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Noticias en CMS</span>
              <span className="font-medium">{newsCount}</span>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Actividad reciente</h3>
            <Link href="/admin/settings/activity" className="text-sm text-primary underline">
              Ver todo ({recentActivityCount})
            </Link>
          </div>
          <div className="mt-4">
            <AuditTimeline entries={auditPreview} />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-background p-5 transition hover:border-primary/30 hover:shadow-sm"
    >
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </Link>
  );
}
