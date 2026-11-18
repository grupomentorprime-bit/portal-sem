"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  activationLabel,
  approvalLabel,
  filterAttentionCases,
  formatAttentionWhen,
  groupAttentionOrgs,
  priorityLabel,
  statusLabel,
  type AttentionView,
  type CasePriority,
  type CaseStatus,
  type PublicAttentionCase,
} from "@/lib/desktop/attention";
import { MENTOR_APPS, mentorAppLabel } from "@/lib/desktop/catalog";

type AreaOption = { id: string; name: string; description: string; active: boolean };
type Colleague = { userId: string; displayName: string; allAreas: boolean; areaIds: string[] };
type StageTab = "conversacion" | "solicitudes" | "informacion";

const VIEWS: Array<{ id: AttentionView; label: string }> = [
  { id: "general", label: "Conversaciones" },
  { id: "vivo", label: "En vivo" },
  { id: "mias", label: "Mis casos" },
  { id: "sin_asignar", label: "Sin asignar" },
  { id: "pendientes", label: "Pendientes" },
  { id: "resueltos", label: "Resueltos" },
];

const AREA_TONE: Record<string, string> = {
  tecnico: "is-tecnico",
  operativo: "is-operativo",
  comercial: "is-comercial",
  facturacion: "is-facturacion",
  capacitacion: "is-capacitacion",
  implementacion: "is-implementacion",
  general: "is-general",
};

const CLIENT_FILTERS: Array<{ id: "todos" | CaseStatus; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "abierto", label: "En gestión" },
  { id: "pendiente", label: "Pendientes" },
  { id: "resuelto", label: "Resueltos" },
];

export function DesktopAttention({
  mode,
  selfId,
  onClose,
}: {
  mode: "panel" | "client";
  selfId: string;
  onClose: () => void;
}) {
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [cases, setCases] = useState<PublicAttentionCase[]>([]);
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [online, setOnline] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [view, setView] = useState<AttentionView>("general");
  const [clientFilter, setClientFilter] = useState<(typeof CLIENT_FILTERS)[number]["id"]>("todos");
  const [areaId, setAreaId] = useState("");
  const [query, setQuery] = useState("");
  const [stageTab, setStageTab] = useState<StageTab>("conversacion");
  const [composing, setComposing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const controller = new AbortController();
    const pull = (quiet: boolean) => {
      if (!quiet) setLoading(true);
      void fetch("/api/desktop/attention", { signal: controller.signal })
        .then(async (response) => {
          const body = (await response.json().catch(() => null)) as {
            ok?: boolean;
            online?: boolean;
            areas?: AreaOption[];
            cases?: PublicAttentionCase[];
            colleagues?: Colleague[];
          } | null;
          if (!response.ok || !body?.ok) {
            setError("No se pudo abrir Atención.");
            return;
          }
          setError("");
          setOnline(body.online === true);
          setAreas(body.areas ?? []);
          setCases(body.cases ?? []);
          setColleagues(body.colleagues ?? []);
        })
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          setError("No se pudo conectar con el servidor.");
        })
        .finally(() => {
          if (!quiet) setLoading(false);
        });
    };
    pull(false);
    const timer = window.setInterval(() => pull(true), 15000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  const viewCounts = useMemo(() => {
    const base = { actorUserId: selfId, areaId: "" as string };
    return {
      general: filterAttentionCases(cases, { ...base, view: "general" }).length,
      vivo: filterAttentionCases(cases, { ...base, view: "vivo" }).length,
      mias: filterAttentionCases(cases, { ...base, view: "mias" }).length,
      sin_asignar: filterAttentionCases(cases, { ...base, view: "sin_asignar" }).length,
      pendientes: filterAttentionCases(cases, { ...base, view: "pendientes" }).length,
      resueltos: filterAttentionCases(cases, { ...base, view: "resueltos" }).length,
    } satisfies Record<AttentionView, number>;
  }, [cases, selfId]);

  const shown = useMemo(() => {
    if (mode === "panel") {
      return filterAttentionCases(cases, {
        view,
        actorUserId: selfId,
        areaId,
      });
    }
    return cases.filter((item) => clientFilter === "todos" || item.status === clientFilter);
  }, [areaId, cases, clientFilter, mode, selfId, view]);

  const orgs = useMemo(() => {
    const rows = groupAttentionOrgs(shown);
    const needle = query.trim().toLocaleLowerCase("es");
    if (!needle) return rows;
    return rows.filter(
      (row) =>
        row.company.toLocaleLowerCase("es").includes(needle) ||
        row.preview.toLocaleLowerCase("es").includes(needle)
    );
  }, [query, shown]);

  const selectedOrg = orgs.find((row) => row.tenantId === selectedTenantId) ?? null;
  const orgCases = selectedOrg?.cases ?? [];
  const selected = orgCases.find((item) => item.id === selectedId) ?? orgCases[0] ?? null;

  useEffect(() => {
    if (!selectedOrg) return;
    if (selected && orgCases.some((item) => item.id === selected.id)) return;
    const next = orgCases.find((item) => item.unread) ?? orgCases[0];
    setSelectedId(next?.id ?? "");
  }, [orgCases, selected, selectedOrg]);

  function replaceCase(next: PublicAttentionCase) {
    setCases((current) => {
      const rest = current.filter((item) => item.id !== next.id);
      return [next, ...rest];
    });
    setSelectedTenantId(next.tenantId);
    setSelectedId(next.id);
    setComposing(false);
    setStageTab("conversacion");
  }

  async function post(payload: Record<string, unknown>): Promise<boolean> {
    setSending(true);
    setError("");
    const response = await fetch("/api/desktop/attention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      case?: PublicAttentionCase;
    } | null;
    setSending(false);
    if (!response?.ok || !body?.ok || !body.case) {
      setError(body?.error || "No se pudo guardar.");
      return false;
    }
    replaceCase(body.case);
    return true;
  }

  async function openOrg(tenantId: string, preferredCaseId?: string) {
    setComposing(false);
    setSelectedTenantId(tenantId);
    setStageTab("conversacion");
    const row = orgs.find((item) => item.tenantId === tenantId);
    const target =
      row?.cases.find((item) => item.id === preferredCaseId) ??
      row?.cases.find((item) => item.unread) ??
      row?.cases[0];
    setSelectedId(target?.id ?? "");
    if (!target?.unread) return;
    await post({ action: "read", caseId: target.id });
  }

  async function openCase(id: string) {
    const item = cases.find((row) => row.id === id);
    if (!item) return;
    setComposing(false);
    setSelectedTenantId(item.tenantId);
    setSelectedId(id);
    setStageTab("conversacion");
    if (!item.unread) return;
    await post({ action: "read", caseId: id });
  }

  return (
    <div className="ajustes-back" onClick={onClose}>
      <div
        className={`ajustes-window is-clients is-attention${mode === "panel" ? " is-attention-panel" : " is-attention-client"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="attention-title"
        onClick={(event) => event.stopPropagation()}
      >
        {error ? <p className="form-error attn-error">{error}</p> : null}
        {loading ? <p className="ajustes-wait">Abriendo…</p> : null}
        {!loading && mode === "panel" ? (
          <div className={`attn-shell${orgs.length === 0 ? " is-idle" : ""}`}>
            <aside className="attn-nav" aria-label="Navegación de Atención">
              <header className="attn-brand">
                <span className="attn-brand-mark" aria-hidden="true">
                  ⌕
                </span>
                <div>
                  <h2 id="attention-title">Atención</h2>
                  <p>Centro de atención y soporte</p>
                </div>
              </header>
              <nav className="attn-nav-list" aria-label="Vistas">
                {VIEWS.map((item) => {
                  const count = viewCounts[item.id];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={view === item.id && !areaId ? "is-on" : undefined}
                      onClick={() => {
                        setView(item.id);
                        setAreaId("");
                      }}
                    >
                      <span>{item.label}</span>
                      {item.id === "vivo" ? (
                        <i className={`attn-live${online ? " is-on" : ""}`} aria-hidden="true" />
                      ) : null}
                      {count > 0 && item.id !== "vivo" && item.id !== "resueltos" ? (
                        <em>{count > 99 ? "99+" : count}</em>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
              <div className="attn-nav-areas">
                <p>Áreas de atención</p>
                <ul>
                  {areas
                    .filter((area) => area.active)
                    .map((area) => (
                      <li key={area.id}>
                        <button
                          type="button"
                          className={areaId === area.id ? "is-on" : undefined}
                          onClick={() => {
                            setView("general");
                            setAreaId(area.id === areaId ? "" : area.id);
                          }}
                        >
                          <i className={`attn-area-dot ${AREA_TONE[area.id] ?? "is-general"}`} aria-hidden="true" />
                          <span>{area.name}</span>
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
              <p className="attn-online">
                {online
                  ? "Hay un ejecutivo disponible."
                  : "No hay ejecutivos en línea. Las solicitudes quedan pendientes."}
              </p>
            </aside>

            <section className="attn-inbox" aria-label="Bandeja de conversaciones">
              <header className="attn-inbox-head">
                <div>
                  <h3>Conversaciones</h3>
                  <p>Solicitudes y casos de nuestros clientes</p>
                </div>
                <button type="button" className="ghost" onClick={onClose}>
                  Cerrar
                </button>
              </header>
              <div className="attn-inbox-tools">
                <select
                  value={areaId}
                  onChange={(event) => setAreaId(event.target.value)}
                  aria-label="Todas las áreas"
                >
                  <option value="">Todas las áreas</option>
                  {areas
                    .filter((area) => area.active)
                    .map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                </select>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar organización…"
                  aria-label="Buscar organización"
                />
              </div>
              {orgs.length === 0 ? (
                <p className="attn-placeholder">
                  {view === "vivo"
                    ? "No hay conversaciones en vivo. Nadie figura como disponible."
                    : areas.length === 0
                      ? "No tienes áreas asignadas. El dueño las marca en Ajustes."
                      : "No hay organizaciones en esta vista."}
                </p>
              ) : (
                <ul className="attn-org-list">
                  {orgs.map((row) => {
                    const active = row.tenantId === selectedTenantId;
                    return (
                      <li key={row.tenantId}>
                        <button
                          type="button"
                          className={active ? "is-active" : undefined}
                          onClick={() => void openOrg(row.tenantId)}
                        >
                          <span className="attn-org-mark" aria-hidden="true">
                            {row.company.trim().charAt(0).toUpperCase() || "C"}
                          </span>
                          <span className="attn-org-copy">
                            <strong>
                              {row.company}
                              {row.unreadCount > 0 ? <i className="attn-dot" /> : null}
                            </strong>
                            <small>{row.preview}</small>
                          </span>
                          <span className="attn-org-meta">
                            <time dateTime={row.lastAt}>{formatAttentionWhen(row.lastAt)}</time>
                            {row.openCount > 0 ? <em>{row.openCount}</em> : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {orgs.length === 0 ? null : (
            <section className="attn-stage" aria-label="Conversación">
              {selectedOrg && selected ? (
                <OrgStage
                  orgName={selectedOrg.company}
                  cases={orgCases}
                  item={selected}
                  tab={stageTab}
                  mode="panel"
                  colleagues={colleagues}
                  sending={sending}
                  onTab={setStageTab}
                  onSelectCase={(id) => void openCase(id)}
                  onPost={(payload) => post(payload)}
                  onClose={onClose}
                />
              ) : (
                <div className="attn-stage-empty">
                  <p>Elige una organización para atenderla.</p>
                </div>
              )}
            </section>
            )}
          </div>
        ) : null}

        {!loading && mode === "client" ? (
          <div className="attn-shell is-client">
            <section className="attn-inbox" aria-label="Mis casos">
              <header className="attn-inbox-head">
                <div>
                  <h2 id="attention-title">Atención</h2>
                  <p>Casos de esta empresa. Nelzuri ya conoce la organización y tu usuario.</p>
                </div>
                <button type="button" className="ghost" onClick={onClose}>
                  Cerrar
                </button>
              </header>
              <div className="attn-inbox-tools is-client-tools">
                <div className="attn-views" role="tablist" aria-label="Casos de la empresa">
                  {CLIENT_FILTERS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={clientFilter === item.id && !composing}
                      className={clientFilter === item.id && !composing ? "is-on" : undefined}
                      onClick={() => {
                        setClientFilter(item.id);
                        setComposing(false);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="primary attn-new"
                  onClick={() => {
                    setComposing(true);
                    setSelectedId("");
                    setSelectedTenantId("");
                  }}
                >
                  + Nueva atención
                </button>
              </div>
              {shown.length === 0 && !composing ? (
                <p className="attn-placeholder">No hay casos en esta vista.</p>
              ) : (
                <ul className="attn-org-list">
                  {shown.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={item.id === selectedId && !composing ? "is-active" : undefined}
                        onClick={() => void openCase(item.id)}
                      >
                        <span className={`attn-org-mark ${AREA_TONE[item.areaId] ?? "is-general"}`} aria-hidden="true">
                          {item.areaName.trim().charAt(0).toUpperCase() || "C"}
                        </span>
                        <span className="attn-org-copy">
                          <strong>
                            {item.subject}
                            {item.unread ? <i className="attn-dot" /> : null}
                          </strong>
                          <small>
                            {item.areaName}
                            {item.productLabel ? ` · ${item.productLabel}` : ""}
                          </small>
                        </span>
                        <span className="attn-org-meta">
                          <time dateTime={item.updatedAt}>{formatAttentionWhen(item.updatedAt)}</time>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="attn-stage" aria-label="Conversación">
              {composing ? (
                <Compose areas={areas.filter((area) => area.active)} sending={sending} onSubmit={(payload) => post(payload)} />
              ) : selected ? (
                <OrgStage
                  orgName={selected.company}
                  cases={[selected]}
                  item={selected}
                  tab={stageTab}
                  mode="client"
                  colleagues={colleagues}
                  sending={sending}
                  onTab={setStageTab}
                  onSelectCase={(id) => void openCase(id)}
                  onPost={(payload) => post(payload)}
                  onClose={onClose}
                />
              ) : (
                <div className="attn-stage-empty">
                  <p>Elige un caso o abre uno nuevo.</p>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Compose({
  areas,
  sending,
  onSubmit,
}: {
  areas: AreaOption[];
  sending: boolean;
  onSubmit: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const [areaId, setAreaId] = useState(areas[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [contextNote, setContextNote] = useState("");
  const [productId, setProductId] = useState("");
  const [priority, setPriority] = useState<CasePriority>("normal");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      action: "open",
      areaId,
      subject,
      body,
      contextNote,
      productId,
      priority,
    });
  }

  return (
    <form className="attn-compose" onSubmit={submit}>
      <h2>Nueva atención</h2>
      <label>
        Área
        <select value={areaId} onChange={(event) => setAreaId(event.target.value)} required>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </label>
      <p className="lead">{areas.find((area) => area.id === areaId)?.description}</p>
      <label>
        Asunto
        <input value={subject} maxLength={120} onChange={(event) => setSubject(event.target.value)} required />
      </label>
      <label>
        Producto, si corresponde
        <select value={productId} onChange={(event) => setProductId(event.target.value)}>
          <option value="">Ninguno</option>
          {MENTOR_APPS.map((id) => (
            <option key={id} value={id}>
              {mentorAppLabel(id)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Prioridad
        <select value={priority} onChange={(event) => setPriority(event.target.value as CasePriority)}>
          <option value="normal">Normal</option>
          <option value="alta">Alta</option>
        </select>
      </label>
      <label>
        Antecedentes
        <textarea value={contextNote} rows={3} maxLength={2000} onChange={(event) => setContextNote(event.target.value)} />
      </label>
      <label>
        Mensaje
        <textarea value={body} rows={4} maxLength={2000} onChange={(event) => setBody(event.target.value)} required />
      </label>
      <button type="submit" className="primary" disabled={sending || areas.length === 0}>
        {sending ? "Enviando…" : "Abrir caso"}
      </button>
    </form>
  );
}

function OrgStage({
  orgName,
  cases,
  item,
  tab,
  mode,
  colleagues,
  sending,
  onTab,
  onSelectCase,
  onPost,
  onClose,
}: {
  orgName: string;
  cases: PublicAttentionCase[];
  item: PublicAttentionCase;
  tab: StageTab;
  mode: "panel" | "client";
  colleagues: Colleague[];
  sending: boolean;
  onTab: (tab: StageTab) => void;
  onSelectCase: (id: string) => void;
  onPost: (payload: Record<string, unknown>) => Promise<boolean>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [conditions, setConditions] = useState("");
  const takers = colleagues.filter((person) => person.allAreas || person.areaIds.includes(item.areaId));
  const solicitudes = cases.length;

  useEffect(() => {
    setDraft("");
    setConditions("");
  }, [item.id]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sent = await onPost({ action: "message", caseId: item.id, body: draft });
    if (sent) setDraft("");
  }

  return (
    <div className="attn-stage-inner">
      <header className="attn-stage-head">
        <div>
          <h3>{orgName}</h3>
          <p>
            Cliente · {item.areaName}
            {item.assigneeName ? ` · ${item.assigneeName}` : " · Sin asignar"}
          </p>
        </div>
        <div className="attn-stage-actions">
          {mode === "panel" && item.status !== "resuelto" ? (
            <label className={`attn-status is-${item.status}`}>
              <span className="sr-only">Estado del caso</span>
              <select
                aria-label="Estado del caso"
                value={item.status}
                onChange={(event) => void onPost({ action: "status", caseId: item.id, status: event.target.value })}
              >
                <option value="pendiente">{statusLabel("pendiente")}</option>
                <option value="abierto">{statusLabel("abierto")}</option>
                <option value="resuelto">{statusLabel("resuelto")}</option>
              </select>
            </label>
          ) : (
            <span className={`attn-status-pill is-${item.status}`}>{statusLabel(item.status)}</span>
          )}
          {mode === "panel" && item.status !== "resuelto" ? (
            <select
              className="attn-assign"
              aria-label="Asignar"
              value={item.assigneeUserId ?? ""}
              onChange={(event) => void onPost({ action: "assign", caseId: item.id, assigneeUserId: event.target.value })}
            >
              <option value="">Asignar…</option>
              {takers.map((person) => (
                <option key={person.userId} value={person.userId}>
                  {person.displayName}
                </option>
              ))}
            </select>
          ) : null}
          <button type="button" className="ghost attn-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
      </header>

      {cases.length > 1 ? (
        <div className="attn-case-tabs" role="tablist" aria-label="Casos de la organización">
          {cases.map((row) => (
            <button
              key={row.id}
              type="button"
              role="tab"
              aria-selected={row.id === item.id}
              className={row.id === item.id ? "is-on" : undefined}
              onClick={() => onSelectCase(row.id)}
            >
              <i className={`attn-area-dot ${AREA_TONE[row.areaId] ?? "is-general"}`} aria-hidden="true" />
              <span>{row.subject}</span>
              {row.unread ? <i className="attn-dot" /> : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className="attn-stage-tabs" role="tablist" aria-label="Detalle">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "conversacion"}
          className={tab === "conversacion" ? "is-on" : undefined}
          onClick={() => onTab("conversacion")}
        >
          Conversación
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "solicitudes"}
          className={tab === "solicitudes" ? "is-on" : undefined}
          onClick={() => onTab("solicitudes")}
        >
          Solicitudes ({solicitudes})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "informacion"}
          className={tab === "informacion" ? "is-on" : undefined}
          onClick={() => onTab("informacion")}
        >
          Información
        </button>
      </div>

      {tab === "conversacion" ? (
        <div className="attn-thread-pane">
          {item.commercial ? (
            <div className="attn-request-card">
              <div>
                <p>Solicitud de aplicación</p>
                <strong>{item.commercial.appLabel}</strong>
              </div>
              <span>{item.commercial.approval ? approvalLabel(item.commercial.approval) : "Solicitado"}</span>
            </div>
          ) : null}
          {item.messages.length === 0 ? <p className="lead">Todavía no hay mensajes.</p> : null}
          <ol className="attn-log">
            {item.messages.map((message) => (
              <li key={message.id} className={message.role === "staff" ? "is-staff" : "is-client"}>
                <span className="attn-bubble-avatar" aria-hidden="true">
                  {message.role === "staff" ? "N" : (orgName.trim().charAt(0).toUpperCase() || "C")}
                </span>
                <div>
                  <small>{message.label}</small>
                  <p>{message.body}</p>
                </div>
              </li>
            ))}
          </ol>
          {item.commercial?.canApprove ? (
            <div className="attn-commercial">
              <p>{activationLabel(item.commercial.activation)}. La activación se hace en Clientes.</p>
              <label>
                Condiciones aceptadas, si las hay
                <textarea value={conditions} rows={2} maxLength={2000} onChange={(event) => setConditions(event.target.value)} />
              </label>
              <div className="attn-approve-row">
                <button
                  type="button"
                  className="primary"
                  disabled={sending}
                  onClick={() => void onPost({ action: "approve", caseId: item.id, decision: "aprobada", conditions })}
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  className="ghost"
                  disabled={sending}
                  onClick={() => void onPost({ action: "approve", caseId: item.id, decision: "rechazada", conditions })}
                >
                  Rechazar
                </button>
              </div>
            </div>
          ) : null}
          {item.status === "resuelto" ? (
            <p className="lead">El caso está resuelto.</p>
          ) : (
            <form className="attn-composer" onSubmit={send}>
              <textarea
                value={draft}
                rows={2}
                maxLength={2000}
                placeholder="Escribe un mensaje…"
                aria-label="Mensaje"
                onChange={(event) => setDraft(event.target.value)}
              />
              <button type="submit" className="primary" disabled={sending || !draft.trim()} aria-label="Enviar">
                {sending ? "…" : "↑"}
              </button>
            </form>
          )}
        </div>
      ) : null}

      {tab === "solicitudes" ? (
        <ul className="attn-request-list">
          {cases.map((row) => (
            <li key={row.id}>
              <button type="button" className={row.id === item.id ? "is-active" : undefined} onClick={() => onSelectCase(row.id)}>
                <span>
                  <strong>{row.subject}</strong>
                  <small>
                    {row.areaName} · {statusLabel(row.status)}
                    {row.productLabel ? ` · ${row.productLabel}` : ""}
                  </small>
                </span>
                <em>{formatAttentionWhen(row.updatedAt)}</em>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "informacion" ? (
        <div className="attn-info">
          <dl>
            <div>
              <dt>Caso</dt>
              <dd>{item.code}</dd>
            </div>
            <div>
              <dt>Área</dt>
              <dd>{item.areaName}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{statusLabel(item.status)}</dd>
            </div>
            <div>
              <dt>Prioridad</dt>
              <dd className={item.priority === "alta" ? "is-alta" : undefined}>{priorityLabel(item.priority)}</dd>
            </div>
            <div>
              <dt>Solicitante</dt>
              <dd>{item.requesterName}</dd>
            </div>
            <div>
              <dt>Ejecutivo</dt>
              <dd>{item.assigneeName ?? "Sin asignar"}</dd>
            </div>
            {item.productLabel ? (
              <div>
                <dt>Aplicación</dt>
                <dd>{item.productLabel}</dd>
              </div>
            ) : null}
          </dl>
          {item.contextNote ? (
            <div className="attn-note">
              <p>Antecedentes</p>
              <p>{item.contextNote}</p>
            </div>
          ) : null}
          {item.commercial ? (
            <div className="attn-commercial">
              <p>Solicitud de {item.commercial.appLabel}.</p>
              <p>
                {item.commercial.approval
                  ? approvalLabel(item.commercial.approval)
                  : "Aprobación reservada al responsable económico."}
              </p>
              <p>{activationLabel(item.commercial.activation)}. La activación se hace en Clientes.</p>
              {item.commercial.conditions ? <p>Condiciones: {item.commercial.conditions}</p> : null}
            </div>
          ) : null}
          {mode === "panel" && item.status !== "resuelto" ? (
            <label className="attn-priority">
              Prioridad
              <select
                aria-label="Prioridad del caso"
                value={item.priority}
                onChange={(event) => void onPost({ action: "priority", caseId: item.id, priority: event.target.value })}
              >
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
              </select>
            </label>
          ) : null}
          {item.events.length > 0 ? (
            <details open>
              <summary>Historial</summary>
              <ul className="attn-events">
                {item.events.map((entry) => (
                  <li key={entry.id}>{entry.detail}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
