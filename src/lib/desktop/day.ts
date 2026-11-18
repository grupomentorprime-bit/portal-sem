import type { MentorAppId } from "@/lib/desktop/catalog";

export type DesktopDayLine = {
  appId: MentorAppId;
  text: string;
  href: string;
};

export type GrowthDayMatter = {
  personaLabel: string;
  band: string | null;
  href: string;
};

const CLEAR = "Nada pide atención ahora.";

function personName(label: string): string {
  const name = label.trim();
  return name || "Persona";
}

/** Una línea de Growth. Solo si la aplicación se abre, y solo con un asunto real. */
export function growthDayLine(input: {
  opens: boolean;
  matter: GrowthDayMatter | null;
}): DesktopDayLine | null {
  if (!input.opens) return null;
  if (!input.matter) {
    return { appId: "growth-os", text: CLEAR, href: "/admin/ventas" };
  }
  const name = personName(input.matter.personaLabel);
  const href = input.matter.href.trim() || "/admin/ventas";
  if (input.matter.band === "overdue") {
    return { appId: "growth-os", text: `${name} está vencida.`, href };
  }
  if (input.matter.band === "unfollowed") {
    return { appId: "growth-os", text: `${name} está sin seguimiento.`, href };
  }
  if (input.matter.band === "stale") {
    return { appId: "growth-os", text: `${name} está estancada.`, href };
  }
  return { appId: "growth-os", text: CLEAR, href: "/admin/ventas" };
}

/** Identidad del aviso. Cambia cuando cambia la persona o la frase. */
export function dayNoticeKey(line: DesktopDayLine): string {
  return `${line.appId}\n${line.href}\n${line.text}`;
}

/** Oculta solo los avisos cerrados en esta visita. Al actualizar, la lista vuelve a ser la del servidor. */
export function visibleDayNotices(
  lines: readonly DesktopDayLine[],
  dismissed: readonly string[]
): DesktopDayLine[] {
  const gone = new Set(dismissed);
  return lines.filter((line) => !gone.has(dayNoticeKey(line)));
}

/** Como máximo tres. Una por aplicación, en el orden que lleguen. */
export function desktopDayLines(lines: Array<DesktopDayLine | null>): DesktopDayLine[] {
  const kept: DesktopDayLine[] = [];
  for (const line of lines) {
    if (!line || kept.some((item) => item.appId === line.appId)) continue;
    kept.push(line);
    if (kept.length === 3) break;
  }
  return kept;
}
