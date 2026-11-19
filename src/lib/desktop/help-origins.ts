export const HELP_LOCATION_TTL_MS = 45_000;

export interface HelpOriginRecord {
  id: string;
  channel: "aplicacion" | "escritorio" | "web";
  siteOrApp: string;
  module: string;
  screen: string;
  action: string | null;
  /** Acceso general: el lugar del problema es un dato aparte, opcional. */
  general?: boolean;
}

export interface HelpAttachment {
  name: string;
  mediaType: string;
  dataUrl: string;
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

export interface HelpLocation {
  tenantId: string;
  userId: string;
  channel: string;
  siteOrApp: string;
  module: string;
  screen: string;
  action: string | null;
  seenAt: string;
}

/**
 * Orígenes que Pedir ayuda puede congelar.
 * Otra aplicación se incorpora agregando aquí su canal, módulo, pantalla y acción,
 * y llamando a `useHelpAsk().ask(id)` dentro del escritorio de Growth OS.
 */
export const HELP_ORIGINS: readonly HelpOriginRecord[] = [
  {
    id: "growth-os.admision.editar-formulario",
    channel: "aplicacion",
    siteOrApp: "Growth OS",
    module: "Admisión",
    screen: "Editar formulario",
    action: null,
  },
  {
    id: "growth-os.admision.editar-formulario.publicar",
    channel: "aplicacion",
    siteOrApp: "Growth OS",
    module: "Admisión",
    screen: "Editar formulario",
    action: "Publicar formulario",
  },
  {
    id: "growth-os.admision.editar-formulario.guardar",
    channel: "aplicacion",
    siteOrApp: "Growth OS",
    module: "Admisión",
    screen: "Editar formulario",
    action: "Guardar",
  },
  {
    id: "growth-os.admision.formularios",
    channel: "aplicacion",
    siteOrApp: "Growth OS",
    module: "Admisión",
    screen: "Formularios",
    action: null,
  },
  {
    id: "growth-os.inicio",
    channel: "aplicacion",
    siteOrApp: "Growth OS",
    module: "Inicio",
    screen: "Inicio",
    action: null,
  },
  {
    id: "escritorio.atencion.nuevo-ticket",
    channel: "escritorio",
    siteOrApp: "Escritorio Empresarial",
    module: "Atención al Cliente",
    screen: "Nuevo ticket",
    action: null,
    general: true,
  },
  {
    id: "escritorio.chat-en-vivo",
    channel: "escritorio",
    siteOrApp: "Escritorio Empresarial",
    module: "Chat en vivo",
    screen: "Chat en vivo",
    action: null,
    general: true,
  },
  {
    id: "web.publica.pedir-ayuda",
    channel: "web",
    siteOrApp: "Web pública",
    module: "Ayuda",
    screen: "Pedir ayuda",
    action: null,
  },
];

const BY_ID = new Map(HELP_ORIGINS.map((item) => [item.id, item]));

export function findHelpOrigin(id: string): HelpOriginRecord | null {
  return BY_ID.get(id.trim()) ?? null;
}

export function freezeHelpOrigin(
  originId: string,
  at: string
): { ok: true; helpFrom: HelpFrom } | { ok: false; reason: "origin" } {
  const origin = findHelpOrigin(originId);
  const when = at.trim();
  if (!origin || !Number.isFinite(Date.parse(when))) return { ok: false, reason: "origin" };
  return {
    ok: true,
    helpFrom: {
      originId: origin.id,
      channel: origin.channel,
      siteOrApp: origin.siteOrApp,
      module: origin.module,
      screen: origin.screen,
      action: origin.action,
      at: new Date(when).toISOString(),
    },
  };
}

export function helpPlace(parts: {
  siteOrApp: string;
  module: string;
  screen: string;
  action?: string | null;
}): string {
  return [parts.siteOrApp, parts.module, parts.screen, parts.action].filter(Boolean).join(" · ");
}

export function helpChannelLabel(channel: string): string {
  if (channel === "aplicacion") return "Aplicación";
  if (channel === "escritorio") return "Escritorio Empresarial";
  if (channel === "web") return "Web";
  return channel.trim();
}

/** Canal y, cuando existe, aplicación o sitio, módulo, pantalla y acción. */
export function formatHelpOrigin(from: {
  channel: string;
  siteOrApp: string;
  module: string;
  screen: string;
  action?: string | null;
}): string {
  const head = helpChannelLabel(from.channel);
  const trail = [from.siteOrApp, from.module, from.screen, from.action]
    .map((part) => part?.trim() ?? "")
    .filter((part, index) => part && !(index === 0 && part === head));
  return trail.length > 0 ? `${head} · ${trail.join(" → ")}` : head;
}

/** Solo nombres registrados. Ignora el texto que la persona esté editando. */
export function helpLocationFromOrigin(input: {
  originId: string;
  tenantId: string;
  userId: string;
  seenAt: string;
  [extra: string]: unknown;
}): { ok: true; location: HelpLocation } | { ok: false; reason: "origin" } {
  const frozen = freezeHelpOrigin(input.originId, input.seenAt);
  if (!frozen.ok) return frozen;
  const tenantId = input.tenantId.trim();
  const userId = input.userId.trim();
  if (!tenantId || !userId) return { ok: false, reason: "origin" };
  return {
    ok: true,
    location: {
      tenantId,
      userId,
      channel: frozen.helpFrom.channel,
      siteOrApp: frozen.helpFrom.siteOrApp,
      module: frozen.helpFrom.module,
      screen: frozen.helpFrom.screen,
      action: frozen.helpFrom.action,
      seenAt: frozen.helpFrom.at,
    },
  };
}

export function presentHelpLocation(
  signal: Pick<HelpLocation, "siteOrApp" | "module" | "screen" | "action" | "seenAt"> | null,
  now: number,
  ttl = HELP_LOCATION_TTL_MS
): {
  state: "now" | "last" | "unavailable";
  label: string;
  place: string;
  at: string | null;
} {
  if (!signal) {
    return { state: "unavailable", label: "No está disponible", place: "", at: null };
  }
  const place = helpPlace(signal);
  const at = Date.parse(signal.seenAt);
  const age = now - at;
  if (Number.isFinite(at) && age <= ttl && age >= -5_000) {
    return { state: "now", label: "Ahora en", place, at: signal.seenAt };
  }
  return { state: "last", label: "Última vez en", place, at: signal.seenAt };
}

export function formatCorrelative(seq: number): string {
  const n = Math.max(1, Math.trunc(seq));
  return `AC-${String(n).padStart(5, "0")}`;
}

export function filterDeskCases<
  T extends {
    id: string;
    tenantId: string;
    subject: string;
    status: string;
    priority: string;
    assigneeUserId: string | null;
    messages: ReadonlyArray<{ role: string }>;
    correlative?: string;
    code?: string;
    helpFrom?: { originId: string } | null;
    originId?: string;
    company?: string;
    requesterName?: string;
  },
>(
  cases: readonly T[],
  filter: {
    query?: string;
    tenantId?: string;
    originId?: string;
    status?: string;
    priority?: string;
    assigneeUserId?: string;
    unassigned?: boolean;
    noFirstReply?: boolean;
  }
): T[] {
  const query = filter.query?.trim().toLocaleLowerCase("es") ?? "";
  return cases.filter((item) => {
    const originId = item.originId || item.helpFrom?.originId || "";
    const code = (item.code || item.correlative || "").toLocaleLowerCase("es");
    if (query) {
      const blob = `${code} ${item.subject} ${item.company ?? ""} ${item.requesterName ?? ""}`.toLocaleLowerCase("es");
      if (!blob.includes(query)) return false;
    }
    if (filter.tenantId && item.tenantId !== filter.tenantId) return false;
    if (filter.originId && originId !== filter.originId) return false;
    if (filter.status && item.status !== filter.status) return false;
    if (filter.priority && item.priority !== filter.priority) return false;
    if (filter.assigneeUserId && item.assigneeUserId !== filter.assigneeUserId) return false;
    if (filter.unassigned && item.assigneeUserId) return false;
    if (filter.noFirstReply && item.messages.some((message) => message.role === "staff")) return false;
    return true;
  });
}

export type DeskFilterFields = {
  tenantId: string;
  originId: string;
  status: string;
  priority: string;
  assigneeUserId: string;
};

export function emptyDeskFilters(): DeskFilterFields {
  return {
    tenantId: "",
    originId: "",
    status: "",
    priority: "",
    assigneeUserId: "",
  };
}

export function countAppliedDeskFilters(fields: DeskFilterFields): number {
  return [
    fields.tenantId,
    fields.originId,
    fields.status,
    fields.priority,
    fields.assigneeUserId,
  ].filter(Boolean).length;
}

export function screenForPath(pathname: string): HelpOriginRecord | null {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if (path === "/admin") return findHelpOrigin("growth-os.inicio");
  if (path === "/admin/portal/forms") return findHelpOrigin("growth-os.admision.formularios");
  if (/^\/admin\/portal\/forms\/[^/]+$/.test(path)) {
    return findHelpOrigin("growth-os.admision.editar-formulario");
  }
  return null;
}
