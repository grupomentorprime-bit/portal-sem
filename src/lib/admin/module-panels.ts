export interface AdminPanelMeta {
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
}

export const ADMIN_PANEL_META = {
  dashboard: {
    eyebrow: "Centro de administración",
    heroTitle: "Panel institucional del SEM",
    heroDescription:
      "Resumen operativo del portal, comunicaciones, admisiones y accesos del equipo CMS.",
  },
  forms: {
    eyebrow: "Portal · Experiencia de formularios",
    heroTitle: "Gestiona convocatorias con landings coloridas",
    heroDescription:
      "Cada formulario público tiene una mini landing informativa. Controla respuestas, publicación y vista previa.",
  },
  admission: {
    eyebrow: "Portal · Admisión",
    heroTitle: "Configura la experiencia de postulación",
    heroDescription:
      "Hero, fechas, requisitos y cierre de admisión con vista previa en tiempo real del portal público.",
  },
  pages: {
    eyebrow: "Portal · Estructura del sitio",
    heroTitle: "Páginas, bloques y plantillas",
    heroDescription:
      "Organiza la arquitectura del portal institucional y abre el editor visual de cada página.",
  },
  content: {
    eyebrow: "Comunicaciones · Centro editorial",
    heroTitle: "Programas, noticias y recursos del portal",
    heroDescription:
      "Gestiona la oferta académica, comunicados institucionales y piezas editoriales del seminario.",
  },
  media: {
    eyebrow: "Medios · Biblioteca visual",
    heroTitle: "Imágenes y documentos institucionales",
    heroDescription:
      "Sube, organiza y reutiliza activos gráficos en páginas, admisión y comunicaciones.",
  },
  config: {
    eyebrow: "Administración · Institución",
    heroTitle: "Identidad, módulos y configuración global",
    heroDescription:
      "Datos institucionales, branding, SEO, contacto y estado del portal en un solo lugar.",
  },
  users: {
    eyebrow: "Administración · Accesos",
    heroTitle: "Usuarios, roles e invitaciones al CMS",
    heroDescription:
      "Invita colaboradores, asigna roles institucionales y revisa el historial de actividad.",
  },
  menus: {
    eyebrow: "Portal · Navegación",
    heroTitle: "Menús y enlaces del sitio",
    heroDescription:
      "Define la navegación principal y secundaria que verán las personas en el portal público.",
  },
  events: {
    eyebrow: "Sistema · Event bus",
    heroTitle: "Eventos internos y automatizaciones",
    heroDescription:
      "Observa emisiones del bus de eventos y depura integraciones del portal.",
  },
  workflows: {
    eyebrow: "Sistema · Workflows",
    heroTitle: "Flujos editoriales y aprobaciones",
    heroDescription:
      "Configura pasos de revisión y publicación para contenido institucional.",
  },
  profile: {
    eyebrow: "Cuenta · Perfil profesional",
    heroTitle: "Tu ficha en el equipo del SEM",
    heroDescription:
      "Nombre, cargo, preferencias regionales y permisos asignados según tu rol institucional.",
  },
  security: {
    eyebrow: "Cuenta · Seguridad",
    heroTitle: "Protección de tu acceso al CMS",
    heroDescription:
      "Contraseña, autenticación institucional y controles de sesión de tu cuenta.",
  },
  activity: {
    eyebrow: "Cuenta · Actividad",
    heroTitle: "Historial de cambios y accesos",
    heroDescription:
      "Línea de tiempo legible con las acciones recientes que realizaste en el panel.",
  },
  integrations: {
    eyebrow: "Administración · Integraciones",
    heroTitle: "Almacenamiento en la nube y conexiones",
    heroDescription:
      "Configura Backblaze B2 u otro proveedor S3 para medios y archivos del portal.",
  },
  notifications: {
    eyebrow: "Cuenta · Notificaciones",
    heroTitle: "Alertas del CMS y avisos institucionales",
    heroDescription:
      "Publicaciones, invitaciones y cambios importantes aparecerán aquí en la siguiente fase.",
  },
  help: {
    eyebrow: "Cuenta · Ayuda",
    heroTitle: "Guías para administrar el portal",
    heroDescription:
      "Enlaces rápidos a usuarios, configuración institucional y comunicaciones del seminario.",
  },
} as const satisfies Record<string, AdminPanelMeta>;

export const CONTENT_SECTION_PANELS: Record<string, AdminPanelMeta> = {
  programs: {
    eyebrow: "Comunicaciones · Programas",
    heroTitle: "Oferta académica y cursos",
    heroDescription: "Gestiona programas formativos, modalidades y fichas públicas del seminario.",
  },
  news: {
    eyebrow: "Comunicaciones · Noticias",
    heroTitle: "Comunicados y novedades institucionales",
    heroDescription: "Publica noticias, convocatorias y avisos para la comunidad SEM.",
  },
  people: {
    eyebrow: "Comunicaciones · Personas",
    heroTitle: "Equipo docente y autoridades",
    heroDescription: "Perfiles, cargos y retratos del equipo institucional en el portal.",
  },
  library: {
    eyebrow: "Comunicaciones · Biblioteca",
    heroTitle: "Recursos y documentos",
    heroDescription: "Material de apoyo, guías y publicaciones descargables.",
  },
  events: {
    eyebrow: "Comunicaciones · Eventos",
    heroTitle: "Agenda y actividades",
    heroDescription: "Jornadas, evaluaciones y encuentros presenciales u online.",
  },
  "academic-agenda": {
    eyebrow: "Comunicaciones · Agenda académica",
    heroTitle: "Calendario formativo",
    heroDescription: "Hitos del año académico, admisión e inicio de clases.",
  },
  avisos: {
    eyebrow: "Comunicaciones · Avisos",
    heroTitle: "Avisos institucionales",
    heroDescription: "Comunicaciones breves y urgentes para estudiantes y equipo.",
  },
  testimonials: {
    eyebrow: "Comunicaciones · Testimonios",
    heroTitle: "Voces de la comunidad",
    heroDescription: "Experiencias de estudiantes y graduados en el portal.",
  },
  gallery: {
    eyebrow: "Comunicaciones · Galería",
    heroTitle: "Galería visual",
    heroDescription: "Imágenes destacadas de la vida institucional del seminario.",
  },
  categories: {
    eyebrow: "Comunicaciones · Categorías",
    heroTitle: "Taxonomía editorial",
    heroDescription: "Clasificaciones para programas, noticias y recursos.",
  },
  team: {
    eyebrow: "Comunicaciones · Equipo (legacy)",
    heroTitle: "Colección histórica de equipo",
    heroDescription: "Registros heredados; preferir la sección Personas para nuevos perfiles.",
  },
};

export function getContentSectionPanel(sectionSlug: string): AdminPanelMeta {
  return (
    CONTENT_SECTION_PANELS[sectionSlug] ?? {
      eyebrow: "Comunicaciones",
      heroTitle: "Contenido editorial",
      heroDescription: "Gestiona elementos de esta colección del portal SEM.",
    }
  );
}
