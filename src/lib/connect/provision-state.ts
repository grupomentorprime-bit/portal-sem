/**
 * Resultado local de una provisión externa.
 * El contrato comercial no vive aquí: esto solo dice si RR.HH. o Aprende Hoy
 * confirmaron la empresa. No abre conexiones ni reintenta.
 */
export const EXTERNAL_PROVISION_APPS = ["rrhh", "aprende-hoy"] as const;

export type ExternalProvisionApp = (typeof EXTERNAL_PROVISION_APPS)[number];

export type ExternalProvisionState = "activated" | "failed" | "uncertain" | "not_configured";

export interface ExternalProvisionRecord {
  state: ExternalProvisionState;
  httpStatus: number | null;
  at: string;
}

export interface ProvisionRecovery {
  state: ExternalProvisionState | "absent";
  callExternal: false;
  reason: "already_confirmed" | "not_idempotent" | "not_requested";
}

function sameTenant(body: Record<string, unknown>, tenantId: string): boolean {
  return body.ok === true && body.tenantId === tenantId;
}

/**
 * Una empresa confirmada nombra al mismo Espacio y dice si se creó ahora
 * o si ya estaba. Un 200 sin esa confirmación no es activación.
 */
export function provisionBodyConfirmsCompany(tenantId: string, body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const record = body as Record<string, unknown>;
  if (!sameTenant(record, tenantId)) return false;
  return record.created === true || record.existed === true;
}

export function classifyProvisionResponse(input: {
  tenantId: string;
  httpStatus: number | null;
  body: unknown;
}): ExternalProvisionState {
  if (input.httpStatus == null || input.httpStatus < 200 || input.httpStatus >= 300) {
    return "failed";
  }
  if (!provisionBodyConfirmsCompany(input.tenantId, input.body)) return "uncertain";
  return "activated";
}

export function provisionRecord(input: {
  tenantId: string;
  httpStatus: number | null;
  body: unknown;
  at?: string;
}): ExternalProvisionRecord {
  return {
    state: classifyProvisionResponse(input),
    httpStatus: input.httpStatus,
    at: input.at ?? new Date().toISOString(),
  };
}

/**
 * Recuperar no vuelve a llamar al servicio.
 * La idempotencia de RR.HH. y Aprende Hoy no está demostrada en este repositorio:
 * repetir el POST podría duplicar la empresa.
 */
export function recoverExternalProvision(
  record: ExternalProvisionRecord | null | undefined
): ProvisionRecovery {
  if (!record) return { state: "absent", callExternal: false, reason: "not_requested" };
  if (record.state === "activated") {
    return { state: "activated", callExternal: false, reason: "already_confirmed" };
  }
  return { state: record.state, callExternal: false, reason: "not_idempotent" };
}
