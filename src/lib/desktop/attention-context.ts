export type AttentionDeskScope =
  | { desk: "platform"; tenantId: null }
  | { desk: "company"; tenantId: string };

export function enteredTenantFromCookie(raw: string | null | undefined): string | null {
  const value = raw?.trim() ?? "";
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value).trim();
    return decoded || null;
  } catch {
    return value;
  }
}

/**
 * La mesa de plataforma no tiene empresa, aunque la sesión conserve
 * la última membresía del dueño. Dentro de una empresa, esa empresa manda.
 * La cookie de cliente abierto solo la honra el dueño.
 */
export function attentionDeskScope(input: {
  owner: boolean;
  sessionTenantId?: string | null;
  enteredTenantId?: string | null;
}): AttentionDeskScope {
  if (input.owner) {
    const entered = input.enteredTenantId?.trim() ?? "";
    if (entered) return { desk: "company", tenantId: entered };
    return { desk: "platform", tenantId: null };
  }
  const tenantId = input.sessionTenantId?.trim() ?? "";
  if (!tenantId) return { desk: "platform", tenantId: null };
  return { desk: "company", tenantId };
}

export function attentionCasesInScope<T extends { tenantId: string }>(
  cases: readonly T[],
  scope: AttentionDeskScope
): T[] {
  if (scope.desk === "platform") return [...cases];
  return cases.filter((item) => item.tenantId === scope.tenantId);
}

export function attentionCaseInDesk(scope: AttentionDeskScope, tenantId: string): boolean {
  if (scope.desk === "platform") return true;
  return tenantId === scope.tenantId;
}

export function attentionOpenTarget(
  scope: AttentionDeskScope,
  requestedTenantId: string
): { ok: true; tenantId: string; asMember: boolean } | { ok: false; reason: "company" } {
  if (scope.desk === "company") {
    return { ok: true, tenantId: scope.tenantId, asMember: true };
  }
  const tenantId = requestedTenantId.trim();
  if (!tenantId) return { ok: false, reason: "company" };
  return { ok: true, tenantId, asMember: false };
}

type DeskActor = {
  kind: "staff" | "client";
  tenantId: string | null;
  allAreas: boolean;
  areaIds: readonly string[];
  orgWide: boolean;
  economic: boolean;
};

/**
 * El chat de un cliente usa la empresa activa.
 * En la mesa de plataforma no hay empresa: hay que elegir una antes de abrir el caso.
 * La empresa elegida no convierte al dueño en operador.
 */
export function resolveChatOpening(input: {
  scope: AttentionDeskScope;
  chosenTenantId?: string | null;
}): { ok: true; tenantId: string; asClient: true } | { ok: false; reason: "company" } {
  if (input.scope.desk === "company") {
    return { ok: true, tenantId: input.scope.tenantId, asClient: true };
  }
  const chosen = input.chosenTenantId?.trim() ?? "";
  if (!chosen) return { ok: false, reason: "company" };
  return { ok: true, tenantId: chosen, asClient: true };
}

/** Quien abre o sigue el chat desde la empresa escribe como cliente de esa empresa. */
export function chatCaseActor<T extends DeskActor>(actor: T, tenantId: string): T {
  return {
    ...actor,
    kind: "client",
    tenantId,
    allAreas: false,
    areaIds: [],
    orgWide: actor.kind === "client" ? actor.orgWide : false,
    economic: actor.kind === "client" ? actor.economic : false,
  };
}

export function attentionMemberActor<T extends DeskActor>(actor: T, scope: AttentionDeskScope): T {
  if (scope.desk !== "company" || actor.kind !== "staff") return actor;
  return {
    ...actor,
    kind: "client",
    tenantId: scope.tenantId,
    allAreas: false,
    areaIds: [],
    orgWide: false,
    economic: actor.economic,
  };
}
