import type {
  CodedSite,
  CodedSitePage,
  SiteContentSlotDef,
  SiteContentValue,
} from "@/sites/types";

export interface EditablePageSummary {
  path: string;
  title: string;
  navLabel: string;
  slotCount: number;
}

export interface EditorField {
  slot: SiteContentSlotDef;
  value: SiteContentValue;
}

export type SanitizeResult =
  | { ok: true; values: Record<string, SiteContentValue> }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function defaultValue(slot: SiteContentSlotDef): SiteContentValue {
  if (slot.type === "text") return { type: "text", value: slot.default };
  if (slot.type === "image") {
    return { type: "image", src: slot.default.src, alt: slot.default.alt };
  }
  return { type: "animation", enabled: slot.default };
}

export function parseStoredValue(raw: unknown): SiteContentValue | undefined {
  if (!isRecord(raw)) return undefined;
  if (raw.type === "text" && typeof raw.value === "string") {
    return { type: "text", value: raw.value };
  }
  if (raw.type === "image" && typeof raw.src === "string") {
    const alt = typeof raw.alt === "string" ? raw.alt : "";
    const mediaId = typeof raw.mediaId === "string" ? raw.mediaId : undefined;
    return { type: "image", src: raw.src, alt, mediaId };
  }
  if (raw.type === "animation" && typeof raw.enabled === "boolean") {
    return { type: "animation", enabled: raw.enabled };
  }
  return undefined;
}

function matchesSlot(slot: SiteContentSlotDef, value: SiteContentValue): boolean {
  return value.type === slot.type;
}

export function mergeSiteContent(
  slots: SiteContentSlotDef[],
  stored: Record<string, SiteContentValue> | undefined
): Record<string, SiteContentValue> {
  const resolved: Record<string, SiteContentValue> = {};
  for (const slot of slots) {
    const override = stored?.[slot.id];
    resolved[slot.id] =
      override && matchesSlot(slot, override) ? override : defaultValue(slot);
  }
  return resolved;
}

export function resolvePageContent(
  page: CodedSitePage | undefined,
  stored: Record<string, SiteContentValue> | undefined
): Record<string, SiteContentValue> {
  if (!page?.slots?.length) return {};
  return mergeSiteContent(page.slots, stored);
}

export function sanitizeStoredContent(
  slots: SiteContentSlotDef[],
  incoming: Record<string, unknown>
): SanitizeResult {
  const allowed = new Map(slots.map((slot) => [slot.id, slot]));
  const values: Record<string, SiteContentValue> = {};

  for (const [id, raw] of Object.entries(incoming)) {
    const slot = allowed.get(id);
    if (!slot) {
      return { ok: false, error: `El slot «${id}» no existe en esta página.` };
    }
    const value = parseStoredValue(raw);
    if (!value || !matchesSlot(slot, value)) {
      return {
        ok: false,
        error: `El slot «${id}» espera un valor de tipo ${slot.type}.`,
      };
    }
    values[id] = value;
  }

  return { ok: true, values };
}

export function editorFields(
  page: CodedSitePage,
  stored: Record<string, SiteContentValue> | undefined
): EditorField[] {
  const resolved = resolvePageContent(page, stored);
  return (page.slots ?? []).map((slot) => ({
    slot,
    value: resolved[slot.id] ?? defaultValue(slot),
  }));
}

export function listEditablePages(site: CodedSite | undefined): EditablePageSummary[] {
  if (!site) return [];
  return site.pages.map((page) => ({
    path: page.path,
    title: page.title,
    navLabel: page.navLabel,
    slotCount: page.slots?.length ?? 0,
  }));
}

export function slotText(
  content: Record<string, SiteContentValue> | undefined,
  id: string,
  fallback: string
): string {
  const value = content?.[id];
  return value?.type === "text" ? value.value : fallback;
}

export function slotImage(
  content: Record<string, SiteContentValue> | undefined,
  id: string,
  fallback: { src: string; alt: string }
): { src: string; alt: string; mediaId?: string } {
  const value = content?.[id];
  if (value?.type === "image" && value.src.trim()) {
    return { src: value.src, alt: value.alt, mediaId: value.mediaId };
  }
  return fallback;
}

export function slotAnimationEnabled(
  content: Record<string, SiteContentValue> | undefined,
  id: string,
  fallback: boolean
): boolean {
  const value = content?.[id];
  return value?.type === "animation" ? value.enabled : fallback;
}
