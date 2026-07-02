import { colorDefaults } from "@/design/tokens/colors";
import type { PortalCursorConfig } from "@/types/cms";

export const DEFAULT_PORTAL_CURSOR: PortalCursorConfig = {
  enabled: true,
  mode: "premium",
  primaryColor: colorDefaults.accent,
  secondaryColor: colorDefaults.secondary,
  size: 36,
  opacity: 0.88,
  glow: true,
  speed: 0.18,
  magnetism: true,
  magnetStrength: 0.35,
  ripple: true,
  animations: true,
  showOnMobile: false,
};
