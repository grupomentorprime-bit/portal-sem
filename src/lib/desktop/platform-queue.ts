import { nextStepLabel, type CasePriority, type CaseStatus, type PublicAttentionCase } from "@/lib/desktop/attention";
import { intakeChannelLabel, type IntakeChannel } from "@/lib/desktop/platform-desk";

export type QueueTurn = "nelzuri" | "cliente" | "resuelto";
export type QueueView = "por_atender" | "sin_asignar" | "mias" | "esperando_cliente";

export const QUEUE_VIEWS: readonly { id: QueueView; label: string }[] = [
  { id: "por_atender", label: "Por atender" },
  { id: "sin_asignar", label: "Sin asignar" },
  { id: "mias", label: "Mis tickets" },
  { id: "esperando_cliente", label: "Esperando al cliente" },
];

export type QueueItem = {
  id: string;
  status: string;
  priority: string;
  assigneeUserId: string | null;
  assigneeName?: string | null;
  nextStep: string;
  subject?: string;
  company?: string;
  code?: string;
  requesterName?: string;
  createdAt: string;
  updatedAt: string;
  messages: ReadonlyArray<{ at: string; role: string; id?: string; label?: string; body?: string }>;
  events: ReadonlyArray<{ at: string; id?: string; detail?: string; actorName?: string; kind?: string }>;
  intakeChannel?: string;
};

export type QueueAction =
  | { action: "message"; body: string; now: string }
  | { action: "confirm-ask"; now: string }
  | { action: "assign"; assigneeUserId: string; assigneeName: string; now: string }
  | { action: "priority"; priority: string; now: string }
  | { action: "promote"; now: string };

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export function queueTurn(item: { status: string; nextStep: string }): QueueTurn {
  if (item.status === "resuelto" || item.nextStep === "resuelto") return "resuelto";
  if (item.status === "confirmacion" || item.nextStep === "cliente") return "cliente";
  return "nelzuri";
}

export function actorLabel(turn: QueueTurn): string {
  if (turn === "cliente") return "Cliente";
  if (turn === "nelzuri") return "NELZURI";
  return "—";
}

function latest(values: readonly number[]): number {
  return values.reduce((max, value) => (value > max ? value : max), 0);
}

export function holdSince(item: QueueItem): number {
  const turn = queueTurn(item);
  const at = (role: string) =>
    item.messages.map((message) => (message.role === role ? Date.parse(message.at) : NaN)).filter(Number.isFinite);
  const created = Date.parse(item.createdAt);
  const updated = Date.parse(item.updatedAt);
  const lastStaff = latest(at("staff"));
  const lastClient = latest(at("client"));
  if (turn === "cliente") return lastStaff || (Number.isFinite(updated) ? updated : created) || 0;
  if (lastClient && lastClient >= lastStaff) return lastClient;
  const returned = latest(
    item.events.map((entry) => Date.parse(entry.at)).filter((value) => Number.isFinite(value) && value > lastStaff && value > lastClient)
  );
  if (returned) return returned;
  return Number.isFinite(created) ? created : 0;
}

export function waitLabel(since: number, now: number): string {
  const minutes = Math.floor(Math.max(0, now - since) / MINUTE);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

function matchesQuery(item: QueueItem, query: string): boolean {
  if (!query) return true;
  const blob = [item.code, item.subject, item.company, item.requesterName, item.assigneeName]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("es");
  return blob.includes(query);
}

export function orderQueue<T extends QueueItem>(
  cases: readonly T[],
  input: { view: QueueView; viewerUserId: string; query?: string; now?: number }
): T[] {
  const query = input.query?.trim().toLocaleLowerCase("es") ?? "";
  return cases
    .filter((item) => {
      const turn = queueTurn(item);
      if (turn === "resuelto") return false;
      if (input.view === "por_atender" && turn !== "nelzuri") return false;
      if (input.view === "sin_asignar" && (item.assigneeUserId || turn !== "nelzuri")) return false;
      if (input.view === "mias" && item.assigneeUserId !== input.viewerUserId) return false;
      if (input.view === "esperando_cliente" && turn !== "cliente") return false;
      return matchesQuery(item, query);
    })
    .slice()
    .sort((a, b) => {
      const byUrgent = (a.priority === "alta" ? 0 : 1) - (b.priority === "alta" ? 0 : 1);
      if (byUrgent) return byUrgent;
      const byTeam = (queueTurn(a) === "nelzuri" ? 0 : 1) - (queueTurn(b) === "nelzuri" ? 0 : 1);
      if (byTeam) return byTeam;
      return holdSince(a) - holdSince(b);
    });
}

export function applyQueueAction<T extends QueueItem>(item: T, action: QueueAction): T {
  if (action.action === "assign") {
    const assigneeUserId = action.assigneeUserId.trim() || null;
    return {
      ...item,
      assigneeUserId,
      assigneeName: assigneeUserId ? action.assigneeName : null,
      status: assigneeUserId && item.status === "pendiente" ? "abierto" : !assigneeUserId && item.status === "abierto" ? "pendiente" : item.status,
      updatedAt: action.now,
    };
  }
  if (action.action === "priority") {
    return { ...item, priority: action.priority === "alta" ? "alta" : "normal", updatedAt: action.now };
  }
  if (action.action === "promote") {
    return { ...item, ticketCaseId: item.id, updatedAt: action.now } as T;
  }
  if (action.action === "confirm-ask") {
    return {
      ...item,
      status: "confirmacion",
      nextStep: "cliente",
      updatedAt: action.now,
      events: [
        ...item.events,
        { id: `${item.id}:confirm`, at: action.now, detail: "Quedó pendiente de confirmación.", actorName: "NELZURI", kind: "estado" },
      ],
    };
  }
  const body = action.body.trim();
  if (!body) return item;
  return {
    ...item,
    nextStep: "cliente",
    updatedAt: action.now,
    messages: [
      ...item.messages,
      { id: `${item.id}:reply`, at: action.now, role: "staff", label: "NELZURI", body },
    ],
  };
}

const COMPANIES = ["Seminario Eclesiástico Mayor", "Mentor Capacitación", "Colegio Andino", "Instituto del Sur", "Fundación Belén"];

function sampleCase(input: {
  id: string;
  code: string;
  subject: string;
  company: string;
  status: CaseStatus;
  priority: CasePriority;
  assigneeUserId: string | null;
  assigneeName: string | null;
  nextStep: "nelzuri" | "cliente" | "resuelto";
  at: string;
  intakeChannel: IntakeChannel;
  originId: string;
  requesterName: string;
}): PublicAttentionCase {
  const staffSpoke = input.nextStep === "cliente";
  return {
    id: input.id,
    code: input.code,
    tenantId: `org-${COMPANIES.indexOf(input.company) + 1}`,
    company: input.company,
    areaId: "general",
    areaName: "Consultas generales",
    subject: input.subject,
    status: input.status,
    priority: input.priority,
    productId: null,
    productLabel: null,
    requesterName: input.requesterName,
    requesterUserId: `req-${input.id}`,
    assigneeUserId: input.assigneeUserId,
    assigneeName: input.assigneeName,
    contextNote: "",
    unread: input.nextStep === "nelzuri",
    createdAt: input.at,
    updatedAt: input.at,
    commercial: null,
    messages: staffSpoke
      ? [{ id: `${input.id}:m`, at: input.at, role: "staff", label: "NELZURI", body: "Quedamos a la espera." }]
      : [{ id: `${input.id}:m`, at: input.at, role: "client", label: input.requesterName, body: input.subject }],
    events: [{ id: `${input.id}:e`, at: input.at, detail: "Caso de ejemplo.", actorName: "NELZURI", kind: "creado" }],
    originId: input.originId,
    helpFromLabel: "Origen",
    helpPlace: "",
    helpAt: input.at,
    nextStep: input.nextStep,
    nextStepLabel: nextStepLabel(input.nextStep),
    whereNote: "",
    attachmentName: null,
    attachmentDataUrl: null,
    awaitingFirstReply: !staffSpoke && input.status !== "resuelto",
    intakeChannel: input.intakeChannel,
    channelLabel: intakeChannelLabel(input.intakeChannel),
    registeredByName: "Mesa",
    ticketCaseId: "",
    contactVerified: true,
    location: null,
  };
}

type Sketch = {
  id: string;
  subject: string;
  priority: CasePriority;
  status: CaseStatus;
  nextStep: "nelzuri" | "cliente" | "resuelto";
  owner: "none" | "me" | "other";
  ageDays: number;
  channel?: IntakeChannel;
  originId?: string;
};

function sketches(): Sketch[] {
  const rows: Sketch[] = [
    {
      id: "q-urgent-oldest",
      subject: "Acceso caído desde hace semanas y nadie de la empresa puede entrar al portal",
      priority: "alta",
      status: "pendiente",
      nextStep: "nelzuri",
      owner: "none",
      ageDays: 20,
    },
  ];
  for (let index = 0; index < 7; index += 1) {
    rows.push({
      id: `q-urgent-free-${index}`,
      subject: `Urgente sin asignar ${index + 1}`,
      priority: "alta",
      status: "pendiente",
      nextStep: "nelzuri",
      owner: "none",
      ageDays: 19 - index,
    });
  }
  for (let index = 0; index < 7; index += 1) {
    rows.push({
      id: `q-urgent-mine-${index}`,
      subject: `Urgente mío ${index + 1}`,
      priority: "alta",
      status: "abierto",
      nextStep: "nelzuri",
      owner: "me",
      ageDays: 12 - index,
    });
  }
  for (let index = 0; index < 5; index += 1) {
    rows.push({
      id: `q-urgent-other-${index}`,
      subject: `Urgente de otro ${index + 1}`,
      priority: "alta",
      status: "abierto",
      nextStep: "nelzuri",
      owner: "other",
      ageDays: 5 - index,
    });
  }
  for (let index = 0; index < 25; index += 1) {
    rows.push({
      id: index === 0 ? "q-chat" : `q-free-${index}`,
      subject: index === 0 ? "Chat en vivo sin pasar a ticket" : `Consulta sin asignar ${index}`,
      priority: "normal",
      status: "pendiente",
      nextStep: "nelzuri",
      owner: "none",
      ageDays: 18 - (index % 18),
      channel: index === 0 ? "envivo" : "portal",
      originId: index === 0 ? "escritorio.chat-en-vivo" : "",
    });
  }
  for (let index = 0; index < 15; index += 1) {
    rows.push({
      id: `q-mine-${index}`,
      subject: `Seguimiento mío ${index + 1}`,
      priority: "normal",
      status: "abierto",
      nextStep: "nelzuri",
      owner: "me",
      ageDays: 9 - (index % 9),
    });
  }
  for (let index = 0; index < 10; index += 1) {
    rows.push({
      id: `q-other-${index}`,
      subject: `Seguimiento del equipo ${index + 1}`,
      priority: "normal",
      status: "abierto",
      nextStep: "nelzuri",
      owner: "other",
      ageDays: 6 - (index % 6),
    });
  }
  for (let index = 0; index < 8; index += 1) {
    rows.push({
      id: `q-wait-${index}`,
      subject: `Espera respuesta del cliente ${index + 1}`,
      priority: index === 0 ? "alta" : "normal",
      status: "abierto",
      nextStep: "cliente",
      owner: index < 3 ? "me" : "other",
      ageDays: 4,
    });
  }
  for (let index = 0; index < 7; index += 1) {
    rows.push({
      id: `q-confirm-${index}`,
      subject: `Pendiente de confirmación ${index + 1}`,
      priority: "normal",
      status: "confirmacion",
      nextStep: "nelzuri",
      owner: index < 2 ? "me" : "none",
      ageDays: 2,
    });
  }
  for (let index = 0; index < 15; index += 1) {
    rows.push({
      id: `q-done-${index}`,
      subject: `Resuelto ${index + 1}`,
      priority: "normal",
      status: "resuelto",
      nextStep: "resuelto",
      owner: "other",
      ageDays: 1,
    });
  }
  return rows;
}

const NAMES = ["Ana Ríos", "Luis Palma", "Marta León", "Pedro Díaz", "Sofía Cruz"];

export function examplePlatformQueue(input: { viewerUserId: string; now: number }): PublicAttentionCase[] {
  return sketches().map((sketch, index) => {
    const ownerId = sketch.owner === "me" ? input.viewerUserId : sketch.owner === "other" ? "colega-1" : null;
    const assigneeName = sketch.owner === "me" ? "Yo" : sketch.owner === "other" ? "Marco Busts" : null;
    return sampleCase({
      id: sketch.id,
      code: `AC-${String(1000 + index).padStart(5, "0")}`,
      subject: sketch.subject,
      company: COMPANIES[index % COMPANIES.length] ?? COMPANIES[0],
      status: sketch.status,
      priority: sketch.priority,
      assigneeUserId: ownerId,
      assigneeName,
      nextStep: sketch.nextStep,
      at: new Date(input.now - sketch.ageDays * DAY).toISOString(),
      intakeChannel: sketch.channel ?? "portal",
      originId: sketch.originId ?? "",
      requesterName: NAMES[index % NAMES.length] ?? "Ana Ríos",
    });
  });
}
