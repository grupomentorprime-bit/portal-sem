/**
 * OT-GROWTH-PERSONAS-IMPLEMENT-003 — criterio Mongo del filtro de origen V1.
 * Puro: sin I/O. No inventa GrowthOriginKind.
 */

import type { Filter } from "mongodb";
import type { GrowthPersona } from "@/core/growth";

/** Criterio Mongo del filtro de origen; sin inventar GrowthOriginKind. */
export function buildPersonaOriginMongoFilter(
  origin: string | undefined
): Filter<GrowthPersona> | null {
  const token = origin?.trim();
  if (!token) return null;

  switch (token) {
    case "whatsapp":
      return { "origin.channel": "whatsapp" };
    case "form":
      return { "origin.kind": "form" };
    case "admission":
      return { "origin.kind": "admission" };
    case "manual":
      return { "origin.kind": "manual" };
    case "event":
      return { "origin.kind": "event" };
    case "portal-web":
      return { "origin.channel": "portal-admision" };
    case "unclear":
      // kind unknown y canal no es humano conocido (whatsapp / portal-admision).
      // $nin también incluye documentos sin channel.
      return {
        "origin.kind": "unknown",
        "origin.channel": { $nin: ["whatsapp", "portal-admision"] },
      };
    default:
      return null;
  }
}
