import {
  isAprendeHoyProductOrigin,
  isCumpleLaunchCandidate,
  isRrhhProductOrigin,
} from "@/lib/connect/policy";
import type { MentorAppId } from "@/lib/desktop/catalog";
import {
  decideOpening,
  isHttpsEntry,
  newlyContracted,
  parseContractPatch,
  resolveContractedApps,
  type DesktopClick,
  type OpeningSignals,
} from "@/nelzuri";

export { isHttpsEntry, newlyContracted, parseContractPatch, resolveContractedApps };
export type { DesktopClick };

/**
 * Fachada del clic.
 * Connect informa si el origen ya es suyo. La decisión la toma el manifiesto.
 */
export function desktopClick(input: {
  appId: MentorAppId;
  tenantId: string;
  contracted: readonly MentorAppId[];
  /** Si falta, se conserva el comportamiento previo (todo el techo). */
  authorized?: readonly MentorAppId[] | null;
  aprendeHoyEntryUrl?: string | null;
  aprendeHoyOrigin?: string | null;
  cumpleOrigin?: string | null;
  rrhhOrigin?: string | null;
}): DesktopClick {
  return decideOpening({
    appId: input.appId,
    tenantId: input.tenantId,
    contracted: input.contracted,
    authorized: input.authorized,
    signals: openingSignals(input),
  });
}

function openingSignals(input: {
  appId: MentorAppId;
  aprendeHoyEntryUrl?: string | null;
  aprendeHoyOrigin?: string | null;
  cumpleOrigin?: string | null;
  rrhhOrigin?: string | null;
}): OpeningSignals {
  if (input.appId === "rrhh") {
    return { productOrigin: isRrhhProductOrigin(input.rrhhOrigin), httpsEntry: null };
  }
  if (input.appId === "aprende-hoy") {
    const entry = input.aprendeHoyEntryUrl;
    return {
      productOrigin: isAprendeHoyProductOrigin(input.aprendeHoyOrigin),
      httpsEntry: isHttpsEntry(entry) ? entry.trim() : null,
    };
  }
  if (input.appId === "cumple") {
    return { productOrigin: isCumpleLaunchCandidate(input.cumpleOrigin), httpsEntry: null };
  }
  return { productOrigin: false, httpsEntry: null };
}

export function escritorioRedirect(input: {
  hasSpace: boolean;
  studentAffairs: boolean;
  isPlatformOperator: boolean;
  hasMembership: boolean;
}): "/admin/sin-espacio" | "/admin/portal/asuntos-estudiantiles" | "/platform" | null {
  if (input.isPlatformOperator) return null;
  if (!input.hasSpace) return "/admin/sin-espacio";
  if (input.studentAffairs) return "/admin/portal/asuntos-estudiantiles";
  return null;
}
