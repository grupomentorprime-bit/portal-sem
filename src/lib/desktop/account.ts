import { WALLPAPERS, type DesktopWallpaper } from "@/lib/desktop/catalog";

export const ACCOUNT_SECTIONS = [
  {
    id: "perfil",
    label: "Perfil",
    subtitle: "Nombre, cargo y datos de contacto.",
  },
  {
    id: "preferencias",
    label: "Preferencias",
    subtitle: "Idioma, zona horaria y fondo del escritorio.",
  },
  {
    id: "seguridad",
    label: "Seguridad",
    subtitle: "Cómo se protege el acceso a tu cuenta.",
  },
] as const;

export type AccountSectionId = (typeof ACCOUNT_SECTIONS)[number]["id"];

const WALLPAPER_LABELS: Record<DesktopWallpaper, string> = {
  mar: "Mar",
  valle: "Valle",
  volcan: "Volcán",
  kepler: "Kepler",
  noche: "Noche",
};

export function wallpaperLabel(id: DesktopWallpaper): string {
  return WALLPAPER_LABELS[id];
}

export function wallpaperChoices(): { id: DesktopWallpaper; label: string }[] {
  return WALLPAPERS.map((id) => ({ id, label: wallpaperLabel(id) }));
}
