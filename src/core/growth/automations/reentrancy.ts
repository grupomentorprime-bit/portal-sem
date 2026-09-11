/**
 * OT-GROWTH-AUTOMATION-003 — protección mínima anti-bucle / reentrada.
 *
 * Un sales-ops puede republicar Growth* → el mismo subscriber se reentra.
 * Solución trazable (sin flags globales ni silenciar el bus):
 * 1) Stack ALS de automationId en la cadena causal in-process.
 * 2) Claim idempotente (tenantId, automationId, version, sourceEventId).
 */

import { AsyncLocalStorage } from "node:async_hooks";

const MAX_CHAIN_DEPTH = 16;

type ChainState = {
  /** Automatizaciones en ejecución en esta cadena (orden = profundidad). */
  stack: string[];
};

const chainAls = new AsyncLocalStorage<ChainState>();

/** Claims de intento: evita reejecutar la misma Automatización ante el mismo evento. */
const claims = new Map<string, "claimed">();

export function automationClaimKey(input: {
  tenantId: string;
  automationId: string;
  version: number;
  sourceEventId: string;
}): string {
  return `${input.tenantId}:${input.automationId}:v${input.version}:${input.sourceEventId}`;
}

export type ReentrancyCheck =
  | { ok: true }
  | {
      ok: false;
      reason: "reentrant" | "duplicate_claim" | "max_depth";
      detail: string;
    };

export function checkAutomationReentrancy(input: {
  tenantId: string;
  automationId: string;
  version: number;
  sourceEventId: string;
}): ReentrancyCheck {
  const state = chainAls.getStore();
  const depth = state?.stack.length ?? 0;
  if (depth >= MAX_CHAIN_DEPTH) {
    return {
      ok: false,
      reason: "max_depth",
      detail: `Cadena de Automatizaciones excedió profundidad ${MAX_CHAIN_DEPTH}.`,
    };
  }
  if (state?.stack.includes(input.automationId)) {
    return {
      ok: false,
      reason: "reentrant",
      detail: `Automatización ${input.automationId} ya está en la cadena causal [${state.stack.join(" → ")}].`,
    };
  }
  const key = automationClaimKey(input);
  if (claims.has(key)) {
    return {
      ok: false,
      reason: "duplicate_claim",
      detail: `Intento ya reclamado: ${key}`,
    };
  }
  return { ok: true };
}

/** Reserva el claim. Debe llamarse solo tras checkAutomationReentrancy ok. */
export function claimAutomationAttempt(input: {
  tenantId: string;
  automationId: string;
  version: number;
  sourceEventId: string;
}): void {
  claims.set(automationClaimKey(input), "claimed");
}

/**
 * Libera el claim tras fallo — permite reintento sin duplicar éxitos previos
 * (el claim solo permanece si la ejecución terminó ok).
 */
export function releaseAutomationAttempt(input: {
  tenantId: string;
  automationId: string;
  version: number;
  sourceEventId: string;
}): void {
  claims.delete(automationClaimKey(input));
}

/**
 * Ejecuta fn con automationId apilado en la cadena ALS.
 * Propaga a publishes anidados (dispatch síncrono del Event Bus).
 */
export async function runWithAutomationChain<T>(
  automationId: string,
  fn: () => Promise<T>
): Promise<T> {
  const parent = chainAls.getStore();
  const next: ChainState = {
    stack: [...(parent?.stack ?? []), automationId],
  };
  return chainAls.run(next, fn);
}

export function getAutomationChainStack(): readonly string[] {
  return chainAls.getStore()?.stack ?? [];
}

/** Solo tests — limpia claims entre casos. */
export function resetAutomationReentrancyForTests(): void {
  claims.clear();
}

export const AUTOMATION_MAX_CHAIN_DEPTH = MAX_CHAIN_DEPTH;
