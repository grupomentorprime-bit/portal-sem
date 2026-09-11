"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, UserRound } from "lucide-react";
import {
  EmptyState,
  Section,
  StatusBadge,
  Timeline,
  aek,
} from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/admin/audit-labels";
import {
  GROWTH_NEXT_ACTION_SECTION_LABEL,
  GROWTH_NO_NEXT_ACTION_LABEL,
  GROWTH_ORIGIN_SECTION_LABEL,
  GROWTH_TIMELINE_SECTION_LABEL,
  GROWTH_VENTAS_CHANGE_STATUS_LABEL,
  GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL,
  GROWTH_VENTAS_CURRENT_STATUS_LABEL,
  GROWTH_VENTAS_FOLLOW_UP_LABEL,
  GROWTH_VENTAS_FOLLOW_UP_PLACEHOLDER,
  GROWTH_VENTAS_OPEN_PERSONA_LABEL,
  GROWTH_VENTAS_PAGE_TITLE,
  GROWTH_VENTAS_REGISTER_CONTACT_LABEL,
  GROWTH_VENTAS_SAVE_NOTE_LABEL,
} from "@/lib/growth/labels";
import type { GrowthVentasOpportunityOperateView } from "@/lib/growth/ventas-view";
import { cn } from "@/lib/utils";

export interface VentasOperateClientProps {
  item: GrowthVentasOpportunityOperateView;
  canOperate: boolean;
}

const cardClass = cn(aek.surface, "shadow-[var(--admin-shadow-panel)] px-5 py-5");

function statusTone(status: string): "active" | "inactive" | "info" {
  if (status === "won" || status === "handed_off") return "active";
  if (status === "lost" || status === "archived") return "inactive";
  return "info";
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
}

export function VentasOperateClient({
  item,
  canOperate,
}: VentasOperateClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [followSummary, setFollowSummary] = useState("");
  const [nextSummary, setNextSummary] = useState(
    item.nextAction?.summary ?? ""
  );

  useEffect(() => {
    setNextSummary(item.nextAction?.summary ?? "");
  }, [item.id, item.nextAction?.summary]);

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la acción.");
    }
  };

  const onTransition = (transitionId: string) =>
    run(async () => {
      const res = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(item.id)}/transition`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transitionId }),
        }
      );
      if (!res.ok) throw new Error(await readError(res));
      setStatusPickerOpen(false);
    });

  const onFollowUp = (kind: "note" | "contact") =>
    run(async () => {
      const res = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(item.id)}/activities`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, summary: followSummary }),
        }
      );
      if (!res.ok) throw new Error(await readError(res));
      setFollowSummary("");
    });

  const onSetNext = () =>
    run(async () => {
      const res = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(item.id)}/next-action`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary: nextSummary }),
        }
      );
      if (!res.ok) throw new Error(await readError(res));
    });

  const onClearNext = () =>
    run(async () => {
      const res = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(item.id)}/next-action`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(await readError(res));
      setNextSummary("");
    });

  const typeLine = [
    item.typeLabel,
    item.subjectLabel ? item.subjectLabel : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: GROWTH_VENTAS_PAGE_TITLE, href: "/admin/ventas" },
        { label: item.personaDisplayName },
      ]}
      title={item.personaDisplayName}
      description={`${typeLine} · ${item.originLabel}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button href="/admin/ventas" variant="outline" size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Ventas
          </Button>
          <Button
            href={`/admin/personas/${encodeURIComponent(item.personaId)}?oportunidad=${encodeURIComponent(item.id)}`}
            variant="outline"
            size="sm"
          >
            <UserRound className="mr-1.5 h-4 w-4" />
            {GROWTH_VENTAS_OPEN_PERSONA_LABEL}
          </Button>
        </div>
      }
    >
      <div className={cn("space-y-4", pending && "opacity-70")}>
        {error ? (
          <p className="rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {/* Centro: qué hacer ahora */}
        <div
          className={cn(
            cardClass,
            "border-[color-mix(in_srgb,var(--color-primary)_18%,var(--admin-border-subtle))]",
            "bg-[color-mix(in_srgb,var(--color-primary)_5%,white)]"
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={aek.label}>{GROWTH_NEXT_ACTION_SECTION_LABEL}</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                {item.nextAction?.summary ?? GROWTH_NO_NEXT_ACTION_LABEL}
              </p>
              <p className="mt-1.5 text-sm text-muted">
                {GROWTH_ORIGIN_SECTION_LABEL}: {item.originLabel}
              </p>
            </div>
            <StatusBadge tone={statusTone(item.status)} label={item.statusLabel} />
          </div>

          {canOperate ? (
            <div className="mt-4 space-y-3 border-t border-[var(--admin-border-subtle)] pt-4">
              <Input
                aria-label={GROWTH_NEXT_ACTION_SECTION_LABEL}
                value={nextSummary}
                onChange={(e) => setNextSummary(e.target.value)}
                placeholder="Ej. Llamar para confirmar interés"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={pending || !nextSummary.trim()}
                  onClick={onSetNext}
                >
                  Guardar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending || !item.nextAction}
                  onClick={onClearNext}
                >
                  {GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {canOperate ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={cn(cardClass, "space-y-3")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-foreground">
                  <span className="text-muted">
                    {GROWTH_VENTAS_CURRENT_STATUS_LABEL}:{" "}
                  </span>
                  <span className="font-medium">{item.statusLabel}</span>
                </p>
                {item.availableTransitions.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={statusPickerOpen ? "secondary" : "outline"}
                    disabled={pending}
                    onClick={() => setStatusPickerOpen((open) => !open)}
                  >
                    {GROWTH_VENTAS_CHANGE_STATUS_LABEL}
                  </Button>
                ) : null}
              </div>

              {item.availableTransitions.length === 0 ? (
                <EmptyState
                  title="Sin cambios disponibles"
                  description="Esta situación no admite más cambios desde Ventas."
                />
              ) : null}

              {statusPickerOpen && item.availableTransitions.length > 0 ? (
                <div className="flex flex-wrap gap-2 border-t border-[var(--admin-border-subtle)] pt-3">
                  {item.availableTransitions.map((t) => (
                    <Button
                      key={t.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => onTransition(t.id)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>

            <Section title={GROWTH_VENTAS_FOLLOW_UP_LABEL}>
              <div className={cn(cardClass, "space-y-3")}>
                <Textarea
                  aria-label="Detalle del seguimiento"
                  value={followSummary}
                  onChange={(e) => setFollowSummary(e.target.value)}
                  placeholder={GROWTH_VENTAS_FOLLOW_UP_PLACEHOLDER}
                  rows={3}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending || !followSummary.trim()}
                    onClick={() => onFollowUp("note")}
                  >
                    {GROWTH_VENTAS_SAVE_NOTE_LABEL}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending || !followSummary.trim()}
                    onClick={() => onFollowUp("contact")}
                  >
                    {GROWTH_VENTAS_REGISTER_CONTACT_LABEL}
                  </Button>
                </div>
              </div>
            </Section>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Solo lectura: no tienes permiso para operar Oportunidades.
          </p>
        )}

        <Section title={GROWTH_TIMELINE_SECTION_LABEL}>
          <div className={cardClass}>
            {item.recentActivities.length === 0 ? (
              <p className="text-sm text-muted">Sin hechos registrados aún.</p>
            ) : (
              <Timeline
                items={item.recentActivities.map((a) => ({
                  id: a.id,
                  title: a.summary,
                  description:
                    a.kindLabel === a.summary ? undefined : a.kindLabel,
                  time: formatRelativeTime(a.occurredAt),
                }))}
              />
            )}
          </div>
        </Section>

        <p className="text-sm text-muted">
          <Link
            href={`/admin/personas/${encodeURIComponent(item.personaId)}`}
            className="font-medium text-primary hover:underline"
          >
            Ver ficha de {item.personaDisplayName}
          </Link>
        </p>
      </div>
    </AdminModulePage>
  );
}
