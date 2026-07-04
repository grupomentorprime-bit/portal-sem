"use client";

import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  ExternalLink,
  FileText,
  Globe,
  Image,
  Newspaper,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import {
  AlertBanner,
  ContentGrid,
  KpiCard,
  QuickActions,
  Section,
  StatusBadge,
  Timeline,
  type QuickActionItem,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { formatAuditMessage, formatRelativeTime } from "@/lib/admin/audit-labels";
import type { AuditTimelineEntry } from "@/components/admin/AuditTimeline";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  compatMode?: boolean;
}

const DASHBOARD_STACK = "flex flex-col gap-6 md:gap-8";

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
  compatMode = false,
}: AdminDashboardClientProps) {
  const portalActive = portalStatus === "active" || portalStatus === "published";
  const cmsSecure = !compatMode;
  const firstName = displayName.split(" ")[0];

  const timelineItems = auditPreview.map((entry) => ({
    id: entry.id,
    time: formatRelativeTime(entry.createdAt),
    title: formatAuditMessage(entry, entry.actorName),
  }));

  const primaryQuickActions: QuickActionItem[] = [
    {
      id: "admission",
      title: "Centro de admisión",
      description: "Hero, fechas y postulación",
      href: "/admin/portal/admission",
      icon: <Globe className="h-4 w-4" />,
      priority: "primary",
    },
    {
      id: "programs",
      title: "Programas y cursos",
      description: "Oferta académica",
      href: "/admin/content/programs",
      icon: <BookOpen className="h-4 w-4" />,
      priority: "primary",
    },
    {
      id: "student-affairs",
      title: "Operación de formularios",
      description: "Respuestas, asistencia, check-in y seguimiento",
      href: "/admin/portal/asuntos-estudiantiles",
      icon: <Users className="h-4 w-4" />,
      priority: "primary",
    },
  ];

  const secondaryQuickActions: QuickActionItem[] = [
    {
      id: "forms",
      title: "Gestión de formularios",
      description: "Crea, configura y publica formularios institucionales",
      href: "/admin/portal/forms",
      icon: <ClipboardList className="h-4 w-4" />,
      priority: "secondary",
    },
    {
      id: "media",
      title: "Biblioteca",
      description: "Imágenes y documentos",
      href: "/admin/media",
      icon: <Image className="h-4 w-4" aria-hidden="true" />,
      priority: "secondary",
    },
    {
      id: "news",
      title: "Publicar noticia",
      description: "Comunicado institucional",
      href: "/admin/content/news",
      icon: <Newspaper className="h-4 w-4" />,
      priority: "secondary",
    },
  ];

  const otherQuickActions: QuickActionItem[] = [
    {
      id: "pages",
      title: "Páginas del portal",
      description: "Estructura del sitio",
      href: "/admin/pages",
      icon: <FileText className="h-4 w-4" />,
      priority: "default",
    },
    {
      id: "users",
      title: "Usuarios CMS",
      description: "Accesos y roles",
      href: "/admin/settings/users",
      icon: <Shield className="h-4 w-4" />,
      priority: "default",
    },
    {
      id: "config",
      title: "Institución",
      description: "Datos y configuración",
      href: "/admin/config",
      icon: <Settings className="h-4 w-4" />,
      priority: "default",
    },
  ];

  const hasAlerts = invitationsPending > 0 || !portalActive;

  return (
    <AdminModulePage
      breadcrumbs={[{ label: "Inicio" }]}
      title="Inicio"
      description={`Panel operativo · ${institutionName}`}
      actions={
        <Button variant="outline" size="sm" href="/">
          <ExternalLink className="mr-2 h-4 w-4" />
          Ver portal público
        </Button>
      }
    >
      <div className={DASHBOARD_STACK}>
        {/* 1. Estado general */}
        <DashboardWelcomeHero
          firstName={firstName}
          roleLabel={roleLabel}
          institutionName={institutionName}
          lastLoginAt={lastLoginAt}
          portalActive={portalActive}
          cmsSecure={cmsSecure}
        />

        {/* 2. Alertas */}
        {hasAlerts ? (
          <div className="flex flex-col gap-2">
            {invitationsPending > 0 ? (
              <AlertBanner variant="warning" title="Acción requerida" compact>
                Hay {invitationsPending} invitación{invitationsPending === 1 ? "" : "es"} pendiente
                {invitationsPending === 1 ? "" : "s"}.{" "}
                <Link href="/admin/settings/users" className="font-semibold underline">
                  Revisar invitaciones
                </Link>
              </AlertBanner>
            ) : null}
            {!portalActive ? (
              <AlertBanner variant="info" title="Portal en revisión" compact>
                El sitio no está publicado.{" "}
                <Link href="/admin/config" className="font-semibold underline">
                  Revisar configuración
                </Link>
              </AlertBanner>
            ) : null}
          </div>
        ) : null}

        {/* 3. Indicadores */}
        <ContentGrid cols={4}>
          <KpiCard
            label="Noticias"
            value={newsCount}
            accent="info"
            variant="info"
            delta="Contenido editorial"
            icon={<Newspaper className="h-3.5 w-3.5" />}
          />
          <KpiCard
            label="Programas"
            value={programsCount}
            accent="primary"
            delta="Oferta académica"
            icon={<BookOpen className="h-3.5 w-3.5" />}
          />
          <KpiCard
            label="Usuarios CMS"
            value={memberCount}
            accent="neutral"
            delta="Accesos activos"
            icon={<Users className="h-3.5 w-3.5" />}
          />
          <KpiCard
            label="Invitaciones pendientes"
            value={invitationsPending}
            accent={invitationsPending > 0 ? "warning" : "neutral"}
            variant={invitationsPending > 0 ? "warning" : "neutral"}
            delta={invitationsPending > 0 ? "Requieren acción" : "Al día"}
            icon={<Shield className="h-3.5 w-3.5" />}
          />
        </ContentGrid>

        {/* 4. Accesos rápidos */}
        <Section title="Accesos rápidos" description="Priorizados por frecuencia de uso institucional.">
          <div className="space-y-4">
            <QuickActions items={primaryQuickActions} cols={3} defaultPriority="primary" />
            <QuickActions items={secondaryQuickActions} cols={3} defaultPriority="secondary" />
            <QuickActions
              items={otherQuickActions}
              cols={3}
              defaultPriority="default"
              scrollOnMobile
            />
          </div>
        </Section>

        {/* 5. Actividad reciente */}
        <Section
          title="Actividad reciente"
          description="Últimos movimientos del equipo en el CMS."
          actions={
            <Link
              href="/admin/settings/activity"
              className="text-xs font-medium text-primary hover:underline sm:text-sm"
            >
              Ver todo ({recentActivityCount})
            </Link>
          }
        >
          {auditPreview.length > 0 ? (
            <Timeline items={timelineItems.slice(0, 6)} />
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
              Aún no hay actividad registrada.
            </p>
          )}
        </Section>

        {/* 6. Estado del sistema */}
        <DashboardSystemPanel
          portalActive={portalActive}
          cmsSecure={cmsSecure}
          newsCount={newsCount}
          programsCount={programsCount}
          memberCount={memberCount}
        />
      </div>
    </AdminModulePage>
  );
}

function DashboardWelcomeHero({
  firstName,
  roleLabel,
  institutionName,
  lastLoginAt,
  portalActive,
  cmsSecure,
}: {
  firstName: string;
  roleLabel: string;
  institutionName: string;
  lastLoginAt?: string;
  portalActive: boolean;
  cmsSecure: boolean;
}) {
  return (
    <div className="rounded-xl border border-border border-l-4 border-l-primary bg-background px-4 py-4 shadow-[var(--admin-shadow-card)] sm:px-5 sm:py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            Centro de Administración SEM
          </p>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Bienvenido, {firstName}
          </h2>
          <p className="text-sm font-medium text-foreground/90">
            {roleLabel} · {institutionName}
          </p>
          {lastLoginAt ? (
            <p className="text-xs text-muted">
              Último acceso {formatRelativeTime(lastLoginAt)}
            </p>
          ) : null}
          <p className="hidden pt-0.5 text-xs leading-snug text-muted sm:block">
            Resumen operativo del portal institucional.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 lg:max-w-[18rem] lg:justify-end">
          <StatusBadge
            tone={portalActive ? "active" : "pending"}
            label={portalActive ? "Portal activo" : "Portal en revisión"}
          />
          <StatusBadge
            tone={cmsSecure ? "active" : "pending"}
            label={cmsSecure ? "CMS seguro" : "CMS compat."}
          />
          <StatusBadge tone="active" label="Accesos activos" />
        </div>
      </div>
    </div>
  );
}

function DashboardSystemPanel({
  portalActive,
  cmsSecure,
  newsCount,
  programsCount,
  memberCount,
}: {
  portalActive: boolean;
  cmsSecure: boolean;
  newsCount: number;
  programsCount: number;
  memberCount: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-[var(--admin-shadow-card)] sm:p-5">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted">
        Estado del sistema
      </h3>

      <ul className="mt-3 space-y-2">
        <SystemStatusDot
          label="Portal"
          ok={portalActive}
          okLabel="Activo"
          warnLabel="En revisión"
        />
        <SystemStatusDot
          label="CMS"
          ok={cmsSecure}
          okLabel="Seguro"
          warnLabel="Modo compat."
        />
        <SystemStatusDot label="Accesos" ok okLabel="Activo" warnLabel="Inactivo" />
      </ul>

      <div className="my-4 h-px bg-border" aria-hidden />

      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted">Actividad</h4>
      <ul className="mt-3 space-y-2">
        <ActivityMetric label="Noticias" value={newsCount} />
        <ActivityMetric label="Programas" value={programsCount} />
        <ActivityMetric label="Usuarios CMS" value={memberCount} />
      </ul>
    </div>
  );
}

function SystemStatusDot({
  label,
  ok,
  okLabel,
  warnLabel,
}: {
  label: string;
  ok: boolean;
  okLabel: string;
  warnLabel: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            ok ? "bg-[var(--color-success)]" : "bg-[var(--color-warning)]"
          )}
          aria-hidden
        />
        {ok ? okLabel : warnLabel}
      </span>
    </li>
  );
}

function ActivityMetric({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </li>
  );
}
