"use client";

import { useEffect, useState } from "react";
import {
  MENTOR_APPS,
  mentorAppBlurb,
  mentorAppLabel,
  type MentorAppId,
} from "@/lib/desktop/catalog";
import { DesktopSwitchGroup, DesktopSwitchRow } from "@/components/desktop/DesktopSwitch";
import { isHttpsEntry, openingSignals } from "@/lib/desktop/contract";
import {
  CLIENT_STATUSES,
  clientStatusLine,
  domainDraftChanged,
  planDraftChanged,
  type ClientConsoleModel,
  type ClientStatus,
} from "@/lib/desktop/client-console";
import { lifecycleMarks, listManifests, projectAppLifecycle } from "@/nelzuri";

export function DesktopClientConsole({
  tenantId,
  model,
  aprendeHoyOrigin,
  cumpleOrigin,
  rrhhOrigin,
  entering,
  onEnter,
  onChanged,
}: {
  tenantId: string;
  model: ClientConsoleModel;
  aprendeHoyOrigin: string | null;
  cumpleOrigin: string | null;
  rrhhOrigin: string | null;
  entering?: boolean;
  onEnter: () => void;
  onChanged: (space: unknown) => void;
}) {
  const [statusPreview, setStatusPreview] = useState<ClientStatus | null>(null);
  const [apps, setApps] = useState<MentorAppId[]>(model.contractedApps);
  const [entryUrl, setEntryUrl] = useState(model.aprendeHoyEntryUrl ?? "");
  const [customHost, setCustomHost] = useState(model.customHost ?? "");
  const [busy, setBusy] = useState<"status" | "plan" | "domain" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatusPreview(null);
    setApps(model.contractedApps);
    setEntryUrl(model.aprendeHoyEntryUrl ?? "");
    setCustomHost(model.customHost ?? "");
    setError("");
  }, [model]);

  const preview = statusPreview && statusPreview !== model.status ? statusPreview : null;
  const planDirty = planDraftChanged({
    contracted: model.contractedApps,
    draft: apps,
    entryUrl: model.aprendeHoyEntryUrl,
    draftUrl: entryUrl,
  });
  const domainDirty = domainDraftChanged(model.customHost, customHost);
  const shownHost = model.primaryHost || model.platformHost;
  const specialized = listManifests().filter((item) => item.class === "specialized");
  const registered = listManifests().filter((item) => item.integration === "pending");

  function factsFor(appId: string) {
    const signals = (MENTOR_APPS as readonly string[]).includes(appId)
      ? openingSignals({
          appId: appId as MentorAppId,
          aprendeHoyEntryUrl: entryUrl,
          aprendeHoyOrigin,
          cumpleOrigin,
          rrhhOrigin,
        })
      : { productOrigin: false, httpsEntry: null };
    return projectAppLifecycle({
      appId,
      tenantId,
      contractedApps: apps,
      requestedApps: model.requestedApps,
      signals,
    });
  }

  function toggleApp(appId: MentorAppId) {
    setError("");
    setApps((current) => {
      const next = current.includes(appId)
        ? current.filter((item) => item !== appId)
        : [...current, appId];
      return MENTOR_APPS.filter((item) => next.includes(item));
    });
  }

  async function applyStatus() {
    if (!preview) return;
    setBusy("status");
    setError("");
    const response = await fetch(`/api/platform/spaces/${encodeURIComponent(tenantId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: preview }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setBusy(null);
    if (!response?.ok || !body?.ok) {
      setError(body?.error || "No se pudo cambiar el estado.");
      return;
    }
    onChanged({ ...model, status: preview, name: model.name });
  }

  async function savePlan() {
    if (apps.includes("aprende-hoy") && entryUrl.trim() && !isHttpsEntry(entryUrl)) {
      setError("Aprende Hoy necesita una dirección https.");
      return;
    }
    setBusy("plan");
    setError("");
    const response = await fetch(`/api/platform/spaces/${encodeURIComponent(tenantId)}/apps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractedApps: apps,
        aprendeHoyEntryUrl: apps.includes("aprende-hoy") ? entryUrl.trim() : "",
      }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      contractedApps?: MentorAppId[];
      aprendeHoyEntryUrl?: string | null;
    } | null;
    setBusy(null);
    if (!response?.ok || !body?.ok) {
      setError(body?.error || "No se guardó el plan.");
      return;
    }
    onChanged({
      ...model,
      contractedApps: body.contractedApps ?? apps,
      aprendeHoyEntryUrl: body.aprendeHoyEntryUrl ?? (apps.includes("aprende-hoy") ? entryUrl.trim() || null : null),
      openAppRequests: model.requestedApps
        .filter((appId) => !(body.contractedApps ?? apps).includes(appId))
        .map((appId) => ({ appId })),
    });
  }

  async function saveDomain() {
    setBusy("domain");
    setError("");
    const response = await fetch(`/api/platform/spaces/${encodeURIComponent(tenantId)}/domain`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host: customHost.trim() }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setBusy(null);
    if (!response?.ok || !body?.ok) {
      setError(body?.error || "No se guardó el dominio.");
      return;
    }
    const fresh = await fetch(`/api/platform/spaces/${encodeURIComponent(tenantId)}`).catch(() => null);
    const freshBody = (await fresh?.json().catch(() => null)) as { ok?: boolean; space?: unknown } | null;
    if (fresh?.ok && freshBody?.space) onChanged(freshBody.space);
  }

  return (
    <div className="console">
      <div className="console-scroll">
      <header className="console-id">
        <h2>{model.name}</h2>
        <p>{model.typeLabel}</p>
      </header>

      <section>
        <p className="console-kicker">Estado</p>
        <div className="status-rail" role="radiogroup" aria-label="Estado del cliente">
          {CLIENT_STATUSES.map((item) => {
            const current = model.status === item.id;
            const chosen = (preview ?? model.status) === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={chosen}
                aria-label={item.label}
                title={item.label}
                className={current ? "is-current" : chosen ? "is-preview" : undefined}
                disabled={busy !== null}
                onClick={() => setStatusPreview(current ? null : item.id)}
              >
                <i className={`lamp is-${item.id}`} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </div>
        <p className="console-line">{clientStatusLine(preview ?? model.status)}</p>
        {preview ? (
          <div className="console-actions">
            <button type="button" className="primary" disabled={busy !== null} onClick={() => void applyStatus()}>
              {busy === "status" ? "Aplicando…" : "Aplicar"}
            </button>
            <button type="button" className="ghost" disabled={busy !== null} onClick={() => setStatusPreview(null)}>
              Volver
            </button>
          </div>
        ) : null}
      </section>

      <section>
        <p className="console-kicker">Plan</p>
        {model.status !== "active" ? (
          <p className="console-line">Este estado no quita aplicaciones del plan.</p>
        ) : null}
        <DesktopSwitchGroup note="Enciende las que este Espacio puede abrir. Guardar el plan no autoriza a las personas. Un pedido no contrata.">
          {MENTOR_APPS.map((appId) => {
            const on = apps.includes(appId);
            const asked = model.requestedApps.includes(appId) && !on;
            const marks = lifecycleMarks(factsFor(appId));
            return (
              <DesktopSwitchRow
                key={appId}
                mark={appId}
                title={mentorAppLabel(appId)}
                detail={
                  <>
                    {mentorAppBlurb(appId)}
                    <span className="lifecycle-facts">
                      {marks.map((mark) => (
                        <span key={mark}>{mark}</span>
                      ))}
                    </span>
                  </>
                }
                badge={asked ? "Pedido" : undefined}
                checked={on}
                disabled={busy !== null}
                onChange={() => toggleApp(appId)}
              />
            );
          })}
        </DesktopSwitchGroup>
        {apps.includes("aprende-hoy") ? (
          <label>
            Entrada de Aprende Hoy
            <input
              value={entryUrl}
              placeholder="https://"
              disabled={busy !== null}
              onChange={(event) => setEntryUrl(event.target.value)}
            />
          </label>
        ) : null}
        {planDirty ? (
          <button type="button" className="primary" disabled={busy !== null} onClick={() => void savePlan()}>
            {busy === "plan" ? "Guardando…" : "Guardar plan"}
          </button>
        ) : null}
      </section>

      <section>
        <p className="console-kicker">Capacidades especializadas</p>
        <p className="console-line">Pertenecen a su Espacio. No se contratan y no entran al plan.</p>
        <div className="lifecycle-registered">
          {specialized.map((item) => (
            <article key={item.id}>
              <strong>{item.label}</strong>
              <span className="lifecycle-facts">
                {lifecycleMarks(factsFor(item.id)).map((mark) => (
                  <span key={mark}>{mark}</span>
                ))}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="console-kicker">Registradas</p>
        <p className="console-line">Identificadas en el catálogo. No se contratan y no operan en el escritorio.</p>
        <div className="lifecycle-registered">
          {registered.map((item) => (
            <article key={item.id}>
              <strong>{item.label}</strong>
              <span className="lifecycle-facts">
                {lifecycleMarks(factsFor(item.id)).map((mark) => (
                  <span key={mark}>{mark}</span>
                ))}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="console-kicker">Dominio</p>
        <p className="console-host">{shownHost || "Sin dirección"}</p>
        {model.platformHost && model.platformHost !== shownHost ? (
          <p className="lead">Subdominio de la plataforma: {model.platformHost}</p>
        ) : null}
        <label>
          Dominio propio
          <input
            value={customHost}
            placeholder="www.organizacion.cl"
            disabled={busy !== null}
            onChange={(event) => setCustomHost(event.target.value)}
          />
        </label>
        {domainDirty ? (
          <button type="button" className="primary" disabled={busy !== null} onClick={() => void saveDomain()}>
            {busy === "domain" ? "Guardando…" : customHost.trim() ? "Guardar dominio" : "Volver al subdominio"}
          </button>
        ) : null}
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      </div>
      <button type="button" className="primary console-enter" disabled={entering} onClick={onEnter}>
        {entering ? "Entrando…" : "Entrar a su escritorio"}
      </button>
    </div>
  );
}
