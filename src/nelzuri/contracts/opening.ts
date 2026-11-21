import type { MentorAppId } from "@/nelzuri/catalog/manifests";
import { manifestById } from "@/nelzuri/catalog/registry";
import { hasAppKey } from "@/nelzuri/contracts/authorization";

export type DesktopClick =
  | { kind: "open"; href: string }
  | { kind: "connect"; appId: "cumple" | "rrhh" | "aprende-hoy" }
  | { kind: "request" }
  | { kind: "unauthorized" }
  | { kind: "later" }
  | { kind: "disconnected" };

/** Hechos que entrega quien cablea. NELZURI no consulta orígenes ni productos. */
export type OpeningSignals = {
  productOrigin: boolean;
  httpsEntry: string | null;
};

export function decideOpening(input: {
  appId: MentorAppId;
  tenantId: string;
  contracted: readonly MentorAppId[];
  authorized?: readonly MentorAppId[] | null;
  signals: OpeningSignals;
}): DesktopClick {
  if (!input.contracted.includes(input.appId)) return { kind: "request" };
  if (
    !hasAppKey(input.appId, {
      contracted: input.contracted,
      authorizedApps: input.authorized,
    })
  ) {
    return { kind: "unauthorized" };
  }

  const manifest = manifestById(input.appId);
  const open = manifest.open;
  if (open.type === "internal") return { kind: "open", href: open.href };
  if (open.type === "connect") {
    return input.signals.productOrigin
      ? { kind: "connect", appId: open.channel }
      : { kind: open.missing };
  }
  if (open.type === "connect-or-https") {
    if (input.signals.productOrigin) return { kind: "connect", appId: open.channel };
    if (input.signals.httpsEntry) return { kind: "open", href: input.signals.httpsEntry };
    return { kind: "disconnected" };
  }
  if (open.type === "connect-in-space") {
    if (input.tenantId === manifest.requiresSpaceId && input.signals.productOrigin) {
      return { kind: "connect", appId: open.channel };
    }
    return { kind: open.missing };
  }
  return { kind: "disconnected" };
}
