/**
 * OT-PORTAL-004 — Contenido canónico del Centro de Admisión SEM.
 * Fuente por defecto; editable vía CMS (portal_admission_config).
 */
import type { AdmissionConfig } from "@/types/admission";
import { DEFAULT_ADMISSION_CLOSING } from "@/lib/portal/admission-closing-defaults";
import { DEFAULT_ADMISSION_SECTIONS } from "@/lib/portal/admission-sections";
import type { CmsFormField } from "@/types/cms-shared";
import { DEFAULT_CMS_SECTION_LAYOUT } from "@/types/cms-shared";

export const ADMISSION_CONFIG_ID = "admission-center";

const DEFAULT_FORM_FIELDS: CmsFormField[] = [
  { id: "ff-firstName", type: "text", name: "firstName", label: "Nombre", required: true, width: "half", order: 0 },
  { id: "ff-lastName", type: "text", name: "lastName", label: "Apellidos", required: true, width: "half", order: 1 },
  { id: "ff-email", type: "email", name: "email", label: "Correo electrónico", required: true, width: "half", order: 2 },
  { id: "ff-phone", type: "phone", name: "phone", label: "Teléfono", required: true, width: "half", order: 3 },
  { id: "ff-church", type: "text", name: "church", label: "Iglesia", required: true, width: "half", order: 4 },
  { id: "ff-city", type: "text", name: "city", label: "Ciudad", required: true, width: "half", order: 5 },
  {
    id: "ff-programId",
    type: "select",
    name: "programId",
    label: "Programa de interés",
    placeholder: "Selecciona un programa",
    required: true,
    width: "full",
    order: 6,
  },
  {
    id: "ff-message",
    type: "textarea",
    name: "message",
    label: "Mensaje (opcional)",
    required: false,
    width: "full",
    helper: "Cuéntanos brevemente tu motivación o contexto pastoral.",
    order: 7,
  },
];

const DEFAULT_PROGRAMS_SECTION: AdmissionConfig["programsSection"] = {
  enabled: true,
  overline: "PROGRAMAS FORMATIVOS",
  title: "Elige la ruta que Dios tiene para ti.",
  description:
    "Programas de formación ministerial con profundidad bíblica, acompañamiento pastoral y modalidad 100% online.",
  tagline: "Formación bíblica con excelencia académica y corazón pastoral.",
  catalogHref: "/programas",
  catalogLabel: "Ver catálogo completo",
  cardCtaLabel: "Conocer programa",
  maxSecondaryVisible: 3,
  secondaryProgramIds: [],
  minProgramsForFilters: 8,
  animation: "fade",
  filters: [
    { id: "all", label: "Todos", matchKind: "all", visible: true, order: 0 },
    {
      id: "diplomas",
      label: "Diplomas",
      matchKind: "text",
      matchValue: "diplom",
      visible: true,
      order: 1,
    },
    {
      id: "certificados",
      label: "Certificados",
      matchKind: "text",
      matchValue: "certificado",
      visible: true,
      order: 2,
    },
    {
      id: "cursos",
      label: "Cursos",
      matchKind: "text",
      matchValue: "curso",
      visible: true,
      order: 3,
    },
    {
      id: "especializaciones",
      label: "Especializaciones",
      matchKind: "text",
      matchValue: "especializaci",
      visible: true,
      order: 4,
    },
  ],
  help: {
    enabled: true,
    title: "¿No sabes qué programa es para ti?",
    description:
      "Nuestro equipo de admisiones puede orientarte según tu llamado y experiencia ministerial.",
    primaryLabel: "Hablar con admisiones",
    primaryHref: "/contacto",
    secondaryLabel: "Ver guía de programas",
    secondaryHref: "/admision",
  },
};

export const DEFAULT_ADMISSION_CONFIG: Omit<AdmissionConfig, "tenant" | "updatedAt"> = {
  _id: ADMISSION_CONFIG_ID,
  hero: {
    enabled: true,
    eyebrow: "Centro de Admisión",
    statusBadge: {
      text: "Admisión 2026 abierta",
      icon: "Sparkles",
      tone: "success",
      visible: true,
    },
    title: "Da el primer paso en tu formación ministerial",
    subtitle: "Formación bíblica, académica y pastoral con respaldo institucional.",
    description:
      "El Seminario Eclesiástico Mayor forma hombres y mujeres para el servicio cristiano con excelencia bíblica, académica y pastoral. Aquí comienza tu proceso de postulación.",
    media: {
      type: "image",
      imageAssetId: "hero-ministerial-call",
      alt: "Formación ministerial SEM",
      overlay: true,
      overlayOpacity: 0.4,
      darkening: 0.15,
      blur: 0,
      gradient: true,
      gradientOpacity: 0.28,
      focalPoint: { x: 0.58, y: 0.42 },
      position: "center",
    },
    editorialCard: {
      visible: true,
      title: "ADMISIÓN 2026",
      rows: [
        {
          id: "ec-open",
          label: "Inicio postulaciones",
          value: "1 de junio",
          visible: true,
          order: 0,
        },
        {
          id: "ec-close",
          label: "Cierre",
          value: "31 de agosto",
          visible: true,
          order: 1,
        },
        {
          id: "ec-classes",
          label: "Inicio clases",
          value: "10 de marzo",
          visible: true,
          order: 2,
        },
      ],
      calendarLink: {
        label: "Ver calendario",
        href: "#fechas",
        visible: true,
      },
    },
    quote: {
      visible: false,
      text: "",
      reference: "",
    },
    animations: {
      enabled: true,
      entrance: "fade",
      hoverElevation: true,
      hoverCta: true,
    },
    actions: [
      {
        id: "hero-act-primary",
        label: "Postular ahora",
        href: "#postulacion",
        variant: "primary",
        icon: "ArrowRight",
        visible: true,
        order: 0,
      },
      {
        id: "hero-act-secondary",
        label: "Conocer programas",
        href: "#programas-admision",
        variant: "secondary",
        visible: true,
        order: 1,
      },
      {
        id: "hero-act-tertiary",
        label: "Hablar con admisiones",
        href: "/contacto",
        variant: "tertiary",
        visible: true,
        order: 2,
      },
    ],
    indicators: [
      {
        id: "ind-1",
        value: "3 años",
        label: "Formando líderes",
        icon: "Award",
        visible: true,
        order: 0,
      },
      {
        id: "ind-2",
        value: "4 generaciones",
        label: "Formación ministerial",
        icon: "Users",
        visible: true,
        order: 1,
      },
      {
        id: "ind-3",
        value: "100%",
        label: "Modalidad online",
        icon: "Monitor",
        visible: true,
        order: 2,
      },
      {
        id: "ind-4",
        value: "IPN Chile",
        label: "Respaldo institucional",
        icon: "Shield",
        visible: true,
        order: 3,
      },
    ],
    microBenefits: [
      { id: "mb-1", icon: "Check", text: "Campus virtual", visible: true, order: 0 },
      { id: "mb-2", icon: "Check", text: "Clases en vivo", visible: true, order: 1 },
      { id: "mb-3", icon: "Check", text: "Docentes especializados", visible: true, order: 2 },
      { id: "mb-4", icon: "Check", text: "Acompañamiento pastoral", visible: true, order: 3 },
    ],
  },
  calendarLabels: {
    applicationsOpen: "Inicio de postulaciones",
    applicationsClose: "Cierre de postulaciones",
    classesStart: "Inicio de clases",
  },
  datesHighlight: {
    enabled: true,
    title: "Fechas importantes",
    statusLabel: "Postulaciones abiertas",
    items: [
      {
        id: "dh-open",
        label: "Inicio de postulaciones",
        value: "1 de junio 2026",
        icon: "Send",
        visible: true,
        order: 0,
      },
      {
        id: "dh-close",
        label: "Cierre de postulaciones",
        value: "31 de agosto 2026",
        icon: "Calendar",
        highlight: true,
        visible: true,
        order: 1,
      },
      {
        id: "dh-classes",
        label: "Inicio de clases",
        value: "10 de marzo 2026",
        icon: "BookOpen",
        visible: true,
        order: 2,
      },
    ],
  },
  programsSection: DEFAULT_PROGRAMS_SECTION,
  heroPrograms: DEFAULT_PROGRAMS_SECTION,
  intro: {
    whyTitle: "¿Por qué estudiar en el SEM?",
    whyDescription:
      "Somos una institución de formación ministerial con respaldo de IPN Chile, modalidad 100% online y acompañamiento docente y pastoral. No somos una plataforma de cursos: formamos siervos para la Iglesia.",
    profilesTitle: "¿Quién puede postular?",
    profilesDescription:
      "Nuestros programas formativos están orientados a personas con vocación al servicio cristiano que deseen profundizar en las Escrituras.",
  },
  profiles: [
    {
      id: "pastores",
      title: "Pastores y pastoras",
      description: "Quienes ejercen o se preparan para el ministerio pastoral ordenado.",
      icon: "Users",
    },
    {
      id: "lideres",
      title: "Líderes y diáconos",
      description: "Servidores con responsabilidad de guía y enseñanza en la congregación.",
      icon: "GraduationCap",
    },
    {
      id: "hermanos",
      title: "Hermanos(as) en la fe",
      description: "Personas comprometidas con el servicio que buscan una base bíblica sólida.",
      icon: "BookOpen",
    },
    {
      id: "vocacion",
      title: "Nuevos creyentes con llamado ministerial",
      description: "Quienes discernen un llamado al servicio y desean una ruta seria de preparación.",
      icon: "Heart",
    },
  ],
  requirements: [
    {
      id: "req-1",
      title: "Antecedentes personales",
      description:
        "Mayor de 18 años, identificación vigente y datos de contacto actualizados para el seguimiento pastoral.",
    },
    {
      id: "req-2",
      title: "Respaldo pastoral",
      description:
        "Carta o recomendación de su pastor(a) o líder espiritual, cuando corresponda al perfil del postulante.",
    },
    {
      id: "req-3",
      title: "Disponibilidad para estudiar",
      description:
        "Compromiso con el ritmo formativo del programa: clases en vivo, material formativo y evaluaciones.",
    },
    {
      id: "req-4",
      title: "Compromiso con el programa",
      description:
        "Vocación al servicio cristiano y disposición a completar la ruta académica de su generación.",
    },
  ],
  calendar: {
    applicationsOpen: "1 de junio 2026",
    applicationsClose: "31 de agosto 2026",
    classesStart: "10 de marzo 2026",
    note: "Las fechas pueden variar por generación. Tras postular, admisiones confirmará el calendario de su cohorte.",
  },
  fees: [
    { id: "matricula", label: "Matrícula de ingreso", value: "$20.000", note: "Pago único al formalizar admisión" },
    { id: "cuota", label: "Cuota semestral", value: "Desde $100.000", note: "4 cuotas semestrales según programa" },
    { id: "mensual", label: "Referencia mensual", value: "Desde $15.000", note: "Orientativo; confirmar con admisiones" },
  ],
  feesNote:
    "Aranceles oficiales del SEM. El equipo de admisiones orienta sobre medios de pago. El portal no procesa pagos.",
  scholarships: [
    {
      id: "s1",
      kind: "scholarship",
      title: "Becas de mérito",
      description: "Apoyo parcial para estudiantes destacados en su proceso formativo.",
    },
    {
      id: "s2",
      kind: "discount",
      title: "Beneficios pastorales",
      description: "Opciones de apoyo para ministros y líderes según convocatoria vigente.",
    },
    {
      id: "s3",
      kind: "agreement",
      title: "Convenios institucionales",
      description: "Acuerdos con iglesias y organizaciones aliadas de IPN Chile.",
    },
  ],
  scholarshipsDescription:
    "Consulta con admisiones las becas y beneficios disponibles para tu generación. La asignación se gestiona en AprendeHoy tras la evaluación de tu postulación.",
  faq: [
    {
      id: "af1",
      question: "¿El portal gestiona mi matrícula o pagos?",
      answer:
        "No. El portal recibe tu postulación y crea un registro de interés. Todo el proceso académico, contratos y pagos se gestiona en AprendeHoy Learning OS.",
    },
    {
      id: "af2",
      question: "¿Qué ocurre después de enviar el formulario?",
      answer:
        "Nuestro equipo de admisiones revisará tus antecedentes y se pondrá en contacto contigo para continuar el proceso de evaluación.",
    },
    {
      id: "af3",
      question: "¿Puedo postular si no soy pastor?",
      answer:
        "Sí. Existen programas para pastores, líderes, hermanos(as) y quienes discernen un llamado ministerial. Revisa el perfil del postulante y el programa de tu generación.",
    },
    {
      id: "af4",
      question: "¿Debo subir documentos en esta etapa?",
      answer:
        "No en esta fase. El formulario captura tu interés. Más adelante admisiones solicitará la documentación requerida.",
    },
    {
      id: "af5",
      question: "¿La formación es 100% online?",
      answer:
        "Sí. Modalidad completamente en línea con clases en vivo, campus virtual y acompañamiento docente.",
    },
  ],
  documents: [
    {
      id: "doc-1",
      title: "Cédula de identidad",
      description: "Copia vigente del documento de identidad del postulante.",
      required: true,
    },
    {
      id: "doc-2",
      title: "Carta pastoral",
      description: "Recomendación del pastor o líder espiritual, cuando aplique.",
      required: true,
    },
    {
      id: "doc-3",
      title: "Certificado de estudios",
      description: "Último certificado de educación formal cursada.",
      required: true,
    },
    {
      id: "doc-4",
      title: "Fotografía tipo carnet",
      description: "Para expediente institucional.",
      required: false,
    },
  ],
  processSteps: [
    {
      id: "ps-1",
      step: 1,
      title: "Explora el programa",
      description: "Conoce los programas formativos, el perfil del seminarista y la modalidad de estudio.",
      status: "completed",
    },
    {
      id: "ps-2",
      step: 2,
      title: "Revisa los requisitos",
      description: "Verifica que cumples los requisitos académicos, pastorales y de compromiso formativo.",
      status: "active",
    },
    {
      id: "ps-3",
      step: 3,
      title: "Completa tu postulación",
      description: "Envía el formulario con tus datos. El portal registrará tu interés como postulante.",
      status: "upcoming",
    },
    {
      id: "ps-4",
      step: 4,
      title: "Nuestro equipo revisará tu solicitud",
      description: "Admisiones evaluará tu postulación en AprendeHoy Learning OS.",
      status: "upcoming",
    },
    {
      id: "ps-5",
      step: 5,
      title: "Nos pondremos en contacto contigo",
      description: "Recibirás orientación para los siguientes pasos. Aquí termina la misión del portal.",
      status: "upcoming",
    },
  ],
  formTitle: "Formulario de postulación",
  formDescription:
    "Completa tus datos para manifestar tu interés. No es necesario adjuntar documentos en esta etapa.",
  formFields: DEFAULT_FORM_FIELDS,
  formSubmitLabel: "Enviar postulación",
  formFooterNote:
    "Al enviar, el portal registrará tu interés como postulante. No gestionamos matrículas ni pagos en esta etapa.",
  formGlobalError: "No pudimos enviar tu postulación. Intenta nuevamente.",
  formConnectionError: "Error de conexión. Verifica tu red e intenta de nuevo.",
  sections: DEFAULT_ADMISSION_SECTIONS,
  sectionLayouts: {
    programs: {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      muted: true,
    },
    why_study: {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      title: "¿Por qué estudiar en el SEM?",
      description:
        "Somos una institución de formación ministerial con respaldo de IPN Chile, modalidad 100% online y acompañamiento docente y pastoral. No somos una plataforma de cursos: formamos siervos para la Iglesia.",
    },
    profiles: {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      title: "¿Quién puede postular?",
      description:
        "Nuestros programas formativos están orientados a personas con vocación al servicio cristiano que deseen profundizar en las Escrituras.",
      muted: true,
    },
    requirements: {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      badge: "Requisitos",
      title: "¿Qué necesitas para postular?",
      description:
        "Requisitos reales del SEM. El equipo de admisiones confirmará tu elegibilidad tras recibir tu solicitud.",
    },
    dates: {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      badge: "Calendario",
      title: "Fechas importantes",
      description:
        "Las fechas pueden variar por generación. Tras postular, admisiones confirmará el calendario de su cohorte.",
      muted: true,
    },
    documents: {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      badge: "Documentación",
      title: "Documentos requeridos",
      description:
        "Listado informativo. No es necesario adjuntar archivos en esta etapa del portal.",
    },
    timeline: {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      badge: "Proceso",
      title: "Tu camino de postulación",
      description:
        "El portal te acompaña hasta que manifiestas tu interés. A partir de ahí, admisiones continúa en AprendeHoy Learning OS.",
      muted: true,
    },
    fees: {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      badge: "Aranceles",
      title: "Información oficial de costos",
      description: "Valores de referencia del SEM. El portal no procesa pagos.",
    },
    scholarships: {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      badge: "Becas y beneficios",
      title: "Opciones de apoyo formativo",
    },
    form: {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      badge: "Postulación",
    },
    faq: {
      ...DEFAULT_CMS_SECTION_LAYOUT,
      badge: "Preguntas frecuentes",
      title: "Resolvemos tus dudas",
      description: "Información sobre el proceso de postulación en el portal institucional.",
    },
  },
  sectionSeo: {
    hero: { anchor: "centro-admision" },
    programs: { anchor: "programas-admision" },
    why_study: { anchor: "introduccion" },
    profiles: { anchor: "perfil-postulante" },
    requirements: { anchor: "requisitos" },
    dates: { anchor: "calendario" },
    documents: { anchor: "documentacion" },
    timeline: { anchor: "proceso-postulacion" },
    fees: { anchor: "aranceles" },
    scholarships: { anchor: "becas" },
    form: { anchor: "postulacion" },
    faq: { anchor: "preguntas-frecuentes" },
  },
  successContent: {
    title: "¡Gracias por postular!",
    lead: "Hemos recibido correctamente tu solicitud.",
    body:
      "Nuestro equipo de admisiones revisará tus antecedentes y se pondrá en contacto contigo para continuar el proceso.",
    invitation:
      "Mientras tanto te invitamos a conocer nuestra comunidad, revisar la biblioteca y mantenerte informado a través de nuestras noticias.",
    links: [
      { label: "Programas formativos", href: "/programas" },
      { label: "Biblioteca institucional", href: "/biblioteca" },
      { label: "Noticias", href: "/noticias" },
      { label: "Equipo docente", href: "/equipo" },
    ],
    ctaTitle: "¿Tienes preguntas?",
    ctaLinks: [
      { label: "Contacto", href: "/contacto" },
      { label: "Programas", href: "/programas" },
    ],
  },
  publishStatus: "published",
  versions: [],
  closing: DEFAULT_ADMISSION_CLOSING,
};

export const ADMISSION_SUCCESS_CONTENT = DEFAULT_ADMISSION_CONFIG.successContent!;
