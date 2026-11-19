export const CSP_RUNTIME_CHECK = {
  verified: false,
  reason:
    "script-src de producción ya no trae 'unsafe-inline'. Falta recorrer CUMPLE, formularios, login y páginas públicas en un navegador con esta política.",
} as const;

export interface ScriptPolicyStatus {
  approved: boolean;
  unsafeInline: boolean;
  reason: string;
}

/**
 * Control distinto del sanitizador. Una CSP con 'unsafe-inline' en script-src
 * no se declara aprobada, aunque el resto de directivas esté presente.
 */
export function productionScriptPolicyStatus(csp: string): ScriptPolicyStatus {
  const script = csp
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("script-src "));
  const unsafeInline = Boolean(script?.includes("'unsafe-inline'"));
  if (!script || unsafeInline) {
    return {
      approved: false,
      unsafeInline,
      reason: unsafeInline
        ? "script-src incluye 'unsafe-inline'. La política no está aprobada."
        : "script-src ausente. La política no está aprobada.",
    };
  }
  return {
    approved: true,
    unsafeInline: false,
    reason: "script-src no incluye 'unsafe-inline'.",
  };
}
