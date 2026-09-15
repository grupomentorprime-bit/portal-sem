"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertBanner, StatusBadge, aek } from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import type { GrowthCampaign } from "@/core/growth/campaigns";
import type { GrowthCampaignMetrics } from "@/core/growth/campaigns";
import {
  CAMPAIGN_ACTIVATE_CTA,
  CAMPAIGN_ACTIVATE_HINT,
  CAMPAIGN_AUDIENCE_EMPTY,
  CAMPAIGN_AUTOMATION_NONE,
  CAMPAIGN_EDIT_CTA,
  CAMPAIGN_END_CTA,
  CAMPAIGN_PAGE_TITLE,
  campaignHumanError,
  campaignStatusTone,
} from "@/lib/growth/campaigns-labels";
import { cn } from "@/lib/utils";

export interface CampanaDetailClientProps {
  campaign: GrowthCampaign;
  statusLabel: string;
  sourceDetail: string;
  metrics: GrowthCampaignMetrics;
  audienceIntro: string | null;
  audienceLabels: string[];
  actividadHref: string;
  canManage: boolean;
  automationName?: string | null;
}

function formatCount(n: number): string {
  return new Intl.NumberFormat("es-CL").format(n);
}

export function CampanaDetailClient({
  campaign,
  statusLabel,
  sourceDetail,
  metrics,
  audienceIntro,
  audienceLabels,
  actividadHref,
  canManage,
  automationName,
}: CampanaDetailClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function activate() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/growth/campaigns/${campaign._id}/activate`,
        { method: "POST" }
      );
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        code?: string;
      };
      if (!res.ok || !data.ok) {
        setError(campaignHumanError(data.code, data.error));
        return;
      }
      router.refresh();
    } catch {
      setError("No pudimos completar la operación.");
    } finally {
      setPending(false);
    }
  }

  async function endCampaign() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/growth/campaigns/${campaign._id}/end`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        code?: string;
      };
      if (!res.ok || !data.ok) {
        setError(campaignHumanError(data.code, data.error));
        return;
      }
      router.refresh();
    } catch {
      setError("No pudimos completar la operación.");
    } finally {
      setPending(false);
    }
  }

  const actions =
    canManage && campaign.status !== "ended" ? (
      <div className="flex flex-wrap gap-2">
        {campaign.status === "draft" ? (
          <>
            <Button
              href={`/admin/campanas/${campaign._id}/editar`}
              size="sm"
              variant="outline"
            >
              {CAMPAIGN_EDIT_CTA}
            </Button>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => void activate()}
            >
              {CAMPAIGN_ACTIVATE_CTA}
            </Button>
          </>
        ) : null}
        {campaign.status === "active" ? (
          <>
            <Button
              href={`/admin/campanas/${campaign._id}/editar`}
              size="sm"
              variant="outline"
            >
              {CAMPAIGN_EDIT_CTA}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => void endCampaign()}
            >
              {CAMPAIGN_END_CTA}
            </Button>
          </>
        ) : null}
      </div>
    ) : null;

  const sourceLines = sourceDetail.split("\n");

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: CAMPAIGN_PAGE_TITLE, href: "/admin/campanas" },
        { label: campaign.name },
      ]}
      title={campaign.name}
      description={campaign.objective}
      actions={actions}
    >
      <div
        className={cn(aek.sectionGap, "max-w-3xl", pending && "opacity-70")}
        data-campana-detail
      >
        {error ? (
          <AlertBanner variant="error" title="No se pudo completar">
            <div className="space-y-2">
              <p>{error}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setError(null)}
              >
                Entendido
              </Button>
            </div>
          </AlertBanner>
        ) : null}

        <section className={cn(aek.surface, "space-y-3 p-4 sm:p-5")}>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              tone={campaignStatusTone(campaign.status)}
              label={statusLabel}
            />
          </div>
          {campaign.status === "draft" && canManage ? (
            <p className="text-sm text-muted">{CAMPAIGN_ACTIVATE_HINT}</p>
          ) : null}
        </section>

        <section className={cn(aek.surface, "p-4 sm:p-5")}>
          <h2 className="mb-4 text-sm font-semibold tracking-tight">
            Resultados
          </h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Metric
              label="Personas captadas"
              value={metrics.personasCaptadas}
              emphasis
            />
            <Metric
              label="Oportunidades"
              value={metrics.oportunidadesGeneradas}
              emphasis
            />
            <Metric label="En seguimiento" value={metrics.enSeguimiento} />
            <Metric label="Ganadas" value={metrics.ganadas} />
            <Metric label="Perdidas" value={metrics.perdidas} />
          </dl>
        </section>

        <section className={cn(aek.surface, "space-y-5 p-4 sm:p-5")}>
          <div>
            <h2 className={aek.label}>De dónde llegan</h2>
            <div className="mt-1.5 space-y-0.5 text-sm text-foreground">
              {sourceLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div>
            <h2 className={aek.label}>A quién acompaña</h2>
            <div className="mt-1.5 space-y-1 text-sm text-foreground">
              {audienceLabels.length === 0 ? (
                <p className="text-muted">{CAMPAIGN_AUDIENCE_EMPTY}</p>
              ) : (
                <>
                  {audienceIntro ? (
                    <p className="text-muted">{audienceIntro}</p>
                  ) : null}
                  <ul className="space-y-1">
                    {audienceLabels.map((label) => (
                      <li key={label}>· {label}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div>
            <h2 className={aek.label}>Seguimiento automático</h2>
            <div className="mt-1.5 text-sm">
              {campaign.automationId ? (
                <Link
                  href={`/admin/automatizaciones/${campaign.automationId}`}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  {automationName ?? "Automatización"}
                </Link>
              ) : (
                <p className="text-muted">{CAMPAIGN_AUTOMATION_NONE}</p>
              )}
            </div>
          </div>

          <div>
            <h2 className={aek.label}>Qué ha pasado</h2>
            <p className="mt-1.5 text-sm">
              <Link
                href={actividadHref}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Ver actividad del Espacio
              </Link>
            </p>
          </div>
        </section>
      </div>
    </AdminModulePage>
  );
}

function Metric({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div>
      <dt className={aek.label}>{label}</dt>
      <dd
        className={cn(
          "mt-1 tracking-tight text-foreground",
          emphasis ? "text-2xl font-semibold" : "text-lg font-semibold"
        )}
      >
        {formatCount(value)}
      </dd>
    </div>
  );
}
