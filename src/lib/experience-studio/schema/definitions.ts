import type { BlockSchema } from "./types";

/** Schemas explícitos — el Inspector se genera automáticamente desde aquí */
export const BLOCK_SCHEMAS: BlockSchema[] = [
  {
    type: "hero",
    label: "Hero",
    description: "Portada institucional con imagen, título y llamados a la acción.",
    icon: "Sparkles",
    category: "hero",
    fields: [
      { key: "overline", label: "Eyebrow", type: "text", section: "content" },
      { key: "title", label: "Título", type: "textarea", section: "content", required: true },
      { key: "subtitle", label: "Subtítulo", type: "textarea", section: "content" },
      { key: "heroMediaId", label: "Imagen de fondo", type: "image", section: "media", folder: "Hero" },
      { key: "overlayOpacity", label: "Overlay", type: "number", section: "design", hint: "0–100" },
      { key: "align", label: "Alineación", type: "alignment", section: "design" },
      { key: "primaryLabel", label: "Botón principal", type: "text", section: "content" },
      { key: "primaryHref", label: "Enlace principal", type: "text", section: "content" },
      { key: "secondaryLabel", label: "Botón secundario", type: "text", section: "content" },
      { key: "secondaryHref", label: "Enlace secundario", type: "text", section: "content" },
    ],
  },
  {
    type: "text",
    label: "Texto",
    description: "Bloque de texto editorial con título y párrafos.",
    icon: "BookOpen",
    category: "content",
    fields: [
      { key: "overline", label: "Eyebrow", type: "text", section: "content" },
      { key: "title", label: "Título", type: "text", section: "content" },
      { key: "body", label: "Contenido", type: "textarea", section: "content", required: true },
      { key: "align", label: "Alineación", type: "alignment", section: "design" },
    ],
  },
  {
    type: "faq",
    label: "Preguntas frecuentes",
    description: "Acordeón de preguntas y respuestas.",
    icon: "ClipboardCheck",
    category: "faq",
    useLegacyEditor: true,
    fields: [
      { key: "overline", label: "Eyebrow", type: "text", section: "content" },
      { key: "title", label: "Título", type: "text", section: "content", required: true },
      { key: "description", label: "Descripción", type: "textarea", section: "content" },
    ],
  },
  {
    type: "cta_premium",
    label: "CTA",
    description: "Llamado a la acción editorial premium.",
    icon: "Compass",
    category: "cta",
    useLegacyEditor: true,
    fields: [
      { key: "overline", label: "Eyebrow", type: "text", section: "content" },
      { key: "title", label: "Título", type: "text", section: "content", required: true },
      { key: "description", label: "Descripción", type: "textarea", section: "content" },
      { key: "imageMediaId", label: "Imagen", type: "image", section: "media", folder: "Hero" },
      {
        key: "variant",
        label: "Variante",
        type: "select",
        section: "design",
        options: [
          { value: "center", label: "Centrado" },
          { value: "split", label: "Dividido" },
          { value: "banner", label: "Banner" },
          { value: "highlight", label: "Destacado" },
        ],
      },
    ],
  },
  {
    type: "stats",
    label: "Indicadores",
    description: "Cifras e indicadores institucionales.",
    icon: "Award",
    category: "indicators",
    useLegacyEditor: true,
    fields: [
      { key: "overline", label: "Eyebrow", type: "text", section: "content" },
      { key: "title", label: "Título", type: "text", section: "content" },
    ],
  },
  {
    type: "timeline",
    label: "Timeline",
    description: "Línea de tiempo o proceso paso a paso.",
    icon: "Clock",
    category: "timeline",
    useLegacyEditor: true,
    fields: [
      { key: "overline", label: "Eyebrow", type: "text", section: "content" },
      { key: "title", label: "Título", type: "text", section: "content", required: true },
      { key: "description", label: "Descripción", type: "textarea", section: "content" },
    ],
  },
  {
    type: "gallery",
    label: "Galería",
    description: "Galería de imágenes institucionales.",
    icon: "Library",
    category: "gallery",
    useLegacyEditor: true,
    fields: [
      { key: "title", label: "Título", type: "text", section: "content" },
      { key: "description", label: "Descripción", type: "textarea", section: "content" },
    ],
  },
  {
    type: "video",
    label: "Video",
    description: "Bloque de video desde la biblioteca institucional.",
    icon: "Video",
    category: "video",
    fields: [
      { key: "title", label: "Título", type: "text", section: "content" },
      { key: "description", label: "Descripción", type: "textarea", section: "content" },
      { key: "videoMediaId", label: "Video", type: "video", section: "media", folder: "Videos" },
    ],
  },
  {
    type: "divider",
    label: "Separador",
    description: "Separador visual entre secciones.",
    icon: "Circle",
    category: "content",
    fields: [
      {
        key: "style",
        label: "Estilo",
        type: "select",
        section: "design",
        options: [
          { value: "line", label: "Línea" },
          { value: "space", label: "Espacio" },
          { value: "gradient", label: "Gradiente" },
        ],
      },
    ],
  },
];

const schemaMap = new Map(BLOCK_SCHEMAS.map((schema) => [schema.type, schema]));

export function getBlockSchema(type: string): BlockSchema | undefined {
  return schemaMap.get(type as BlockSchema["type"]);
}

export function listBlockSchemas(): BlockSchema[] {
  return BLOCK_SCHEMAS;
}
