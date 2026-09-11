/**
 * ADR-010 §1.2 — Origen como value object. Sin colección growth_origins.
 */

import type { GrowthOrigin, GrowthOriginInput } from "./types";

export function buildGrowthOrigin(
  input: GrowthOriginInput,
  now: string = new Date().toISOString()
): GrowthOrigin {
  const origin: GrowthOrigin = {
    kind: input.kind,
    sourceCollection: input.sourceCollection,
    sourceId: input.sourceId,
    capturedAt: input.capturedAt ?? now,
  };
  if (input.channel != null && input.channel !== "") origin.channel = input.channel;
  if (input.formId != null && input.formId !== "") origin.formId = input.formId;
  if (input.formDestination != null && input.formDestination !== "") {
    origin.formDestination = input.formDestination;
  }
  if (input.campaign != null && input.campaign !== "") origin.campaign = input.campaign;
  if (input.referrer != null && input.referrer !== "") origin.referrer = input.referrer;
  return origin;
}
