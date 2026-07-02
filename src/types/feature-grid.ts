/** Experience Module — Feature Grid v1.0 */

export interface PortalFeatureItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  color?: string;
  order?: number;
  visible?: boolean;
  url?: string;
}

export interface PortalFeatureGridSettings extends Record<string, unknown> {
  overline?: string;
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export interface PortalFeatureGridProps {
  settings: PortalFeatureGridSettings;
  features: PortalFeatureItem[];
  id?: string;
  muted?: boolean;
}

/** Cantidades de tarjetas soportadas por el layout */
export const FEATURE_GRID_SUPPORTED_COUNTS = [3, 4, 6, 8, 12] as const;
