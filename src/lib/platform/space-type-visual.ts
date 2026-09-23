import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Briefcase,
  Building2,
  GraduationCap,
  HandHeart,
  Landmark,
  Layers,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { TenantType } from "@/core/tenant/types";

export interface SpaceTypeVisual {
  icon: LucideIcon;
  /** Fondo del badge del ícono. */
  badgeBg: string;
  /** Color del ícono. */
  iconFg: string;
  /** Fondo del contenedor grande (lista). */
  panelBg: string;
  /** Accent decorativo. */
  accent: string;
}

/**
 * Visual por tipo de organización cuando el Espacio aún no tiene logo.
 * Los valores legacy siguen mapeados para Espacios creados antes del catálogo actual.
 */
export function spaceTypeVisual(
  type: TenantType | string | null | undefined
): SpaceTypeVisual {
  switch (type) {
    case "business":
      return {
        icon: Briefcase,
        badgeBg:
          "bg-[color-mix(in_srgb,var(--growth-os-primary)_14%,white)]",
        iconFg: "text-[var(--growth-os-primary)]",
        panelBg:
          "from-[color-mix(in_srgb,var(--growth-os-primary)_8%,white)] via-white to-[color-mix(in_srgb,var(--growth-os-secondary)_12%,white)]",
        accent: "bg-[var(--growth-os-primary)]/12",
      };
    case "education":
      return {
        icon: GraduationCap,
        badgeBg:
          "bg-[color-mix(in_srgb,var(--growth-os-secondary)_18%,white)]",
        iconFg: "text-[var(--growth-os-primary)]",
        panelBg:
          "from-[color-mix(in_srgb,var(--growth-os-secondary)_14%,white)] via-white to-[color-mix(in_srgb,var(--growth-os-primary)_8%,white)]",
        accent: "bg-[var(--growth-os-secondary)]/20",
      };
    case "academy":
      return {
        icon: BookOpen,
        badgeBg:
          "bg-[color-mix(in_srgb,var(--growth-os-secondary)_18%,white)]",
        iconFg: "text-[var(--growth-os-primary)]",
        panelBg:
          "from-[color-mix(in_srgb,var(--growth-os-secondary)_14%,white)] via-white to-[color-mix(in_srgb,var(--growth-os-primary)_8%,white)]",
        accent: "bg-[var(--growth-os-secondary)]/20",
      };
    case "social":
      return {
        icon: HandHeart,
        badgeBg:
          "bg-[color-mix(in_srgb,var(--growth-os-success)_16%,white)]",
        iconFg: "text-[var(--growth-os-success)]",
        panelBg:
          "from-[color-mix(in_srgb,var(--growth-os-success)_12%,white)] via-white to-[color-mix(in_srgb,var(--growth-os-secondary)_10%,white)]",
        accent: "bg-[var(--growth-os-success)]/18",
      };
    case "community":
      return {
        icon: UsersRound,
        badgeBg:
          "bg-[color-mix(in_srgb,var(--growth-os-light)_18%,white)]",
        iconFg: "text-[color-mix(in_srgb,var(--growth-os-light)_70%,var(--growth-os-primary))]",
        panelBg:
          "from-[color-mix(in_srgb,var(--growth-os-light)_14%,white)] via-white to-[color-mix(in_srgb,var(--growth-os-primary)_8%,white)]",
        accent: "bg-[var(--growth-os-light)]/20",
      };
    case "independent":
      return {
        icon: UserRound,
        badgeBg:
          "bg-[color-mix(in_srgb,var(--growth-os-accent)_14%,white)]",
        iconFg: "text-[var(--growth-os-accent)]",
        panelBg:
          "from-[color-mix(in_srgb,var(--growth-os-accent)_10%,white)] via-white to-[color-mix(in_srgb,var(--growth-os-secondary)_10%,white)]",
        accent: "bg-[var(--growth-os-accent)]/16",
      };
    case "institution":
      return {
        icon: Landmark,
        badgeBg:
          "bg-[color-mix(in_srgb,var(--growth-os-primary)_14%,white)]",
        iconFg: "text-[var(--growth-os-primary)]",
        panelBg:
          "from-[color-mix(in_srgb,var(--growth-os-primary)_10%,white)] via-white to-[color-mix(in_srgb,var(--growth-os-secondary)_12%,white)]",
        accent: "bg-[var(--growth-os-primary)]/12",
      };
    case "platform":
      return {
        icon: Sparkles,
        badgeBg:
          "bg-[color-mix(in_srgb,var(--growth-os-primary)_14%,white)]",
        iconFg: "text-[var(--growth-os-primary)]",
        panelBg:
          "from-[color-mix(in_srgb,var(--growth-os-primary)_12%,white)] via-white to-[color-mix(in_srgb,var(--growth-os-secondary)_14%,white)]",
        accent: "bg-[var(--growth-os-secondary)]/18",
      };
    case "other":
      return {
        icon: Layers,
        badgeBg:
          "bg-[color-mix(in_srgb,var(--growth-os-primary)_12%,white)]",
        iconFg: "text-[var(--growth-os-primary)]",
        panelBg:
          "from-[var(--gray-100)] via-white to-[color-mix(in_srgb,var(--growth-os-secondary)_12%,white)]",
        accent: "bg-[var(--growth-os-secondary)]/16",
      };
    default:
      return {
        icon: Building2,
        badgeBg:
          "bg-[color-mix(in_srgb,var(--growth-os-primary)_12%,white)]",
        iconFg: "text-[var(--growth-os-primary)]",
        panelBg:
          "from-[var(--gray-100)] via-white to-[color-mix(in_srgb,var(--growth-os-secondary)_12%,white)]",
        accent: "bg-[var(--growth-os-secondary)]/16",
      };
  }
}
