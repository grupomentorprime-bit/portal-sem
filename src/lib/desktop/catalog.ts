export const MENTOR_APPS = ["growth-os", "cumple", "aprende-hoy", "rrhh"] as const;
export type MentorAppId = (typeof MENTOR_APPS)[number];

/** Utilidades del escritorio. No se contratan. */
export type DockAppId = MentorAppId | "mensajes" | "envivo" | "clientes" | "ajustes";

/**
 * Catálogo de la mesa.
 * El dueño ve Clientes y Ajustes. El cliente ve las cuatro aplicaciones.
 * Ajustes del cliente sigue en la barra y no se duplica en su dock.
 * El chat en vivo no está en la mesa: se abre desde la burbuja.
 */
export function desktopDock(owner: boolean): DockAppId[] {
  if (owner) return ["mensajes", "clientes", "ajustes"];
  return [...MENTOR_APPS, "mensajes"];
}

/** Acciones de la barra que no están en el dock. */
export function desktopUtilities(owner: boolean): Array<"ajustes"> {
  if (owner) return [];
  return ["ajustes"];
}

/**
 * El dueño no está dentro de un cliente. Su sesión puede tener una membresía
 * (por ejemplo Mentor Capacitación); la mesa sigue siendo la de la plataforma.
 */
export function desktopContextLabel(input: { owner: boolean; spaceName: string }): string {
  if (input.owner) return "Plataforma";
  return input.spaceName;
}

/** Solo un miembro con varios Espacios cambia de mesa desde la barra. El dueño entra desde Clientes. */
export function desktopCanSwitchSpace(input: { owner: boolean; spaceCount: number }): boolean {
  return !input.owner && input.spaceCount > 1;
}

/** Recuerda el cliente que el dueño eligió abrir. Sin elección, la mesa sigue en la plataforma. */
export const DESK_ENTERED_COOKIE = "mp_desk_client";

export function enteredClientId(input: {
  owner: boolean;
  requestedId?: string | null;
  spaceIds: readonly string[];
}): string | null {
  if (!input.owner) return null;
  const id = input.requestedId?.trim() ?? "";
  if (!id || !input.spaceIds.includes(id)) return null;
  return id;
}

export function writeEnteredClientCookie(tenantId: string | null): void {
  if (typeof document === "undefined") return;
  if (!tenantId) {
    document.cookie = `${DESK_ENTERED_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }
  document.cookie = `${DESK_ENTERED_COOKIE}=${encodeURIComponent(tenantId)}; Path=/; Max-Age=2592000; SameSite=Lax`;
}

/** Lee la cookie de cliente abierto. Solo en el navegador. */
export function readEnteredClientCookie(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${DESK_ENTERED_COOKIE}=`;
  const part = document.cookie.split("; ").find((row) => row.startsWith(prefix));
  if (!part) return null;
  const raw = part.slice(prefix.length);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw) || null;
  } catch {
    return raw;
  }
}

/**
 * Si el dueño ya abrió un cliente desde la mesa, al cambiar de Espacio
 * desde una aplicación la cookie debe seguir al nuevo Espacio.
 * Sin cookie previa no escribe nada: la mesa de plataforma sigue intacta.
 */
export function syncEnteredClientCookie(tenantId: string): void {
  if (!tenantId || !readEnteredClientCookie()) return;
  writeEnteredClientCookie(tenantId);
}

export function dockUtilityHref(appId: "clientes" | "ajustes", owner: boolean): string {
  if (appId === "clientes") return "/platform?crear=1";
  return owner ? "/platform/usuarios" : "/admin/config";
}

export const CUMPLE_SPACE_ID = "cumple";

export const WALLPAPERS = ["mar", "valle", "volcan", "kepler", "noche"] as const;
export type DesktopWallpaper = (typeof WALLPAPERS)[number];
/** Un fondo del catálogo, o la imagen que subió la persona. */
export type WallpaperChoice = DesktopWallpaper | "custom";

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

export function dockAppLabel(appId: DockAppId): string {
  if (appId === "ajustes") return "Ajustes";
  if (appId === "mensajes") return "Atención";
  if (appId === "envivo") return "Chat en vivo";
  if (appId === "clientes") return "Clientes";
  return LABELS[appId];
}

export function dockAppBlurb(appId: DockAppId, owner = false): string {
  if (appId === "mensajes") {
    return owner
      ? "Casos de cada empresa. Se responden cuando entres."
      : "Casos de esta empresa con Nelzuri.";
  }
  if (appId === "envivo") {
    return owner
      ? "Quién está en el escritorio ahora."
      : "Hablar con Nelzuri si hay alguien en línea.";
  }
  if (appId === "clientes") return "Organizaciones. Se miran aquí, sin cambiar de escritorio.";
  if (appId === "ajustes") {
    return owner
      ? "La plataforma, sus productos y quién la administra."
      : "Ajustes de este cliente: sitio, equipo y accesos.";
  }
  return BLURBS[appId];
}

export function parseWallpaper(value: unknown): DesktopWallpaper {
  if (typeof value === "string" && (WALLPAPERS as readonly string[]).includes(value)) {
    return value as DesktopWallpaper;
  }
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
