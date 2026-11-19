export const INTAKE_CHANNELS = [
  { id: "portal", label: "Portal" },
  { id: "envivo", label: "Chat en vivo" },
  { id: "telefono", label: "Teléfono" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "correo", label: "Correo" },
  { id: "otro", label: "Otra vía" },
] as const;

export type IntakeChannel = (typeof INTAKE_CHANNELS)[number]["id"];

export const MANUAL_INTAKE_CHANNELS = INTAKE_CHANNELS.filter((item) => item.id !== "portal" && item.id !== "envivo");

export const REPORT_PERIODS = [
  { id: "7", label: "Últimos 7 días", days: 7 },
  { id: "30", label: "Últimos 30 días", days: 30 },
  { id: "90", label: "Últimos 90 días", days: 90 },
] as const;

export type ReportPeriodId = (typeof REPORT_PERIODS)[number]["id"];

export interface ReportParty {
  userId: string;
  name: string;
  email: string;
}

export interface ReportDispatchRecord {
  id: string;
  at: string;
  actorUserId: string;
  actorName: string;
  tenantId: string;
  company: string;
  periodLabel: string;
  channelLabel: string;
  to: ReportParty[];
  cc: ReportParty[];
  message: string;
  result: "enviado" | "fallido";
  detail: string;
}

type IntakeMessage = {
  role: "client" | "staff" | "system";
  authorUserId: string;
  authorName: string;
};

type IntakeEvent = {
  actorUserId: string;
  actorName?: string;
  kind: string;
  detail: string;
};

export function isIntakeChannel(value: string): value is IntakeChannel {
  return INTAKE_CHANNELS.some((item) => item.id === value);
}

export function intakeChannelLabel(channel: string): string {
  return INTAKE_CHANNELS.find((item) => item.id === channel)?.label ?? "Portal";
}

export function resolveIntakeChannel(item: {
  intakeChannel?: string | null;
  originId?: string | null;
  helpFrom?: { originId?: string | null } | null;
}): IntakeChannel {
  if (item.intakeChannel && isIntakeChannel(item.intakeChannel)) return item.intakeChannel;
  if (item.originId === "escritorio.chat-en-vivo" || item.helpFrom?.originId === "escritorio.chat-en-vivo") {
    return "envivo";
  }
  return "portal";
}

export function reportPeriod(periodId: string): (typeof REPORT_PERIODS)[number] | null {
  return REPORT_PERIODS.find((item) => item.id === periodId) ?? null;
}

export function reportSince(periodId: string, now: number): number | null {
  const period = reportPeriod(periodId);
  if (!period || !Number.isFinite(now)) return null;
  return now - period.days * 86_400_000;
}

type ReportableIncident = {
  intakeChannel?: string | null;
  originId?: string | null;
  helpFrom?: { originId?: string | null } | null;
  ticketCaseId?: string | null;
};

/** Un chat entra al informe solo después de Pasar a ticket. El resto de los canales ya nace como ticket. */
export function isReportedIncident(row: ReportableIncident): boolean {
  if (resolveIntakeChannel(row) !== "envivo") return true;
  return Boolean(row.ticketCaseId?.trim());
}

export function filterIncidents<
  T extends {
    createdAt: string;
    tenantId: string;
    status: string;
  } & ReportableIncident,
>(rows: readonly T[], filter: { since: number; tenantId?: string; channel?: string }): T[] {
  const tenantId = filter.tenantId?.trim() ?? "";
  const channel = filter.channel?.trim() ?? "";
  return rows.filter((row) => {
    const at = Date.parse(row.createdAt);
    if (!Number.isFinite(at) || at < filter.since) return false;
    if (tenantId && row.tenantId !== tenantId) return false;
    if (!isReportedIncident(row)) return false;
    if (channel && resolveIntakeChannel(row) !== channel) return false;
    return true;
  });
}

export function incidentTotals(rows: readonly { status: string }[]): {
  received: number;
  open: number;
  resolved: number;
} {
  const resolved = rows.filter((row) => row.status === "resuelto").length;
  return { received: rows.length, open: rows.length - resolved, resolved };
}

export function sendRequiresCompany(tenantId: string): boolean {
  return tenantId.trim().length === 0;
}

export function clipReportMessage(message: string): { ok: true; message: string } | { ok: false; reason: "long" } {
  const clean = message.trim();
  if (clean.length > 500) return { ok: false, reason: "long" };
  return { ok: true, message: clean };
}

export function incidentCsv(
  rows: readonly {
    code: string;
    subject: string;
    company: string;
    requester: string;
    channel: string;
    status: string;
  }[]
): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [
    ["Ticket", "Asunto", "Empresa", "Solicitante", "Canal", "Estado"],
    ...rows.map((row) => [row.code, row.subject, row.company, row.requester, row.channel, row.status]),
  ];
  return lines.map((line) => line.map(escape).join(",")).join("\n");
}

export function applyManualIntake<T extends { messages: IntakeMessage[]; events: IntakeEvent[] }>(
  item: T,
  input: {
    contactName: string;
    channel: string;
    operatorUserId: string;
    operatorName: string;
    requesterUserId?: string;
  }
):
  | {
      ok: true;
      case: T & {
        requesterUserId: string;
        requesterName: string;
        registeredByUserId: string;
        registeredByName: string;
        intakeChannel: IntakeChannel;
        waitingOn: "nelzuri";
        sharedWithCompany: false;
      };
    }
  | { ok: false; reason: "contact" | "channel" } {
  const contact = input.contactName.trim().replace(/\s+/g, " ");
  if (contact.length < 2 || contact.length > 80) return { ok: false, reason: "contact" };
  if (!isIntakeChannel(input.channel) || input.channel === "portal" || input.channel === "envivo") {
    return { ok: false, reason: "channel" };
  }
  const operatorName = input.operatorName.trim() || "Operador NELZURI";
  const label = intakeChannelLabel(input.channel);
  const operatorUserId = input.operatorUserId.trim();
  if (!operatorUserId) return { ok: false, reason: "contact" };
  const requesterUserId = input.requesterUserId?.trim() ?? "";
  return {
    ok: true,
    case: {
      ...item,
      requesterUserId,
      requesterName: contact,
      registeredByUserId: operatorUserId,
      registeredByName: operatorName,
      intakeChannel: input.channel,
      waitingOn: "nelzuri",
      sharedWithCompany: false,
      messages: item.messages.map((message, index) =>
        index === 0
          ? { ...message, role: "system" as const, authorUserId: operatorUserId, authorName: operatorName }
          : message
      ),
      events: item.events.map((event, index) =>
        index === 0
          ? {
              ...event,
              kind: "recepcion",
              actorUserId: operatorUserId,
              actorName: operatorName,
              detail: `Reporte por ${label}, ingresado por ${operatorName}.`,
            }
          : event
      ),
    },
  };
}
