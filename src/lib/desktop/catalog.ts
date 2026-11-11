export const MENTOR_APPS = ["growth-os", "cumple", "aprende-hoy", "rrhh"] as const;
export type MentorAppId = (typeof MENTOR_APPS)[number];

export const CUMPLE_SPACE_ID = "cumple";

export const WALLPAPERS = ["mar", "valle", "noche"] as const;
export type DesktopWallpaper = (typeof WALLPAPERS)[number];

export const DESKTOP_FALLBACK = "#102033";

const LABELS: Record<MentorAppId, string> = {
  "growth-os": "Growth OS",
  cumple: "Cumple",
  "aprende-hoy": "Aprende Hoy",
  rrhh: "RR.HH.",
};

const BLURBS: Record<MentorAppId, string> = {
  "growth-os": "Captación y conversión del Espacio.",
  cumple: "Cumplimiento de la empresa: obligaciones, brechas y evidencia.",
  "aprende-hoy": "Vida académica: admisión, clases, evaluación y campus.",
  rrhh: "Personas empleadas, contratos y jornada.",
};

export function isMentorAppId(value: string): value is MentorAppId {
  return (MENTOR_APPS as readonly string[]).includes(value);
}

export function mentorAppLabel(appId: MentorAppId): string {
  return LABELS[appId];
}

export function mentorAppBlurb(appId: MentorAppId): string {
  return BLURBS[appId];
}

export function parseWallpaper(value: unknown): DesktopWallpaper {
  if (value === "mar" || value === "valle" || value === "noche") return value;
  return "mar";
}

export function nextWallpaper(current: DesktopWallpaper): DesktopWallpaper {
  const index = WALLPAPERS.indexOf(current);
  return WALLPAPERS[(index + 1) % WALLPAPERS.length] ?? "mar";
}

export function wallpaperSrc(id: DesktopWallpaper): string {
  return `/desktop/${id}.jpg`;
}

export function spaceSwitchLanding(pathname: string): "/escritorio" | "/admin" {
  return pathname === "/escritorio" ? "/escritorio" : "/admin";
}
