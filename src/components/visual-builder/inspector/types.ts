import type { ReactNode } from "react";

/** Props base compartidas por campos del inspector */
export interface InspectorFieldBaseProps {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
}

export type InspectorAlignmentValue = "left" | "center" | "right";

export type InspectorWidthValue = "full" | "contained" | "narrow";

export type InspectorSpacingPreset = "none" | "sm" | "md" | "lg" | "xl";

export type InspectorTypographySize = "sm" | "md" | "lg" | "xl";

export type InspectorTypographyWeight = "normal" | "medium" | "semibold";

export type InspectorDevice = "desktop" | "tablet" | "mobile";

export interface InspectorResponsiveVisibility {
  desktop: boolean;
  tablet: boolean;
  mobile: boolean;
}

export interface InspectorLinkValue {
  label: string;
  href: string;
  openInNewTab?: boolean;
}

export interface InspectorSectionId {
  content: "content";
  media: "media";
  design: "design";
  visibility: "visibility";
  config: "config";
  actions: "actions";
}

/** Secciones canónicas del inspector (orden fijo) */
export const INSPECTOR_SECTION_ORDER = [
  "content",
  "media",
  "design",
  "visibility",
  "config",
  "actions",
] as const;

export type InspectorCanonicalSection = (typeof INSPECTOR_SECTION_ORDER)[number];

export const INSPECTOR_SECTION_LABELS: Record<InspectorCanonicalSection, string> = {
  content: "Contenido",
  media: "Multimedia",
  design: "Diseño",
  visibility: "Visibilidad",
  config: "Configuración",
  actions: "Acciones",
};

export interface InspectorPanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Tablet/móvil: panel como drawer */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export interface InspectorActionHandlers {
  onDuplicate?: () => void;
  onHide?: () => void;
  onDelete?: () => void;
  hidden?: boolean;
  deleteDisabled?: boolean;
}
