import { isMentorAppId, mentorAppLabel, type MentorAppId } from "@/lib/desktop/catalog";

/**
 * Presencia real llega en la etapa siguiente.
 * Hasta entonces nadie figura como disponible.
 */
export function attentionOnline(): { online: false } {
  return { online: false };
}

export const COMMERCIAL_AREA_ID = "comercial";

export type CaseStatus = "abierto" | "pendiente" | "resuelto";
export type CasePriority = "normal" | "alta";
export type ApprovalState = "sin_revision" | "aprobada" | "rechazada";
export type ActivationState = "pendiente" | "activada";
export type AttentionView =
  | "general"
  | "vivo"
  | "sin_asignar"
  | "mias"
  | "pendientes"
  | "resueltos";

export interface AttentionArea {
  id: string;
  name: string;
  description: string;
  active: boolean;
  builtin: boolean;
}

export const DEFAULT_ATTENTION_AREAS: readonly AttentionArea[] = [
  {
    id: "tecnico",
    name: "Soporte técnico",
    description: "Incidencias, problemas de acceso y errores.",
    active: true,
    builtin: true,
  },
  {
    id: "operativo",
    name: "Soporte operativo",
    description: "Ayuda en el uso cotidiano de las aplicaciones.",
    active: true,
    builtin: true,
  },
  {
    id: COMMERCIAL_AREA_ID,
    name: "Comercial",
    description: "Productos, planes, nuevas aplicaciones y servicios.",
    active: true,
    builtin: true,
  },
  {
    id: "facturacion",
    name: "Facturación y contratación",
    description: "Pagos, cobros, documentos y aprobaciones.",
    active: true,
    builtin: true,
  },
  {
    id: "capacitacion",
    name: "Capacitación",
    description: "Orientación y formación de usuarios.",
    active: true,
    builtin: true,
  },
  {
    id: "implementacion",
    name: "Implementación",
    description: "Configuración, incorporación y puesta en marcha.",
    active: true,
    builtin: true,
  },
  {
    id: "general",
    name: "Consultas generales",
    description: "Requerimientos que necesitan clasificación.",
    active: true,
    builtin: true,
  },
];

export interface AttentionMessage {
  id: string;
  at: string;
  authorUserId: string;
  authorName: string;
  role: "client" | "staff";
  body: string;
}

export interface AttentionEvent {
  id: string;
  at: string;
  actorUserId: string;
  actorName?: string;
  kind:
    | "creado"
    | "asignado"
    | "transferido"
    | "estado"
    | "prioridad"
    | "aprobacion"
    | "activacion";
  detail: string;
}

export interface HelpFrom {
  originId: string;
  channel: string;
  siteOrApp: string;
  module: string;
  screen: string;
  action: string | null;
  at: string;
}

export interface HelpAttachment {
  name: string;
  mediaType: string;
  dataUrl: string;
}

export interface CommercialRecord {
  appId: MentorAppId;
  requesterUserId: string;
  economicResponsibleUserId: string | null;
  approval: ApprovalState;
  conditions: string | null;
  activation: ActivationState;
}

export interface AttentionCase {
  id: string;
  tenantId: string;
  areaId: string;
  subject: string;
  status: CaseStatus;
  priority: CasePriority;
  productId: MentorAppId | null;
  requesterUserId: string;
  requesterName: string;
  participantUserIds: string[];
  assigneeUserId: string | null;
  assigneeName: string | null;
  contextNote: string;
  commercial: CommercialRecord | null;
  correlative?: string;
  helpFrom?: HelpFrom | null;
  whereNote?: string;
  attachment?: HelpAttachment | null;
  waitingOn?: "nelzuri" | "cliente";
  sharedWithCompany?: boolean;
  readAtByUser?: Record<string, string>;
  visitorEmail?: string;
  contactCodeHash?: string;
  contactVerifiedAt?: string | null;
  messages: AttentionMessage[];
  events: AttentionEvent[];
  clientReadAt?: string;
  /** Una marca para el equipo. La lectura por persona llega con la presencia. */
  staffReadAt?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface AttentionActor {
  userId: string;
  displayName: string;
  kind: "client" | "staff";
  tenantId: string | null;
  allAreas: boolean;
  areaIds: readonly string[];
  orgWide: boolean;
  economic: boolean;
}

export interface AttentionColleague {
  userId: string;
  displayName: string;
  allAreas: boolean;
  areaIds: readonly string[];
}

export interface PublicCommercial {
  appId: MentorAppId;
  appLabel: string;
  activation: ActivationState;
  approval: ApprovalState | null;
  conditions: string | null;
  canApprove: boolean;
}

export interface PublicAttentionCase {
  id: string;
  code: string;
  tenantId: string;
  company: string;
  areaId: string;
  areaName: string;
  subject: string;
  status: CaseStatus;
  priority: CasePriority;
  productId: MentorAppId | null;
  productLabel: string | null;
  requesterName: string;
  assigneeUserId: string | null;
  assigneeName: string | null;
  contextNote: string;
  unread: boolean;
  createdAt: string;
  updatedAt: string;
  commercial: PublicCommercial | null;
  messages: Array<{ id: string; at: string; role: "client" | "staff"; label: string; body: string }>;
  events: Array<{ id: string; at: string; detail: string; actorName: string }>;
  originId: string;
  helpFromLabel: string;
  helpPlace: string;
  helpAt: string | null;
  nextStep: "nelzuri" | "cliente" | "resuelto";
  nextStepLabel: string;
  whereNote: string;
  attachmentName: string | null;
  attachmentDataUrl: string | null;
  awaitingFirstReply: boolean;
  contactVerified: boolean;
  location: {
    state: "now" | "last" | "unavailable";
    label: string;
    place: string;
    at: string | null;
  } | null;
}

export interface LegacyAttentionThread {
  tenantId: string;
  messages?: Array<{
    id?: string;
    at?: string;
    authorUserId?: string;
    role?: string;
    body?: string;
  }>;
  updatedAt?: string;
  clientReadAt?: string;
  ownerReadAt?: string;
}

const MAX_BODY = 2000;
const MAX_NOTE = 2000;
const MAX_SUBJECT = 120;

export function statusLabel(status: CaseStatus): string {
  if (status === "abierto") return "En gestión";
  if (status === "resuelto") return "Resuelto";
  return "Pendiente";
}

export function priorityLabel(priority: CasePriority): string {
  return priority === "alta" ? "Alta" : "Normal";
}

export function approvalLabel(approval: ApprovalState): string {
  if (approval === "aprobada") return "Aprobada";
  if (approval === "rechazada") return "Rechazada";
  return "Sin aprobación económica";
}

export function activationLabel(activation: ActivationState): string {
  return activation === "activada" ? "Activada en Clientes" : "Activación pendiente";
}

export function caseCode(id: string): string {
  const compact = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
  return `AT-${compact || "CASO"}`;
}

export function planRequestBody(appId: MentorAppId): string {
  const label = mentorAppLabel(appId);
  return `Pidió ${label.endsWith(".") ? label : `${label}.`}`;
}

export function isCaseStatus(value: string): value is CaseStatus {
  return value === "abierto" || value === "pendiente" || value === "resuelto";
}

export function isCasePriority(value: string): value is CasePriority {
  return value === "normal" || value === "alta";
}

export function mergeAttentionAreas(stored: unknown): AttentionArea[] {
  const active = new Map<string, boolean>();
  const custom: AttentionArea[] = [];
  if (Array.isArray(stored)) {
    for (const item of stored) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id.trim() : "";
      if (!id) continue;
      const builtin = DEFAULT_ATTENTION_AREAS.find((area) => area.id === id);
      if (builtin) {
        active.set(id, row.active === false && id !== COMMERCIAL_AREA_ID ? false : true);
        continue;
      }
      const name = cleanName(typeof row.name === "string" ? row.name : "");
      if (!name) continue;
      custom.push({
        id,
        name,
        description:
          typeof row.description === "string" && row.description.trim()
            ? row.description.trim().slice(0, 160)
            : "Área definida por la plataforma.",
        active: row.active !== false,
        builtin: false,
      });
    }
  }
  return [
    ...DEFAULT_ATTENTION_AREAS.map((area) => ({
      ...area,
      active: active.get(area.id) ?? true,
    })),
    ...custom,
  ];
}

export function addAttentionArea(
  areas: readonly AttentionArea[],
  name: string,
  id?: string
): { ok: true; areas: AttentionArea[] } | { ok: false; reason: "name" | "duplicate" } {
  const clean = cleanName(name);
  if (!clean) return { ok: false, reason: "name" };
  if (areas.some((area) => area.name.localeCompare(clean, "es", { sensitivity: "accent" }) === 0)) {
    return { ok: false, reason: "duplicate" };
  }
  const nextId = uniqueAreaId(id?.trim() || slugArea(clean), areas);
  return {
    ok: true,
    areas: [
      ...areas.map((area) => ({ ...area })),
      {
        id: nextId,
        name: clean,
        description: "Área definida por la plataforma.",
        active: true,
        builtin: false,
      },
    ],
  };
}

export function setAttentionAreaActive(
  areas: readonly AttentionArea[],
  id: string,
  active: boolean
): { ok: true; areas: AttentionArea[] } | { ok: false; reason: "missing" | "comercial" | "last" } {
  const current = areas.find((area) => area.id === id);
  if (!current) return { ok: false, reason: "missing" };
  if (!active && id === COMMERCIAL_AREA_ID) return { ok: false, reason: "comercial" };
  if (!active && current.active && areas.filter((area) => area.active).length <= 1) {
    return { ok: false, reason: "last" };
  }
  return {
    ok: true,
    areas: areas.map((area) => (area.id === id ? { ...area, active } : { ...area })),
  };
}

export function normalizeGrant(areaIds: unknown, areas: readonly AttentionArea[]): string[] {
  if (!Array.isArray(areaIds)) return [];
  const known = new Set(areas.map((area) => area.id));
  const unique: string[] = [];
  for (const id of areaIds) {
    if (typeof id !== "string" || !known.has(id) || unique.includes(id)) continue;
    unique.push(id);
  }
  return unique;
}

export function canSeeAttentionCase(actor: AttentionActor, item: AttentionCase): boolean {
  if (actor.kind === "staff") {
    return actor.allAreas || actor.areaIds.includes(item.areaId);
  }
  if (!actor.tenantId || actor.tenantId !== item.tenantId) return false;
  if (actor.orgWide || item.sharedWithCompany) return true;
  if (item.requesterUserId === actor.userId) return true;
  return item.participantUserIds.includes(actor.userId);
}

export function canTakeArea(person: AttentionColleague, areaId: string): boolean {
  return person.allAreas || person.areaIds.includes(areaId);
}

export function caseIsUnread(item: AttentionCase, actor: AttentionActor): boolean {
  const last = item.messages[item.messages.length - 1];
  if (!last) return false;
  const mine = actor.kind === "staff" ? "staff" : "client";
  if (last.role === mine) return false;
  const personal = item.readAtByUser?.[actor.userId];
  const readAt = personal ?? (actor.kind === "client" ? item.clientReadAt : undefined);
  if (!readAt) return true;
  return last.at > readAt;
}

export function markCaseRead(item: AttentionCase, actor: AttentionActor, now: string): AttentionCase {
  const readAtByUser = { ...(item.readAtByUser ?? {}), [actor.userId]: now };
  if (actor.kind === "staff") return { ...item, staffReadAt: now, readAtByUser };
  return { ...item, clientReadAt: now, readAtByUser };
}

export function caseNextStep(item: Pick<AttentionCase, "status" | "waitingOn">): "nelzuri" | "cliente" | "resuelto" {
  if (item.status === "resuelto") return "resuelto";
  if (item.waitingOn === "cliente") return "cliente";
  return "nelzuri";
}

export function nextStepLabel(step: "nelzuri" | "cliente" | "resuelto"): string {
  if (step === "resuelto") return "Resuelto";
  if (step === "cliente") return "Le toca al cliente";
  return "Le toca a NELZURI";
}

export function attentionBadge(
  cases: readonly AttentionCase[],
  actor: AttentionActor
): { count: number; unread: boolean } {
  const visible = cases.filter((item) => canSeeAttentionCase(actor, item));
  if (actor.kind === "staff") {
    const count = visible.filter(
      (item) => (item.status !== "resuelto" && !item.assigneeUserId) || caseIsUnread(item, actor)
    ).length;
    return { count, unread: false };
  }
  return { count: 0, unread: visible.some((item) => caseIsUnread(item, actor)) };
}

export interface AttentionFilter {
  view?: AttentionView;
  actorUserId?: string;
  tenantId?: string;
  areaId?: string;
  productId?: string;
  priority?: CasePriority | "";
  status?: CaseStatus | "";
}

export function filterAttentionCases<T extends AttentionCase | PublicAttentionCase>(
  cases: readonly T[],
  filter: AttentionFilter
): T[] {
  if (filter.view === "vivo") return [];
  return cases
    .filter((item) => {
      if (filter.view === "general" && item.status === "resuelto") return false;
      if (filter.view === "sin_asignar" && (item.assigneeUserId || item.status === "resuelto")) return false;
      if (filter.view === "mias" && (item.assigneeUserId !== filter.actorUserId || item.status === "resuelto")) {
        return false;
      }
      if (filter.view === "pendientes" && item.status !== "pendiente") return false;
      if (filter.view === "resueltos" && item.status !== "resuelto") return false;
      if (filter.tenantId && item.tenantId !== filter.tenantId) return false;
      if (filter.areaId && item.areaId !== filter.areaId) return false;
      if (filter.productId && item.productId !== filter.productId) return false;
      if (filter.priority && item.priority !== filter.priority) return false;
      if (filter.status && item.status !== filter.status) return false;
      return true;
    })
    .slice()
    .sort(byRecent);
}

export interface AttentionOrgSource {
  tenantId: string;
  company: string;
  areaName: string;
  subject: string;
  status: CaseStatus;
  updatedAt: string;
  unread?: boolean;
}

export interface AttentionOrgRow<T extends AttentionOrgSource = PublicAttentionCase> {
  tenantId: string;
  company: string;
  openCount: number;
  unreadCount: number;
  lastAt: string;
  preview: string;
  cases: T[];
}

/** Agrupa casos ya filtrados en una fila por organización. No inventa orgs vacías. */
export function groupAttentionOrgs<T extends AttentionOrgSource>(cases: readonly T[]): AttentionOrgRow<T>[] {
  const map = new Map<string, AttentionOrgRow<T>>();
  for (const item of cases) {
    const existing = map.get(item.tenantId);
    if (!existing) {
      map.set(item.tenantId, {
        tenantId: item.tenantId,
        company: item.company,
        openCount: item.status === "resuelto" ? 0 : 1,
        unreadCount: item.unread ? 1 : 0,
        lastAt: item.updatedAt,
        preview: `${item.areaName} · ${item.subject}`,
        cases: [item],
      });
      continue;
    }
    existing.cases.push(item);
    if (item.status !== "resuelto") existing.openCount += 1;
    if (item.unread) existing.unreadCount += 1;
    if (item.updatedAt > existing.lastAt) {
      existing.lastAt = item.updatedAt;
      existing.preview = `${item.areaName} · ${item.subject}`;
      existing.company = item.company;
    }
  }
  return [...map.values()]
    .map((row) => ({
      ...row,
      cases: row.cases.slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0)),
    }))
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : a.lastAt > b.lastAt ? -1 : 0));
}

export function formatAttentionWhen(iso: string, now = Date.now()): string {
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return "";
  const delta = now - at;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  if (at >= startOfToday.getTime()) {
    return new Date(at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  }
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (at >= startOfYesterday.getTime()) return "Ayer";
  if (delta < 7 * 24 * 60 * 60 * 1000) {
    return new Date(at).toLocaleDateString("es-CL", { weekday: "short" });
  }
  return new Date(at).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

export function visibleAttentionCases(
  cases: readonly AttentionCase[],
  actor: AttentionActor,
  limit = 300
): AttentionCase[] {
  return cases
    .filter((item) => canSeeAttentionCase(actor, item))
    .sort(byRecent)
    .slice(0, limit);
}

export function presentAttentionCase(
  item: AttentionCase,
  actor: AttentionActor,
  input: {
    company: string;
    areaName: string;
    location?: PublicAttentionCase["location"];
  }
): PublicAttentionCase | null {
  if (!canSeeAttentionCase(actor, item)) return null;
  const staff = actor.kind === "staff";
  const step = caseNextStep(item);
  const helpPlace = item.helpFrom
    ? [item.helpFrom.siteOrApp, item.helpFrom.module, item.helpFrom.screen, item.helpFrom.action]
        .filter(Boolean)
        .join(" · ")
    : "";
  return {
    id: item.id,
    code: item.correlative?.trim() || caseCode(item.id),
    tenantId: item.tenantId,
    company: input.company,
    areaId: item.areaId,
    areaName: input.areaName,
    subject: item.subject,
    status: item.status,
    priority: item.priority,
    productId: item.productId,
    productLabel: item.productId ? mentorAppLabel(item.productId) : null,
    requesterName: item.requesterName,
    assigneeUserId: staff ? item.assigneeUserId : null,
    assigneeName: item.assigneeName,
    contextNote: item.contextNote,
    unread: caseIsUnread(item, actor),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    commercial: presentCommercial(item, actor),
    messages: item.messages.map((message) => ({
      id: message.id,
      at: message.at,
      role: message.role,
      label: message.authorName.trim() || (message.role === "staff" ? "Nelzuri" : "Cliente"),
      body: message.body,
    })),
    events: item.events.map((entry) => ({
      id: entry.id,
      at: entry.at,
      detail: entry.detail,
      actorName: entry.actorName?.trim() || (entry.actorUserId === "legacy" ? "Registro" : "NELZURI"),
    })),
    originId: item.helpFrom?.originId ?? "",
    helpFromLabel: item.helpFrom ? "Pidió ayuda desde" : "Origen no registrado",
    helpPlace,
    helpAt: item.helpFrom?.at ?? null,
    nextStep: step,
    nextStepLabel: nextStepLabel(step),
    whereNote: item.whereNote ?? "",
    attachmentName: item.attachment?.name ?? null,
    attachmentDataUrl: item.attachment?.dataUrl ?? null,
    awaitingFirstReply: item.status !== "resuelto" && !item.messages.some((row) => row.role === "staff"),
    contactVerified: Boolean(item.contactVerifiedAt),
    location: staff
      ? input.location ?? { state: "unavailable", label: "No está disponible", place: "", at: null }
      : null,
  };
}

export function openAttentionCase(input: {
  areas: readonly AttentionArea[];
  actor: AttentionActor;
  tenantId: string;
  areaId: string;
  subject: string;
  body: string;
  contextNote?: string;
  priority?: string;
  productId?: string | null;
  forCompany?: boolean;
  visitor?: boolean;
  correlative?: string;
  helpFrom?: HelpFrom | null;
  whereNote?: string;
  attachment?: HelpAttachment | null;
  id: string;
  messageId: string;
  eventId: string;
  now: string;
}): { ok: true; case: AttentionCase } | { ok: false; reason: "forbidden" | "area" | "subject" | "empty" | "long" | "note" | "product" | "priority" | "origin" | "attachment" } {
  const staffOpening = input.forCompany === true;
  const visitor = input.visitor === true;
  if (visitor) {
    if (input.tenantId.trim()) return { ok: false, reason: "forbidden" };
  } else if (staffOpening) {
    if (input.actor.kind !== "staff" || !input.tenantId.trim()) return { ok: false, reason: "forbidden" };
  } else if (input.actor.kind !== "client" || input.actor.tenantId !== input.tenantId) {
    return { ok: false, reason: "forbidden" };
  }
  const area = input.areas.find((item) => item.id === input.areaId && item.active);
  if (!area) return { ok: false, reason: "area" };
  const subject = input.subject.trim().replace(/\s+/g, " ");
  if (subject.length < 3 || subject.length > MAX_SUBJECT) return { ok: false, reason: "subject" };
  const body = input.body.trim();
  if (!body) return { ok: false, reason: "empty" };
  if (body.length > MAX_BODY) return { ok: false, reason: "long" };
  const contextNote = (input.contextNote ?? "").trim();
  if (contextNote.length > MAX_NOTE) return { ok: false, reason: "note" };
  const whereNote = (input.whereNote ?? "").trim();
  if (whereNote.length > 200) return { ok: false, reason: "note" };
  const correlative = input.correlative?.trim() ?? "";
  if (correlative && !/^AC-\d{5,}$/.test(correlative)) return { ok: false, reason: "origin" };
  const priority = input.priority?.trim() || "normal";
  if (!isCasePriority(priority)) return { ok: false, reason: "priority" };
  const productRaw = input.productId?.trim() || "";
  let productId: MentorAppId | null = null;
  if (productRaw) {
    if (!isMentorAppId(productRaw)) return { ok: false, reason: "product" };
    productId = productRaw;
  }
  const authorName = input.actor.displayName.trim() || (staffOpening ? "Nelzuri" : "Cliente");
  const created = baseCase({
    id: input.id,
    tenantId: input.tenantId,
    areaId: area.id,
    subject,
    priority,
    productId,
    requesterUserId: input.actor.userId,
    requesterName: authorName,
    contextNote,
    commercial: null,
    now: input.now,
    eventId: input.eventId,
    actorUserId: input.actor.userId,
    eventDetail: "Abrió el caso.",
    actorName: authorName,
  });
  const role = staffOpening ? "staff" : "client";
  created.messages = [
    message({
      id: input.messageId,
      at: input.now,
      authorUserId: input.actor.userId,
      authorName,
      role,
      body,
    }),
  ];
  created.clientReadAt = role === "client" ? input.now : undefined;
  created.correlative = correlative || undefined;
  created.helpFrom = input.helpFrom ?? null;
  created.whereNote = whereNote;
  created.attachment = input.attachment ?? null;
  created.waitingOn = staffOpening ? "cliente" : "nelzuri";
  created.sharedWithCompany = staffOpening;
  created.readAtByUser = role === "client" ? { [input.actor.userId]: input.now } : {};
  return { ok: true, case: created };
}

export function noteCommercialRequest(
  existing: AttentionCase | null,
  input: {
    tenantId: string;
    appId: MentorAppId;
    authorUserId: string;
    authorName: string;
    id: string;
    messageId: string;
    eventId: string;
    now: string;
  }
): { already: boolean; case: AttentionCase } {
  if (
    existing &&
    existing.tenantId === input.tenantId &&
    existing.status !== "resuelto" &&
    existing.commercial?.appId === input.appId
  ) {
    return { already: true, case: existing };
  }
  const authorName = input.authorName.trim() || "Cliente";
  const created = baseCase({
    id: input.id,
    tenantId: input.tenantId,
    areaId: COMMERCIAL_AREA_ID,
    subject: planRequestBody(input.appId).replace(/\.$/, ""),
    priority: "normal",
    productId: input.appId,
    requesterUserId: input.authorUserId,
    requesterName: authorName,
    contextNote: "",
    commercial: {
      appId: input.appId,
      requesterUserId: input.authorUserId,
      economicResponsibleUserId: null,
      approval: "sin_revision",
      conditions: null,
      activation: "pendiente",
    },
    now: input.now,
    eventId: input.eventId,
    actorUserId: input.authorUserId,
    eventDetail: "Solicitó la aplicación.",
  });
  created.messages = [
    message({
      id: input.messageId,
      at: input.now,
      authorUserId: input.authorUserId,
      authorName,
      role: "client",
      body: planRequestBody(input.appId),
    }),
  ];
  created.clientReadAt = input.now;
  return { already: false, case: created };
}

export function appendCaseMessage(
  item: AttentionCase,
  input: {
    actor: AttentionActor;
    body: string;
    id: string;
    now: string;
  }
): { ok: true; case: AttentionCase } | { ok: false; reason: "forbidden" | "closed" | "empty" | "long" } {
  if (!canSeeAttentionCase(input.actor, item)) return { ok: false, reason: "forbidden" };
  if (item.status === "resuelto") return { ok: false, reason: "closed" };
  const body = input.body.trim();
  if (!body) return { ok: false, reason: "empty" };
  if (body.length > MAX_BODY) return { ok: false, reason: "long" };
  const role = input.actor.kind === "staff" ? "staff" : "client";
  const next: AttentionCase = {
    ...item,
    waitingOn: role === "staff" ? "cliente" : "nelzuri",
    updatedAt: input.now,
    messages: [
      ...item.messages,
      message({
        id: input.id,
        at: input.now,
        authorUserId: input.actor.userId,
        authorName: input.actor.displayName.trim() || (role === "staff" ? "Nelzuri" : "Cliente"),
        role,
        body,
      }),
    ],
  };
  return { ok: true, case: markCaseRead(next, input.actor, input.now) };
}

export function assignAttentionCase(
  item: AttentionCase,
  input: {
    actor: AttentionActor;
    assignee: AttentionColleague | null;
    id: string;
    now: string;
  }
): { ok: true; case: AttentionCase } | { ok: false; reason: "forbidden" | "closed" | "assignee" } {
  if (input.actor.kind !== "staff" || !canSeeAttentionCase(input.actor, item)) {
    return { ok: false, reason: "forbidden" };
  }
  if (item.status === "resuelto") return { ok: false, reason: "closed" };
  if (input.assignee && !canTakeArea(input.assignee, item.areaId)) {
    return { ok: false, reason: "assignee" };
  }
  const nextId = input.assignee?.userId ?? null;
  if (nextId === item.assigneeUserId) return { ok: true, case: item };
  const had = item.assigneeUserId;
  let detail = "Quedó sin asignar.";
  let kind: AttentionEvent["kind"] = "asignado";
  if (input.assignee && !had) {
    detail = `Asignado a ${input.assignee.displayName}.`;
    kind = "asignado";
  } else if (input.assignee && had) {
    detail = `Se transfirió a ${input.assignee.displayName}.`;
    kind = "transferido";
  }
  return {
    ok: true,
    case: {
      ...item,
      assigneeUserId: nextId,
      assigneeName: input.assignee?.displayName ?? null,
      status: nextId && item.status === "pendiente" ? "abierto" : !nextId && item.status === "abierto" ? "pendiente" : item.status,
      updatedAt: input.now,
      events: [...item.events, event(input.id, input.now, input.actor.userId, kind, detail, input.actor.displayName)],
    },
  };
}

export function setAttentionStatus(
  item: AttentionCase,
  input: { actor: AttentionActor; status: CaseStatus; id: string; now: string }
): { ok: true; case: AttentionCase } | { ok: false; reason: "forbidden" } {
  if (input.actor.kind !== "staff" || !canSeeAttentionCase(input.actor, item)) {
    return { ok: false, reason: "forbidden" };
  }
  if (item.status === input.status) return { ok: true, case: item };
  return {
    ok: true,
    case: {
      ...item,
      status: input.status,
      waitingOn: input.status === "resuelto" ? item.waitingOn : "nelzuri",
      resolvedAt: input.status === "resuelto" ? input.now : undefined,
      updatedAt: input.now,
      events: [
        ...item.events,
        event(
          input.id,
          input.now,
          input.actor.userId,
          "estado",
          `Estado: ${statusLabel(input.status)}.`,
          input.actor.displayName
        ),
      ],
    },
  };
}

export function setAttentionPriority(
  item: AttentionCase,
  input: { actor: AttentionActor; priority: CasePriority; id: string; now: string }
): { ok: true; case: AttentionCase } | { ok: false; reason: "forbidden" } {
  if (input.actor.kind !== "staff" || !canSeeAttentionCase(input.actor, item)) {
    return { ok: false, reason: "forbidden" };
  }
  if (item.priority === input.priority) return { ok: true, case: item };
  return {
    ok: true,
    case: {
      ...item,
      priority: input.priority,
      updatedAt: input.now,
      events: [
        ...item.events,
        event(input.id, input.now, input.actor.userId, "prioridad", `Prioridad: ${priorityLabel(input.priority)}.`),
      ],
    },
  };
}

export function recordEconomicApproval(
  item: AttentionCase,
  input: {
    actor: AttentionActor;
    decision: "aprobada" | "rechazada";
    conditions?: string;
    messageId: string;
    eventId: string;
    now: string;
  }
): { ok: true; case: AttentionCase } | { ok: false; reason: "forbidden" | "decided" | "missing" | "long" } {
  if (!item.commercial) return { ok: false, reason: "missing" };
  if (
    input.actor.kind !== "client" ||
    !input.actor.economic ||
    input.actor.tenantId !== item.tenantId
  ) {
    return { ok: false, reason: "forbidden" };
  }
  if (item.commercial.approval !== "sin_revision") return { ok: false, reason: "decided" };
  const conditions = (input.conditions ?? "").trim();
  if (conditions.length > MAX_NOTE) return { ok: false, reason: "long" };
  const authorName = input.actor.displayName.trim() || "Cliente";
  const detail =
    input.decision === "aprobada"
      ? "La empresa registró la aprobación económica."
      : "La empresa rechazó la aprobación económica.";
  return {
    ok: true,
    case: {
      ...item,
      updatedAt: input.now,
      commercial: {
        ...item.commercial,
        approval: input.decision,
        conditions: conditions || null,
        economicResponsibleUserId: input.actor.userId,
        activation: item.commercial.activation,
      },
      messages: [
        ...item.messages,
        message({
          id: input.messageId,
          at: input.now,
          authorUserId: input.actor.userId,
          authorName,
          role: "client",
          body: detail,
        }),
      ],
      events: [...item.events, event(input.eventId, input.now, input.actor.userId, "aprobacion", detail)],
      clientReadAt: input.now,
    },
  };
}

export function activateCommercialCase(
  item: AttentionCase,
  input: {
    appId: MentorAppId;
    actorUserId: string;
    actorName: string;
    messageId: string;
    eventId: string;
    now: string;
  }
): AttentionCase | null {
  if (!item.commercial || item.commercial.appId !== input.appId) return null;
  if (item.commercial.activation === "activada") return item;
  const authorName = input.actorName.trim() || "Nelzuri";
  return {
    ...item,
    updatedAt: input.now,
    commercial: { ...item.commercial, activation: "activada" },
    messages: [
      ...item.messages,
      message({
        id: input.messageId,
        at: input.now,
        authorUserId: input.actorUserId,
        authorName,
        role: "staff",
        body: "Quedó activada en Clientes.",
      }),
    ],
    events: [
      ...item.events,
      event(input.eventId, input.now, input.actorUserId, "activacion", "Quedó activada en Clientes."),
    ],
  };
}

export function legacyCaseFromThread(thread: LegacyAttentionThread, id: string): AttentionCase | null {
  const tenantId = thread.tenantId?.trim() ?? "";
  const messages = (thread.messages ?? []).flatMap((row) => {
    const body = row.body?.trim() ?? "";
    const at = row.at?.trim() ?? "";
    if (!tenantId || !body || !at) return [];
    const role = row.role === "owner" || row.role === "staff" ? "staff" : "client";
    return [
      message({
        id: row.id?.trim() || `${id}-${at}`,
        at,
        authorUserId: row.authorUserId?.trim() || "legacy",
        authorName: role === "staff" ? "Nelzuri" : "Cliente",
        role,
        body,
      }),
    ];
  });
  if (!tenantId || messages.length === 0) return null;
  const first = messages[0];
  const last = messages[messages.length - 1];
  return {
    id,
    tenantId,
    areaId: "general",
    subject: "Conversación anterior",
    status: "pendiente",
    priority: "normal",
    productId: null,
    requesterUserId: first?.authorUserId || "legacy",
    requesterName: "Cliente",
    participantUserIds: [],
    assigneeUserId: null,
    assigneeName: null,
    contextNote: "",
    commercial: null,
    messages,
    events: [
      {
        id: `${id}-import`,
        at: first?.at || last?.at || "",
        actorUserId: "legacy",
        kind: "creado",
        detail: "Conversación anterior, conservada como un caso.",
      },
    ],
    clientReadAt: thread.clientReadAt,
    staffReadAt: thread.ownerReadAt,
    createdAt: first?.at || "",
    updatedAt: thread.updatedAt || last?.at || "",
  };
}

function presentCommercial(item: AttentionCase, actor: AttentionActor): PublicCommercial | null {
  if (!item.commercial || !canSeeAttentionCase(actor, item)) return null;
  const staff = actor.kind === "staff";
  const economic = actor.kind === "client" && actor.economic && actor.tenantId === item.tenantId;
  const requester = actor.kind === "client" && actor.userId === item.requesterUserId;
  return {
    appId: item.commercial.appId,
    appLabel: mentorAppLabel(item.commercial.appId),
    activation: item.commercial.activation,
    approval: staff || economic || requester ? item.commercial.approval : null,
    conditions: staff || economic ? item.commercial.conditions : null,
    canApprove: economic && item.commercial.approval === "sin_revision",
  };
}

function baseCase(input: {
  id: string;
  tenantId: string;
  areaId: string;
  subject: string;
  priority: CasePriority;
  productId: MentorAppId | null;
  requesterUserId: string;
  requesterName: string;
  contextNote: string;
  commercial: CommercialRecord | null;
  now: string;
  eventId: string;
  actorUserId: string;
  eventDetail: string;
  actorName?: string;
}): AttentionCase {
  return {
    id: input.id,
    tenantId: input.tenantId,
    areaId: input.areaId,
    subject: input.subject,
    status: "pendiente",
    priority: input.priority,
    productId: input.productId,
    requesterUserId: input.requesterUserId,
    requesterName: input.requesterName,
    participantUserIds: [],
    assigneeUserId: null,
    assigneeName: null,
    contextNote: input.contextNote,
    commercial: input.commercial,
    messages: [],
    events: [event(input.eventId, input.now, input.actorUserId, "creado", input.eventDetail, input.actorName)],
    createdAt: input.now,
    updatedAt: input.now,
  };
}

function message(input: AttentionMessage): AttentionMessage {
  return input;
}

export function askCaseInformation(
  item: AttentionCase,
  input: { actor: AttentionActor; body: string; id: string; eventId: string; now: string }
): { ok: true; case: AttentionCase } | { ok: false; reason: "forbidden" | "closed" | "empty" | "long" } {
  const sent = appendCaseMessage(item, input);
  if (!sent.ok) return sent;
  const author = input.actor.displayName.trim() || "Nelzuri";
  return {
    ok: true,
    case: {
      ...sent.case,
      waitingOn: "cliente",
      events: [
        ...sent.case.events,
        event(input.eventId, input.now, input.actor.userId, "estado", "Pidió información.", author),
      ],
    },
  };
}

export function reopenAttentionCase(
  item: AttentionCase,
  input: { actor: AttentionActor; id: string; now: string }
): { ok: true; case: AttentionCase } | { ok: false; reason: "forbidden" | "status" } {
  if (input.actor.kind !== "staff" || !canSeeAttentionCase(input.actor, item)) {
    return { ok: false, reason: "forbidden" };
  }
  if (item.status !== "resuelto") return { ok: false, reason: "status" };
  const reopened = setAttentionStatus(item, { ...input, status: "pendiente" });
  if (!reopened.ok) return { ok: false, reason: "forbidden" };
  return reopened;
}

function event(
  id: string,
  at: string,
  actorUserId: string,
  kind: AttentionEvent["kind"],
  detail: string,
  actorName = ""
): AttentionEvent {
  return { id, at, actorUserId, kind, detail, ...(actorName.trim() ? { actorName: actorName.trim() } : {}) };
}

function byRecent<T extends { updatedAt: string; subject: string }>(a: T, b: T): number {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt < b.updatedAt ? 1 : -1;
  return a.subject.localeCompare(b.subject, "es");
}

function cleanName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60) return null;
  return name;
}

function slugArea(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return base || "area";
}

function uniqueAreaId(base: string, areas: readonly AttentionArea[]): string {
  if (!areas.some((area) => area.id === base)) return base;
  let n = 2;
  while (areas.some((area) => area.id === `${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
