import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  Handshake,
  Info,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquare,
  PauseCircle,
  PenLine,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserPlus,
  UserRound,
  UserX,
  Users,
} from "lucide-react";
import { EmptyState, aek } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import type { AnalyticsPeriodPreset } from "@/lib/growth/analytics-period";
import { formatRelativeTime } from "@/lib/admin/audit-labels";
import { cn } from "@/lib/utils";
import {
  homeActivityEventLabel,
  type HomeActivityTone,
} from "./humanize-home-activity";
import type { HomeMetricTrend } from "./home-metric-trends";
import { HomePeriodSelect } from "./HomePeriodSelect";
import { HomeConversionFunnel } from "./HomeConversionFunnel";
import { buildHomeFunnelFigure } from "./home-funnel-figure";
import type {
  GrowthOsHomeOwnerRow,
  GrowthOsHomeUnassignedOwner,
  GrowthOsHomeView,
} from "./project-home";

const cardClass = cn(
  aek.surface,
  "bg-white shadow-[var(--admin-shadow-card)]"
);

const REVIEW_CTA_LABEL = "Revisar";
const ACTIVITY_LINK = "/admin/actividad";

function formatCount(n: number): string {
  return new Intl.NumberFormat("es").format(n);
}

function formatSharePct(share: number | null): string {
  if (share == null || !Number.isFinite(share)) return "—";
  const pct = share * 100;
  if (Math.abs(pct - Math.round(pct)) < 0.05) return `${Math.round(pct)}%`;
  return `${pct.toFixed(1)}%`;
}

function formatCohortPct(rate: number | null): string {
  if (rate == null || !Number.isFinite(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function personaInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

function ownerInitial(name: string): string {
  return personaInitial(name);
}

const TONE_STYLE: Record<
  HomeActivityTone,
  { bg: string; fg: string; Icon: typeof Activity }
> = {
  form: {
    bg: "bg-[color-mix(in_srgb,var(--growth-os-primary)_12%,white)]",
    fg: "text-[var(--growth-os-primary)]",
    Icon: FileText,
  },
  diagnosis: {
    bg: "bg-[#EDE9FE]",
    fg: "text-[#7C3AED]",
    Icon: GraduationCap,
  },
  opportunity: {
    bg: "bg-[color-mix(in_srgb,var(--growth-os-accent)_12%,white)]",
    fg: "text-[var(--growth-os-accent)]",
    Icon: Handshake,
  },
  stage: {
    bg: "bg-[#DBEAFE]",
    fg: "text-[#3B82F6]",
    Icon: TrendingUp,
  },
  assignment: {
    bg: "bg-[#E0E7FF]",
    fg: "text-[#4F46E5]",
    Icon: UserPlus,
  },
  followup: {
    bg: "bg-[color-mix(in_srgb,var(--growth-os-success)_14%,white)]",
    fg: "text-[var(--growth-os-success)]",
    Icon: Sparkles,
  },
  contact: {
    bg: "bg-[#D1FAE5]",
    fg: "text-[#12B76A]",
    Icon: MessageCircle,
  },
  close: {
    bg: "bg-[#FEF3C7]",
    fg: "text-[#B54708]",
    Icon: Trophy,
  },
  transfer: {
    bg: "bg-[color-mix(in_srgb,var(--growth-os-light)_16%,white)]",
    fg: "text-[var(--growth-os-light)]",
    Icon: ArrowRight,
  },
  note: {
    bg: "bg-[var(--gray-100)]",
    fg: "text-[var(--gray-600)]",
    Icon: MessageSquare,
  },
  other: {
    bg: "bg-[var(--gray-100)]",
    fg: "text-[var(--gray-600)]",
    Icon: Activity,
  },
};

const REASON_DOT: Record<string, string> = {
  overdue: "bg-[#F04438]",
  unfollowed: "bg-[#F79009]",
  stale: "bg-[#98A2B3]",
};

const REASON_TEXT: Record<string, string> = {
  overdue: "text-[#F04438]",
  unfollowed: "text-[#DC6803]",
  stale: "text-[#667085]",
};

const AGE_TEXT: Record<string, string> = {
  overdue: "text-[#F04438]",
  unfollowed: "text-[#F04438]",
  stale: "text-[#667085]",
};

const PRIORITY_PILL: Record<string, { label: string; className: string }> = {
  overdue: {
    label: "Alta",
    className: "bg-[#FEE4E2] text-[#D92D20]",
  },
  unfollowed: {
    label: "Media",
    className: "bg-[#FEF0C7] text-[#DC6803]",
  },
  stale: {
    label: "Baja",
    className: "bg-[#F2F4F7] text-[#667085]",
  },
};

const AVATAR_TONES = [
  "bg-[#EDE9FE] text-[#7C3AED]",
  "bg-[#DBEAFE] text-[#3B82F6]",
  "bg-[#FCE7F3] text-[#DB2777]",
  "bg-[#E0E7FF] text-[#4F46E5]",
  "bg-[#FFEDD5] text-[#C2410C]",
];

const ORIGIN_VISUALS: Array<{
  match: RegExp;
  bg: string;
  fg: string;
  bar: string;
  Icon: typeof Users;
}> = [
  { match: /whatsapp/i, bg: "bg-[#D1FAE5]", fg: "text-[#12B76A]", bar: "bg-[#12B76A]", Icon: MessageCircle },
  { match: /campañ|campana|campan/i, bg: "bg-[#DBEAFE]", fg: "text-[#3B82F6]", bar: "bg-[#3B82F6]", Icon: Megaphone },
  { match: /referid/i, bg: "bg-[#FEF3C7]", fg: "text-[#F79009]", bar: "bg-[#F79009]", Icon: Users },
  { match: /evento/i, bg: "bg-[#CCFBF1]", fg: "text-[#0F766E]", bar: "bg-[#14B8A6]", Icon: CalendarDays },
  { match: /manual|registro/i, bg: "bg-[#FCE7F3]", fg: "text-[#DB2777]", bar: "bg-[#DB2777]", Icon: PenLine },
  { match: /admis/i, bg: "bg-[#E0E7FF]", fg: "text-[#4F46E5]", bar: "bg-[#4F46E5]", Icon: GraduationCap },
  { match: /form|diagn|web/i, bg: "bg-[#EDE9FE]", fg: "text-[#7C3AED]", bar: "bg-[#7C3AED]", Icon: FileText },
];

const ORIGIN_FALLBACK = [
  { bg: "bg-[#EDE9FE]", fg: "text-[#7C3AED]", bar: "bg-[#7C3AED]", Icon: FileText },
  { bg: "bg-[#D1FAE5]", fg: "text-[#12B76A]", bar: "bg-[#12B76A]", Icon: MessageCircle },
  { bg: "bg-[#DBEAFE]", fg: "text-[#3B82F6]", bar: "bg-[#3B82F6]", Icon: Megaphone },
  { bg: "bg-[#FEF3C7]", fg: "text-[#F79009]", bar: "bg-[#F79009]", Icon: Users },
];

function originVisual(label: string, index: number) {
  return (
    ORIGIN_VISUALS.find((item) => item.match.test(label)) ??
    ORIGIN_FALLBACK[index % ORIGIN_FALLBACK.length]!
  );
}

function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="inline-flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-[#101828]">
        {children}
      </h2>
      {action}
    </div>
  );
}

function TitleHint({ text }: { text: string }) {
  return (
    <span
      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#98A2B3]"
      title={text}
    >
      <Info className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      <span className="sr-only">{text}</span>
    </span>
  );
}

function trendPath(values: number[], width: number, height: number): { line: string; area: string } {
  const series = values.length >= 2 ? values : [0, 0];
  const max = Math.max(...series, 1);
  const step = width / (series.length - 1);
  const points = series.map((value, index) => ({
    x: index * step,
    y: height - 2 - (value / max) * (height - 6),
  }));
  let line = `M${points[0]!.x.toFixed(1)},${points[0]!.y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    line += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return {
    line,
    area: `${line} L${width.toFixed(1)},${height} L0,${height} Z`,
  };
}

function TrendSpark({ values, color, label }: { values: number[]; color: string; label: string }) {
  const width = 92;
  const height = 40;
  const { line, area } = trendPath(values, width, height);
  const gradId = `home-trend-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.38" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendDelta({ trend }: { trend?: HomeMetricTrend }) {
  const pct = trend?.deltaPct;
  if (pct == null || !Number.isFinite(pct)) {
    return <p className="text-[12px] font-medium text-[#98A2B3]">vs. período anterior</p>;
  }
  const rounded = Math.round(pct);
  const up = rounded > 0;
  const down = rounded < 0;
  const favorable = trend?.higherIsBetter ? up : down;
  const unfavorable = trend?.higherIsBetter ? down : up;
  const tone = favorable
    ? "text-[#12B76A]"
    : unfavorable
      ? "text-[#F04438]"
      : "text-[#667085]";
  const Icon = up ? ArrowUp : down ? ArrowDown : null;
  const sign = rounded > 0 ? "+" : "";
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] leading-none">
      <span className={cn("inline-flex items-center gap-0.5 font-semibold", tone)}>
        {Icon ? <Icon className="h-3 w-3" strokeWidth={2.6} aria-hidden /> : null}
        {sign}
        {rounded}%
      </span>
      <span className="font-medium text-[#98A2B3]">vs. período anterior</span>
    </p>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconFg,
  spark,
  trend,
  title,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  iconBg: string;
  iconFg: string;
  spark: string;
  trend?: HomeMetricTrend;
  title?: string;
}) {
  return (
    <div
      className="relative flex min-h-[132px] flex-col rounded-[18px] border border-[#EEF0F4] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_24px_rgba(16,24,40,0.04)]"
      title={title}
    >
      <div className="flex items-center gap-2.5 pr-[5.5rem]">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]",
            iconBg,
            iconFg
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} aria-hidden />
        </span>
        <p className="text-[13px] font-medium leading-tight text-[#667085]">{label}</p>
      </div>
      <p className="mt-3 text-[1.85rem] font-bold tabular-nums leading-none tracking-[-0.045em] text-[#101828]">
        {formatCount(value)}
      </p>
      <div className="mt-2.5 pr-[5.5rem]">
        <TrendDelta trend={trend} />
      </div>
      <div className="pointer-events-none absolute bottom-3.5 right-3">
        <TrendSpark values={trend?.series ?? []} color={spark} label={label} />
      </div>
    </div>
  );
}

const CHART_PLOT_H = 112;

function ownerShortName(label: string): string {
  return label.split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
}

function CommercialPerformanceBody({
  owners,
  unassigned,
  canAssign,
}: {
  owners: GrowthOsHomeOwnerRow[];
  unassigned: GrowthOsHomeUnassignedOwner | null;
  canAssign: boolean;
}) {
  const maxOwnerBar = Math.max(...owners.flatMap((o) => [o.open, o.won]), 1);
  const empty = owners.length === 0 && !unassigned;
  const barW =
    owners.length <= 1 ? "w-7" : owners.length === 2 ? "w-5" : "w-4";
  const colMin =
    owners.length <= 1 ? "min-w-[88px]" : owners.length === 2 ? "min-w-[72px]" : "min-w-[56px]";

  if (empty) {
    return (
      <EmptyState
        title="Sin responsables con actividad"
        description="Cuando haya oportunidades activas o ganadas atribuibles, verás la comparación aquí."
        icon={<BarChart3 className="h-8 w-8" strokeWidth={1.5} />}
        className="mt-4 border-dashed bg-[var(--gray-50)] py-8 shadow-none"
      />
    );
  }

  const unassignedBlock = unassigned ? (
    canAssign ? (
      <Link
        href="/admin/ventas?banda=unassigned"
        className="mt-4 flex items-center gap-3 rounded-[12px] border border-dashed border-[#FDB022]/65 bg-[#FFFAEB]/80 px-3 py-2.5 transition hover:border-[#FDB022] hover:bg-[#FFFAEB]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FEF0C7] text-[#B54708]">
          <UserX className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-[#93370D]">
            Pendiente de asignación
          </span>
          <span className="block text-[11px] text-[#B54708]/90">
            {unassigned.open === 1
              ? "1 oportunidad activa sin responsable"
              : `${unassigned.open} oportunidades activas sin responsable`}
          </span>
        </span>
        <span className="text-[16px] font-bold tabular-nums text-[#93370D]">
          {unassigned.open}
        </span>
      </Link>
    ) : (
      <div className="mt-4 flex items-center gap-3 rounded-[12px] border border-dashed border-[#FDB022]/65 bg-[#FFFAEB]/80 px-3 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FEF0C7] text-[#B54708]">
          <UserX className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-[#93370D]">
            Pendiente de asignación
          </span>
          <span className="block text-[11px] text-[#B54708]/90">
            {unassigned.open === 1
              ? "1 oportunidad activa sin responsable"
              : `${unassigned.open} oportunidades activas sin responsable`}
          </span>
        </span>
        <span className="text-[16px] font-bold tabular-nums text-[#93370D]">
          {unassigned.open}
        </span>
      </div>
    )
  ) : null;

  if (owners.length === 0) {
    return <div className="mt-4">{unassignedBlock}</div>;
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-[var(--gray-500)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--growth-os-primary)]" />
          Activas
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[color-mix(in_srgb,var(--growth-os-primary)_45%,white)]" />
          Ganadas
        </span>
      </div>

      <div
        className={cn(
          "mt-4 flex items-end justify-around gap-3 border-b border-[var(--admin-border-subtle)] pb-0",
          owners.length === 1 && "justify-center gap-8 px-6"
        )}
        style={{ height: CHART_PLOT_H }}
      >
        {owners.map((owner) => {
          const openH = Math.max(10, Math.round((owner.open / maxOwnerBar) * (CHART_PLOT_H - 20)));
          const wonH = Math.max(
            owner.won > 0 ? 10 : 4,
            Math.round((owner.won / maxOwnerBar) * (CHART_PLOT_H - 20))
          );
          return (
            <div
              key={owner.userId ?? owner.label}
              className={cn("flex flex-col items-center", colMin)}
              title={`${ownerShortName(owner.label)}: ${owner.open} activas, ${owner.won} ganadas`}
            >
              <div className="flex items-end gap-1.5" style={{ height: CHART_PLOT_H - 8 }}>
                <div
                  className={cn(barW, "rounded-t-[5px] bg-[var(--growth-os-primary)]")}
                  style={{ height: openH }}
                  aria-label={`Activas: ${owner.open}`}
                />
                <div
                  className={cn(
                    barW,
                    "rounded-t-[5px] bg-[color-mix(in_srgb,var(--growth-os-primary)_45%,white)]"
                  )}
                  style={{ height: wonH }}
                  aria-label={`Ganadas: ${owner.won}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "mt-3 flex justify-around gap-3",
          owners.length === 1 && "justify-center gap-8 px-6"
        )}
      >
        {owners.map((owner) => (
          <div
            key={`label-${owner.userId ?? owner.label}`}
            className={cn("flex flex-col items-center gap-1.5", colMin)}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--growth-os-primary)_12%,white)] text-[10px] font-bold text-[var(--growth-os-primary)]"
              aria-hidden
            >
              {ownerInitial(owner.label)}
            </span>
            <p
              className="max-w-[96px] truncate text-center text-[12px] font-medium text-[var(--gray-800)]"
              title={owner.label}
            >
              {ownerShortName(owner.label)}
            </p>
            <p className="text-[11px] tabular-nums text-[var(--gray-500)]">
              {owner.open}
              <span className="mx-0.5 text-[var(--gray-300)]">/</span>
              {owner.won}
            </p>
          </div>
        ))}
      </div>

      {unassignedBlock}
    </div>
  );
}

const NEXT_STEP_ICON: Record<
  string,
  { Icon: typeof AlertCircle; bg: string; fg: string }
> = {
  overdue: {
    Icon: AlertCircle,
    bg: "bg-[#FEE4E2]",
    fg: "text-[#D92D20]",
  },
  unfollowed: {
    Icon: Sparkles,
    bg: "bg-[#FEF0C7]",
    fg: "text-[#DC6803]",
  },
  stale: {
    Icon: PauseCircle,
    bg: "bg-[#F2F4F7]",
    fg: "text-[#667085]",
  },
  unassigned: {
    Icon: UserPlus,
    bg: "bg-[#FEF0C7]",
    fg: "text-[#B54708]",
  },
};

export function GrowthOsAdminHomeMaster({
  greeting,
  firstName,
  spaceName,
  home,
  periodPreset = "last_30d",
}: {
  greeting: string;
  firstName: string;
  spaceName: string;
  home: GrowthOsHomeView;
  periodPreset?: AnalyticsPeriodPreset;
}) {
  const maxOrigin = Math.max(...home.origins.map((item) => item.count), 1);
  const funnel = home.funnel;
  const funnelFigure = buildHomeFunnelFigure(funnel);
  const canSales =
    home.capabilities.salesView ||
    home.capabilities.salesRead ||
    home.capabilities.salesOperate;
  const canAssignUnassigned =
    home.capabilities.salesView || home.capabilities.salesOperate;
  const ventasHref = home.capabilities.salesOperate || home.capabilities.salesRead
    ? "/admin/ventas"
    : "/admin/conversion";

  return (
    <div className="flex flex-col gap-5" data-growth-os-home>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.85rem] font-bold leading-[1.15] tracking-[-0.04em] text-[#101828] sm:text-[2rem]">
            {greeting}, {firstName}{" "}
            <span aria-hidden>☀️</span>
          </h1>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[#667085]" title={spaceName}>
            Aquí tienes el estado de tu negocio hoy.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <HomePeriodSelect preset={periodPreset} />
        </div>
      </header>

      <section aria-label="Indicadores principales">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <MetricCard
            label="Nuevos prospectos"
            value={home.metrics.nuevosProspectos}
            icon={Users}
            iconBg="bg-[#EDE9FE]"
            iconFg="text-[#7C3AED]"
            spark="#7C3AED"
            trend={home.trends?.nuevosProspectos}
            title={home.denominators.captacion}
          />
          <MetricCard
            label="Oportunidades activas"
            value={home.metrics.oportunidadesActivas}
            icon={Target}
            iconBg="bg-[#DBEAFE]"
            iconFg="text-[#3B82F6]"
            spark="#3B82F6"
            trend={home.trends?.oportunidadesActivas}
            title={home.denominators.stock}
          />
          <MetricCard
            label="Ganadas"
            value={home.metrics.ganadas}
            icon={Trophy}
            iconBg="bg-[#D1FAE5]"
            iconFg="text-[#12B76A]"
            spark="#12B76A"
            trend={home.trends?.ganadas}
            title="Oportunidades ganadas con closedAt en el período"
          />
          <MetricCard
            label="Por atender"
            value={home.metrics.porAtender}
            icon={Clock}
            iconBg="bg-[#FEF3C7]"
            iconFg="text-[#F79009]"
            spark="#F79009"
            trend={home.trends?.porAtender}
            title="Vencidas, sin seguimiento o estancadas. La cola es el estado actual; no hay foto del período anterior."
          />
          <MetricCard
            label="Actividad"
            value={home.metrics.actividad}
            icon={Activity}
            iconBg="bg-[#EDE9FE]"
            iconFg="text-[#8B5CF6]"
            spark="#8B5CF6"
            trend={home.trends?.actividad}
            title="Actividades del Espacio con occurredAt en el período"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:items-stretch">
        <section
          className={cn(
            cardClass,
            "flex h-full min-w-0 flex-col rounded-[16px] border-[#EEF0F4] p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_20px_rgba(16,24,40,0.04)] sm:p-6 xl:col-span-5"
          )}
        >
          <SectionTitle
            action={
              funnel && funnel.cohortSize > 0 ? (
                <span
                  className="text-[13px] font-semibold text-[#7C3AED]"
                  title={`${funnel.cohortDenominator} ${funnel.cohortNote} Numerador: ganadas de esa cohorte (${funnel.cohortWon}).`}
                >
                  Conversión total: {formatCohortPct(funnel.cohortRate)}
                </span>
              ) : null
            }
          >
            Embudo de conversión
            <TitleHint
              text={
                funnel
                  ? `${funnel.funnelLabel} · etapas = abiertas ahora; Ganadas del período es resultado, no etapa`
                  : home.denominators.stock
              }
            />
          </SectionTitle>

          {!funnelFigure ? (
            <EmptyState
              title={canSales ? "Sin oportunidades abiertas" : "Embudo no disponible"}
              description={
                canSales
                  ? "Cuando haya oportunidades abiertas, verás aquí el stock por etapa."
                  : "Necesitas permiso de ventas para ver el embudo del Espacio."
              }
              icon={<TrendingUp className="h-8 w-8" strokeWidth={1.5} />}
              className="mt-4 flex-1 border-dashed bg-[var(--gray-50)] py-8 shadow-none"
            />
          ) : (
            <HomeConversionFunnel figure={funnelFigure} />
          )}
        </section>

        <section
          className={cn(
            cardClass,
            "flex h-full flex-col rounded-[16px] border-[#EEF0F4] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_20px_rgba(16,24,40,0.04)] xl:col-span-4"
          )}
        >
          <SectionTitle
            action={
              canSales ? (
                <Link
                  href="/admin/conversion"
                  className="text-[13px] font-semibold text-[#7C3AED] hover:underline"
                >
                  Ver todas
                </Link>
              ) : null
            }
          >
            Qué necesita atención
            <TitleHint text="Vencidas, sin seguimiento o estancadas." />
          </SectionTitle>

          {home.attention.length === 0 ? (
            <EmptyState
              title="Nada pide atención ahora"
              description="Cuando una oportunidad esté vencida, sin seguimiento o estancada, aparecerá aquí."
              icon={<UserRound className="h-8 w-8" strokeWidth={1.5} />}
              className="mt-4 flex-1 border-dashed bg-[var(--gray-50)] py-8 shadow-none"
            />
          ) : (
            <ul className="mt-4 flex min-h-0 flex-1 flex-col divide-y divide-[#F2F4F7]">
              {home.attention.map((item, index) => {
                const band = item.band ?? "";
                const priority = PRIORITY_PILL[band] ?? {
                  label: item.bandLabel,
                  className: "bg-[#F2F4F7] text-[#667085]",
                };
                return (
                  <li key={item.id} className="flex flex-1 items-center py-3 first:pt-1 last:pb-0">
                    <div className="flex w-full items-center gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tracking-tight",
                          AVATAR_TONES[index % AVATAR_TONES.length]
                        )}
                        aria-hidden
                      >
                        {personaInitial(item.displayName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold leading-5 tracking-tight text-[#101828]">
                          {item.displayName}
                        </p>
                        <p
                          className="mt-0.5 truncate text-[12px] leading-4 text-[#667085]"
                          title={item.ownerLabel}
                        >
                          {item.contextLabel}
                        </p>
                        <p
                          className={cn(
                            "mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium leading-4",
                            REASON_TEXT[band] ?? "text-[#667085]"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 shrink-0 rounded-full",
                              REASON_DOT[band] ?? "bg-[#98A2B3]"
                            )}
                            aria-hidden
                          />
                          {item.reasonLabel}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        <span
                          className={cn(
                            "text-[12px] font-semibold tabular-nums",
                            AGE_TEXT[band] ?? "text-[#667085]"
                          )}
                        >
                          {item.ageLabel}
                        </span>
                        <span
                          className={cn(
                            "inline-flex h-6 items-center rounded-full px-2 text-[11px] font-semibold",
                            priority.className
                          )}
                        >
                          {priority.label}
                        </span>
                        <Button
                          href={item.href}
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-[10px] border-[#E4E7EC] bg-white px-3 text-[12px] font-semibold text-[#344054] shadow-none hover:bg-[#F9FAFB]"
                        >
                          {REVIEW_CTA_LABEL}
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          className={cn(
            cardClass,
            "flex h-full flex-col rounded-[16px] border-[#EEF0F4] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_20px_rgba(16,24,40,0.04)] xl:col-span-3"
          )}
        >
          <SectionTitle>
            Origen de los prospectos
            <TitleHint text="Altas del período por origen de la oportunidad" />
          </SectionTitle>
          {home.origins.length === 0 ? (
            <EmptyState
              title="Sin altas en el período"
              description="Cuando se abran oportunidades con origen registrado, el desglose aparecerá aquí."
              icon={<MapPin className="h-8 w-8" strokeWidth={1.5} />}
              className="mt-4 flex-1 border-dashed bg-[var(--gray-50)] py-8 shadow-none"
            />
          ) : (
            <ul className="mt-5 flex min-h-0 flex-1 flex-col justify-between gap-4">
              {home.origins.map((item, index) => {
                const visual = originVisual(item.label, index);
                const Icon = visual.Icon;
                const width = Math.max(10, Math.round((item.count / maxOrigin) * 100));
                return (
                  <li key={item.label} className="flex gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]",
                        visual.bg,
                        visual.fg
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[13px] font-medium text-[#344054]">
                          {item.label}
                        </span>
                        <span className="shrink-0 tabular-nums text-[13px]">
                          <span className="font-semibold text-[#101828]">
                            {formatCount(item.count)}
                          </span>
                          <span className="ml-1.5 font-medium text-[#98A2B3]">
                            {formatSharePct(item.share)}
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F2F4F7]">
                        <div
                          className={cn("h-full rounded-full", visual.bar)}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:items-start">
        <section className={cn(cardClass, "p-5 xl:col-span-5")}>
          <SectionTitle
            action={
              home.capabilities.salesView ? (
                <Link
                  href="/admin/conversion/analitica"
                  className="text-xs font-semibold text-[var(--growth-os-primary)] hover:underline"
                >
                  Analítica de conversión
                </Link>
              ) : null
            }
          >
            Rendimiento comercial
          </SectionTitle>
          <p className="mt-1 text-[12px] leading-snug text-[var(--gray-500)]">
            Activas a cargo vs ganadas del período por responsable
          </p>
          <CommercialPerformanceBody
            owners={home.owners}
            unassigned={home.unassignedOwner}
            canAssign={canAssignUnassigned}
          />
        </section>

        <section className={cn(cardClass, "p-5 xl:col-span-4")}>
          <SectionTitle
            action={
              <Link
                href={ACTIVITY_LINK}
                className="text-xs font-semibold text-[var(--growth-os-primary)] hover:underline"
              >
                Ver toda la actividad
              </Link>
            }
          >
            Actividad reciente
          </SectionTitle>
          {home.activity.length === 0 ? (
            <EmptyState
              title="Aún no hay actividad en el período"
              description="Los hechos del Espacio aparecerán aquí cuando ocurran."
              icon={<Activity className="h-8 w-8" strokeWidth={1.5} />}
              className="mt-4 border-dashed bg-[var(--gray-50)] py-8 shadow-none"
            />
          ) : (
            <div className="relative mt-4">
              <span
                className="absolute bottom-3 left-[17px] top-3 w-px bg-[var(--admin-border-subtle)]"
                aria-hidden
              />
              <ul>
                {home.activity.map((item) => {
                  const tone = TONE_STYLE[item.tone] ?? TONE_STYLE.other;
                  const Icon = tone.Icon;
                  const eventLabel =
                    item.eventLabel ?? homeActivityEventLabel(item.tone);
                  const body = (
                    <>
                      <span
                        className={cn(
                          "relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-[3px] ring-white",
                          tone.bg,
                          tone.fg
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[var(--gray-900)]">
                            {item.story}
                          </p>
                          <time className="shrink-0 whitespace-nowrap pt-0.5 text-[11px] font-medium text-[var(--gray-500)]">
                            {formatRelativeTime(item.occurredAt)}
                          </time>
                        </div>
                        <p className="mt-0.5 text-[12px] leading-snug text-[var(--gray-500)]">
                          {eventLabel}
                        </p>
                      </div>
                    </>
                  );
                  return (
                    <li key={item.id} className="relative pb-3.5 last:pb-0">
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="-mx-1 flex gap-3 rounded-[10px] px-1 py-0.5 transition hover:bg-[var(--gray-50)]"
                        >
                          {body}
                        </Link>
                      ) : (
                        <div className="flex gap-3">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        <section className={cn(cardClass, "flex flex-col p-5 xl:col-span-3")}>
          <SectionTitle>Próximos pasos</SectionTitle>
          {home.nextSteps.length === 0 ? (
            <div className="mt-4 flex flex-1 flex-col items-start justify-center rounded-[12px] border border-dashed border-[color-mix(in_srgb,var(--growth-os-success)_35%,var(--admin-border-subtle))] bg-[color-mix(in_srgb,var(--growth-os-success)_6%,white)] px-3.5 py-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--growth-os-success)_14%,white)] text-[var(--growth-os-success)]">
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </span>
              <p className="mt-2.5 text-[13px] font-semibold text-[var(--gray-900)]">
                Al día por ahora
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-[var(--gray-500)]">
                No hay vencidas, sin seguimiento, estancadas ni sin responsable pendientes.
              </p>
            </div>
          ) : (
            <ul className="mt-3 flex-1 divide-y divide-[var(--admin-border-subtle)]">
              {home.nextSteps.map((step) => {
                const visual =
                  NEXT_STEP_ICON[step.id] ?? {
                    Icon: ArrowRight,
                    bg: "bg-[color-mix(in_srgb,var(--growth-os-primary)_12%,white)]",
                    fg: "text-[var(--growth-os-primary)]",
                  };
                const StepIcon = visual.Icon;
                return (
                  <li key={step.id}>
                    <Link
                      href={step.href}
                      className="flex items-center gap-3 py-2.5 transition hover:bg-[var(--gray-50)]"
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]",
                          visual.bg,
                          visual.fg
                        )}
                      >
                        <StepIcon className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold leading-snug text-[var(--gray-900)]">
                          {step.label}
                        </span>
                        {step.detail ? (
                          <span className="mt-0.5 block text-[11px] leading-snug text-[var(--gray-500)]">
                            {step.detail}
                          </span>
                        ) : null}
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-[var(--gray-400)]"
                        strokeWidth={2}
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {canSales ? (
            <Button
              href={ventasHref}
              className="mt-4 h-11 w-full rounded-[12px] bg-[var(--growth-os-primary)] text-[14px] font-semibold text-white hover:bg-[var(--growth-os-primary)] hover:opacity-95"
            >
              Ir a Ventas
            </Button>
          ) : home.capabilities.peopleView ? (
            <Button
              href="/admin/personas"
              className="mt-4 h-11 w-full rounded-[12px] bg-[var(--growth-os-primary)] text-[14px] font-semibold text-white hover:bg-[var(--growth-os-primary)] hover:opacity-95"
            >
              Ir a Personas
            </Button>
          ) : null}
        </section>
      </div>
    </div>
  );
}
