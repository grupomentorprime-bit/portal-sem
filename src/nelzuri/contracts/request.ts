import type { MentorAppId } from "@/nelzuri/catalog/manifests";
import { isMentorAppId } from "@/nelzuri/catalog/registry";

/** La solicitud no contrata. Un id ajeno al catálogo contratable se rechaza. */
export function evaluateAppRequest(input: {
  appId: string;
  contracted: readonly string[];
}): { ok: true; appId: MentorAppId } | { ok: false; reason: "unknown" | "contracted" } {
  if (!isMentorAppId(input.appId)) return { ok: false, reason: "unknown" };
  if (input.contracted.includes(input.appId)) return { ok: false, reason: "contracted" };
  return { ok: true, appId: input.appId };
}
