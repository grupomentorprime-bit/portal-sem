/**
 * OT-CMSV2-001 / OT-IAM-SEM-001 — Capa de lenguaje y navegación institucional del CMS.
 */

import { ROLE_CODES } from "@/core/identity/roles/codes";

export interface AdminNavItem {
  /** Identificador estable para sub-ítems que comparten href. */
  id?: string;
  href: string;
  label: string;
  icon?: string;
  /** Contador opcional para badge en sidebar. */
  badge?: number;
  matchPrefixes?: string[];
  /** Permisos requeridos (todos deben estar presentes). */
  requiredPermissions?: string[];
  /** Al menos uno de estos permisos. */
  requiredAnyPermission?: string[];
  /** Al menos uno de estos códigos de rol. */
  requiredRole?: string[];
}

/**
 * Navegación principal del Centro de Administración.
 * Cada ítem declara permisos explícitos — nunca visible por defecto (OT-IAM-SEM-001 Fase 5).
 */
export const ADMIN_PRIMARY_NAV: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Inicio",
    icon: "home",
    matchPrefixes: ["/admin"],
    requiredAnyPermission: ["cms.pages.read", "settings.team", "student-affairs.read"],
  },
  {
    href: "/admin/config",
    label: "Institución",
    icon: "institution",
    matchPrefixes: ["/admin/config"],
    requiredAnyPermission: ["settings.update"],
  },
  {
    href: "/admin/pages",
    label: "Portal",
    icon: "portal",
    matchPrefixes: [
      "/admin/pages",
      "/admin/menus",
      "/admin/experience-studio",
      "/admin/portal/forms",
    ],
    requiredAnyPermission: [
      "cms.pages.read",
      "cms.pages.update",
      "cms.menus.read",
      "experience.forms.read",
      "experience.forms.manage",
    ],
  },
  {
    href: "/admin/content/programs",
    label: "Programas y cursos",
    icon: "programs",
    matchPrefixes: ["/admin/content/programs"],
    requiredAnyPermission: ["programs.manage", "cms.pages.read"],
  },
  {
    href: "/admin/portal/admission",
    label: "Centro de admisión",
    icon: "admission",
    matchPrefixes: ["/admin/portal/admission"],
    requiredAnyPermission: [
      "cms.pages.read",
      "experience.forms.read",
      "experience.forms.manage",
      "students.read",
    ],
  },
  {
    href: "/admin/portal/asuntos-estudiantiles",
    label: "Operación de formularios",
    icon: "students",
    matchPrefixes: ["/admin/portal/asuntos-estudiantiles"],
    requiredAnyPermission: [
      "student-affairs.read",
      "student-affairs.checkin",
      "student-affairs.manage",
    ],
  },
  {
    href: "/admin/content",
    label: "Comunicaciones",
    icon: "communications",
    matchPrefixes: [
      "/admin/content",
      "/admin/content/news",
      "/admin/content/events",
      "/admin/content/library",
      "/admin/content/institutional_notices",
      "/admin/content/academic_agenda",
    ],
    requiredAnyPermission: [
      "cms.pages.read",
      "cms.pages.update",
      "news.publish",
      "content.events.manage",
      "programs.manage",
    ],
  },
  {
    href: "/admin/content/people",
    label: "Personas",
    icon: "people",
    matchPrefixes: ["/admin/content/people", "/admin/content/team"],
    requiredAnyPermission: ["cms.pages.read", "cms.pages.update", "programs.manage"],
  },
  {
    href: "/admin/media",
    label: "Medios",
    icon: "media",
    matchPrefixes: ["/admin/media"],
    requiredAnyPermission: ["cms.media.read", "cms.media.upload"],
  },
  {
    href: "/admin/settings/users",
    label: "Administración",
    icon: "admin",
    matchPrefixes: [
      "/admin/settings",
      "/admin/workflows",
      "/admin/events",
      "/admin/experience",
    ],
    requiredAnyPermission: ["settings.team", "identity.audit.read", "workflow.read", "identity.roles.manage"],
  },
  {
    href: "/admin/settings/roles",
    label: "Permisos por rol",
    icon: "admin",
    matchPrefixes: ["/admin/settings/roles"],
    requiredAnyPermission: ["identity.roles.manage"],
  },
];

/** Roles internos → etiquetas institucionales visibles en el CMS */
export const INSTITUTIONAL_ROLE_LABELS: Record<string, string> = {
  [ROLE_CODES.SUPER_ADMIN]: "Super Admin",
  "Super Admin": "Super Admin",
  "Tenant Owner": "Super Admin",
  [ROLE_CODES.INSTITUTION_ADMIN]: "Administrador",
  "Institution Admin": "Administrador",
  [ROLE_CODES.SUPPORT]: "Soporte",
  Support: "Soporte",
  [ROLE_CODES.ADMISSIONS]: "Admisiones",
  Admissions: "Admisiones",
  [ROLE_CODES.STUDENT_AFFAIRS]: "Asuntos Estudiantiles",
  "Student Affairs": "Asuntos Estudiantiles",
  [ROLE_CODES.COMMUNICATIONS]: "Comunicaciones",
  Communications: "Comunicaciones",
  Editor: "Comunicaciones",
  [ROLE_CODES.REVIEWER]: "Revisor",
  Reviewer: "Revisor",
  [ROLE_CODES.GUEST]: "Consulta",
  Guest: "Consulta",
  Teacher: "Docente",
  Finance: "Finanzas",
  Student: "Estudiante",
  "Platform Owner": "Super Admin",
  "Platform Admin": "Administrador",
};

/** Roles asignables al invitar — identificados por código oficial (UI usa assignableRoles de la API) */
export const CMS_INVITE_ROLES = [
  { code: ROLE_CODES.INSTITUTION_ADMIN, label: "Administrador" },
  { code: ROLE_CODES.SUPPORT, label: "Soporte" },
  { code: ROLE_CODES.ADMISSIONS, label: "Admisiones" },
  { code: ROLE_CODES.STUDENT_AFFAIRS, label: "Asuntos Estudiantiles" },
  { code: ROLE_CODES.COMMUNICATIONS, label: "Comunicaciones" },
  { code: ROLE_CODES.REVIEWER, label: "Revisor" },
  { code: ROLE_CODES.GUEST, label: "Consulta" },
] as const;

/** Grupos de filtro en Usuarios CMS — solo códigos oficiales */
export const CMS_USER_GROUPS = [
  { id: "all", label: "Todos" },
  { id: "admins", label: "Administradores", roleCodes: [ROLE_CODES.INSTITUTION_ADMIN] },
  { id: "support", label: "Soporte", roleCodes: [ROLE_CODES.SUPPORT] },
  { id: "communications", label: "Comunicaciones", roleCodes: [ROLE_CODES.COMMUNICATIONS] },
  { id: "reviewers", label: "Revisores", roleCodes: [ROLE_CODES.REVIEWER] },
  {
    id: "student-affairs",
    label: "Asuntos Estudiantiles",
    roleCodes: [ROLE_CODES.STUDENT_AFFAIRS],
  },
  { id: "admissions", label: "Admisiones", roleCodes: [ROLE_CODES.ADMISSIONS] },
  { id: "guests", label: "Consulta", roleCodes: [ROLE_CODES.GUEST] },
] as const;

export function getInstitutionalRoleLabel(codeOrLegacyName: string, legacyName?: string): string {
  const primary = INSTITUTIONAL_ROLE_LABELS[codeOrLegacyName];
  if (primary) return primary;
  if (legacyName) {
    const fallback = INSTITUTIONAL_ROLE_LABELS[legacyName];
    if (fallback) return fallback;
  }
  return "Colaborador";
}

export function isNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.href === "/admin") {
    return pathname === "/admin";
  }

  if (item.href === "/admin/pages") {
    if (pathname.startsWith("/admin/portal/admission")) {
      return false;
    }
  }

  if (item.href === "/admin/content") {
    if (
      pathname.startsWith("/admin/content/people") ||
      pathname.startsWith("/admin/content/team") ||
      pathname.startsWith("/admin/content/programs")
    ) {
      return false;
    }
  }

  const prefixes = item.matchPrefixes ?? [item.href];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const ADMIN_SEARCH_CATEGORIES = [
  { id: "news", label: "Noticias", href: "/admin/content/news" },
  { id: "people", label: "Personas", href: "/admin/content/people" },
  { id: "programs", label: "Programas", href: "/admin/content/programs" },
  { id: "library", label: "Biblioteca", href: "/admin/content/library" },
  { id: "users", label: "Usuarios", href: "/admin/settings/users" },
  { id: "pages", label: "Páginas", href: "/admin/pages" },
  { id: "forms", label: "Formularios", href: "/admin/portal/forms" },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: "America/Santiago", label: "Chile (Santiago)" },
  { value: "America/Lima", label: "Perú (Lima)" },
  { value: "America/Bogota", label: "Colombia (Bogotá)" },
  { value: "UTC", label: "UTC" },
] as const;

export const LOCALE_OPTIONS = [
  { value: "es-CL", label: "Español (Chile)" },
  { value: "es", label: "Español" },
] as const;

/** Secciones de configuración institucional (etiquetas visibles) */
export const CONFIG_SECTION_LABELS: Record<string, string> = {
  general: "Configuración general",
  branding: "Identidad visual",
  seo: "Visibilidad web",
  contact: "Contacto",
  social: "Redes sociales",
  features: "Funciones del portal",
  experience: "Experiencia del visitante",
  status: "Estado del portal",
};

export function getConfigSectionLabel(sectionId: string): string {
  return CONFIG_SECTION_LABELS[sectionId] ?? sectionId;
}

/** Centro Editorial — accesos principales */
export const CONTENT_EDITORIAL_PRIMARY = [
  {
    href: "/admin/content/programs",
    label: "Programas",
    description: "Oferta académica y formación ministerial",
    collection: "academy_programs",
  },
  {
    href: "/admin/content/news",
    label: "Noticias",
    description: "Comunicados y novedades institucionales",
    collection: "content_news",
  },
  {
    href: "/admin/content/library",
    label: "Biblioteca",
    description: "Recursos y publicaciones de referencia",
    collection: "content_library",
  },
  {
    href: "/admin/content/people",
    label: "Personas",
    description: "Equipo directivo, docente y técnico",
    collection: "content_people",
  },
  {
    href: "/admin/portal/admission",
    label: "Centro de admisión",
    description: "Contenido y cierre editorial del proceso de ingreso",
    collection: null,
  },
] as const;

export const CONTENT_EDITORIAL_SECONDARY = [
  {
    href: "/admin/content/events",
    label: "Eventos",
    description: "Actividades y encuentros institucionales",
    collection: "content_events",
  },
  {
    href: "/admin/content/academic-agenda",
    label: "Agenda académica",
    description: "Calendario formativo oficial",
    collection: "content_academic_agenda",
  },
  {
    href: "/admin/content/avisos",
    label: "Avisos institucionales",
    description: "Comunicados de la Dirección",
    collection: "content_institutional_notices",
  },
  {
    href: "/admin/content/testimonials",
    label: "Testimonios",
    description: "Voces de la comunidad seminario",
    collection: "academy_testimonials",
  },
  {
    href: "/admin/content/gallery",
    label: "Galería",
    description: "Imágenes institucionales",
    collection: "academy_gallery",
  },
  {
    href: "/admin/content/categories",
    label: "Categorías",
    description: "Organización editorial",
    collection: "academy_categories",
  },
] as const;

export const MEDIA_LIBRARY_QUICK_LINKS = [
  { id: "all", label: "Todos los archivos", description: "Vista general de la biblioteca" },
  { id: "graphics", label: "Biblioteca gráfica", description: "Logos, íconos e isotipos" },
  { id: "photos", label: "Biblioteca fotográfica", description: "Retratos e imágenes editoriales" },
  { id: "editorial", label: "Assets editoriales", description: "Material de campaña y piezas premium" },
] as const;
