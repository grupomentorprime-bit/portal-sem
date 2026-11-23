export const CSP_RUNTIME_CHECK = {
  verified: true,
  reason:
    "Verificado el 2026-11-19 en next start de integrate/nelzuri-local, puerto 41873. Evidencia en docs/seguridad/csp-runtime-evidence.json: nonce, sin unsafe-inline ni unsafe-eval, scripts con nonce, inline sin nonce bloqueado y script externo no autorizado bloqueado en /, /login, /formularios, /contacto y CUMPLE.",
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
