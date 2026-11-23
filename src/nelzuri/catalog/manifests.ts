import { ADMISSION_DOOR, CONGRESS_DOOR, STUDENT_AFFAIRS_DOOR } from "@/nelzuri/catalog/doors";
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
  version: "1",
  publication: "published",
  label: "Growth OS",
  blurb: "Captación y conversión del Espacio.",
  contractable: true,
  sectors: ["business"],
  defaultContract: { when: "field-missing" },
  open: { type: "internal", href: "/admin" },
});

const cumple = manifest({
  id: "cumple",
  class: "transversal",
  integration: "connect",
  version: "1",
  publication: "published",
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
  version: "1",
  publication: "published",
  label: "Aprende Hoy",
  blurb: "Vida académica: admisión, clases, evaluación y campus.",
  contractable: true,
  sectors: ["education"],
  defaultContract: { when: "never" },
  open: { type: "connect-or-https", channel: "aprende-hoy" },
});

const rrhh = manifest({
  id: "rrhh",
  class: "transversal",
  integration: "connect",
  version: "1",
  publication: "published",
  label: "RR.HH.",
  blurb: "Personas empleadas, contratos y jornada.",
  contractable: true,
  sectors: ["business"],
  defaultContract: { when: "never" },
  open: { type: "connect", channel: "rrhh", missing: "later" },
});

/** Registradas para el catálogo. No entran al contrato ni a la mesa. */
const store = manifest({
  id: "store",
  class: "transversal",
  integration: "pending",
  version: "1",
  publication: "draft",
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
  version: "1",
  publication: "draft",
  label: "Connect",
  blurb: "Protocolo de apertura de Cumple, Aprende Hoy y RR.HH.",
  contractable: false,
  defaultContract: { when: "never" },
  open: { type: "none" },
});

/**
 * Capacidades que ya operan en su Espacio.
 * La puerta repite los permisos de la navegación actual. No se contratan.
 */
const admision = manifest({
  id: "admision",
  class: "specialized",
  integration: "internal",
  version: "1",
  publication: "published",
  label: "Admisión",
  blurb: "Centro de admisión del Seminario. No se contrata.",
  contractable: false,
  defaultContract: { when: "never" },
  requiresSpaceId: "seminario-ipn",
  door: ADMISSION_DOOR,
  open: { type: "internal", href: "/admin/portal/admission" },
});

const asuntosEstudiantiles = manifest({
  id: "asuntos-estudiantiles",
  class: "specialized",
  integration: "internal",
  version: "1",
  publication: "published",
  label: "Asuntos Estudiantiles",
  blurb: "Operación de formularios del Seminario. No se contrata.",
  contractable: false,
  defaultContract: { when: "never" },
  requiresSpaceId: "seminario-ipn",
  door: STUDENT_AFFAIRS_DOOR,
  open: { type: "internal", href: "/admin/portal/asuntos-estudiantiles" },
});

const congreso = manifest({
  id: "congreso",
  class: "specialized",
  integration: "internal",
  version: "1",
  publication: "published",
  label: "Congreso de Varones",
  blurb: "Congreso de Varones de IPN Chile. No se contrata.",
  contractable: false,
  defaultContract: { when: "never" },
  requiresSpaceId: "ipn-chile",
  door: CONGRESS_DOOR,
  open: { type: "internal", href: "/admin/portal/congreso-varones" },
});

/**
 * Ids que ya persisten en `contractedApps`.
 * Una aplicación contratable nueva se agrega aquí y en su manifiesto, en el mismo cambio.
 */
export const MENTOR_APPS = [growthOs.id, cumple.id, aprendeHoy.id, rrhh.id] as const;
export type MentorAppId = (typeof MENTOR_APPS)[number];

/** Capacidades especializadas. No entran a `contractedApps`. */
export const SPECIALIZED_APPS = [admision.id, asuntosEstudiantiles.id, congreso.id] as const;
export type SpecializedAppId = (typeof SPECIALIZED_APPS)[number];

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
