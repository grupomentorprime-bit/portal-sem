/**
 * Aplicaciones que un Espacio ya tiene y que una unidad puede habilitar.
 * Los ids coinciden con los grupos de navegación del admin.
 */
export const UNIT_APP_CATALOG = [
  { id: "conversion", label: "CRM · Conversión" },
  { id: "campanas", label: "Campañas" },
  { id: "automatizaciones", label: "Automatizaciones" },
  { id: "analitica", label: "Analítica" },
  { id: "sitio-web", label: "Sitio web" },
  { id: "institucion", label: "Institución" },
] as const;

export type UnitAppId = (typeof UNIT_APP_CATALOG)[number]["id"];

const UNIT_APP_IDS = new Set<string>(UNIT_APP_CATALOG.map((app) => app.id));

export function isUnitAppId(value: string): value is UnitAppId {
  return UNIT_APP_IDS.has(value);
}

export function normalizeEnabledAppIds(
  ids: readonly string[]
): { ok: true; appIds: string[] } | { ok: false; error: string } {
  const appIds: string[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    if (!isUnitAppId(id)) {
      return { ok: false, error: `La aplicación «${id}» no existe en este Espacio.` };
    }
    seen.add(id);
    appIds.push(id);
  }
  return { ok: true, appIds };
}

export function allUnitAppIds(): string[] {
  return UNIT_APP_CATALOG.map((app) => app.id);
}
