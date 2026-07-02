import { colorDefaults, neutralScale } from "@/design/tokens/colors";

/** Colores de estado de workflow — tokens corporativos SEM */
export const workflowStateColors = {
  draft: neutralScale[500],
  review: colorDefaults.warning,
  approved: colorDefaults.secondary,
  published: colorDefaults.success,
  archived: neutralScale[400],
} as const;
