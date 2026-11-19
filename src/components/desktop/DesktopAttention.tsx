"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  approvalLabel,
  formatAttentionWhen,
  groupAttentionOrgs,
  isLiveChatCase,
  pickOwnLiveThread,
  priorityLabel,
  statusLabel,
  type PublicAttentionCase,
} from "@/lib/desktop/attention";
import {
  countAppliedDeskFilters,
  emptyDeskFilters,
  filterDeskCases,
  findHelpOrigin,
  formatHelpOrigin,
  HELP_ORIGINS,
  type DeskFilterFields,
} from "@/lib/desktop/help-origins";
import { PlatformAttention } from "@/components/desktop/PlatformAttention";
import { applyQueueAction, examplePlatformQueue } from "@/lib/desktop/platform-queue";
import { isIntakeChannel, intakeChannelLabel } from "@/lib/desktop/platform-desk";
import { NELZURI_LOGO_ON_DARK, NELZURI_NAME } from "@/lib/desktop/nelzuri";

type AreaOption = { id: string; name: string; description: string; active: boolean };
type Colleague = { userId: string; displayName: string; allAreas: boolean; areaIds: string[] };
type OnlineOrg = { tenantId: string; company: string; names: string[] };
type Channel = "mensajes" | "envivo";

type ChatRow = {
  key: string;
  tenantId: string;
  caseId: string;
  title: string;
  preview: string;
  at: string;
  unread: boolean;
  online: boolean;
  origin?: string;
  area?: string;
  code?: string;
  status?: string;
  statusKey?: string;
};

function companyWhen(iso: string, prefix: "Creado" | "Actualizado"): string {
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return "";
  const now = Date.now();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const clock = new Date(at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  if (at >= start.getTime()) return `${prefix} hoy, ${clock}`;
  const yesterday = new Date(start);
  yesterday.setDate(yesterday.getDate() - 1);
  if (at >= yesterday.getTime()) return `${prefix} ayer, ${clock}`;
  const day = formatAttentionWhen(iso, now);
  return day ? `${prefix} ${day}` : prefix;
}

function byRecent(a: PublicAttentionCase, b: PublicAttentionCase): number {
  return a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0;
}

function subjectFrom(body: string): string {
  const line = body.trim().replace(/\s+/g, " ");
  if (line.length < 3) return "Consulta";
  return line.slice(0, 80);
}

function pickCase(items: readonly PublicAttentionCase[]): PublicAttentionCase | null {
  const open = items.filter((item) => item.status !== "resuelto").slice().sort(byRecent);
  return open.find((item) => item.unread) ?? open[0] ?? items.slice().sort(byRecent)[0] ?? null;
}

function WindowDismiss({ bubble, onClose }: { bubble: boolean; onClose: () => void }) {
  if (bubble) {
    return (
      <button type="button" className="ghost attn-close" onClick={onClose} aria-label="Minimizar">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6 14h12" />
        </svg>
      </button>
    );
  }
  return (
    <button type="button" className="ghost" onClick={onClose}>
      Cerrar
    </button>
  );
}

export function DesktopAttention({
  mode,
  channel,
  onClose,
  presentation = "window",
  onUnreadCount,
  spaceName = "",
  lockedTenantId = "",
}: {
  mode: "panel" | "client";
  channel: Channel;
  onClose: () => void;
  presentation?: "window" | "bubble";
  onUnreadCount?: (count: number) => void;
  /** Nombre del espacio activo. En la mesa global queda vacío. */
  spaceName?: string;
  /** Empresa fija cuando la ventana se abre dentro de un espacio. */
  lockedTenantId?: string;
}) {
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [cases, setCases] = useState<PublicAttentionCase[]>([]);
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [staffOnline, setStaffOnline] = useState(false);
  const [onlineOrgs, setOnlineOrgs] = useState<OnlineOrg[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<DeskFilterFields>(emptyDeskFilters());
  const [draftFilters, setDraftFilters] = useState<DeskFilterFields>(emptyDeskFilters());
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [waitingOnly, setWaitingOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [companies, setCompanies] = useState<Array<{ tenantId: string; name: string }>>([]);
  const [serverDesk, setServerDesk] = useState<"platform" | "company">(
    mode === "client" || lockedTenantId ? "company" : "platform"
  );
  const [activeCompany, setActiveCompany] = useState<{ tenantId: string; name: string } | null>(
    lockedTenantId ? { tenantId: lockedTenantId, name: spaceName } : null
  );
  const [composing, setComposing] = useState(false);
  const [composeSession, setComposeSession] = useState(0);
  const [receipt, setReceipt] = useState<{ correlative: string; caseId: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [viewerId, setViewerId] = useState("");
  const [clientChat, setClientChat] = useState(false);
  const demoQueue = useRef(false);
  if (typeof window !== "undefined") {
    demoQueue.current = new URLSearchParams(window.location.search).get("cola") === "100";
  }

  const liveClient = channel === "envivo" && (mode === "client" || clientChat);
  const bubble = presentation === "bubble";

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const controller = new AbortController();
    const pull = (quiet: boolean) => {
      if (!quiet) setLoading(true);
      void Promise.all([
        fetch("/api/desktop/attention", { signal: controller.signal }),
        fetch("/api/desktop/presence", { signal: controller.signal }),
      ])
        .then(async ([attentionResponse, presenceResponse]) => {
          const attention = (await attentionResponse.json().catch(() => null)) as {
            ok?: boolean;
            desk?: "platform" | "company";
            activeCompany?: { tenantId: string; name: string } | null;
            areas?: AreaOption[];
            cases?: PublicAttentionCase[];
            colleagues?: Colleague[];
            companies?: Array<{ tenantId: string; name: string }>;
            viewerUserId?: string;
          } | null;
          const presence = (await presenceResponse.json().catch(() => null)) as {
            ok?: boolean;
            staffOnline?: boolean;
            online?: OnlineOrg[];
          } | null;
          if (!attentionResponse.ok || !attention?.ok) {
            setError("No se pudo abrir la conversación.");
            return;
          }
          setError("");
          if (attention.desk === "company" || attention.desk === "platform") setServerDesk(attention.desk);
          setActiveCompany(attention.activeCompany ?? null);
          setAreas(attention.areas ?? []);
          setColleagues(attention.colleagues ?? []);
          setCompanies(attention.companies ?? []);
          setViewerId(attention.viewerUserId ?? "");
          if (demoQueue.current) {
            if (!quiet) setCases(examplePlatformQueue({ viewerUserId: attention.viewerUserId || "me", now: Date.now() }));
          } else {
            setCases(attention.cases ?? []);
          }
          if (presenceResponse.ok && presence?.ok) {
            setStaffOnline(presence.staffOnline === true);
            setOnlineOrgs(presence.online ?? []);
          }
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

  const onlineIds = useMemo(() => new Set(onlineOrgs.map((org) => org.tenantId)), [onlineOrgs]);
  const companyView = channel === "mensajes" && serverDesk === "company";
  const globalDesk = channel === "mensajes" && serverDesk === "platform" && mode === "panel";
  const companyTenantId = companyView ? activeCompany?.tenantId || lockedTenantId : "";
  const showDeskFilters = globalDesk && mode === "panel" && channel === "mensajes";
  const spaceCases = useMemo(
    () => (companyView ? cases.filter((item) => !companyTenantId || item.tenantId === companyTenantId) : []),
    [cases, companyTenantId, companyView]
  );

  useEffect(() => {
    if (!showDeskFilters) setFiltersOpen(false);
  }, [showDeskFilters]);

  const activeFilterCount = globalDesk ? countAppliedDeskFilters(appliedFilters) : 0;

  const listed = useMemo(() => {
    if (channel !== "mensajes") return cases;
    const scoped = companyTenantId ? cases.filter((item) => item.tenantId === companyTenantId) : cases;
    return filterDeskCases(scoped, {
      query,
      tenantId: globalDesk ? appliedFilters.tenantId : "",
      originId: showDeskFilters ? appliedFilters.originId : "",
      status: showDeskFilters ? appliedFilters.status : "",
      priority: showDeskFilters ? appliedFilters.priority : "",
      assigneeUserId: showDeskFilters ? appliedFilters.assigneeUserId : "",
      unassigned: unassignedOnly,
      noFirstReply: waitingOnly,
    });
  }, [
    cases,
    channel,
    companyTenantId,
    globalDesk,
    appliedFilters,
    query,
    showDeskFilters,
    unassignedOnly,
    waitingOnly,
  ]);

  const rows = useMemo((): ChatRow[] => {
    const source = channel === "mensajes" ? listed : cases;
    const needle = channel === "mensajes" ? "" : query.trim().toLocaleLowerCase("es");
    const matches = (title: string, preview: string) =>
      !needle || title.toLocaleLowerCase("es").includes(needle) || preview.toLocaleLowerCase("es").includes(needle);

    if (channel === "envivo" && mode === "panel") {
      const openChats = source.filter((item) => isLiveChatCase(item) && item.status !== "resuelto");
      const desks = new Map<string, { company: string; online: boolean; names: string[] }>();
      for (const org of onlineOrgs) desks.set(org.tenantId, { company: org.company, online: true, names: org.names });
      for (const item of openChats) {
        if (!desks.has(item.tenantId)) desks.set(item.tenantId, { company: item.company, online: false, names: [] });
      }
      return [...desks.entries()].flatMap(([tenantId, org]) => {
        const related = openChats.filter((item) => item.tenantId === tenantId).sort(byRecent);
        const chosen = related[0] ?? null;
        const preview = org.online
          ? org.names.length > 0
            ? `${org.names.join(", ")} en línea`
            : "En el escritorio"
          : chosen
            ? `Desconectado · ${chosen.code}`
            : "Desconectado";
        if (!matches(org.company, preview) && !(chosen && matches(chosen.code, chosen.subject))) return [];
        return [
          {
            key: tenantId,
            tenantId,
            caseId: chosen?.id ?? "",
            title: org.company,
            preview,
            at: chosen?.updatedAt ?? "",
            unread: related.some((item) => item.unread),
            online: org.online,
          } satisfies ChatRow,
        ];
      });
    }

    if (mode === "client") {
      return source
        .slice()
        .sort(byRecent)
        .flatMap((item) => {
          const preview = item.messages.at(-1)?.body || item.areaName;
          const status = statusLabel(item.status);
          if (!matches(item.subject, preview) && !matches(item.code, item.company) && !matches(status, item.code)) {
            return [];
          }
          return [
            {
              key: item.id,
              tenantId: item.tenantId,
              caseId: item.id,
              title: item.subject,
              preview: item.company,
              at: item.updatedAt,
              unread: item.unread,
              online: staffOnline,
              origin: item.helpPlace || "Origen no registrado",
              code: item.code,
              status,
              statusKey: item.status,
            } satisfies ChatRow,
          ];
        });
    }

    if (mode === "panel" && channel === "mensajes") {
      return source
        .slice()
        .sort(byRecent)
        .map(
          (item) =>
            ({
              key: item.id,
              tenantId: item.tenantId,
              caseId: item.id,
              title: item.subject,
              preview: item.company,
              at: item.updatedAt,
              unread: item.unread || item.awaitingFirstReply,
              online: onlineIds.has(item.tenantId),
              origin: item.helpPlace || "Origen no registrado",
              code: item.code,
              status: statusLabel(item.status),
              statusKey: item.status,
            }) satisfies ChatRow
        );
    }

    return groupAttentionOrgs(source).flatMap((org) => {
      if (!matches(org.company, org.preview)) return [];
      const chosen = pickCase(org.cases);
      return [
        {
          key: org.tenantId,
          tenantId: org.tenantId,
          caseId: chosen?.id ?? "",
          title: org.company,
          preview: org.preview,
          at: org.lastAt,
          unread: org.unreadCount > 0,
          online: onlineIds.has(org.tenantId),
        } satisfies ChatRow,
      ];
    });
  }, [cases, channel, listed, mode, onlineIds, onlineOrgs, query, staffOnline]);

  const selected = cases.find((item) => item.id === selectedId) ?? null;
  const orgCases = selected
    ? cases
        .filter((item) => item.tenantId === selected.tenantId && (channel !== "envivo" || isLiveChatCase(item)))
        .slice()
        .sort(byRecent)
    : [];
  const liveCase = useMemo(() => {
    if (!liveClient) return null;
    return pickOwnLiveThread(cases, viewerId);
  }, [cases, liveClient, viewerId]);
  const threadCase = liveClient ? liveCase : selected;

  function replaceCase(next: PublicAttentionCase) {
    setCases((current) => [next, ...current.filter((item) => item.id !== next.id)]);
    setSelectedTenantId(next.tenantId);
    setSelectedId(next.id);
    setComposing(false);
  }

  async function post(payload: Record<string, unknown>): Promise<boolean> {
    if (demoQueue.current && payload.action !== "read") {
      const now = new Date().toISOString();
      const caseId = typeof payload.caseId === "string" ? payload.caseId : "";
      setSending(true);
      setError("");
      if (payload.action === "open") {
        const channel = typeof payload.intakeChannel === "string" && isIntakeChannel(payload.intakeChannel) ? payload.intakeChannel : "telefono";
        const tenantId = typeof payload.tenantId === "string" ? payload.tenantId : "";
        const opened = examplePlatformQueue({ viewerUserId: viewerId || "me", now: Date.now() })[0];
        const subject = typeof payload.subject === "string" && payload.subject.trim() ? payload.subject.trim() : "Consulta";
        const next = {
          ...opened,
          id: `q-new-${Date.now()}`,
          code: "AC-NUEVO",
          tenantId,
          company: companies.find((company) => company.tenantId === tenantId)?.name || "Empresa",
          subject,
          status: "pendiente" as const,
          priority: "normal" as const,
          assigneeUserId: null,
          assigneeName: null,
          nextStep: "nelzuri" as const,
          nextStepLabel: "Le toca a NELZURI",
          requesterName: typeof payload.contactName === "string" && payload.contactName.trim() ? payload.contactName.trim() : "Contacto",
          intakeChannel: channel,
          channelLabel: intakeChannelLabel(channel),
          createdAt: now,
          updatedAt: now,
          messages: [{ id: `q-new-m`, at: now, role: "client" as const, label: "Contacto", body: typeof payload.body === "string" ? payload.body : subject }],
          events: [{ id: `q-new-e`, at: now, detail: "Alta manual.", actorName: "NELZURI", kind: "creado" as const }],
        };
        setCases((current) => [next, ...current]);
        setSelectedId(next.id);
        setComposing(false);
        setSending(false);
        return true;
      }
      setCases((current) =>
        current.map((item) => {
          if (item.id !== caseId) return item;
          if (payload.action === "message" && typeof payload.body === "string") {
            return applyQueueAction(item, { action: "message", body: payload.body, now });
          }
          if (payload.action === "confirm-ask") return applyQueueAction(item, { action: "confirm-ask", now });
          if (payload.action === "assign") {
            const assigneeUserId = typeof payload.assigneeUserId === "string" ? payload.assigneeUserId : "";
            const assigneeName = colleagues.find((person) => person.userId === assigneeUserId)?.displayName ?? "";
            return applyQueueAction(item, { action: "assign", assigneeUserId, assigneeName, now });
          }
          if (payload.action === "priority" && typeof payload.priority === "string") {
            return applyQueueAction(item, { action: "priority", priority: payload.priority, now });
          }
          if (payload.action === "promote") return applyQueueAction(item, { action: "promote", now });
          return item;
        })
      );
      setSending(false);
      return true;
    }
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
      receipt?: { correlative?: string } | null;
    } | null;
    setSending(false);
    if (!response?.ok || !body?.ok || !body.case) {
      setError(body?.error || "No se pudo guardar.");
      return false;
    }
    if (companyView && payload.action === "open") {
      const opened = body.case;
      setCases((current) => [opened, ...current.filter((item) => item.id !== opened.id)]);
      setComposing(false);
      setSelectedId("");
      setSelectedTenantId("");
      setReceipt({
        correlative: body.receipt?.correlative || opened.code,
        caseId: opened.id,
      });
      return true;
    }
    replaceCase(body.case);
    return true;
  }

  async function openRow(row: ChatRow) {
    setComposing(false);
    setReceipt(null);
    setSelectedTenantId(row.tenantId);
    setSelectedId(row.caseId);
    if (!row.caseId || !row.unread || demoQueue.current) return;
    await post({ action: "read", caseId: row.caseId });
  }

  useEffect(() => {
    if (!liveClient || !liveCase?.unread) return;
    void post({ action: "read", caseId: liveCase.id });
    // La lectura se dispara al aparecer un caso sin leer, no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveClient, liveCase?.id, liveCase?.unread]);

  useEffect(() => {
    if (loading) return;
    const count =
      bubble && mode === "panel"
        ? cases.filter(
            (item) => item.unread && (onlineIds.has(item.tenantId) || (isLiveChatCase(item) && item.status !== "resuelto"))
          ).length
        : cases.filter((item) => item.unread).length;
    onUnreadCount?.(count);
  }, [bubble, cases, loading, mode, onUnreadCount, onlineIds]);

  const title =
    channel === "envivo"
      ? "Chat en vivo"
      : globalDesk
        ? "Atención · Plataforma"
        : "Atención";
  const defaultArea = areas.find((area) => area.id === "general" && area.active)?.id ?? areas.find((area) => area.active)?.id ?? "";
  const staffThread = bubble && mode === "panel" && Boolean(selectedTenantId);
  const paneOpen = composing || Boolean(selectedId) || (channel === "envivo" && Boolean(selectedTenantId));
  const showInbox = !liveClient && !staffThread;
  const showStage = bubble ? liveClient || mode !== "panel" || Boolean(selectedTenantId) : true;

  function backToList() {
    setComposing(false);
    setReceipt(null);
    setSelectedId("");
    setSelectedTenantId("");
  }

  function openComposer() {
    setComposeSession((n) => n + 1);
    setComposing(true);
    setReceipt(null);
    setSelectedId("");
    setSelectedTenantId("");
  }

  function openFilters() {
    setDraftFilters(appliedFilters);
    setFiltersOpen(true);
  }

  function closeFilters() {
    setFiltersOpen(false);
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
    setFiltersOpen(false);
  }

  function clearDraftFilters() {
    setDraftFilters(emptyDeskFilters());
  }

  function openReceiptTicket() {
    const id = receipt?.caseId || "";
    const tenant = cases.find((item) => item.id === id)?.tenantId || "";
    setReceipt(null);
    setComposing(false);
    setSelectedId(id);
    setSelectedTenantId(tenant);
  }

  useEffect(() => {
    if (!companyView || loading || composing || receipt || selectedId) return;
    if (!window.matchMedia("(min-width: 801px)").matches) return;
    const first = rows.find((row) => row.caseId);
    if (!first) return;
    setSelectedTenantId(first.tenantId);
    setSelectedId(first.caseId);
    if (first.unread) void post({ action: "read", caseId: first.caseId });
    // En escritorio el primer ticket queda abierto. En móvil la lista va primero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyView, composing, loading, receipt, rows, selectedId]);

  const frame = (
      <div
        className={
          bubble
            ? "live-chat-sheet"
            : `ajustes-window is-clients is-attention${liveClient ? " is-attention-client" : " is-attention-panel"}${globalDesk ? " is-platform-capsule" : ""}`
        }
        role="dialog"
        aria-modal={bubble ? undefined : true}
        aria-labelledby={bubble ? undefined : "attention-title"}
        aria-label={bubble ? (mode === "panel" ? "Bandeja de chat" : `Chat con ${NELZURI_NAME}`) : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        {bubble ? null : (
          <header className="attn-window-bar">
            <h2 id="attention-title">{title}</h2>
            <button type="button" className="ghost" onClick={onClose}>
              Cerrar
            </button>
          </header>
        )}
        {error ? <p className="form-error attn-error">{error}</p> : null}
        {loading ? <p className="ajustes-wait">Abriendo…</p> : null}
        {!loading ? (
          <div className={`attn-shell is-chat${liveClient ? " is-live-client" : ""}${bubble ? " is-bubble" : ""}${paneOpen ? " is-detail" : ""}`}>
            {showInbox ? (
              <section className="attn-inbox" aria-label={bubble ? title : companyView && mode === "client" ? "Mis tickets" : "Bandeja"}>
                {bubble ? (
                  <header className="attn-inbox-head">
                    <div>
                      <h2>{title}</h2>
                      <p>{channel === "envivo" ? "Quien está en el escritorio" : companyView && mode === "client" ? "Mis tickets" : "Bandeja"}</p>
                    </div>
                    {channel === "envivo" && mode === "panel" ? (
                      <button type="button" className="ghost" onClick={() => setClientChat(true)}>
                        Escribir como cliente
                      </button>
                    ) : null}
                    <WindowDismiss bubble onClose={onClose} />
                  </header>
                ) : null}
                <div className="attn-inbox-tools">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar correlativo…"
                    aria-label="Buscar"
                  />
                </div>
                {channel === "mensajes" ? (
                  <div className="attn-filter-anchor">
                    <div className="attn-quick">
                      <button
                        type="button"
                        className={unassignedOnly ? "attn-chip is-on" : "attn-chip"}
                        aria-pressed={unassignedOnly}
                        onClick={() => setUnassignedOnly((current) => !current)}
                      >
                        Sin asignar
                      </button>
                      <button
                        type="button"
                        className={waitingOnly ? "attn-chip is-on" : "attn-chip"}
                        aria-pressed={waitingOnly}
                        onClick={() => setWaitingOnly((current) => !current)}
                      >
                        Sin primera respuesta
                      </button>
                      {showDeskFilters ? (
                        <button
                          type="button"
                          className={filtersOpen ? "attn-chip is-on" : "attn-chip"}
                          aria-expanded={filtersOpen}
                          onClick={() => (filtersOpen ? closeFilters() : openFilters())}
                        >
                          Filtros
                          {activeFilterCount > 0 ? <em>{activeFilterCount}</em> : null}
                        </button>
                      ) : null}
                      <button type="button" className="primary attn-new" onClick={openComposer}>
                        Nuevo ticket
                      </button>
                    </div>
                    {filtersOpen && showDeskFilters ? (
                      <div className="attn-filter-float" role="dialog" aria-label="Filtros">
                        <label>
                          Empresa
                          <select
                            aria-label="Empresa"
                            value={draftFilters.tenantId}
                            onChange={(event) => setDraftFilters((current) => ({ ...current, tenantId: event.target.value }))}
                          >
                            <option value="">Todas</option>
                            {companies.map((company) => (
                              <option key={company.tenantId} value={company.tenantId}>
                                {company.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Origen
                          <select
                            aria-label="Origen"
                            value={draftFilters.originId}
                            onChange={(event) => setDraftFilters((current) => ({ ...current, originId: event.target.value }))}
                          >
                            <option value="">Todos</option>
                            {HELP_ORIGINS.map((origin) => (
                              <option key={origin.id} value={origin.id}>
                                {origin.action ? `${origin.screen} · ${origin.action}` : `${origin.siteOrApp} · ${origin.screen}`}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Estado
                          <select
                            aria-label="Estado"
                            value={draftFilters.status}
                            onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
                          >
                            <option value="">Todos</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="abierto">En gestión</option>
                            <option value="resuelto">Resuelto</option>
                          </select>
                        </label>
                        <label>
                          Prioridad
                          <select
                            aria-label="Prioridad"
                            value={draftFilters.priority}
                            onChange={(event) => setDraftFilters((current) => ({ ...current, priority: event.target.value }))}
                          >
                            <option value="">Todas</option>
                            <option value="normal">Normal</option>
                            <option value="alta">Alta</option>
                          </select>
                        </label>
                        <label>
                          Responsable
                          <select
                            aria-label="Responsable"
                            value={draftFilters.assigneeUserId}
                            onChange={(event) => setDraftFilters((current) => ({ ...current, assigneeUserId: event.target.value }))}
                          >
                            <option value="">Todos</option>
                            {colleagues.map((person) => (
                              <option key={person.userId} value={person.userId}>
                                {person.displayName}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="attn-filter-actions">
                          <button type="button" className="ghost" onClick={clearDraftFilters}>Limpiar</button>
                          <button type="button" className="primary" onClick={applyFilters}>Aplicar</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {rows.length === 0 ? (
                  <p className="attn-placeholder">
                    {channel === "envivo"
                      ? "Nadie está en el escritorio ahora."
                      : "No hay tickets."}
                  </p>
                ) : (
                  <ul className="attn-org-list">
                    {rows.map((row) => {
                      const active =
                        !composing && (row.code || mode === "client" ? row.key === selectedId : row.key === selectedTenantId);
                      return (
                        <li key={row.key}>
                          {row.code ? (
                            <button
                              type="button"
                              className={`is-ticket${active ? " is-active" : ""}${row.unread ? " is-unread" : ""}`}
                              onClick={() => void openRow(row)}
                            >
                              <span className="attn-row-lead">
                                <span className="attn-row-code">{row.code}</span>
                                <span className="attn-row-subject">{row.title}</span>
                              </span>
                              <span className="attn-row-status">{row.status}</span>
                              <span className="attn-row-sub">{[row.preview, row.origin].filter(Boolean).join(" · ")}</span>
                              {row.at ? (
                                <time className="attn-row-time" dateTime={row.at}>
                                  {formatAttentionWhen(row.at)}
                                </time>
                              ) : (
                                <span className="attn-row-time" />
                              )}
                            </button>
                          ) : (
                            <button type="button" className={active ? "is-active" : undefined} onClick={() => void openRow(row)}>
                              <span className="attn-org-mark" aria-hidden="true">
                                {row.title.trim().charAt(0).toUpperCase() || "C"}
                              </span>
                              <span className="attn-org-copy">
                                <strong>
                                  {row.title}
                                  {row.online ? <i className="attn-live-dot" title="En línea" /> : null}
                                  {row.unread ? <i className="attn-dot" /> : null}
                                </strong>
                                <small>{row.preview}</small>
                              </span>
                              {row.at ? (
                                <span className="attn-org-meta">
                                  <time dateTime={row.at}>{formatAttentionWhen(row.at)}</time>
                                </span>
                              ) : null}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ) : null}

            {showStage ? (
            <section className="attn-stage" aria-label="Conversación">
              {paneOpen && !bubble && !liveClient ? (
                <div className="attn-backbar">
                  <button type="button" className="ghost" onClick={backToList}>
                    Volver
                  </button>
                </div>
              ) : null}
              {staffThread ? (
                <div className="live-chat-backbar">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setSelectedTenantId("");
                      setSelectedId("");
                    }}
                  >
                    Volver
                  </button>
                  <WindowDismiss bubble onClose={onClose} />
                </div>
              ) : null}
              {liveClient ? (
                <LiveClient
                  item={liveCase}
                  staffOnline={staffOnline}
                  areas={areas.filter((area) => area.active)}
                  companies={companies}
                  activeTenantId={activeCompany?.tenantId || lockedTenantId || ""}
                  defaultArea={defaultArea}
                  sending={sending}
                  onPost={post}
                  onClose={onClose}
                  onBack={clientChat ? () => setClientChat(false) : undefined}
                  bubble={bubble}
                />
              ) : composing && channel === "mensajes" ? (
                <Compose
                  key={composeSession}
                  mode={mode}
                  companies={companies}
                  areas={areas.filter((area) => area.active)}
                  defaultArea={defaultArea}
                  sending={sending}
                  spaceName={companyView ? activeCompany?.name || spaceName : ""}
                  lockedTenantId={companyView ? activeCompany?.tenantId || lockedTenantId : ""}
                  onSubmit={post}
                />
              ) : threadCase ? (
                <Thread
                  item={threadCase}
                  orgCases={mode === "panel" && channel !== "mensajes" ? orgCases : [threadCase]}
                  mode={mode}
                  areas={areas.filter((area) => area.active)}
                  online={mode === "panel" ? onlineIds.has(threadCase.tenantId) : staffOnline}
                  colleagues={colleagues}
                  sending={sending}
                  onSelectCase={(id) => {
                    setSelectedId(id);
                    const next = cases.find((item) => item.id === id);
                    if (next?.unread) void post({ action: "read", caseId: id });
                  }}
                  onPost={post}
                />
              ) : (
                <div className="attn-stage-empty">
                  <p>
                    {channel === "envivo" && selectedTenantId
                      ? "Está en línea. La conversación aparece cuando escriba."
                      : "Elige un ticket."}
                  </p>
                </div>
              )}
            </section>
            ) : null}
          </div>
        ) : null}
      </div>
  );

  if (bubble) return frame;
  if (globalDesk) {
    return (
      <div className="ajustes-back" onClick={onClose}>
        <PlatformAttention
          cases={cases}
          companies={companies}
          colleagues={colleagues}
          selected={selected}
          sending={sending}
          loading={loading}
          error={error}
          defaultArea={defaultArea}
          viewerUserId={viewerId}
          onClose={onClose}
          onOpen={(item) => void openRow({
            key: item.id,
            tenantId: item.tenantId,
            caseId: item.id,
            title: item.subject,
            preview: item.company,
            at: item.updatedAt,
            unread: item.unread,
            online: false,
          })}
          onClear={backToList}
          onPost={post}
        />
      </div>
    );
  }
  if (companyView) {
    return (
      <div className="ajustes-back" onClick={onClose}>
        <CompanySpace
          companyName={activeCompany?.name || spaceName || "Este espacio"}
          loading={loading}
          error={error}
          composing={composing}
          receipt={receipt}
          composeSession={composeSession}
          query={query}
          rows={rows}
          selectedId={selectedId}
          selected={selected}
          sending={sending}
          areas={areas.filter((area) => area.active)}
          defaultArea={defaultArea}
          spaceEmpty={spaceCases.length === 0}
          detail={composing || Boolean(receipt) || Boolean(selectedId)}
          mode={mode}
          spaceName={activeCompany?.name || spaceName}
          lockedTenantId={activeCompany?.tenantId || lockedTenantId}
          onQuery={setQuery}
          onClose={onClose}
          onCompose={openComposer}
          onOpenRow={(row) => void openRow(row)}
          onBack={backToList}
          onSubmit={post}
          onOpenReceipt={openReceiptTicket}
        />
      </div>
    );
  }
  return (
    <div className="ajustes-back" onClick={onClose}>
      {frame}
    </div>
  );
}

function CompanySpace({
  companyName,
  loading,
  error,
  composing,
  receipt,
  composeSession,
  query,
  rows,
  selectedId,
  selected,
  sending,
  areas,
  defaultArea,
  spaceEmpty,
  detail,
  mode,
  spaceName,
  lockedTenantId,
  onQuery,
  onClose,
  onCompose,
  onOpenRow,
  onBack,
  onSubmit,
  onOpenReceipt,
}: {
  companyName: string;
  loading: boolean;
  error: string;
  composing: boolean;
  receipt: { correlative: string; caseId: string } | null;
  composeSession: number;
  query: string;
  rows: ChatRow[];
  selectedId: string;
  selected: PublicAttentionCase | null;
  sending: boolean;
  areas: AreaOption[];
  defaultArea: string;
  spaceEmpty: boolean;
  detail: boolean;
  mode: "panel" | "client";
  spaceName: string;
  lockedTenantId: string;
  onQuery: (value: string) => void;
  onClose: () => void;
  onCompose: () => void;
  onOpenRow: (row: ChatRow) => void;
  onBack: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<boolean>;
  onOpenReceipt: () => void;
}) {
  const listOn = !composing && !receipt;
  return (
    <div
      className="ajustes-window is-attention is-attention-company"
      role="dialog"
      aria-modal="true"
      aria-label={`Atención. ${companyName}`}
      onClick={(event) => event.stopPropagation()}
    >
      <header className="attn-company-bar">
        <img className="attn-company-logo" src={NELZURI_LOGO_ON_DARK} alt={NELZURI_NAME} />
        <p className="attn-company-place">
          <span>Atención</span>
          <span aria-hidden="true">|</span>
          <strong>{companyName}</strong>
        </p>
        <button type="button" className="attn-company-close" onClick={onClose} aria-label="Cerrar">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>
      <div className={`attn-company-shell${detail ? " is-detail" : ""}`}>
        <nav className="attn-company-nav" aria-label="Atención">
          <button type="button" className={listOn ? "is-on" : undefined} aria-current={listOn ? "page" : undefined} onClick={onBack}>
            <TicketNavIcon />
            Mis tickets
          </button>
          <button type="button" className={composing ? "is-on" : undefined} aria-current={composing ? "page" : undefined} onClick={onCompose}>
            <PlusNavIcon />
            Nuevo ticket
          </button>
        </nav>
        <div className="attn-company-body">
          {error ? <p className="form-error attn-error">{error}</p> : null}
          {loading ? <p className="ajustes-wait">Abriendo…</p> : null}
          {!loading && receipt ? (
            <CompanyReceipt correlative={receipt.correlative} onOpen={onOpenReceipt} onBack={onBack} />
          ) : null}
          {!loading && !receipt && composing ? (
            <>
              <div className="attn-company-back">
                <button type="button" className="ghost" onClick={onBack}>
                  Volver
                </button>
              </div>
              <Compose
                key={composeSession}
                mode={mode}
                variant="company"
                companies={[]}
                areas={areas}
                defaultArea={defaultArea}
                sending={sending}
                spaceName={spaceName}
                lockedTenantId={lockedTenantId}
                onSubmit={onSubmit}
              />
            </>
          ) : null}
          {!loading && !receipt && !composing && spaceEmpty ? <CompanyEmpty onCreate={onCompose} /> : null}
          {!loading && !receipt && !composing && !spaceEmpty ? (
            <div className="attn-company-split">
              <section className="attn-company-list" aria-label="Mis tickets">
                <header className="attn-company-list-head">
                  <h2 id="attention-title">Mis tickets</h2>
                  <button type="button" className="primary" onClick={onCompose}>
                    + Nuevo ticket
                  </button>
                </header>
                <div className="attn-inbox-tools">
                  <input
                    value={query}
                    onChange={(event) => onQuery(event.target.value)}
                    placeholder="Buscar por código o asunto…"
                    aria-label="Buscar por código o asunto"
                  />
                </div>
                {rows.length === 0 ? (
                  <p className="attn-placeholder">Ningún ticket coincide con la búsqueda.</p>
                ) : (
                  <ul className="attn-company-tickets">
                    {rows.map((row) => {
                      const active = row.key === selectedId;
                      return (
                        <li key={row.key}>
                          <button type="button" className={active ? "is-active" : undefined} onClick={() => onOpenRow(row)}>
                            <span className="attn-company-ticket-top">
                              <strong>{row.code}</strong>
                              {row.status ? (
                                <span className={`attn-status-pill is-${row.statusKey || "abierto"}`}>{row.status}</span>
                              ) : null}
                            </span>
                            <span className="attn-company-ticket-subject">{row.title}</span>
                            {row.at ? <span className="attn-company-ticket-when">{companyWhen(row.at, "Actualizado")}</span> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
              <section className="attn-company-stage" aria-label="Conversación">
                {detail ? (
                  <div className="attn-company-back">
                    <button type="button" className="ghost" onClick={onBack}>
                      Volver
                    </button>
                  </div>
                ) : null}
                {selected ? (
                  <CompanyConversation item={selected} sending={sending} onPost={onSubmit} />
                ) : (
                  <div className="attn-stage-empty">
                    <p>Elige un ticket.</p>
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ClientConfirmation({
  item,
  sending,
  onPost,
}: {
  item: PublicAttentionCase;
  sending: boolean;
  onPost: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="attn-reply-bar">
      <p>Pendiente de confirmación</p>
      <button
        type="button"
        className="primary"
        disabled={sending}
        onClick={() => void onPost({ action: "confirm", caseId: item.id, decision: "resuelto" })}
      >
        Quedó resuelto
      </button>
      <label>
        Motivo
        <textarea
          value={reason}
          rows={2}
          maxLength={2000}
          aria-label="Motivo"
          placeholder="Qué sigue sin funcionar"
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <button
        type="button"
        className="ghost"
        disabled={sending || !reason.trim()}
        onClick={() => void onPost({ action: "confirm", caseId: item.id, decision: "sigue", reason })}
      >
        Sigo con el problema
      </button>
    </div>
  );
}

function CompanyConversation({
  item,
  sending,
  onPost,
}: {
  item: PublicAttentionCase;
  sending: boolean;
  onPost: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  return (
    <div className="attn-stage-inner">
      <header className="attn-company-thread-head">
        <div>
          <p className="attn-company-code-line">{item.code}</p>
          <h3>{item.subject}</h3>
          <p>{companyWhen(item.createdAt, "Creado")}</p>
        </div>
        <span className={`attn-status-pill is-${item.status}`}>{statusLabel(item.status)}</span>
      </header>
      <Bubbles item={item} mine="client" voice="company" />
      {item.status === "confirmacion" ? (
        <ClientConfirmation item={item} sending={sending} onPost={onPost} />
      ) : item.status === "resuelto" ? (
        <p className="lead attn-resolved">Este ticket está resuelto.</p>
      ) : (
        <div className="attn-reply-bar">
          <Composer
            sending={sending}
            placeholder="Escribe una respuesta…"
            onSend={(body) => onPost({ action: "message", caseId: item.id, body, asClient: true })}
          />
        </div>
      )}
    </div>
  );
}

function CompanyReceipt({
  correlative,
  onOpen,
  onBack,
}: {
  correlative: string;
  onOpen: () => void;
  onBack: () => void;
}) {
  return (
    <div className="attn-company-receipt">
      <div className="attn-company-check" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M5 12.5 9.2 17 19 7" />
        </svg>
      </div>
      <h2>Solicitud recibida</h2>
      <p>Tu ticket se registró correctamente con el código</p>
      <p className="attn-company-correlative">{correlative}</p>
      <p>Hemos recibido tu solicitud y te estaremos informando los avances en este mismo ticket.</p>
      <div className="attn-company-receipt-actions">
        <button type="button" className="primary" onClick={onOpen}>
          Ver ticket
        </button>
        <button type="button" className="ghost" onClick={onBack}>
          Volver a mis tickets
        </button>
      </div>
    </div>
  );
}

function CompanyEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="attn-company-empty">
      <header className="attn-company-list-head">
        <h2>Mis tickets</h2>
      </header>
      <div className="attn-company-empty-body">
        <div className="attn-company-empty-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M7 16.5 4.8 19V8.2A2.2 2.2 0 0 1 7 6h10a2.2 2.2 0 0 1 2.2 2.2V14a2.2 2.2 0 0 1-2.2 2.2H7z" strokeLinejoin="round" />
            <path d="M9 11h.01M12 11h.01M15 11h.01" strokeLinecap="round" />
          </svg>
        </div>
        <h3>Todavía no tienes tickets</h3>
        <p>Cuando necesites ayuda, puedes registrar un nuevo ticket y dar seguimiento desde aquí.</p>
        <button type="button" className="primary" onClick={onCreate}>
          + Nuevo ticket
        </button>
      </div>
    </div>
  );
}

function TicketNavIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 17.5 4.5 20V8.2A2.2 2.2 0 0 1 6.7 6h10.6A2.2 2.2 0 0 1 19.5 8.2v6.1a2.2 2.2 0 0 1-2.2 2.2H7z" strokeLinejoin="round" />
    </svg>
  );
}

function PlusNavIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

function LiveClient({
  item,
  staffOnline,
  areas,
  companies,
  activeTenantId,
  defaultArea,
  sending,
  onPost,
  onClose,
  onBack,
  bubble = false,
}: {
  item: PublicAttentionCase | null;
  staffOnline: boolean;
  areas: AreaOption[];
  companies: Array<{ tenantId: string; name: string }>;
  activeTenantId: string;
  defaultArea: string;
  sending: boolean;
  onPost: (payload: Record<string, unknown>) => Promise<boolean>;
  onClose: () => void;
  onBack?: () => void;
  bubble?: boolean;
}) {
  return (
    <div className="attn-stage-inner">
      <header className="attn-stage-head">
        <div>
          <h3 id="attention-title">
            {NELZURI_NAME}
            {staffOnline ? <i className="attn-live-dot" title="En línea" /> : null}
          </h3>
          <p>
            {activeTenantId
              ? staffOnline
                ? "En línea"
                : "No hay nadie en línea. El mensaje queda en Atención al Cliente."
              : "Selecciona la empresa del chat antes de iniciar el caso."}
          </p>
        </div>
        {onBack ? (
          <button type="button" className="ghost" onClick={onBack}>
            Volver a la bandeja
          </button>
        ) : null}
        {bubble ? <WindowDismiss bubble onClose={onClose} /> : null}
      </header>
      {item ? <Bubbles item={item} mine="client" /> : <p className="attn-placeholder">Escribe para empezar.</p>}
      {item && item.status === "confirmacion" ? (
        <ClientConfirmation item={item} sending={sending} onPost={onPost} />
      ) : item && item.status !== "resuelto" ? (
        <Composer
          sending={sending}
          onSend={(body) => onPost({ action: "message", caseId: item.id, body, asClient: true })}
        />
      ) : (
        <Compose
          mode="client"
          companies={companies}
          areas={areas}
          defaultArea={defaultArea}
          sending={sending}
          originId="escritorio.chat-en-vivo"
          lockedTenantId={activeTenantId}
          onSubmit={onPost}
        />
      )}
    </div>
  );
}

const ATTACH_MAX_BYTES = 4_000_000;

const WORD_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const WORD_DOC = "application/msword";

function attachmentKind(file: { name: string; type: string }): "image" | "pdf" | "word" | null {
  const type = file.type.toLowerCase();
  if (type === "application/pdf") return "pdf";
  if (type === WORD_DOC || type === WORD_DOCX) return "word";
  if (type.startsWith("image/")) return "image";
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "word";
  if (/\.(png|jpe?g|webp|gif|bmp)$/.test(name)) return "image";
  return null;
}

function allowedImageType(type: string): "image/png" | "image/jpeg" | "image/webp" | null {
  if (type === "image/jpg") return "image/jpeg";
  if (type === "image/png" || type === "image/jpeg" || type === "image/webp") return type;
  return null;
}

function attachmentMediaType(file: File, kind: "image" | "pdf" | "word"): string {
  if (
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/webp" ||
    file.type === "application/pdf" ||
    file.type === WORD_DOC ||
    file.type === WORD_DOCX
  ) {
    return file.type;
  }
  if (kind === "pdf") return "application/pdf";
  if (kind === "word") return file.name.toLowerCase().endsWith(".doc") ? WORD_DOC : WORD_DOCX;
  const name = file.name.toLowerCase();
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

function attachmentName(file: File, kind: "image" | "pdf" | "word"): string {
  const fallback = kind === "pdf" ? "documento.pdf" : kind === "word" ? "documento.docx" : "captura.png";
  const raw = file.name.replace(/[\\/]/g, " ").trim();
  const clean = !raw || raw === "image.png" || raw === "blob" ? fallback : raw;
  if (clean.length <= 80) return clean;
  const dot = clean.lastIndexOf(".");
  const ext = dot > 0 ? clean.slice(dot, dot + 8) : "";
  return `${clean.slice(0, 80 - ext.length)}${ext}`;
}

function clipboardFileName(type: string): string {
  if (type === "application/pdf") return "documento.pdf";
  if (type === "image/jpeg" || type === "image/jpg") return "captura.jpg";
  if (type === "image/webp") return "captura.webp";
  return "captura.png";
}

function withClipboardType(file: File, type: string): File {
  if (file.type || !type) return file;
  const name = !file.name || file.name === "blob" ? clipboardFileName(type) : file.name;
  return new File([file], name, { type });
}

function fileFromClipboard(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const item of data.items) {
    if (item.kind !== "file") continue;
    const raw = item.getAsFile();
    if (!raw || raw.size <= 0) continue;
    const file = withClipboardType(raw, item.type);
    if (attachmentKind(file) || item.type.startsWith("image/") || item.type === "application/pdf") return file;
  }
  for (const file of data.files) {
    if (file.size <= 0) continue;
    if (attachmentKind(file) || file.type.startsWith("image/")) return file;
  }
  return null;
}

function readDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("read"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("read"));
    reader.readAsDataURL(file);
  });
}

function forceDataUrl(mediaType: string, dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  const payload = comma >= 0 ? dataUrl.slice(comma + 1) : "";
  return `data:${mediaType};base64,${payload}`;
}

async function imageFileToPng(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), "image/png"));
    if (!blob) throw new Error("png");
    return blob;
  } finally {
    bitmap.close();
  }
}

const AREA_MARKS = ["tecnico", "operativo", "comercial", "facturacion", "capacitacion", "implementacion", "general"] as const;

function AreaMark({ id }: { id: string }) {
  const known = (AREA_MARKS as readonly string[]).includes(id);
  return <span className={known ? `attn-area-dot is-${id}` : "attn-area-dot"} aria-hidden="true" />;
}

function AreaSelect({
  areas,
  value,
  onChange,
}: {
  areas: AreaOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = areas.find((area) => area.id === value);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  function move(step: number) {
    if (areas.length === 0) return;
    const current = Math.max(0, areas.findIndex((area) => area.id === value));
    const next = areas[(current + step + areas.length) % areas.length];
    if (next) onChange(next.id);
    setOpen(true);
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    }
  }

  return (
    <div className={`attn-area-select${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="attn-area-trigger"
        aria-label="Área"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onKeyDown}
      >
        {selected ? <AreaMark id={selected.id} /> : null}
        <span>{selected?.name || "Seleccionar área"}</span>
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <ul className="attn-area-menu" role="listbox" aria-label="Área">
          {areas.map((area) => (
            <li key={area.id} role="none">
              <button
                type="button"
                role="option"
                aria-selected={area.id === value}
                className={area.id === value ? "is-on" : undefined}
                onClick={() => {
                  onChange(area.id);
                  setOpen(false);
                }}
              >
                <AreaMark id={area.id} />
                <span>{area.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Compose({
  mode,
  companies,
  areas,
  defaultArea,
  sending,
  originId = "escritorio.atencion.nuevo-ticket",
  spaceName = "",
  lockedTenantId = "",
  variant = "desk",
  onSubmit,
}: {
  mode: "panel" | "client";
  companies: Array<{ tenantId: string; name: string }>;
  areas: AreaOption[];
  defaultArea: string;
  sending: boolean;
  originId?: string;
  spaceName?: string;
  lockedTenantId?: string;
  variant?: "desk" | "company";
  onSubmit: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const origin = findHelpOrigin(originId);
  const ticketForm = originId !== "escritorio.chat-en-vivo";
  const fixedCompany = mode === "client" || Boolean(lockedTenantId);
  const [openedAt] = useState(() => new Date().toISOString());
  const [areaId, setAreaId] = useState(defaultArea);
  const [tenantId, setTenantId] = useState("");
  const [chatTenantId, setChatTenantId] = useState("");
  const [body, setBody] = useState("");
  const [whereNote, setWhereNote] = useState("");
  const [attachment, setAttachment] = useState<Record<string, string> | null>(null);
  const [attachNote, setAttachNote] = useState("");
  const [dropping, setDropping] = useState(false);
  const companyReady = mode !== "panel" || Boolean(lockedTenantId || tenantId);

  useEffect(() => {
    if (!areaId && defaultArea) setAreaId(defaultArea);
  }, [areaId, defaultArea]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const companyId = lockedTenantId || (ticketForm && mode === "client" ? "" : ticketForm ? tenantId : chatTenantId);
    if (!ticketForm && !companyId) return;
    void onSubmit({
      action: "open",
      areaId,
      tenantId: companyId,
      subject: subjectFrom(body),
      body,
      originId,
      capturedAt: openedAt,
      whereNote,
      attachment,
      priority: "normal",
    });
  }

  const takeFileRef = useRef<(file: File | undefined) => void>(() => {});
  const attachSeq = useRef(0);

  async function takeFile(file: File | undefined) {
    if (!file) return;
    const seq = ++attachSeq.current;
    const kind = attachmentKind(file);
    if (!kind) {
      setAttachNote("Solo imagen, PDF o Word.");
      return;
    }
    if (file.size > ATTACH_MAX_BYTES) {
      setAttachNote("El archivo pasa de 4 MB.");
      return;
    }
    try {
      let next: Record<string, string>;
      if (kind === "pdf" || kind === "word") {
        const mediaType = attachmentMediaType(file, kind);
        next = { name: attachmentName(file, kind), mediaType, dataUrl: forceDataUrl(mediaType, await readDataUrl(file)) };
      } else {
        const direct = allowedImageType(file.type) ?? (file.type ? null : allowedImageType(attachmentMediaType(file, "image")));
        if (direct) {
          next = { name: attachmentName(file, "image"), mediaType: direct, dataUrl: forceDataUrl(direct, await readDataUrl(file)) };
        } else {
          const png = await imageFileToPng(file);
          if (png.size > ATTACH_MAX_BYTES) {
            if (seq === attachSeq.current) setAttachNote("El archivo pasa de 4 MB.");
            return;
          }
          next = { name: "captura.png", mediaType: "image/png", dataUrl: await readDataUrl(png) };
        }
      }
      if (seq !== attachSeq.current) return;
      setAttachment(next);
      setAttachNote("");
    } catch {
      if (seq === attachSeq.current) setAttachNote("No pude leer ese archivo.");
    }
  }

  takeFileRef.current = (file) => {
    void takeFile(file);
  };

  useEffect(() => {
    if (!ticketForm) return;
    function onWindowPaste(event: ClipboardEvent) {
      const file = fileFromClipboard(event.clipboardData);
      if (file) {
        event.preventDefault();
        takeFileRef.current(file);
        return;
      }
      const hinted = [...(event.clipboardData?.items ?? [])].some((item) => item.type.startsWith("image/") || item.type === "application/pdf");
      if (!hinted || !navigator.clipboard?.read) return;
      event.preventDefault();
      void navigator.clipboard
        .read()
        .then(async (items) => {
          for (const item of items) {
            const type = item.types.find((entry) => entry.startsWith("image/") || entry === "application/pdf");
            if (!type) continue;
            const blob = await item.getType(type);
            takeFileRef.current(new File([blob], clipboardFileName(type), { type }));
            return;
          }
        })
        .catch(() => setAttachNote("No pude pegar. Arrastra el archivo o elige uno."));
    }
    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [ticketForm]);

  function onDragOver(event: DragEvent<HTMLFormElement>) {
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDropping(true);
  }

  function onDragLeave(event: DragEvent<HTMLFormElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDropping(false);
  }

  function onDrop(event: DragEvent<HTMLFormElement>) {
    event.preventDefault();
    setDropping(false);
    const file = [...event.dataTransfer.files].find((item) => attachmentKind(item));
    if (!file) {
      setAttachNote("Solo imagen, PDF o Word.");
      return;
    }
    void takeFile(file);
  }

  const dropProps = { onDragOver, onDragLeave, onDrop };

  if (variant === "company" && ticketForm) {
    return (
      <form className={`attn-compose is-company${dropping ? " is-dropping" : ""}`} onSubmit={submit} {...dropProps}>
        <header className="attn-compose-head">
          <h2>Nuevo ticket</h2>
        </header>
        <div className="attn-compose-fields">
          <div className="attn-field-row">
            <span>Empresa</span>
            <strong className="attn-company-pill">{spaceName || "Este espacio"}</strong>
          </div>
          <div className="attn-field-row">
            <span>
              Área <i aria-hidden="true">*</i>
            </span>
            <AreaSelect areas={areas} value={areaId} onChange={setAreaId} />
          </div>
          <label className="attn-field-row is-top">
            <span>
              Describe el problema <i aria-hidden="true">*</i>
            </span>
            <textarea
              value={body}
              rows={8}
              maxLength={2000}
              required
              placeholder="Cuéntanos con detalle qué está sucediendo, qué intentaste hacer y, si es posible, desde cuándo ocurre."
              aria-label="Describe el problema"
              onChange={(event) => setBody(event.target.value)}
            />
          </label>
        </div>
        <footer className="attn-compose-foot is-attach">
          <AttachControl
            attachment={attachment}
            note={attachNote}
            dropping={dropping}
            onPick={takeFile}
            onClear={() => {
              attachSeq.current += 1;
              setAttachment(null);
              setAttachNote("");
            }}
          />
          <button type="submit" className="primary" disabled={sending || !body.trim() || !areaId || !companyReady}>
            {sending ? "Enviando…" : "Enviar ticket"}
          </button>
        </footer>
      </form>
    );
  }

  if (!ticketForm) {
    const companyId = lockedTenantId || chatTenantId;
    return (
      <form className="attn-compose is-live" onSubmit={submit}>
        <h2>Nuevo mensaje</h2>
        {lockedTenantId ? null : (
          <label>
            Empresa
            <select
              value={chatTenantId}
              required
              aria-label="Empresa del chat"
              onChange={(event) => setChatTenantId(event.target.value)}
            >
              <option value="">Seleccionar empresa del chat</option>
              {companies.map((company) => (
                <option key={company.tenantId} value={company.tenantId}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="attn-area-field">
          <span>Área</span>
          <AreaSelect areas={areas} value={areaId} onChange={setAreaId} />
        </div>
        <div className="attn-composer">
          <ComposerFields body={body} sending={sending || !companyId} onChange={setBody} />
        </div>
      </form>
    );
  }

  return (
    <form className={`attn-compose${dropping ? " is-dropping" : ""}`} onSubmit={submit} {...dropProps}>
      <header className="attn-compose-head">
        <h2>Nuevo ticket</h2>
        <p>
          {origin ? formatHelpOrigin(origin) : "Origen no registrado"}
          {" · "}
          {formatAttentionWhen(openedAt)}
        </p>
      </header>
      <div className="attn-compose-fields">
        <div className="attn-compose-pair">
          {fixedCompany ? (
            <div className="attn-fixed-field">
              <span>Empresa</span>
              <strong>{spaceName || "Este espacio"}</strong>
            </div>
          ) : (
            <label>
              Empresa
              <select value={tenantId} onChange={(event) => setTenantId(event.target.value)} required aria-label="Empresa del ticket">
                <option value="">Seleccionar empresa</option>
                {companies.map((company) => (
                  <option key={company.tenantId} value={company.tenantId}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="attn-area-field">
            <span>Área</span>
            <AreaSelect areas={areas} value={areaId} onChange={setAreaId} />
          </div>
        </div>
        <label className="attn-problem">
          Describe el problema
          <textarea
            value={body}
            rows={8}
            maxLength={2000}
            required
            placeholder="Qué pasó y qué esperabas que ocurriera."
            aria-label="Describe el problema"
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <label>
          Dónde ocurrió
          <input value={whereNote} maxLength={200} onChange={(event) => setWhereNote(event.target.value)} placeholder="Opcional" aria-label="Dónde ocurrió" />
        </label>
      </div>
      <footer className="attn-compose-foot is-attach">
        <AttachControl
          attachment={attachment}
          note={attachNote}
          dropping={dropping}
          onPick={takeFile}
          onClear={() => {
            attachSeq.current += 1;
            setAttachment(null);
            setAttachNote("");
          }}
        />
        <button type="submit" className="primary" disabled={sending || !body.trim() || !areaId || !companyReady}>
          {sending ? "Enviando…" : "Enviar ticket"}
        </button>
      </footer>
    </form>
  );
}

function AttachControl({
  attachment,
  note,
  dropping,
  onPick,
  onClear,
}: {
  attachment: Record<string, string> | null;
  note: string;
  dropping: boolean;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) {
  const preview = attachment?.dataUrl.startsWith("data:image/") ? attachment.dataUrl : "";
  const hint = note || (dropping ? "Suelta para adjuntar" : "Arrastra aquí, pega (Ctrl+V) o elige. Imagen, PDF o Word.");
  return (
    <div className={`attn-dropzone${attachment ? " is-on" : ""}${dropping ? " is-dropping" : ""}${note ? " is-warn" : ""}`}>
      <label className="attn-dropzone-hit">
        <input
          type="file"
          accept="image/*,application/pdf,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.doc,.docx"
          aria-label="Adjuntar imagen, PDF o Word"
          onChange={(event) => {
            onPick(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {preview ? <img src={preview} alt="" /> : <span className="attn-dropzone-mark" aria-hidden="true" />}
        <span className="attn-dropzone-copy">
          <strong>{attachment?.name || (dropping ? "Suelta aquí" : "Adjuntar captura, PDF o Word")}</strong>
          <small className={note ? "is-warn" : undefined}>{hint}</small>
        </span>
        <span className="attn-dropzone-pick">{attachment ? "Cambiar" : "Elegir"}</span>
      </label>
      {attachment ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClear();
          }}
          aria-label="Quitar adjunto"
        >
          Quitar
        </button>
      ) : null}
    </div>
  );
}

function AttachmentChip({ name, dataUrl }: { name: string | null; dataUrl: string }) {
  const image = dataUrl.startsWith("data:image/");
  return (
    <p className="attn-file">
      <a href={dataUrl} target="_blank" rel="noreferrer">
        {image ? <img src={dataUrl} alt={name || "Adjunto"} /> : name || "PDF"}
      </a>
    </p>
  );
}

function milestoneAt(item: PublicAttentionCase, kind: PublicAttentionCase["events"][number]["kind"]): string {
  return item.events.find((entry) => entry.kind === kind)?.at ?? "";
}

function Thread({
  item,
  orgCases,
  mode,
  areas,
  online,
  colleagues,
  sending,
  onSelectCase,
  onPost,
}: {
  item: PublicAttentionCase;
  orgCases: PublicAttentionCase[];
  mode: "panel" | "client";
  areas: AreaOption[];
  online: boolean;
  colleagues: Colleague[];
  sending: boolean;
  onSelectCase: (id: string) => void;
  onPost: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const [conditions, setConditions] = useState("");
  const takers = colleagues.filter((person) => person.allAreas || person.areaIds.includes(item.areaId));

  useEffect(() => {
    setConditions("");
  }, [item.id]);

  const receivedAt = milestoneAt(item, "recepcion") || item.createdAt;
  const assignedAt = milestoneAt(item, "asignado");
  const answeredAt = milestoneAt(item, "primera_respuesta");
  const locationText = item.location
    ? [item.location.place, item.location.state === "last" && item.location.at ? formatAttentionWhen(item.location.at) : ""]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="attn-stage-inner">
      <header className="attn-stage-head">
        <div className="attn-detail-copy">
          <p className="attn-correlative">{item.code}</p>
          <h3>
            {item.subject}
            {online ? <i className="attn-live-dot" title="En línea" /> : null}
          </h3>
          <p className="attn-detail-meta">
            {mode === "panel" && item.status !== "resuelto" && item.status !== "confirmacion" ? (
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
            ) : (
              <span className={`attn-status-pill is-${item.status}`}>{statusLabel(item.status)}</span>
            )}
            <span>{item.company}</span>
            <span>{item.channelLabel}</span>
            <span className="attn-meta-origin">{item.helpPlace || "Origen no registrado"}</span>
          </p>
        </div>
        {mode === "panel" && (item.intakeChannel === "envivo" || item.originId === "escritorio.chat-en-vivo") ? (
          <button
            type="button"
            className="ghost"
            disabled={sending || Boolean(item.ticketCaseId)}
            onClick={() => void onPost({ action: "promote", caseId: item.id })}
          >
            {item.ticketCaseId ? `Mismo ticket ${item.code}` : "Pasar a ticket"}
          </button>
        ) : null}
        {mode === "panel" && item.status !== "resuelto" ? (
          <div className="attn-stage-actions">
            <select
              aria-label="Prioridad"
              value={item.priority}
              onChange={(event) => void onPost({ action: "priority", caseId: item.id, priority: event.target.value })}
            >
              <option value="normal">{priorityLabel("normal")}</option>
              <option value="alta">{priorityLabel("alta")}</option>
            </select>
            <select
              aria-label="Área"
              value={item.areaId}
              onChange={(event) => void onPost({ action: "area", caseId: item.id, areaId: event.target.value })}
            >
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
            <select
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
          </div>
        ) : null}
      </header>
      {orgCases.length > 1 ? (
        <label className="attn-case-pick">
          Conversación
          <select aria-label="Conversación" value={item.id} onChange={(event) => onSelectCase(event.target.value)}>
            {orgCases.map((row) => (
              <option key={row.id} value={row.id}>
                {row.subject}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="attn-main">
        <Bubbles item={item} mine={mode === "panel" ? "staff" : "client"} />
        <section className="attn-activity" aria-label="Actividad">
          <h4>Actividad</h4>
          <dl>
            <div>
              <dt>Recepción</dt>
              <dd>
                <time dateTime={receivedAt}>{formatAttentionWhen(receivedAt)}</time>
              </dd>
            </div>
            <div>
              <dt>Asignación</dt>
              <dd>
                {assignedAt ? <time dateTime={assignedAt}>{formatAttentionWhen(assignedAt)}</time> : "Sin asignar"}
              </dd>
            </div>
            <div>
              <dt>Primera respuesta humana</dt>
              <dd>
                {answeredAt ? <time dateTime={answeredAt}>{formatAttentionWhen(answeredAt)}</time> : "Pendiente"}
              </dd>
            </div>
            <div>
              <dt>Área</dt>
              <dd>{item.areaName}</dd>
            </div>
            <div>
              <dt>Siguiente paso</dt>
              <dd>{item.nextStepLabel}</dd>
            </div>
            {item.whereNote ? (
              <div>
                <dt>Dónde ocurrió</dt>
                <dd>{item.whereNote}</dd>
              </div>
            ) : null}
            {mode === "panel" && item.location ? (
              <div>
                <dt>{item.location.label}</dt>
                <dd>{locationText || "No está disponible"}</dd>
              </div>
            ) : null}
            {item.attachmentDataUrl ? (
              <div>
                <dt>Adjunto</dt>
                <dd>
                  <a href={item.attachmentDataUrl} target="_blank" rel="noreferrer">
                    {item.attachmentName || "Adjunto"}
                  </a>
                </dd>
              </div>
            ) : null}
            </dl>
          {mode === "panel" && item.events.length > 0 ? (
            <ol className="attn-event-list">
              {item.events.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.detail}</span>
                  <small>
                    {entry.actorName} · {formatAttentionWhen(entry.at)}
                  </small>
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      </div>
      {item.commercial?.canApprove ? (
        <div className="attn-commercial">
          <p>
            {item.commercial.appLabel}. {item.commercial.approval ? approvalLabel(item.commercial.approval) : "Pendiente de aprobación."}
          </p>
          <label>
            Condiciones, si las hay
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
      {item.status === "confirmacion" && mode === "client" ? (
        <ClientConfirmation item={item} sending={sending} onPost={onPost} />
      ) : item.status === "resuelto" ? (
        mode === "panel" ? (
          <div className="attn-reply-bar">
            <button type="button" className="primary" disabled={sending} onClick={() => void onPost({ action: "reopen", caseId: item.id })}>
              Reabrir
            </button>
          </div>
        ) : (
          <p className="lead attn-resolved">Este ticket está resuelto.</p>
        )
      ) : (
        <div className="attn-reply-bar">
          {mode === "panel" && item.status !== "confirmacion" ? (
            <button
              type="button"
              className="ghost"
              disabled={sending}
              onClick={() => void onPost({ action: "confirm-ask", caseId: item.id })}
            >
              Pendiente de confirmación
            </button>
          ) : null}
          {mode === "panel" ? (
            <button
              type="button"
              className="ghost"
              disabled={sending}
              onClick={() => void onPost({ action: "request-info", caseId: item.id, body: "¿Puedes contarnos un poco más?" })}
            >
              Pedir información
            </button>
          ) : null}
          <Composer
            sending={sending}
            onSend={(body) => onPost({ action: "message", caseId: item.id, body, asClient: mode === "client" })}
          />
        </div>
      )}
    </div>
  );
}

function Bubbles({
  item,
  mine,
  voice = "desk",
}: {
  item: PublicAttentionCase;
  mine: "staff" | "client";
  voice?: "desk" | "company";
}) {
  return (
    <div className="attn-thread-pane">
      {item.messages.length === 0 ? <p className="lead">Todavía no hay mensajes.</p> : null}
      {item.attachmentDataUrl ? <AttachmentChip name={item.attachmentName} dataUrl={item.attachmentDataUrl} /> : null}
      <ol className="attn-log">
        {item.messages.map((message) => {
          const label =
            voice === "company" && message.role === "staff"
              ? NELZURI_NAME
              : voice === "company" && message.role === "client"
                ? "Tú"
                : message.label;
          return message.role === "system" ? (
            <li key={message.id} className="is-system">
              <p>{message.body}</p>
            </li>
          ) : (
            <li key={message.id} className={message.role === mine ? "is-mine" : "is-theirs"}>
              <div>
                <small>
                  {label} · {formatAttentionWhen(message.at)}
                </small>
                <p>{message.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Composer({
  sending,
  onSend,
  placeholder = "Escribe un mensaje…",
}: {
  sending: boolean;
  onSend: (body: string) => Promise<boolean>;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sent = await onSend(draft);
    if (sent) setDraft("");
  }

  return (
    <form className="attn-composer" onSubmit={send}>
      <ComposerFields body={draft} sending={sending} placeholder={placeholder} onChange={setDraft} />
    </form>
  );
}

function ComposerFields({
  body,
  sending,
  onChange,
  placeholder = "Escribe un mensaje…",
  submitLabel = "Enviar",
}: {
  body: string;
  sending: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  submitLabel?: string;
}) {
  function onKey(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <>
      <textarea
        value={body}
        rows={2}
        maxLength={2000}
        placeholder={placeholder}
        aria-label="Mensaje"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKey}
      />
      <button type="submit" className="primary" disabled={sending || !body.trim()} aria-label={submitLabel}>
        {sending ? "…" : "↑"}
      </button>
    </>
  );
}
