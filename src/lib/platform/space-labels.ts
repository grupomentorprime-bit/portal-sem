import { ROLE_CODES } from "@/core/identity/roles/codes";
import {
  PLATFORM_ROLE_CODES,
  type PlatformRoleCode,
} from "@/core/identity/platform/codes";
import type { SiteStatus, TenantStatus, TenantType } from "@/core/tenant/types";

/** Etiquetas visibles en Platform Admin (Growth OS). */
export function labelTenantStatus(status: TenantStatus | string): string {
  switch (status) {
    case "active":
      return "Activo";
    case "inactive":
      return "Inactivo";
    case "suspended":
      return "Suspendido";
    default:
      return status;
  }
}

export function labelSiteStatus(status: SiteStatus | string): string {
  switch (status) {
    case "active":
      return "Activo";
    case "inactive":
      return "Inactivo";
    case "maintenance":
      return "Mantenimiento";
    default:
      return status;
  }
}

export function labelTenantType(type: TenantType | string): string {
  switch (type) {
    case "business":
      return "Empresa";
    case "education":
      return "Educación";
    case "social":
      return "Organización social";
    case "community":
      return "Comunidad o iglesia";
    case "independent":
      return "Profesional independiente";
    case "other":
      return "Otro";
    // Legacy (Espacios previos a OT-GROWTH-UX-SPACE-CREATION-001)
    case "institution":
      return "Institución";
    case "academy":
      return "Academia";
    case "platform":
      return "Plataforma";
    default:
      return type;
  }
}

/** Roles de Espacio en lenguaje de Platform Admin (nunca “super_admin”). */
export function labelSpaceRole(code: string | null | undefined): string {
  switch (code) {
    case ROLE_CODES.SUPER_ADMIN:
      return "Dueño del Espacio";
    case ROLE_CODES.INSTITUTION_ADMIN:
      return "Administrador";
    case ROLE_CODES.SUPPORT:
      return "Soporte";
    case ROLE_CODES.ADMISSIONS:
      return "Admisiones";
    case ROLE_CODES.STUDENT_AFFAIRS:
      return "Asuntos Estudiantiles";
    case ROLE_CODES.COMMUNICATIONS:
      return "Comunicaciones";
    case ROLE_CODES.REVIEWER:
      return "Revisor";
    case ROLE_CODES.GUEST:
      return "Consulta";
    default:
      return code?.trim() || "Miembro";
  }
}

/** Roles globales de Growth OS en lenguaje humano (nunca códigos técnicos). */
export function labelPlatformRole(
  roles: readonly PlatformRoleCode[] | null | undefined
): string {
  if (!roles || roles.length === 0) return "Operador de Growth OS";
  if (roles.includes(PLATFORM_ROLE_CODES.OWNER)) return "Dueño de Growth OS";
  if (roles.includes(PLATFORM_ROLE_CODES.OPERATOR)) {
    return "Operador de Growth OS";
  }
  return "Operador de Growth OS";
}

/** Primer nombre para saludo; fallback al displayName completo. */
export function firstNameFromDisplayName(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function timeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}
