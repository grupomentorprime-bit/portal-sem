import type { AdmissionClosingBlock, AdmissionClosingConfig } from "@/types/admission-closing";
import { rewriteLegacyPlatformProductName } from "@/core/branding/display";
import { isSemTenant } from "@/core/tenant/is-sem";
import { DEFAULT_ADMISSION_CLOSING } from "@/lib/portal/admission-closing-defaults";
import { EMPTY_ADMISSION_CLOSING } from "@/lib/portal/empty-admission";
import { isWithheldSemPublicHref, SEM_CONTACT_PUBLISHED } from "@/lib/portal/sem-identity-v7";

function rewriteClosingBlock(block: AdmissionClosingBlock): AdmissionClosingBlock {
  if (block.type !== "copyright" || !block.data.developerText) return block;
  return {
    ...block,
    data: {
      ...block.data,
      developerText: rewriteLegacyPlatformProductName(block.data.developerText),
    },
  };
}

export function sortClosingBlocks<T extends { order: number }>(blocks: T[]): T[] {
  return [...blocks].sort((a, b) => a.order - b.order);
}

export function reorderClosingBlocks(
  blocks: AdmissionClosingBlock[],
  draggedId: string,
  targetId: string
): AdmissionClosingBlock[] {
  const sorted = sortClosingBlocks(blocks);
  const from = sorted.findIndex((b) => b.id === draggedId);
  const to = sorted.findIndex((b) => b.id === targetId);
  if (from < 0 || to < 0 || from === to) return blocks;

  const next = [...sorted];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map((block, index) => ({ ...block, order: index }));
}

export function reorderClosingListItems<T extends { id: string; order: number }>(
  items: T[],
  draggedId: string,
  targetId: string
): T[] {
  const sorted = sortClosingBlocks(items);
  const from = sorted.findIndex((item) => item.id === draggedId);
  const to = sorted.findIndex((item) => item.id === targetId);
  if (from < 0 || to < 0 || from === to) return items;

  const next = [...sorted];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map((entry, index) => ({ ...entry, order: index }));
}

export function mergeClosingConfig(
  saved?: AdmissionClosingConfig,
  options?: { tenant?: string }
): AdmissionClosingConfig {
  const base = isSemTenant(options?.tenant)
    ? DEFAULT_ADMISSION_CLOSING
    : EMPTY_ADMISSION_CLOSING;

  if (!saved) {
    return {
      ...base,
      blocks: base.blocks.map(rewriteClosingBlock),
    };
  }
  if (base.blocks.length === 0) {
    return {
      ...base,
      ...saved,
      blocks: sortClosingBlocks((saved.blocks ?? []).map(rewriteClosingBlock)),
    };
  }

  const savedTypes = new Set(saved.blocks.map((block) => block.type));
  const missingDefaults = base.blocks.filter((block) => !savedTypes.has(block.type));

  return {
    ...base,
    ...saved,
    blocks: sortClosingBlocks([...saved.blocks, ...missingDefaults].map(rewriteClosingBlock)),
  };
}

/** Presentación pública: no publica contacto inconsistente ni enlaces de semilla. */
export function presentPublicClosing(
  closing: AdmissionClosingConfig,
  tenantId: string
): AdmissionClosingConfig {
  if (!isSemTenant(tenantId)) return closing;

  return {
    ...closing,
    blocks: closing.blocks.map((block) => {
      if (block.type === "contact" && !SEM_CONTACT_PUBLISHED) {
        return {
          ...block,
          data: {
            ...block.data,
            email: "",
            phone: "",
            whatsapp: "",
            address: "",
            mapEmbedUrl: "",
          },
        };
      }
      if (block.type === "actions") {
        return {
          ...block,
          data: {
            ...block.data,
            items: block.data.items.filter((item) => !isWithheldSemPublicHref(item.href)),
          },
        };
      }
      if (block.type === "footer") {
        return {
          ...block,
          data: {
            ...block.data,
            columns: block.data.columns.map((column) => ({
              ...column,
              items: column.items.filter((item) => !isWithheldSemPublicHref(item.url)),
            })),
          },
        };
      }
      return block;
    }),
  };
}

export function resolveClosingFooterHref(
  type: string,
  url?: string
): { href: string; external?: boolean } {
  const value = url?.trim() ?? "";
  switch (type) {
    case "email":
      return { href: value.startsWith("mailto:") ? value : `mailto:${value}` };
    case "phone":
      return { href: value.startsWith("tel:") ? value : `tel:${value.replace(/\s/g, "")}` };
    case "file":
    case "url":
    case "page":
    case "program":
    case "news":
    case "library":
    default:
      return { href: value, external: value.startsWith("http") };
  }
}
