/**
 * OT-CMSV2-001 — Capa de lenguaje y navegación institucional del CMS.
 * Mapea conceptos internos de plataforma a etiquetas visibles para el SEM.
 */

export interface AdminNavItem {
  href: string;
  label: string;
  icon?: string;
  matchPrefixes?: string[];
  /** Si se define, el ítem solo se muestra si el usuario tiene al menos uno de estos permisos. */
  requiredAnyPermission?: string[];
}

/**
 * Navegación principal del Centro de Administración.
 *
 * Orden por capas institucionales (de lo general a lo operativo):
 * 1. Orientación — Inicio
 * 2. Identidad — Institución
 * 3. Presencia pública — Portal
 * 4. Oferta académica — Programas → Admisión
 * 5. Contenido editorial — Comunicaciones → Personas
 * 6. Recursos transversales — Medios
 * 7. Sistema — Administración
 */
export const ADMIN_PRIMARY_NAV: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Inicio",
    icon: "home",
    matchPrefixes: ["/admin"],
  },
  {
    href: "/admin/config",
    label: "Institución",
    icon: "institution",
    matchPrefixes: ["/admin/config"],
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
  },
  {
    href: "/admin/content/programs",
    label: "Programas y cursos",
    icon: "programs",
    matchPrefixes: ["/admin/content/programs"],
  },
  {
    href: "/admin/portal/admission",
    label: "Centro de admisión",
    icon: "admission",
    matchPrefixes: ["/admin/portal/admission"],
  },
  {
    href: "/admin/portal/asuntos-estudiantiles",
    label: "Asuntos estudiantiles",
    icon: "students",
    matchPrefixes: ["/admin/portal/asuntos-estudiantiles"],
    requiredAnyPermission: [
      "student-affairs.read",
      "student-affairs.checkin",
      "student-affairs.manage",
      "experience.forms.manage",
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
  },
  {
    href: "/admin/content/people",
    label: "Personas",
    icon: "people",
    matchPrefixes: ["/admin/content/people", "/admin/content/team"],
  },
  {
    href: "/admin/media",
    label: "Medios",
    icon: "media",
    matchPrefixes: ["/admin/media"],
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
  },
];

/** Roles internos → etiquetas institucionales (nunca mostrar nombres técnicos) */
export const INSTITUTIONAL_ROLE_LABELS: Record<string, string> = {
  "Tenant Owner": "Director General",
  "Institution Admin": "Administrador",
  Editor: "Editor",
  Reviewer: "Revisor",
  Teacher: "Docente",
  Admissions: "Admisiones",
  Finance: "Finanzas",
  Student: "Estudiante",
  Guest: "Solo lectura",
  "Student Affairs": "Asuntos estudiantiles",
  "Platform Owner": "Director General",
  "Platform Admin": "Administrador",
  Support: "Soporte",
};

/** Roles asignables al invitar (orden institucional) */
export const CMS_INVITE_ROLES = [
  { id: "admin", internalName: "Institution Admin", label: "Administrador" },
  { id: "editor", internalName: "Editor", label: "Editor" },
  { id: "comms", internalName: "Editor", label: "Comunicaciones" },
  { id: "admissions", internalName: "Admissions", label: "Admisiones" },
  { id: "student-affairs", internalName: "Student Affairs", label: "Asuntos estudiantiles" },
  { id: "reviewer", internalName: "Reviewer", label: "Revisor" },
  { id: "readonly", internalName: "Guest", label: "Solo lectura" },
] as const;

/** Grupos de filtro en Usuarios CMS */
export const CMS_USER_GROUPS = [
  { id: "all", label: "Todos" },
  { id: "admins", label: "Administradores", roles: ["Tenant Owner", "Institution Admin"] },
  { id: "editors", label: "Editores", roles: ["Editor"] },
  { id: "reviewers", label: "Revisores", roles: ["Reviewer"] },
  {
    id: "student-affairs",
    label: "Asuntos estudiantiles",
    roles: ["Student Affairs"],
  },
  { id: "guests", label: "Invitados", roles: ["Guest", "Admissions", "Teacher", "Finance", "Student"] },
] as const;

export function getInstitutionalRoleLabel(internalName: string): string {
  return INSTITUTIONAL_ROLE_LABELS[internalName] ?? "Colaborador";
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
  {
    href: "/admin/portal/forms",
    label: "Centro de formularios",
    description: "Convocatorias, asistencia y respuestas de formularios",
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
