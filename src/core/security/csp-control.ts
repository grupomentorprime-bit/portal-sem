/** Superficies que hoy inyectan script inline y impiden quitar 'unsafe-inline'. */
export const CSP_INLINE_SCRIPT_SURFACES = [
  "src/components/sites/cumple/CumpleShell.tsx",
  "src/components/portal/seo/PortalStructuredData.tsx",
] as const;

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
