import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import type { AppManifest } from "@/nelzuri/catalog/types";

function manifest<const T extends AppManifest>(value: T): T {
  return value;
}

/**
 * Aplicación transversal. Se contrata y se autoriza en el escritorio.
 * El núcleo no importa su código: solo esta ficha.
 * `field-missing` cubre documentos que no traen el campo. No obliga a un Espacio nuevo.
 */
const growthOs = manifest({
  id: "growth-os",
  class: "transversal",
  integration: "internal",
  label: PLATFORM_DISPLAY_NAME,
  blurb: "Captación y conversión del Espacio.",
  contractable: true,
  defaultContract: { when: "field-missing" },
  open: { type: "internal", href: "/admin" },
});

const cumple = manifest({
  id: "cumple",
  class: "transversal",
  integration: "connect",
  label: "Cumple",
  blurb: "Cumplimiento de la empresa: obligaciones, brechas y evidencia.",
  contractable: true,
  defaultContract: { when: "field-missing", spaceId: "cumple" },
  requiresSpaceId: "cumple",
  open: { type: "connect-in-space", channel: "cumple", missing: "disconnected" },
});

const aprendeHoy = manifest({
  id: "aprende-hoy",
  class: "transversal",
  integration: "connect",
  label: "Aprende Hoy",
  blurb: "Vida académica: admisión, clases, evaluación y campus.",
  contractable: true,
  defaultContract: { when: "never" },
  open: { type: "connect-or-https", channel: "aprende-hoy" },
});

const rrhh = manifest({
  id: "rrhh",
  class: "transversal",
  integration: "connect",
  label: "RR.HH.",
  blurb: "Personas empleadas, contratos y jornada.",
  contractable: true,
  defaultContract: { when: "never" },
  open: { type: "connect", channel: "rrhh", missing: "later" },
});

/** Registradas para el catálogo. No entran al contrato ni a la mesa. */
const store = manifest({
  id: "store",
  class: "transversal",
  integration: "pending",
  label: "Store",
  blurb: "Aplicación registrada. Todavía no entra al contrato del Espacio.",
  contractable: false,
  defaultContract: { when: "never" },
  open: { type: "none" },
});

const connect = manifest({
  id: "connect",
  class: "transversal",
  integration: "pending",
  label: "Connect",
  blurb: "Protocolo de apertura de Cumple, Aprende Hoy y RR.HH.",
  contractable: false,
  defaultContract: { when: "never" },
  open: { type: "none" },
});

/** Identificadas. La puerta de cada Espacio llega en una etapa posterior. */
const admision = manifest({
  id: "admision",
  class: "specialized",
  integration: "pending",
  label: "Admisión",
  blurb: "Capacidad de un Espacio. No se contrata desde el escritorio.",
  contractable: false,
  defaultContract: { when: "never" },
  open: { type: "none" },
});

const asuntosEstudiantiles = manifest({
  id: "asuntos-estudiantiles",
  class: "specialized",
  integration: "pending",
  label: "Asuntos estudiantiles",
  blurb: "Capacidad de un Espacio. No se contrata desde el escritorio.",
  contractable: false,
  defaultContract: { when: "never" },
  open: { type: "none" },
});

const congreso = manifest({
  id: "congreso",
  class: "specialized",
  integration: "pending",
  label: "Congreso",
  blurb: "Capacidad de un Espacio. No se contrata desde el escritorio.",
  contractable: false,
  defaultContract: { when: "never" },
  open: { type: "none" },
});

/**
 * Ids que ya persisten en `contractedApps`.
 * Una aplicación contratable nueva se agrega aquí y en su manifiesto, en el mismo cambio.
 */
export const MENTOR_APPS = [growthOs.id, cumple.id, aprendeHoy.id, rrhh.id] as const;
export type MentorAppId = (typeof MENTOR_APPS)[number];

export const APP_MANIFESTS = [
  growthOs,
  cumple,
  aprendeHoy,
  rrhh,
  store,
  connect,
  admision,
  asuntosEstudiantiles,
  congreso,
] as const;
