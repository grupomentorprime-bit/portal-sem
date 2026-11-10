export type GrowthVentasVista = "cola" | "kanban" | "lista";

export function parseGrowthVentasVista(
  raw: string | undefined | null
): GrowthVentasVista {
  const value = raw?.trim().toLowerCase();
  if (value === "kanban") return "kanban";
  if (value === "lista") return "lista";
  return "cola";
}
