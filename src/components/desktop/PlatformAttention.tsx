"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AttachControl, useTicketAttachment } from "@/components/desktop/attention-attach";
import {
  priorityLabel,
  statusLabel,
  type PublicAttentionCase,
} from "@/lib/desktop/attention";
import {
  countAppliedDeskFilters,
  emptyDeskFilters,
  type DeskFilterFields,
} from "@/lib/desktop/help-origins";
import {
  actorLabel,
  holdSince,
  orderQueue,
  QUEUE_VIEWS,
  queueTurn,
  waitLabel,
  type QueueView,
} from "@/lib/desktop/platform-queue";
import {
  INTAKE_CHANNELS,
  MANUAL_INTAKE_CHANNELS,
  REPORT_PERIODS,
  filterIncidents,
  incidentCsv,
  incidentTotals,
  reportSince,
  resolveIntakeChannel,
  sendRequiresCompany,
  type ReportDispatchRecord,
} from "@/lib/desktop/platform-desk";

type Colleague = { userId: string; displayName: string; allAreas: boolean; areaIds: string[] };
type Company = { tenantId: string; name: string };
type Person = { userId: string; name: string; email: string; admin: boolean };
type Tab = "tickets" | "informes";

function ticketWhen(iso: string): string {
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return "";
  const clock = new Date(at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (at >= start.getTime()) return `Hoy, ${clock}`;
  const yesterday = new Date(start);
  yesterday.setDate(yesterday.getDate() - 1);
  if (at >= yesterday.getTime()) return `Ayer, ${clock}`;
  return new Date(at).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

type Glyph = { d: string } | { cx: number; cy: number; r: number };

function Icon({ glyph, size = 16 }: { glyph: Glyph[]; size?: number }) {
  return (
    <svg className="plat-ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {glyph.map((part, index) => ("d" in part ? <path key={index} d={part.d} /> : <circle key={index} cx={part.cx} cy={part.cy} r={part.r} />))}
    </svg>
  );
}

function Field({ glyph, children }: { glyph: Glyph[]; children: ReactNode }) {
  return (
    <span className="plat-field">
      <Icon glyph={glyph} />
      {children}
    </span>
  );
}

const ICO = {
  home: [
    { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" },
    { d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  ],
  chart: [{ d: "M4 20V12" }, { d: "M10 20V7" }, { d: "M16 20V4" }, { d: "M3 20h18" }],
  file: [
    { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" },
    { d: "M14 2v4a2 2 0 0 0 2 2h4" },
    { d: "M8 13h8" },
    { d: "M8 17h5" },
  ],
  filePlus: [
    { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" },
    { d: "M14 2v4a2 2 0 0 0 2 2h4" },
    { d: "M12 18v-6" },
    { d: "M9 15h6" },
  ],
  user: [{ d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }, { cx: 12, cy: 7, r: 4 }],
  filter: [{ d: "M3 4h18l-7 8v6l-4 2v-8Z" }],
  search: [{ cx: 11, cy: 11, r: 7 }, { d: "m20 20-3.5-3.5" }],
  plus: [{ d: "M12 5v14M5 12h14" }],
  send: [{ d: "m22 2-7 20-4-9-9-4Z" }, { d: "M22 2 11 13" }],
  down: [{ d: "M12 3v12" }, { d: "m7 11 5 5 5-5" }, { d: "M5 21h14" }],
  phone: [{ d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" }],
  mail: [
    { d: "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" },
    { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" },
  ],
  chat: [{ d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }],
  whatsapp: [{ d: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z" }],
  monitor: [
    { d: "M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" },
    { d: "M8 21h8" },
    { d: "M12 17v4" },
  ],
  layers: [
    { d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" },
    { d: "m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" },
    { d: "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" },
  ],
  nodes: [
    { cx: 6, cy: 12, r: 2.25 },
    { cx: 18, cy: 6, r: 2.25 },
    { cx: 18, cy: 18, r: 2.25 },
    { d: "M8.1 11.2 15.9 7.3" },
    { d: "M8.1 12.8 15.9 16.7" },
  ],
  calendar: [
    { d: "M4 5h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" },
    { d: "M16 3v4M8 3v4M3 10h18" },
  ],
  flag: [
    { d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" },
    { d: "M4 22V4" },
  ],
  tag: [
    { d: "M12.6 2.6 21 11l-8.4 8.4a2 2 0 0 1-2.8 0L2.6 12.2V4.2A1.6 1.6 0 0 1 4.2 2.6h8.4z" },
    { cx: 7.5, cy: 7.5, r: 1 },
  ],
  building: [
    { d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18z" },
    { d: "M10 6h.01M14 6h.01M10 10h.01M14 10h.01M10 14h.01M14 14h.01M10 18h4" },
  ],
} satisfies Record<string, Glyph[]>;

function channelMark(label: string): { glyph: Glyph[]; tone?: string } {
  if (label === "Teléfono") return { glyph: ICO.phone };
  if (label === "WhatsApp") return { glyph: ICO.whatsapp, tone: "is-whatsapp" };
  if (label === "Chat en vivo") return { glyph: ICO.chat };
  if (label === "Correo") return { glyph: ICO.mail };
  if (label === "Portal") return { glyph: ICO.monitor };
  return { glyph: ICO.file };
}

function historyOf(item: PublicAttentionCase) {
  return [
    ...item.events.map((entry) => ({ id: `e-${entry.id}`, at: entry.at, title: entry.detail, body: entry.actorName })),
    ...item.messages.map((message) => ({ id: `m-${message.id}`, at: message.at, title: message.label, body: message.body })),
  ].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}

export function PlatformAttention({
  cases,
  companies,
  colleagues,
  selected,
  sending,
  loading,
  error,
  defaultArea,
  viewerUserId,
  onClose,
  onOpen,
  onClear,
  onPost,
}: {
  cases: PublicAttentionCase[];
  companies: Company[];
  colleagues: Colleague[];
  selected: PublicAttentionCase | null;
  sending: boolean;
  loading: boolean;
  error: string;
  defaultArea: string;
  viewerUserId: string;
  onClose: () => void;
  onOpen: (item: PublicAttentionCase) => void;
  onClear: () => void;
  onPost: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const [enlarged, setEnlarged] = useState(false);
  const [tab, setTab] = useState<Tab>("tickets");
  const [query, setQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<DeskFilterFields>(emptyDeskFilters());
  const [draftFilters, setDraftFilters] = useState<DeskFilterFields>(emptyDeskFilters());
  const [appliedChannel, setAppliedChannel] = useState("");
  const [draftChannel, setDraftChannel] = useState("");
  const [queueView, setQueueView] = useState<QueueView>("por_atender");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const queueScroll = useRef<HTMLDivElement>(null);
  const reportScroll = useRef<HTMLElement>(null);
  const viewMemory = useRef<{ tab: Tab; queue: number; report: number }>({ tab: "tickets", queue: 0, report: 0 });
  const restoreView = useRef(false);
  const pinnedQueue = useRef<number | null>(null);
  const [composing, setComposing] = useState(false);
  const [composeSession, setComposeSession] = useState(0);
  const [period, setPeriod] = useState<string>("30");
  const [reportTenant, setReportTenant] = useState("");
  const [reportChannel, setReportChannel] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtersOpen) return;
    function onPointer(event: PointerEvent) {
      if (!filterRef.current?.contains(event.target as Node)) setFiltersOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [filtersOpen]);

  useEffect(() => {
    setNow(Date.now());
  }, [cases]);

  useEffect(() => {
    if (queueScroll.current) queueScroll.current.scrollTop = 0;
  }, [queueView, query]);

  useEffect(() => {
    if (composing || !restoreView.current) return;
    restoreView.current = false;
    const { queue, report } = viewMemory.current;
    const frame = requestAnimationFrame(() => {
      if (queueScroll.current) queueScroll.current.scrollTop = queue;
      if (reportScroll.current) reportScroll.current.scrollTop = report;
    });
    return () => cancelAnimationFrame(frame);
  }, [composing]);

  useEffect(() => {
    const top = pinnedQueue.current;
    if (top == null) return;
    pinnedQueue.current = null;
    const apply = () => {
      if (queueScroll.current) queueScroll.current.scrollTop = top;
    };
    apply();
    const frame = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(frame);
  }, [selected?.id]);

  const listed = orderQueue(cases, { view: queueView, viewerUserId, query }).filter((item) => {
    if (appliedFilters.tenantId && item.tenantId !== appliedFilters.tenantId) return false;
    if (appliedFilters.status && item.status !== appliedFilters.status) return false;
    if (appliedFilters.priority && item.priority !== appliedFilters.priority) return false;
    if (appliedFilters.assigneeUserId && item.assigneeUserId !== appliedFilters.assigneeUserId) return false;
    if (appliedChannel && resolveIntakeChannel(item) !== appliedChannel) return false;
    return true;
  });
  const queueCounts = Object.fromEntries(
    QUEUE_VIEWS.map((view) => [view.id, orderQueue(cases, { view: view.id, viewerUserId }).length])
  ) as Record<QueueView, number>;

  const report = useMemo(() => {
    const since = reportSince(period, Date.now()) ?? 0;
    const rows = filterIncidents(cases, { since, tenantId: reportTenant, channel: reportChannel });
    return { rows, totals: incidentTotals(rows) };
  }, [cases, period, reportChannel, reportTenant]);

  const activeFilterCount = countAppliedDeskFilters(appliedFilters) + (appliedChannel ? 1 : 0);
  const periodLabel = REPORT_PERIODS.find((item) => item.id === period)?.label ?? "Últimos 30 días";
  const reportCompany = companies.find((company) => company.tenantId === reportTenant)?.name ?? "";

  function openFilters() {
    setDraftFilters(appliedFilters);
    setDraftChannel(appliedChannel);
    setFiltersOpen(true);
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
    setAppliedChannel(draftChannel);
    setFiltersOpen(false);
  }

  function clearDraft() {
    setDraftFilters(emptyDeskFilters());
    setDraftChannel("");
  }

  function openComposer() {
    viewMemory.current = {
      tab,
      queue: queueScroll.current?.scrollTop ?? 0,
      report: reportScroll.current?.scrollTop ?? 0,
    };
    restoreView.current = true;
    setComposeSession((value) => value + 1);
    setComposing(true);
    setSendOpen(false);
  }

  function closeComposer() {
    setTab(viewMemory.current.tab);
    setComposing(false);
  }

  function openQueued(item: PublicAttentionCase) {
    pinnedQueue.current = queueScroll.current?.scrollTop ?? 0;
    onOpen(item);
  }

  function exportReport() {
    const csv = incidentCsv(
      report.rows.map((item) => ({
        code: item.code,
        subject: item.subject,
        company: item.company,
        requester: item.requesterName,
        channel: item.channelLabel,
        status: statusLabel(item.status),
      }))
    );
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "informe-incidencias.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className={`ajustes-window is-clients is-attention is-attention-panel is-platform-capsule${enlarged ? " is-enlarged" : ""}${composing ? " is-intake-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="attention-title"
      onClick={(event) => event.stopPropagation()}
    >
      <header className="plat-bar">
        <h2 id="attention-title">
          <span className="plat-mark" aria-hidden="true">
            <Icon glyph={ICO.layers} />
          </span>
          Atención · Plataforma
        </h2>
        <div className="plat-chrome">
          <button type="button" aria-label="Reducir" onClick={() => setEnlarged(false)}>
            <span />
          </button>
          <button type="button" aria-label="Ampliar" aria-pressed={enlarged} onClick={() => setEnlarged((value) => !value)}>
            <span />
          </button>
          <button type="button" aria-label="Cerrar" onClick={onClose}>
            <span />
          </button>
        </div>
      </header>
      <div className="plat-tabs">
        {tab === "informes" ? (
          <button type="button" onClick={() => setTab("tickets")}>
            <Icon glyph={ICO.home} />
            Cola
          </button>
        ) : null}
        <button type="button" className={`plat-side${tab === "informes" ? " is-on" : ""}`} onClick={() => setTab("informes")}>
          <Icon glyph={ICO.chart} />
          Informes
        </button>
        <span className="plat-tabs-gap" />
        {tab === "informes" ? (
          <button
            type="button"
            className="primary"
            onClick={() => {
              setSendOpen(true);
              setComposing(false);
            }}
          >
            <Icon glyph={ICO.send} />
            Enviar informe
          </button>
        ) : null}
        <button type="button" className="primary" onClick={openComposer}>
          <Icon glyph={ICO.plus} />
          Nuevo ticket
        </button>
      </div>
      {error ? <p className="form-error attn-error">{error}</p> : null}
      {loading ? <p className="ajustes-wait">Abriendo…</p> : null}
      <div className={`plat-stage${composing ? " is-intake" : ""}`}>
      {!loading ? (
        <div className="plat-body" hidden={composing}>
          {tab === "tickets" ? (
            <div className={`plat-work${selected ? " is-open" : ""}`}>
            <section className="plat-queue" aria-label="Cola de tickets">
              <div className="plat-tools">
                <label className="plat-search">
                  <Icon glyph={ICO.search} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar asunto, empresa o código..."
                    aria-label="Buscar asunto, empresa o código"
                  />
                </label>
                <div className="plat-filter-anchor" ref={filterRef}>
                  <button type="button" className={filtersOpen ? "is-on" : undefined} aria-expanded={filtersOpen} onClick={() => (filtersOpen ? setFiltersOpen(false) : openFilters())}>
                    <Icon glyph={ICO.filter} />
                    Filtros
                    {activeFilterCount > 0 ? <em>{activeFilterCount}</em> : null}
                  </button>
                  {filtersOpen ? (
                    <div className="attn-filter-float" role="dialog" aria-label="Filtros">
                      <label>
                        Empresa
                        <Field glyph={ICO.layers}>
                        <select aria-label="Empresa del filtro" value={draftFilters.tenantId} onChange={(event) => setDraftFilters((current) => ({ ...current, tenantId: event.target.value }))}>
                          <option value="">Todas las empresas</option>
                          {companies.map((company) => (
                            <option key={company.tenantId} value={company.tenantId}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                        </Field>
                      </label>
                      <label>
                        Origen
                        <Field glyph={ICO.nodes}>
                        <select aria-label="Origen" value={draftChannel} onChange={(event) => setDraftChannel(event.target.value)}>
                          <option value="">Todos los canales</option>
                          {INTAKE_CHANNELS.map((channel) => (
                            <option key={channel.id} value={channel.id}>
                              {channel.label}
                            </option>
                          ))}
                        </select>
                        </Field>
                      </label>
                      <label>
                        Estado
                        <Field glyph={ICO.tag}>
                        <select aria-label="Estado" value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}>
                          <option value="">Todos los estados</option>
                          <option value="pendiente">{statusLabel("pendiente")}</option>
                          <option value="abierto">{statusLabel("abierto")}</option>
                          <option value="confirmacion">{statusLabel("confirmacion")}</option>
                          <option value="resuelto">{statusLabel("resuelto")}</option>
                        </select>
                        </Field>
                      </label>
                      <label>
                        Prioridad
                        <Field glyph={ICO.flag}>
                        <select aria-label="Prioridad" value={draftFilters.priority} onChange={(event) => setDraftFilters((current) => ({ ...current, priority: event.target.value }))}>
                          <option value="">Todas las prioridades</option>
                          <option value="normal">{priorityLabel("normal")}</option>
                          <option value="alta">{priorityLabel("alta")}</option>
                        </select>
                        </Field>
                      </label>
                      <label>
                        Responsable
                        <Field glyph={ICO.user}>
                        <select aria-label="Responsable" value={draftFilters.assigneeUserId} onChange={(event) => setDraftFilters((current) => ({ ...current, assigneeUserId: event.target.value }))}>
                          <option value="">Todos los responsables</option>
                          {colleagues.map((person) => (
                            <option key={person.userId} value={person.userId}>
                              {person.displayName}
                            </option>
                          ))}
                        </select>
                        </Field>
                      </label>
                      <div className="attn-filter-actions">
                        <button type="button" className="ghost" onClick={clearDraft}>
                          Limpiar
                        </button>
                        <button type="button" className="primary" onClick={applyFilters}>
                          Aplicar
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="plat-views" role="tablist" aria-label="Vistas de la cola">
                {QUEUE_VIEWS.map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    role="tab"
                    aria-selected={queueView === view.id}
                    className={queueView === view.id ? "is-on" : undefined}
                    onClick={() => setQueueView(view.id)}
                  >
                    {view.label}
                    <em>{queueCounts[view.id]}</em>
                  </button>
                ))}
              </div>
              <div className="plat-scroll" ref={queueScroll}>
                {listed.length === 0 ? (
                  <p className="attn-placeholder">No hay tickets en esta vista.</p>
                ) : (
                  <div className="plat-table" role="list" aria-label="Tickets">
                    {listed.map((item) => {
                      const turn = queueTurn(item);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="listitem"
                          className={selected?.id === item.id ? "is-on" : undefined}
                          aria-current={selected?.id === item.id ? "true" : undefined}
                          onClick={() => openQueued(item)}
                        >
                          <span className="plat-subject">
                            {item.priority === "alta" ? <i className="plat-urgent" title="Urgente" /> : null}
                            <em>{item.subject}</em>
                          </span>
                          <span className="plat-queue-meta">
                            <span>{item.company}</span>
                            <time dateTime={new Date(holdSince(item)).toISOString()}>{now == null ? "" : waitLabel(holdSince(item), now)}</time>
                            <span>{actorLabel(turn)}</span>
                            <span>{item.assigneeName || "Sin asignar"}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
            {selected ? (
              <TicketDetail
                item={selected}
                colleagues={colleagues}
                sending={sending}
                now={now}
                onPost={onPost}
                onClose={() => {
                  pinnedQueue.current = queueScroll.current?.scrollTop ?? 0;
                  onClear();
                }}
              />
            ) : null}
            </div>
          ) : null}
          {tab === "informes" ? (
            <section className="plat-report" aria-label="Informes de incidencias" ref={reportScroll}>
              <h3>Informes de incidencias</h3>
              <div className="plat-tools">
                <Field glyph={ICO.calendar}>
                  <select aria-label="Período" value={period} onChange={(event) => setPeriod(event.target.value)}>
                    {REPORT_PERIODS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field glyph={ICO.layers}>
                  <select aria-label="Empresa del informe" value={reportTenant} onChange={(event) => setReportTenant(event.target.value)}>
                    <option value="">Todas las empresas</option>
                    {companies.map((company) => (
                      <option key={company.tenantId} value={company.tenantId}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field glyph={ICO.nodes}>
                  <select aria-label="Canal del informe" value={reportChannel} onChange={(event) => setReportChannel(event.target.value)}>
                    <option value="">Todos los canales</option>
                    {INTAKE_CHANNELS.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <button type="button" className="ghost plat-export" onClick={exportReport}>
                  <Icon glyph={ICO.down} />
                  Exportar
                </button>
              </div>
              <p className="plat-stats">
                <span>
                  <Icon glyph={ICO.chart} />
                  <strong>{report.totals.received}</strong> recibidas
                </span>
                <span>
                  <strong>{report.totals.open}</strong> abiertas
                </span>
                <span>
                  <strong>{report.totals.resolved}</strong> resueltas
                </span>
              </p>
              {report.rows.length === 0 ? (
                <p className="attn-placeholder">No hay incidencias en este período.</p>
              ) : (
                <div className="plat-table" role="table" aria-label="Incidencias">
                  <div className="plat-head" role="row">
                    <span>Incidencia</span>
                    <span>Empresa</span>
                    <span>Solicitante</span>
                    <span>Canal</span>
                    <span>Estado</span>
                  </div>
                  {report.rows.map((item) => {
                    const origin = channelMark(item.channelLabel);
                    return (
                    <div key={item.id} role="row">
                      <span className="plat-ticket">
                        <Icon glyph={ICO.file} />
                        <b>{item.code}</b>
                        <em>{item.subject}</em>
                      </span>
                      <span>{item.company}</span>
                      <span>{item.requesterName}</span>
                      <span className={`plat-channel${origin.tone ? ` ${origin.tone}` : ""}`}>
                        <Icon glyph={origin.glyph} />
                        {item.channelLabel}
                      </span>
                      <span className={`attn-status-pill is-${item.status}`}>{statusLabel(item.status)}</span>
                    </div>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}
        </div>
      ) : null}
      {composing ? (
        <IntakeDrawer
          key={composeSession}
          companies={companies}
          defaultArea={defaultArea}
          sending={sending}
          onClose={closeComposer}
          onSubmit={onPost}
          onCreated={() => {
            setComposing(false);
            setTab("tickets");
          }}
        />
      ) : null}
      {sendOpen ? (
        <SendDrawer
          companies={companies}
          lockedTenant={reportTenant}
          lockedName={reportCompany}
          period={period}
          periodLabel={periodLabel}
          channel={reportChannel}
          onClose={() => setSendOpen(false)}
        />
      ) : null}
      </div>
    </div>
  );
}

function TicketDetail({
  item,
  colleagues,
  sending,
  now,
  onPost,
  onClose,
}: {
  item: PublicAttentionCase;
  colleagues: Colleague[];
  sending: boolean;
  now: number | null;
  onPost: (payload: Record<string, unknown>) => Promise<boolean>;
  onClose: () => void;
}) {
  const [reply, setReply] = useState("");
  const takers = colleagues.filter((person) => person.allAreas || person.areaIds.includes(item.areaId));
  const closed = item.status === "resuelto";
  const origin = channelMark(item.channelLabel);

  useEffect(() => {
    setReply("");
  }, [item.id]);

  return (
    <section className="plat-detail" aria-label="Detalle del ticket">
      <header>
        <div>
          <h3>{item.subject}</h3>
          <p>
            {item.company} · {item.code} · {now == null ? "" : waitLabel(holdSince(item), now)} · {actorLabel(queueTurn(item))}
          </p>
        </div>
        <div className="plat-detail-actions">
          <button type="button" onClick={onClose}>
            Cerrar
          </button>
          {item.status === "confirmacion" ? (
            <span className="attn-status-pill is-confirmacion">{statusLabel("confirmacion")}</span>
          ) : (
            <select
              className={`attn-status is-${item.status}`}
              aria-label="Estado"
              value={item.status}
              onChange={(event) => void onPost({ action: "status", caseId: item.id, status: event.target.value })}
            >
              <option value="pendiente">{statusLabel("pendiente")}</option>
              <option value="abierto">{statusLabel("abierto")}</option>
              <option value="resuelto">{statusLabel("resuelto")}</option>
            </select>
          )}
        </div>
      </header>
      <dl className="plat-facts">
        <div>
          <dt>
            <Icon glyph={ICO.user} />
            Solicitante
          </dt>
          <dd>{item.requesterName || "Sin solicitante"}</dd>
        </div>
        <div>
          <dt className={origin.tone}>
            <Icon glyph={origin.glyph} />
            Origen
          </dt>
          <dd>{item.channelLabel}</dd>
        </div>
        <div>
          <dt>
            <Icon glyph={ICO.file} />
            Registrado por
          </dt>
          <dd>{item.registeredByName || "—"}</dd>
        </div>
      </dl>
      <div className="plat-assign">
        <label>
          <Icon glyph={ICO.flag} />
          Prioridad
          <select
            aria-label="Prioridad"
            value={item.priority}
            onChange={(event) => void onPost({ action: "priority", caseId: item.id, priority: event.target.value })}
          >
            <option value="normal">{priorityLabel("normal")}</option>
            <option value="alta">{priorityLabel("alta")}</option>
          </select>
        </label>
        <label>
          <Icon glyph={ICO.user} />
          Asignado a
          <select
            aria-label="Asignado a"
            value={item.assigneeUserId ?? ""}
            disabled={closed}
            onChange={(event) => void onPost({ action: "assign", caseId: item.id, assigneeUserId: event.target.value })}
          >
            <option value="">Sin asignar</option>
            {takers.map((person) => (
              <option key={person.userId} value={person.userId}>
                {person.displayName}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="plat-thread">
        <h4>Historial del ticket</h4>
        <ol>
          {historyOf(item).map((entry) => (
            <li key={entry.id}>
              <strong>{entry.title}</strong>
              {entry.body ? <p>{entry.body}</p> : null}
              <time dateTime={entry.at}>{ticketWhen(entry.at)}</time>
            </li>
          ))}
        </ol>
      {item.attachmentDataUrl ? (
        <p className="attn-file">
          <a href={item.attachmentDataUrl} target="_blank" rel="noreferrer">
            {item.attachmentName || "Adjunto"}
          </a>
        </p>
      ) : null}
      {!closed && item.status !== "confirmacion" ? (
        <div className="plat-reply">
          <button
            type="button"
            className="ghost"
            disabled={sending}
            onClick={() => void onPost({ action: "confirm-ask", caseId: item.id })}
          >
            Pedir confirmación
          </button>
        </div>
      ) : null}
      {item.intakeChannel === "envivo" || item.originId === "escritorio.chat-en-vivo" ? (
        <div className="plat-reply">
          <button
            type="button"
            className="ghost"
            disabled={sending || Boolean(item.ticketCaseId)}
            onClick={() => void onPost({ action: "promote", caseId: item.id })}
          >
            {item.ticketCaseId ? `Mismo ticket ${item.code}` : "Pasar a ticket"}
          </button>
        </div>
      ) : null}
      {closed ? null : (
        <form
          className="plat-reply"
          onSubmit={(event) => {
            event.preventDefault();
            if (!reply.trim()) return;
            void onPost({ action: "message", caseId: item.id, body: reply }).then((ok) => {
              if (ok) setReply("");
            });
          }}
        >
          <textarea
            value={reply}
            rows={3}
            maxLength={2000}
            placeholder="Escribe una respuesta al solicitante..."
            aria-label="Respuesta"
            onChange={(event) => setReply(event.target.value)}
          />
          <div>
            <button type="button" className="ghost" onClick={() => setReply("")}>
              Cancelar
            </button>
            <button type="submit" className="primary" disabled={sending || !reply.trim()}>
              {sending ? "Enviando…" : "Responder"}
            </button>
          </div>
        </form>
      )}
      </div>
    </section>
  );
}

function IntakeDrawer({
  companies,
  defaultArea,
  sending,
  onClose,
  onSubmit,
  onCreated,
}: {
  companies: Company[];
  defaultArea: string;
  sending: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<boolean>;
  onCreated: () => void;
}) {
  const [tenantId, setTenantId] = useState("");
  const [mode, setMode] = useState<"" | "user" | "contact">("");
  const [contactName, setContactName] = useState("");
  const [requesterUserId, setRequesterUserId] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleState, setPeopleState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [channel, setChannel] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const companyRef = useRef<HTMLSelectElement>(null);
  const attached = useTicketAttachment(true);
  const chosen = people.find((person) => person.userId === requesterUserId) ?? null;
  const requesterReady = mode === "user" ? Boolean(chosen) : mode === "contact" && contactName.trim().length >= 2;

  useEffect(() => {
    companyRef.current?.focus();
  }, []);

  useEffect(() => {
    setMode("");
    setRequesterUserId("");
    setContactName("");
    if (!tenantId) {
      setPeople([]);
      setPeopleState("idle");
      return;
    }
    const controller = new AbortController();
    setPeopleState("loading");
    void fetch("/api/desktop/attention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "company-directory", tenantId }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as { ok?: boolean; authorized?: Person[] } | null;
        if (!response.ok || !payload?.ok) {
          setPeople([]);
          setPeopleState("error");
          return;
        }
        setPeople(payload.authorized ?? []);
        setPeopleState("ready");
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setPeople([]);
        setPeopleState("error");
      });
    return () => controller.abort();
  }, [tenantId]);

  function chooseMode(next: "user" | "contact") {
    setMode(next);
    setRequesterUserId("");
    setContactName("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!requesterReady) return;
    const ok = await onSubmit({
      action: "open",
      areaId: defaultArea,
      tenantId,
      subject,
      body,
      contactName: mode === "user" ? chosen?.name ?? "" : contactName.trim(),
      requesterUserId: mode === "user" ? chosen?.userId ?? "" : "",
      intakeChannel: channel,
      attachment: attached.attachment,
      priority: "normal",
    });
    if (ok) onCreated();
  }

  return (
    <form className={`plat-drawer is-intake${attached.dropping ? " is-dropping" : ""}`} aria-label="Nuevo ticket" onSubmit={(event) => void submit(event)} {...attached.dropProps}>
      <header>
        <h2>
          <Icon glyph={ICO.filePlus} />
          Nuevo ticket
        </h2>
        <button type="button" aria-label="Cerrar formulario" onClick={onClose}>
          ×
        </button>
      </header>
      <div className="plat-drawer-body">
      <label>
        <span className="plat-req">Empresa <i>*</i></span>
        <Field glyph={ICO.layers}>
        <select ref={companyRef} value={tenantId} required aria-label="Empresa del ticket" onChange={(event) => setTenantId(event.target.value)}>
          <option value="">Seleccionar empresa</option>
          {companies.map((company) => (
            <option key={company.tenantId} value={company.tenantId}>
              {company.name}
            </option>
          ))}
        </select>
        </Field>
      </label>
      <fieldset className="plat-who">
        <legend className="plat-req">Solicitante <i>*</i></legend>
        {tenantId ? (
          <div className="plat-who-options" role="radiogroup" aria-label="Solicitante">
            <button type="button" role="radio" aria-checked={mode === "user"} className={mode === "user" ? "is-on" : undefined} onClick={() => chooseMode("user")}>
              Elegir usuario de la empresa
            </button>
            <button type="button" role="radio" aria-checked={mode === "contact"} className={mode === "contact" ? "is-on" : undefined} onClick={() => chooseMode("contact")}>
              Registrar contacto sin cuenta
            </button>
          </div>
        ) : (
          <p className="plat-who-hint">Selecciona la empresa para indicar el solicitante.</p>
        )}
        {mode === "user" && tenantId ? (
          peopleState === "error" ? (
            <p className="plat-who-empty">No se pudieron leer los usuarios de la empresa.</p>
          ) : peopleState === "ready" && people.length === 0 ? (
            <p className="plat-who-empty">Esta empresa no tiene usuarios con cuenta.</p>
          ) : (
            <>
              <label>
                <span>Usuario</span>
                <Field glyph={ICO.user}>
                <select
                  value={requesterUserId}
                  required
                  aria-label="Usuario de la empresa"
                  disabled={peopleState === "loading"}
                  onChange={(event) => {
                    const person = people.find((item) => item.userId === event.target.value);
                    setRequesterUserId(person?.userId ?? "");
                    setContactName(person?.name ?? "");
                  }}
                >
                  <option value="">{peopleState === "loading" ? "Cargando usuarios…" : "Seleccionar usuario"}</option>
                  {people.map((person) => (
                    <option key={person.userId} value={person.userId}>
                      {person.name}
                    </option>
                  ))}
                </select>
                </Field>
              </label>
              {chosen ? (
                <p className="plat-who-account">
                  <strong>{chosen.name}</strong>
                  <span>Cuenta · {chosen.email}</span>
                </p>
              ) : null}
            </>
          )
        ) : null}
        {mode === "contact" && tenantId ? (
          <label>
            <span className="plat-req">Nombre del contacto <i>*</i></span>
            <Field glyph={ICO.user}>
            <input value={contactName} required minLength={2} maxLength={80} aria-label="Contacto sin cuenta" onChange={(event) => setContactName(event.target.value)} />
            </Field>
          </label>
        ) : null}
      </fieldset>
      <div className="plat-intake-pair">
      <label>
        <span className="plat-req">Canal de origen <i>*</i></span>
        <Field glyph={channel ? channelMark(INTAKE_CHANNELS.find((item) => item.id === channel)?.label ?? "").glyph : ICO.nodes}>
        <select value={channel} required aria-label="Canal de origen" onChange={(event) => setChannel(event.target.value)}>
          <option value="">Seleccionar canal</option>
          {MANUAL_INTAKE_CHANNELS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        </Field>
      </label>
      <label>
        <span className="plat-req">Asunto <i>*</i></span>
        <input value={subject} required minLength={3} maxLength={120} aria-label="Asunto" onChange={(event) => setSubject(event.target.value)} />
      </label>
      </div>
      <label className="plat-intake-copy">
        <span className="plat-req">Descripción <i>*</i></span>
        <textarea value={body} required rows={6} maxLength={2000} aria-label="Descripción" onChange={(event) => setBody(event.target.value)} />
      </label>
      <div className="plat-drawer-attach">
        <AttachControl attachment={attached.attachment} note={attached.note} dropping={attached.dropping} onPick={attached.takeFile} onClear={attached.clear} />
      </div>
      </div>
      <footer>
        <button type="button" className="ghost" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="primary" disabled={sending || !requesterReady}>
          {sending ? "Creando…" : "Crear ticket"}
        </button>
      </footer>
    </form>
  );
}

function SendDrawer({
  companies,
  lockedTenant,
  lockedName,
  period,
  periodLabel,
  channel,
  onClose,
}: {
  companies: Company[];
  lockedTenant: string;
  lockedName: string;
  period: string;
  periodLabel: string;
  channel: string;
  onClose: () => void;
}) {
  const [tenantId, setTenantId] = useState(lockedTenant);
  const [admins, setAdmins] = useState<Person[]>([]);
  const [authorized, setAuthorized] = useState<Person[]>([]);
  const [toUserId, setToUserId] = useState("");
  const [cc, setCc] = useState<Person[]>([]);
  const [pick, setPick] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [dispatch, setDispatch] = useState<ReportDispatchRecord | null>(null);
  const needsCompany = sendRequiresCompany(lockedTenant);
  const companyName = companies.find((company) => company.tenantId === tenantId)?.name || lockedName;

  useEffect(() => {
    if (!tenantId) {
      setAdmins([]);
      setAuthorized([]);
      setToUserId("");
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setNotice("");
    void fetch("/api/desktop/attention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ action: "company-directory", tenantId }),
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as { ok?: boolean; admins?: Person[]; authorized?: Person[]; error?: string } | null;
        if (!response.ok || !body?.ok) {
          setNotice(body?.error || "No se pudo leer la empresa.");
          setAdmins([]);
          setAuthorized([]);
          return;
        }
        const nextAdmins = body.admins ?? [];
        setAdmins(nextAdmins);
        setAuthorized(body.authorized ?? []);
        setToUserId(nextAdmins[0]?.userId ?? "");
        setCc([]);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setNotice("No se pudo leer la empresa.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [tenantId]);

  const remaining = authorized.filter((person) => person.userId !== toUserId && !cc.some((item) => item.userId === person.userId));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sendRequiresCompany(tenantId)) {
      setNotice("Selecciona la empresa antes de enviar.");
      return;
    }
    setSending(true);
    setNotice("");
    const response = await fetch("/api/desktop/attention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send-report",
        tenantId,
        period,
        channel,
        toUserId,
        ccUserIds: cc.map((person) => person.userId),
        message,
      }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string; dispatch?: ReportDispatchRecord } | null;
    setSending(false);
    if (!response?.ok || !body?.ok || !body.dispatch) {
      setNotice(body?.error || "No se pudo enviar el informe.");
      return;
    }
    setDispatch(body.dispatch);
    setNotice(body.dispatch.result === "enviado" ? "Informe enviado." : "Quedó registrado, pero el correo no salió.");
  }

  return (
    <form className="plat-drawer" aria-label="Enviar informe" onSubmit={(event) => void submit(event)}>
      <header>
        <h2>
          <Icon glyph={ICO.send} />
          Enviar informe
        </h2>
        <button type="button" aria-label="Cerrar envío" onClick={onClose}>
          ×
        </button>
      </header>
      <div className="plat-drawer-body">
      <p className="plat-send-meta">
        <span><Icon glyph={ICO.building} size={14} /> Empresa · {companyName || "por elegir"}</span>
        <span><Icon glyph={ICO.calendar} size={14} /> Período · {periodLabel}</span>
      </p>
      {needsCompany ? (
        <label>
          <span className="plat-req">Empresa <i>*</i></span>
          <Field glyph={ICO.layers}>
          <select aria-label="Empresa del envío" value={tenantId} onChange={(event) => setTenantId(event.target.value)}>
            <option value="">Seleccionar empresa</option>
            {companies.map((company) => (
              <option key={company.tenantId} value={company.tenantId}>
                {company.name}
              </option>
            ))}
          </select>
          </Field>
        </label>
      ) : null}
      <label>
        Para
        <Field glyph={ICO.user}>
        <select aria-label="Destinatario" value={toUserId} onChange={(event) => setToUserId(event.target.value)} disabled={!tenantId || loading}>
          <option value="">{loading ? "Cargando…" : "Administrador de la empresa"}</option>
          {admins.map((person) => (
            <option key={person.userId} value={person.userId}>
              {person.name}
            </option>
          ))}
        </select>
        </Field>
      </label>
      <div className="plat-cc">
        <span>Con copia</span>
        <div>
          {cc.map((person) => (
            <button key={person.userId} type="button" onClick={() => setCc((current) => current.filter((item) => item.userId !== person.userId))}>
              <Icon glyph={ICO.user} size={14} />
              {person.name}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
        <label>
          <span><Icon glyph={ICO.plus} size={14} /> Agregar usuarios</span>
          <small>Usuarios autorizados de la empresa.</small>
          <Field glyph={ICO.user}>
          <select
            aria-label="Agregar usuarios"
            value={pick}
            onChange={(event) => {
              const person = remaining.find((item) => item.userId === event.target.value);
              setPick("");
              if (person) setCc((current) => [...current, person]);
            }}
          >
            <option value="">Usuarios autorizados de la empresa</option>
            {remaining.map((person) => (
              <option key={person.userId} value={person.userId}>
                {person.name}
              </option>
            ))}
          </select>
          </Field>
        </label>
      </div>
      <label>
        Formato
        <Field glyph={ICO.file}>
        <select aria-label="Formato" value="pdf" disabled>
          <option value="pdf">PDF</option>
        </select>
        </Field>
      </label>
      <label>
        Mensaje (opcional)
        <textarea value={message} maxLength={500} rows={4} placeholder="Incluye un mensaje para los destinatarios..." aria-label="Mensaje" onChange={(event) => setMessage(event.target.value)} />
        <small>
          {message.length}/500
        </small>
      </label>
      {notice ? <p className="plat-notice">{notice}</p> : null}
      {dispatch ? (
        <p className="plat-notice">
          {dispatch.actorName} · {ticketWhen(dispatch.at)} · {dispatch.to.map((person) => person.email).join(", ")}
          {dispatch.cc.length > 0 ? ` · copia ${dispatch.cc.map((person) => person.email).join(", ")}` : ""} · {dispatch.result}
        </p>
      ) : null}
      </div>
      <footer>
        <button type="button" className="ghost" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="primary" disabled={sending || !toUserId || sendRequiresCompany(tenantId)}>
          {sending ? "Enviando…" : <><Icon glyph={ICO.send} /> Enviar informe</>}
        </button>
      </footer>
    </form>
  );
}
