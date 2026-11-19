"use client";

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  approvalLabel,
  formatAttentionWhen,
  groupAttentionOrgs,
  priorityLabel,
  statusLabel,
  type PublicAttentionCase,
} from "@/lib/desktop/attention";
import { filterDeskCases, findHelpOrigin, formatHelpOrigin } from "@/lib/desktop/help-origins";

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
};

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

export function DesktopAttention({
  mode,
  channel,
  onClose,
}: {
  mode: "panel" | "client";
  channel: Channel;
  onClose: () => void;
}) {
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [cases, setCases] = useState<PublicAttentionCase[]>([]);
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [staffOnline, setStaffOnline] = useState(false);
  const [onlineOrgs, setOnlineOrgs] = useState<OnlineOrg[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [originId, setOriginId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [queue, setQueue] = useState("unassigned");
  const [companies, setCompanies] = useState<Array<{ tenantId: string; name: string }>>([]);
  const [composing, setComposing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const liveClient = channel === "envivo" && mode === "client";

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
            areas?: AreaOption[];
            cases?: PublicAttentionCase[];
            colleagues?: Colleague[];
            companies?: Array<{ tenantId: string; name: string }>;
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
          setAreas(attention.areas ?? []);
          setCases(attention.cases ?? []);
          setColleagues(attention.colleagues ?? []);
          setCompanies(attention.companies ?? []);
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

  const listed = useMemo(() => {
    if (mode !== "panel" || channel !== "mensajes") return cases;
    return filterDeskCases(cases, {
      query,
      tenantId: companyId,
      originId,
      status: statusId,
      priority: priorityId,
      assigneeUserId: assigneeId,
      unassigned: queue === "unassigned",
      noFirstReply: queue === "waiting",
    });
  }, [assigneeId, cases, channel, companyId, mode, originId, priorityId, query, queue, statusId]);

  const rows = useMemo((): ChatRow[] => {
    const source = mode === "panel" && channel === "mensajes" ? listed : cases;
    const needle = mode === "panel" && channel === "mensajes" ? "" : query.trim().toLocaleLowerCase("es");
    const matches = (title: string, preview: string) =>
      !needle || title.toLocaleLowerCase("es").includes(needle) || preview.toLocaleLowerCase("es").includes(needle);

    if (channel === "envivo" && mode === "panel") {
      return onlineOrgs.flatMap((org) => {
        const related = source.filter((item) => item.tenantId === org.tenantId).sort(byRecent);
        const preview = org.names.length > 0 ? `${org.names.join(", ")} en línea` : "En el escritorio";
        if (!matches(org.company, preview)) return [];
        return [
          {
            key: org.tenantId,
            tenantId: org.tenantId,
            caseId: pickCase(related)?.id ?? "",
            title: org.company,
            preview,
            at: related[0]?.updatedAt ?? "",
            unread: related.some((item) => item.unread),
            online: true,
          } satisfies ChatRow,
        ];
      });
    }

    if (mode === "client") {
      return source
        .slice()
        .sort(byRecent)
        .flatMap((item) => {
          const preview = `${item.code} · ${item.messages.at(-1)?.body || item.areaName}`;
          if (!matches(item.subject, preview) && !matches(item.code, item.company)) return [];
          return [
            {
              key: item.id,
              tenantId: item.tenantId,
              caseId: item.id,
              title: item.subject,
              preview,
              at: item.updatedAt,
              unread: item.unread,
              online: staffOnline,
            } satisfies ChatRow,
          ];
        });
    }

    if (mode === "panel" && channel === "mensajes" && queue === "unassigned") {
      return source
        .slice()
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
        .map(
          (item) =>
            ({
              key: item.id,
              tenantId: item.tenantId,
              caseId: item.id,
              title: `${item.code} · ${item.subject}`,
              preview: item.company,
              at: item.createdAt,
              unread: item.unread || item.awaitingFirstReply,
              online: onlineIds.has(item.tenantId),
              origin: item.helpPlace || "Origen no registrado",
              area: item.areaName,
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
  }, [cases, channel, listed, mode, onlineIds, onlineOrgs, query, queue, staffOnline]);

  const selected = cases.find((item) => item.id === selectedId) ?? null;
  const orgCases = selected
    ? cases.filter((item) => item.tenantId === selected.tenantId).slice().sort(byRecent)
    : [];
  const liveCase = useMemo(() => {
    if (!liveClient) return null;
    return pickCase(cases.filter((item) => item.status !== "resuelto")) ?? pickCase(cases);
  }, [cases, liveClient]);
  const threadCase = liveClient ? liveCase : selected;

  function replaceCase(next: PublicAttentionCase) {
    setCases((current) => [next, ...current.filter((item) => item.id !== next.id)]);
    setSelectedTenantId(next.tenantId);
    setSelectedId(next.id);
    setComposing(false);
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

  async function openRow(row: ChatRow) {
    setComposing(false);
    setSelectedTenantId(row.tenantId);
    setSelectedId(row.caseId);
    if (!row.caseId || !row.unread) return;
    await post({ action: "read", caseId: row.caseId });
  }

  useEffect(() => {
    if (!liveClient || !liveCase?.unread) return;
    void post({ action: "read", caseId: liveCase.id });
    // La lectura se dispara al aparecer un caso sin leer, no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveClient, liveCase?.id, liveCase?.unread]);

  const title = channel === "envivo" ? "Chat en vivo" : "Atención al Cliente";
  const globalDesk = channel === "mensajes" && mode === "panel";
  const defaultArea = areas.find((area) => area.id === "general" && area.active)?.id ?? areas.find((area) => area.active)?.id ?? "";

  return (
    <div className="ajustes-back" onClick={onClose}>
      <div
        className={`ajustes-window is-clients is-attention${liveClient ? " is-attention-client" : " is-attention-panel"}${globalDesk ? " is-platform-capsule" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="attention-title"
        onClick={(event) => event.stopPropagation()}
      >
        {error ? <p className="form-error attn-error">{error}</p> : null}
        {loading ? <p className="ajustes-wait">Abriendo…</p> : null}
        {!loading ? (
          <div className={`attn-shell is-chat${liveClient ? " is-live-client" : ""}`}>
            {liveClient ? null : (
              <section className="attn-inbox" aria-label={title}>
                <header className="attn-inbox-head">
                  <div>
                    <h2 id="attention-title">{title}</h2>
                    <p>{channel === "envivo" ? "Quien está en el escritorio" : mode === "client" ? "Mis tickets" : "Bandeja"}</p>
                  </div>
                  <button type="button" className="ghost" onClick={onClose}>
                    Cerrar
                  </button>
                </header>
                <div className="attn-inbox-tools">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={mode === "panel" ? "Buscar correlativo…" : "Buscar ticket…"}
                    aria-label="Buscar"
                  />
                  {mode === "client" && channel === "mensajes" ? (
                    <button
                      type="button"
                      className="primary attn-new"
                      onClick={() => {
                        setComposing(true);
                        setSelectedId("");
                      }}
                    >
                      Nuevo ticket
                    </button>
                  ) : null}
                  {mode === "panel" && channel === "mensajes" ? (
                    <button
                      type="button"
                      className="primary attn-new"
                      onClick={() => {
                        setComposing(true);
                        setSelectedId("");
                      }}
                    >
                      Nuevo ticket
                    </button>
                  ) : null}
                </div>
                {mode === "panel" && channel === "mensajes" ? (
                  <div className="attn-inbox-tools">
                    <select aria-label="Empresa" value={companyId} onChange={(event) => setCompanyId(event.target.value)}>
                      <option value="">Empresa</option>
                      {companies.map((company) => (
                        <option key={company.tenantId} value={company.tenantId}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    <select aria-label="Origen" value={originId} onChange={(event) => setOriginId(event.target.value)}>
                      <option value="">Origen</option>
                      <option value="growth-os.admision.editar-formulario">Editar formulario</option>
                      <option value="growth-os.admision.editar-formulario.guardar">Guardar formulario</option>
                      <option value="growth-os.admision.editar-formulario.publicar">Publicar formulario</option>
                      <option value="growth-os.admision.formularios">Formularios</option>
                      <option value="escritorio.atencion.nuevo-ticket">Escritorio</option>
                      <option value="web.publica.pedir-ayuda">Web pública</option>
                    </select>
                    <select aria-label="Estado" value={statusId} onChange={(event) => setStatusId(event.target.value)}>
                      <option value="">Estado</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="abierto">En gestión</option>
                      <option value="resuelto">Resuelto</option>
                    </select>
                    <select aria-label="Prioridad" value={priorityId} onChange={(event) => setPriorityId(event.target.value)}>
                      <option value="">Prioridad</option>
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                    </select>
                    <select aria-label="Responsable" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
                      <option value="">Responsable</option>
                      {colleagues.map((person) => (
                        <option key={person.userId} value={person.userId}>
                          {person.displayName}
                        </option>
                      ))}
                    </select>
                    <select aria-label="Cola" value={queue} onChange={(event) => setQueue(event.target.value)}>
                      <option value="">Cola</option>
                      <option value="unassigned">Sin asignar</option>
                      <option value="waiting">Sin primera respuesta</option>
                    </select>
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
                    {rows.map((row) => (
                      <li key={row.key}>
                        <button
                          type="button"
                          className={
                            row.key === (mode === "client" || row.origin ? selectedId : selectedTenantId) && !composing
                              ? "is-active"
                              : undefined
                          }
                          onClick={() => void openRow(row)}
                        >
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
                            {row.origin ? <small>Origen: {row.origin}</small> : null}
                            {row.area ? <small>Área: {row.area}</small> : null}
                          </span>
                          {row.at ? (
                            <span className="attn-org-meta">
                              {row.origin ? <span>Ingreso</span> : null}
                              <time dateTime={row.at}>{formatAttentionWhen(row.at)}</time>
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <section className="attn-stage" aria-label="Conversación">
              {liveClient ? (
                <LiveClient
                  item={liveCase}
                  staffOnline={staffOnline}
                  areas={areas.filter((area) => area.active)}
                  defaultArea={defaultArea}
                  sending={sending}
                  onPost={post}
                  onClose={onClose}
                />
              ) : composing && channel === "mensajes" ? (
                <Compose
                  mode={mode}
                  companies={companies}
                  areas={areas.filter((area) => area.active)}
                  defaultArea={defaultArea}
                  sending={sending}
                  onSubmit={post}
                />
              ) : threadCase ? (
                <Thread
                  item={threadCase}
                  orgCases={mode === "panel" ? orgCases : [threadCase]}
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
                  onClose={onClose}
                />
              ) : (
                <div className="attn-stage-empty">
                  <p>
                    {channel === "envivo" && selectedTenantId
                      ? "Está en línea. La conversación aparece cuando escriba."
                      : "Elige un ticket."}
                  </p>
                  {liveClient ? null : (
                    <button type="button" className="ghost attn-stage-close" onClick={onClose}>
                      Cerrar
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LiveClient({
  item,
  staffOnline,
  areas,
  defaultArea,
  sending,
  onPost,
  onClose,
}: {
  item: PublicAttentionCase | null;
  staffOnline: boolean;
  areas: AreaOption[];
  defaultArea: string;
  sending: boolean;
  onPost: (payload: Record<string, unknown>) => Promise<boolean>;
  onClose: () => void;
}) {
  return (
    <div className="attn-stage-inner">
      <header className="attn-stage-head">
        <div>
          <h3 id="attention-title">
            Nelzuri
            {staffOnline ? <i className="attn-live-dot" title="En línea" /> : null}
          </h3>
          <p>{staffOnline ? "En línea" : "No hay nadie en línea. El mensaje queda en Atención al Cliente."}</p>
        </div>
        <button type="button" className="ghost attn-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </header>
      {item ? <Bubbles item={item} mine="client" /> : <p className="attn-placeholder">Escribe para empezar.</p>}
      {item && item.status !== "resuelto" ? (
        <Composer sending={sending} onSend={(body) => onPost({ action: "message", caseId: item.id, body })} />
      ) : (
        <Compose mode="client" companies={[]} areas={areas} defaultArea={defaultArea} sending={sending} onSubmit={onPost} />
      )}
    </div>
  );
}

function Compose({
  mode,
  companies,
  areas,
  defaultArea,
  sending,
  onSubmit,
}: {
  mode: "panel" | "client";
  companies: Array<{ tenantId: string; name: string }>;
  areas: AreaOption[];
  defaultArea: string;
  sending: boolean;
  onSubmit: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const origin = findHelpOrigin("escritorio.atencion.nuevo-ticket");
  const [openedAt] = useState(() => new Date().toISOString());
  const [areaId, setAreaId] = useState(defaultArea);
  const [tenantId, setTenantId] = useState(companies[0]?.tenantId ?? "");
  const [body, setBody] = useState("");
  const [whereNote, setWhereNote] = useState("");
  const [attachment, setAttachment] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!areaId && defaultArea) setAreaId(defaultArea);
  }, [areaId, defaultArea]);

  useEffect(() => {
    if (!tenantId && companies[0]) setTenantId(companies[0].tenantId);
  }, [companies, tenantId]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit({
      action: "open",
      areaId,
      tenantId: mode === "panel" ? tenantId : "",
      subject: subjectFrom(body),
      body,
      originId: "escritorio.atencion.nuevo-ticket",
      capturedAt: openedAt,
      whereNote,
      attachment,
      priority: "normal",
    });
  }

  function onFile(file: File | undefined) {
    if (!file) {
      setAttachment(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachment({ name: file.name, mediaType: file.type, dataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <form className="attn-compose" onSubmit={submit}>
      <h2>Nuevo ticket</h2>
      <p className="lead">
        Origen: {origin ? formatHelpOrigin(origin) : "Origen no registrado"} · {formatAttentionWhen(openedAt)}
      </p>
      {mode === "panel" ? (
        <label>
          Empresa
          <select value={tenantId} onChange={(event) => setTenantId(event.target.value)} required aria-label="Empresa del ticket">
            {companies.map((company) => (
              <option key={company.tenantId} value={company.tenantId}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        Área
        <select value={areaId} onChange={(event) => setAreaId(event.target.value)} required aria-label="Área">
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Dónde ocurrió
        <input value={whereNote} maxLength={200} onChange={(event) => setWhereNote(event.target.value)} placeholder="Opcional" aria-label="Dónde ocurrió" />
      </label>
      <label>
        Captura
        <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Captura" onChange={(event) => onFile(event.target.files?.[0])} />
      </label>
      <div className="attn-composer">
        <ComposerFields body={body} sending={sending} onChange={setBody} />
      </div>
    </form>
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
  onClose,
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
  onClose: () => void;
}) {
  const [conditions, setConditions] = useState("");
  const takers = colleagues.filter((person) => person.allAreas || person.areaIds.includes(item.areaId));
  const title = mode === "panel" ? item.company : item.subject;

  useEffect(() => {
    setConditions("");
  }, [item.id]);

  return (
    <div className="attn-stage-inner">
      <header className="attn-stage-head">
        <div>
          <h3>
            {title}
            {online ? <i className="attn-live-dot" title="En línea" /> : null}
          </h3>
          <p>
            {item.code} · {item.nextStepLabel}
          </p>
          <p>Origen: {item.helpPlace || "Origen no registrado"}</p>
          <p>Área: {item.areaName}</p>
          {mode === "panel" ? (
            <p>
              {item.location?.label ?? "No está disponible"}
              {item.location?.place ? ` ${item.location.place}` : ""}
              {item.location?.state === "last" && item.location.at ? ` · ${formatAttentionWhen(item.location.at)}` : ""}
            </p>
          ) : null}
          {item.whereNote ? <p>Dónde ocurrió: {item.whereNote}</p> : null}
          <ol className="attn-milestones" aria-label="Hitos">
            <li>
              <span>Recepción</span>
              <time dateTime={milestoneAt(item, "recepcion") || item.createdAt}>
                {formatAttentionWhen(milestoneAt(item, "recepcion") || item.createdAt)}
              </time>
            </li>
            <li>
              <span>Asignación</span>
              {milestoneAt(item, "asignado") ? (
                <time dateTime={milestoneAt(item, "asignado")}>{formatAttentionWhen(milestoneAt(item, "asignado"))}</time>
              ) : (
                <span>Sin asignar</span>
              )}
            </li>
            <li>
              <span>Primera respuesta humana</span>
              {milestoneAt(item, "primera_respuesta") ? (
                <time dateTime={milestoneAt(item, "primera_respuesta")}>
                  {formatAttentionWhen(milestoneAt(item, "primera_respuesta"))}
                </time>
              ) : (
                <span>Pendiente</span>
              )}
            </li>
          </ol>
          {item.awaitingFirstReply && mode === "panel" ? <p>Primera respuesta pendiente.</p> : null}
          {!item.assigneeUserId && item.status !== "resuelto" && mode === "panel" ? <p>Sin asignar.</p> : null}
        </div>
        <div className="attn-stage-actions">
          {mode === "panel" && item.status !== "resuelto" ? (
            <select
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
          {mode === "panel" && item.status !== "resuelto" ? (
            <select
              aria-label="Prioridad"
              value={item.priority}
              onChange={(event) => void onPost({ action: "priority", caseId: item.id, priority: event.target.value })}
            >
              <option value="normal">{priorityLabel("normal")}</option>
              <option value="alta">{priorityLabel("alta")}</option>
            </select>
          ) : null}
          {mode === "panel" && item.status !== "resuelto" ? (
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
          ) : null}
          {mode === "panel" && item.status !== "resuelto" ? (
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
          ) : null}
          <button type="button" className="ghost attn-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
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
      <Bubbles item={item} mine={mode === "panel" ? "staff" : "client"} />
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
      {mode === "panel" && item.events.length > 0 ? (
        <ol className="attn-log">
          {item.events.map((entry) => (
            <li key={entry.id}>
              <small>
                {entry.actorName} · {formatAttentionWhen(entry.at)}
              </small>
              <p>{entry.detail}</p>
            </li>
          ))}
        </ol>
      ) : null}
      {item.attachmentDataUrl ? (
        <p>
          <a href={item.attachmentDataUrl} target="_blank" rel="noreferrer">
            {item.attachmentName || "Captura"}
          </a>
        </p>
      ) : null}
      {item.status === "resuelto" ? (
        mode === "panel" ? (
          <button type="button" className="primary" disabled={sending} onClick={() => void onPost({ action: "reopen", caseId: item.id })}>
            Reabrir
          </button>
        ) : (
          <p className="lead">Este ticket está resuelto.</p>
        )
      ) : (
        <>
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
          <Composer sending={sending} onSend={(body) => onPost({ action: "message", caseId: item.id, body })} />
        </>
      )}
    </div>
  );
}

function Bubbles({ item, mine }: { item: PublicAttentionCase; mine: "staff" | "client" }) {
  return (
    <div className="attn-thread-pane">
      {item.messages.length === 0 ? <p className="lead">Todavía no hay mensajes.</p> : null}
      <ol className="attn-log">
        {item.messages.map((message) =>
          message.role === "system" ? (
            <li key={message.id} className="is-system">
              <p>{message.body}</p>
            </li>
          ) : (
            <li key={message.id} className={message.role === mine ? "is-mine" : "is-theirs"}>
              <div>
                <small>
                  {message.label} · {formatAttentionWhen(message.at)}
                </small>
                <p>{message.body}</p>
              </div>
            </li>
          )
        )}
      </ol>
    </div>
  );
}

function Composer({
  sending,
  onSend,
}: {
  sending: boolean;
  onSend: (body: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState("");

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sent = await onSend(draft);
    if (sent) setDraft("");
  }

  return (
    <form className="attn-composer" onSubmit={send}>
      <ComposerFields body={draft} sending={sending} onChange={setDraft} />
    </form>
  );
}

function ComposerFields({
  body,
  sending,
  onChange,
  submitLabel = "Enviar",
}: {
  body: string;
  sending: boolean;
  onChange: (value: string) => void;
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
        placeholder="Escribe un mensaje…"
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
