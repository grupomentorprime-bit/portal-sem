export const CONNECT_CODE_TTL_MS = 60_000;
export const CONNECT_CALLBACK_PATH = "/api/connect/callback";
export const CONNECT_APP_ID = "cumple" as const;
export const RRHH_CANONICAL_ORIGIN = "https://rrhh-dev-xltxcc-f041cc-212-47-70-32.sslip.io";

export type ConnectProductId = "cumple" | "rrhh" | "aprende-hoy";

export type ConnectDenyReason =
  | "unavailable"
  | "no_company"
  | "no_membership"
  | "no_plan"
  | "no_key"
  | "no_destination";

export type ConnectAccessInput = {
  appId: string;
  tenantId: string;
  membershipActive: boolean;
  contractedApps: unknown;
  authorizedApps: unknown;
  resolvedOrigin: string | null;
  /** Padre de `cumple.{base}`. Sin base solo se admite `cumple.localhost`. */
  spaceBaseDomain?: string | null;
};

const LAUNCH_CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const TRANSACTION_HASH_PATTERN = /^[a-f0-9]{64}$/;

export function isLaunchCode(value: string): boolean {
  return LAUNCH_CODE_PATTERN.test(value);
}

/** Prueba de la transacción: 32 bytes en base64url. No viaja en la respuesta de emisión. */
export function isTransactionVerifier(value: string): boolean {
  return LAUNCH_CODE_PATTERN.test(value);
}

/** SHA-256 hex del verificador. Es lo único que se guarda con el código. */
export function isTransactionHash(value: string): boolean {
  return TRANSACTION_HASH_PATTERN.test(value);
}

/** El navegador crea la prueba. El servidor solo recibe y guarda su hash. */
export function createTransactionVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

export async function hashTransactionVerifier(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function normalizeOrigin(value: string | null | undefined): string | null {
  const raw = value?.trim() ?? "";
  if (!raw || raw.length > 200) return null;
  try {
    const url = new URL(raw);
    if (url.username || url.password || url.search || url.hash) return null;
    if (url.pathname !== "/" && url.pathname !== "") return null;
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Padre del host del escritorio (`growthos.ejemplo.cl` → `ejemplo.cl`). Loopback no tiene base. */
export function spaceBaseFromDeskOrigin(deskOrigin: string | null | undefined): string | null {
  const origin = normalizeOrigin(deskOrigin);
  if (!origin) return null;
  const hostname = new URL(origin).hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return null;
  const parts = hostname.split(".");
  if (parts.length < 3) return null;
  return parts.slice(1).join(".");
}

/**
 * Destino de Cumple: `cumple.localhost` o, con base, `https://cumple.{base}`.
 * `cumple.otro.tld` no entra. Con base pública tampoco entra el loopback.
 */
export function isCumpleProductOrigin(
  value: string | null | undefined,
  spaceBaseDomain?: string | null
): value is string {
  const origin = normalizeOrigin(value);
  if (!origin) return false;
  const url = new URL(origin);
  const hostname = url.hostname.toLowerCase();
  const base = spaceBaseDomain?.trim().toLowerCase().replace(/^\.+|\.+$/g, "") ?? "";
  if (hostname === "cumple.localhost") {
    if (base) return false;
    return url.protocol === "http:" || url.protocol === "https:";
  }
  if (url.protocol !== "https:" || url.port) return false;
  if (!base || base.includes("/") || base.includes("*") || hostname !== `cumple.${base}`) return false;
  return true;
}

export function isCumpleRequestHost(
  host: string | null | undefined,
  spaceBaseDomain?: string | null
): boolean {
  const raw = host?.split(",")[0]?.trim() ?? "";
  if (!raw || raw.length > 200) return false;
  const withProto = raw.includes("://")
    ? raw
    : raw.startsWith("localhost") || raw.startsWith("127.") || raw.includes(".localhost")
      ? `http://${raw}`
      : `https://${raw}`;
  return isCumpleProductOrigin(withProto, spaceBaseDomain);
}

/**
 * El icono solo decide si intenta el canje. El destino lo vuelve a fijar el servidor
 * y el formulario solo se envía a `cumple.{base}` del escritorio.
 */
/**
 * Destino de RR.HH.: HTTPS sin puerto, o HTTP solo en localhost.
 * No acepta el host de Cumple. El servidor vuelve a fijar este origen al emitir.
 */
function isStandaloneProductOrigin(value: string | null | undefined): value is string {
  const origin = normalizeOrigin(value);
  if (!origin) return false;
  const url = new URL(origin);
  const hostname = url.hostname.toLowerCase();
  if (hostname === "cumple.localhost" || hostname.split(".")[0] === "cumple") return false;
  if (url.protocol === "https:") return url.port === "";
  if (url.protocol !== "http:") return false;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function isRrhhProductOrigin(value: string | null | undefined): value is string {
  return isStandaloneProductOrigin(value);
}

export function isAprendeHoyProductOrigin(value: string | null | undefined): value is string {
  return isStandaloneProductOrigin(value);
}

export function isCumpleLaunchCandidate(value: string | null | undefined): boolean {
  const origin = normalizeOrigin(value);
  if (!origin) return false;
  const url = new URL(origin);
  const hostname = url.hostname.toLowerCase();
  if (hostname === "cumple.localhost") {
    return url.protocol === "http:" || url.protocol === "https:";
  }
  if (url.protocol !== "https:" || url.port) return false;
  const labels = hostname.split(".");
  return (
    labels[0] === "cumple" &&
    labels.length >= 3 &&
    labels.every((label) => /^[a-z0-9-]+$/.test(label) && !label.startsWith("-") && !label.endsWith("-"))
  );
}

/** Origen del escritorio que puede emitir el código. HTTP solo en loopback pelado. */
export function isDeskOrigin(value: string | null | undefined): value is string {
  const origin = normalizeOrigin(value);
  if (!origin) return false;
  const url = new URL(origin);
  if (url.protocol === "https:") return true;
  if (url.protocol !== "http:") return false;
  return url.hostname === "localhost" || url.hostname === "127.0.0.1";
}

/**
 * Plan y llave explícitos. Un campo ausente no se rellena con el default del escritorio.
 */
export function evaluateConnectAccess(
  input: ConnectAccessInput
): { ok: true; appId: ConnectProductId; destinationOrigin: string } | { ok: false; reason: ConnectDenyReason } {
  if (input.appId === "rrhh") return evaluateRrhhConnectAccess(input);
  if (input.appId === "aprende-hoy") return evaluateAprendeHoyConnectAccess(input);
  if (input.appId !== CONNECT_APP_ID) return { ok: false, reason: "unavailable" };
  const tenantId = input.tenantId.trim();
  if (!tenantId) return { ok: false, reason: "no_company" };
  if (tenantId !== "cumple") return { ok: false, reason: "no_destination" };
  if (!input.membershipActive) return { ok: false, reason: "no_membership" };
  if (!Array.isArray(input.contractedApps) || !input.contractedApps.includes(CONNECT_APP_ID)) {
    return { ok: false, reason: "no_plan" };
  }
  if (!Array.isArray(input.authorizedApps) || !input.authorizedApps.includes(CONNECT_APP_ID)) {
    return { ok: false, reason: "no_key" };
  }
  if (!isCumpleProductOrigin(input.resolvedOrigin, input.spaceBaseDomain)) {
    return { ok: false, reason: "no_destination" };
  }
  return { ok: true, appId: CONNECT_APP_ID, destinationOrigin: new URL(input.resolvedOrigin).origin };
}

/** Plan y llave de RR.HH. en la empresa activa. El destino no lo elige el navegador. */
export function evaluateRrhhConnectAccess(
  input: ConnectAccessInput
): { ok: true; appId: "rrhh"; destinationOrigin: string } | { ok: false; reason: ConnectDenyReason } {
  if (input.appId !== "rrhh") return { ok: false, reason: "unavailable" };
  const tenantId = input.tenantId.trim();
  if (!tenantId) return { ok: false, reason: "no_company" };
  if (!input.membershipActive) return { ok: false, reason: "no_membership" };
  if (!Array.isArray(input.contractedApps) || !input.contractedApps.includes("rrhh")) {
    return { ok: false, reason: "no_plan" };
  }
  if (!Array.isArray(input.authorizedApps) || !input.authorizedApps.includes("rrhh")) {
    return { ok: false, reason: "no_key" };
  }
  if (!isRrhhProductOrigin(input.resolvedOrigin)) return { ok: false, reason: "no_destination" };
  return { ok: true, appId: "rrhh", destinationOrigin: new URL(input.resolvedOrigin).origin };
}

/** Plan y llave de Aprende Hoy en la empresa activa. El destino no lo elige el navegador. */
export function evaluateAprendeHoyConnectAccess(
  input: ConnectAccessInput
): { ok: true; appId: "aprende-hoy"; destinationOrigin: string } | { ok: false; reason: ConnectDenyReason } {
  if (input.appId !== "aprende-hoy") return { ok: false, reason: "unavailable" };
  const tenantId = input.tenantId.trim();
  if (!tenantId) return { ok: false, reason: "no_company" };
  if (!input.membershipActive) return { ok: false, reason: "no_membership" };
  if (!Array.isArray(input.contractedApps) || !input.contractedApps.includes("aprende-hoy")) {
    return { ok: false, reason: "no_plan" };
  }
  if (!Array.isArray(input.authorizedApps) || !input.authorizedApps.includes("aprende-hoy")) {
    return { ok: false, reason: "no_key" };
  }
  if (!isAprendeHoyProductOrigin(input.resolvedOrigin)) return { ok: false, reason: "no_destination" };
  return { ok: true, appId: "aprende-hoy", destinationOrigin: new URL(input.resolvedOrigin).origin };
}

export function readCallbackSubmission(input: {
  method: string;
  queryCode: string | null;
  bodyCode: string | null;
  bodyTransaction: string | null;
  originHeader: string | null;
  requestOrigin: string;
  allowedIssuer: string;
  spaceBaseDomain?: string | null;
}):
  | { ok: true; code: string; transaction: string; issuerOrigin: string; destinationOrigin: string }
  | {
      ok: false;
      reason: "method" | "query_code" | "missing_code" | "malformed" | "transaction" | "issuer" | "destination";
    } {
  if (input.method.toUpperCase() !== "POST") return { ok: false, reason: "method" };
  if (input.queryCode != null) return { ok: false, reason: "query_code" };
  const code = input.bodyCode?.trim() ?? "";
  if (!code) return { ok: false, reason: "missing_code" };
  if (code.length > 128 || !isLaunchCode(code)) return { ok: false, reason: "malformed" };
  const transaction = input.bodyTransaction?.trim() ?? "";
  if (!transaction || transaction.length > 128 || !isTransactionVerifier(transaction)) {
    return { ok: false, reason: "transaction" };
  }
  const issuer = normalizeOrigin(input.originHeader);
  const allowed = normalizeOrigin(input.allowedIssuer);
  if (!issuer || !allowed || issuer !== allowed || !isDeskOrigin(issuer)) {
    return { ok: false, reason: "issuer" };
  }
  const destination = normalizeOrigin(input.requestOrigin);
  if (!destination || !isCumpleProductOrigin(destination, input.spaceBaseDomain)) {
    return { ok: false, reason: "destination" };
  }
  return { ok: true, code, transaction, issuerOrigin: issuer, destinationOrigin: destination };
}

export function productLandingUrl(
  destinationOrigin: string,
  spaceBaseDomain?: string | null
): string | null {
  let url: URL;
  try {
    url = new URL(destinationOrigin);
  } catch {
    return null;
  }
  if (!isCumpleProductOrigin(url.origin, spaceBaseDomain)) return null;
  return `${url.origin}/`;
}

export function connectLaunchForm(input: {
  callback: string;
  code: string;
  transaction: string;
  deskOrigin: string;
  rrhhOrigin?: string | null;
  aprendeHoyOrigin?: string | null;
}):
  | {
      ok: true;
      action: string;
      method: "POST";
      referrerPolicy: "origin";
      fields: { code: string; transaction: string };
    }
  | { ok: false } {
  const transaction = input.transaction.trim();
  if (!isLaunchCode(input.code.trim()) || !isTransactionVerifier(transaction)) return { ok: false };
  let url: URL;
  try {
    url = new URL(input.callback);
  } catch {
    return { ok: false };
  }
  if (url.pathname !== CONNECT_CALLBACK_PATH) return { ok: false };
  if (url.search || url.hash || url.username || url.password) return { ok: false };
  const rrhh = normalizeOrigin(input.rrhhOrigin);
  const aprende = normalizeOrigin(input.aprendeHoyOrigin);
  const allowedRrhh = Boolean(rrhh && url.origin === rrhh && isRrhhProductOrigin(url.origin));
  const allowedAprende = Boolean(
    aprende && url.origin === aprende && isAprendeHoyProductOrigin(url.origin)
  );
  if (
    !allowedRrhh &&
    !allowedAprende &&
    !isCumpleProductOrigin(url.origin, spaceBaseFromDeskOrigin(input.deskOrigin))
  ) {
    return { ok: false };
  }
  return {
    ok: true,
    action: `${url.origin}${CONNECT_CALLBACK_PATH}`,
    method: "POST",
    referrerPolicy: "origin",
      fields: { code: input.code, transaction },
  };
}

export function escritorioReturnHref(pageOrigin: string, deskOrigin: string): string {
  const page = normalizeOrigin(pageOrigin);
  const desk = normalizeOrigin(deskOrigin);
  if (!desk || !isDeskOrigin(desk)) return "/escritorio";
  if (page === desk) return "/escritorio";
  return `${desk}/escritorio`;
}

export function isSafeEscritorioHref(href: string, deskOrigin: string): boolean {
  if (href === "/escritorio") return true;
  const expected = escritorioReturnHref("https://producto.invalid", deskOrigin);
  return href === expected;
}

/**
 * La sesión de Cumple no autoriza Growth OS.
 * Una sesión de escritorio tampoco se acepta en el host de Cumple.
 */
export function growthSessionAllowed(input: {
  audience: "desk" | "cumple" | null | undefined;
  hostIsCumple: boolean;
}): boolean {
  if (input.audience === "cumple") return false;
  if (input.hostIsCumple) return false;
  return true;
}

const PRODUCT_REVOKE_REASONS = new Set([
  "unavailable",
  "no_company",
  "no_membership",
  "no_plan",
  "no_key",
]);

/**
 * Veredicto de la única operación que reconoce la sesión de Cumple.
 * `revoke` borra esa sesión. `deny` la deja intacta (fallo transitorio o host ajeno).
 */
export function productSessionVerdict(input: {
  audience: "desk" | "cumple" | null | undefined;
  hostIsCumple: boolean;
  access: { ok: true } | { ok: false; reason: string } | null;
}): "allow" | "deny" | "revoke" {
  if (input.audience !== "cumple" || !input.hostIsCumple) return "deny";
  if (input.access?.ok) return "allow";
  const reason = input.access && !input.access.ok ? input.access.reason : "unavailable";
  if (PRODUCT_REVOKE_REASONS.has(reason)) return "revoke";
  return "deny";
}

/** Cookie de la sesión de Cumple. Sin `domain`: no viaja a otro host. */
export function productSessionCookieOptions(secure: boolean): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function auditCarriesSecret(events: unknown, secrets: readonly string[]): boolean {
  const text = JSON.stringify(events);
  return secrets.some((secret) => secret.length > 0 && text.includes(secret));
}
