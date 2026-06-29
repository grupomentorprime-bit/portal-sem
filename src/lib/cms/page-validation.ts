import type {
  BlockType,
  CmsPageCreate,
  PageBlock,
  PageValidationError,
  CmsPageUpdate,
} from "@/types/page";
import { BLOCK_TYPES, PAGE_STATUSES, PAGE_TEMPLATES } from "@/types/page";
import { normalizeSlug } from "@/lib/cms/page-utils";
import { DEFAULT_SETTINGS } from "@/lib/cms/page-defaults";
import { QUERY_BLOCK_TYPES, blockTypeToDefaultQuery } from "@/lib/content/block-query-defaults";

const PAGE_ID_PATTERN = /^[a-z0-9_-]+$/;

function isValidUrl(value: unknown): boolean {
  if (typeof value !== "string" || !value) return true;
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");
}

function validateBlock(block: PageBlock, index: number): PageValidationError[] {
  const errors: PageValidationError[] = [];
  const prefix = `blocks[${index}]`;

  if (!block.id) {
    errors.push({ field: `${prefix}.id`, message: "El bloque requiere id." });
  }
  if (!BLOCK_TYPES.includes(block.type)) {
    errors.push({ field: `${prefix}.type`, message: "Tipo de bloque inválido." });
  }
  if (typeof block.visible !== "boolean") {
    errors.push({ field: `${prefix}.visible`, message: "visible debe ser booleano." });
  }
  if (typeof block.order !== "number") {
    errors.push({ field: `${prefix}.order`, message: "order debe ser numérico." });
  }
  if (!block.settings || typeof block.settings !== "object") {
    errors.push({ field: `${prefix}.settings`, message: "settings debe ser un objeto." });
  }

  if (block.type === "hero") {
    const heroImage = block.settings.heroImage;
    if (heroImage && !isValidUrl(heroImage)) {
      errors.push({ field: `${prefix}.settings.heroImage`, message: "URL de imagen inválida." });
    }
  }

  return errors;
}

function validateBlocks(blocks: PageBlock[]): PageValidationError[] {
  const errors: PageValidationError[] = [];
  const ids = new Set<string>();

  blocks.forEach((block, index) => {
    errors.push(...validateBlock(block, index));
    if (ids.has(block.id)) {
      errors.push({ field: `blocks[${index}].id`, message: "ID de bloque duplicado." });
    }
    ids.add(block.id);
  });

  return errors;
}

function validateCommon(
  data: {
    title?: string;
    slug?: string;
    tenant?: string;
    status?: string;
    template?: string;
    blocks?: PageBlock[];
  },
  requireAll: boolean
): PageValidationError[] {
  const errors: PageValidationError[] = [];

  if (requireAll || data.title !== undefined) {
    if (!data.title?.trim()) {
      errors.push({ field: "title", message: "El título es obligatorio." });
    }
  }

  if (requireAll || data.slug !== undefined) {
    if (!data.slug?.trim()) {
      errors.push({ field: "slug", message: "El slug es obligatorio." });
    } else if (normalizeSlug(data.slug) !== data.slug && data.slug !== "/") {
      errors.push({ field: "slug", message: "El slug debe comenzar con /." });
    }
  }

  if (requireAll || data.tenant !== undefined) {
    if (!data.tenant?.trim()) {
      errors.push({ field: "tenant", message: "El tenant es obligatorio." });
    }
  }

  if (data.status && !PAGE_STATUSES.includes(data.status as (typeof PAGE_STATUSES)[number])) {
    errors.push({ field: "status", message: "Estado inválido." });
  }

  if (data.template && !PAGE_TEMPLATES.includes(data.template as (typeof PAGE_TEMPLATES)[number])) {
    errors.push({ field: "template", message: "Plantilla inválida." });
  }

  if (data.blocks) {
    errors.push(...validateBlocks(data.blocks));
  }

  return errors;
}

export function validatePageCreate(data: CmsPageCreate): PageValidationError[] {
  const errors = validateCommon(data, true);

  if (!data._id?.trim()) {
    errors.push({ field: "_id", message: "El id es obligatorio." });
  } else if (!PAGE_ID_PATTERN.test(data._id)) {
    errors.push({ field: "_id", message: "El id solo puede contener a-z, 0-9, _ y -." });
  }

  return errors;
}

export function validatePageUpdate(data: CmsPageUpdate): PageValidationError[] {
  return validateCommon(data, false);
}

export function mergeBlockSettings(
  type: BlockType,
  settings?: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...DEFAULT_SETTINGS[type], ...(settings ?? {}) };

  if (QUERY_BLOCK_TYPES.includes(type)) {
    if (!merged.query) {
      merged.query = blockTypeToDefaultQuery(type);
    }
    delete merged.items;
  }

  return merged;
}
