export type Tone = "ink" | "sand" | "hot";

export type CardItem = {
  title: string;
  description: string;
  href: string;
  icon: string;
  tone: Tone;
};

/** Número internacional sin +. Vacío hasta confirmar el WhatsApp del equipo. */
export const whatsappNumber = "";

export const tagline = "Cumplimiento empresarial bajo control.";

export const tesis =
  "Mentor Cumple le entrega una visión clara del estado de su empresa y le ayuda a implementar y mantener todo bajo control.";

export const soluciones: CardItem[] = [
  {
    title: "Ley Karin",
    description: "Protocolos, procedimientos y capacitaciones.",
    href: "/materias/ley-karin",
    icon: "shield",
    tone: "ink",
  },
  {
    title: "Seguridad y Salud en el Trabajo",
    description: "DS 44, gestión preventiva, riesgos y evidencias.",
    href: "/materias/seguridad-salud-trabajo",
    icon: "clipboard",
    tone: "sand",
  },
  {
    title: "Laboral y RR.HH.",
    description: "Contratos, registros, jornada, obligaciones y vencimientos.",
    href: "/materias/laboral-rrhh",
    icon: "users",
    tone: "hot",
  },
  {
    title: "Protección de datos",
    description: "Políticas, tratamientos y controles.",
    href: "/materias/proteccion-datos",
    icon: "folder",
    tone: "ink",
  },
  {
    title: "Inclusión laboral",
    description: "Obligaciones y documentación.",
    href: "/materias/inclusion-laboral",
    icon: "users",
    tone: "sand",
  },
  {
    title: "Contratistas y terceros",
    description: "Documentos, requisitos y control.",
    href: "/materias/contratistas-terceros",
    icon: "briefcase",
    tone: "hot",
  },
];

export const informacion: CardItem[] = [
  {
    title: "Ley Karin",
    description: "Prevención, investigación y el respaldo de cada caso.",
    href: "/materias/ley-karin",
    icon: "shield",
    tone: "ink",
  },
  {
    title: "DS 44 / SST",
    description: "Seguridad y salud en el trabajo, medidas y evidencias.",
    href: "/materias/seguridad-salud-trabajo",
    icon: "clipboard",
    tone: "sand",
  },
  {
    title: "Laboral y RR.HH.",
    description: "Contratos, jornada y obligaciones del día a día.",
    href: "/materias/laboral-rrhh",
    icon: "users",
    tone: "hot",
  },
  {
    title: "Protección de datos",
    description: "Políticas, tratamientos y controles.",
    href: "/materias/proteccion-datos",
    icon: "folder",
    tone: "ink",
  },
  {
    title: "Inclusión laboral",
    description: "Ley 21.015: cuotas, registro y documentación de inclusión.",
    href: "/materias/inclusion-laboral",
    icon: "users",
    tone: "sand",
  },
  {
    title: "Contratistas y terceros",
    description: "Subcontratación, documentos exigibles y control de terceros.",
    href: "/materias/contratistas-terceros",
    icon: "briefcase",
    tone: "hot",
  },
];

export const recursos: CardItem[] = [
  {
    title: "Cómo funciona",
    description: "Diagnóstico, plan, implementación y control permanente.",
    href: "/como-funciona",
    icon: "clipboard",
    tone: "sand",
  },
  {
    title: "Preguntas frecuentes",
    description: "Alcance, plazos y qué pasa cuando una ley se actualiza.",
    href: "/preguntas-frecuentes",
    icon: "help",
    tone: "hot",
  },
  {
    title: "Evaluar mi empresa",
    description: "Responda unas preguntas y reciba un diagnóstico preliminar.",
    href: "/evaluar",
    icon: "check",
    tone: "ink",
  },
];

export type MenuEntry =
  | { id: string; label: string; href: string }
  | { id: string; label: string; items: readonly CardItem[] };

export const menus: readonly MenuEntry[] = [
  { id: "inicio", label: "Inicio", href: "/" },
  { id: "soluciones", label: "Soluciones", items: soluciones },
  { id: "informacion", label: "Información", items: informacion },
  { id: "recursos", label: "Recursos", items: recursos },
  { id: "nosotros", label: "Nosotros", href: "/nosotros" },
  { id: "contacto", label: "Contacto", href: "/contacto" },
];

/** Alias para el formulario de diagnóstico (tipo de organización). */
export const organizaciones: CardItem[] = [
  {
    title: "PYMES",
    description: "Método y claridad, sin exigir un área interna de gran tamaño.",
    href: "#pymes",
    icon: "store",
    tone: "hot",
  },
  {
    title: "Empresas",
    description: "Varias áreas y responsables, reunidos en un solo estado.",
    href: "#empresas",
    icon: "building",
    tone: "ink",
  },
  {
    title: "Instituciones",
    description: "Trazabilidad, orden documental y evidencia.",
    href: "#instituciones",
    icon: "landmark",
    tone: "sand",
  },
  {
    title: "Varios centros",
    description: "Estado, responsable y documentación por unidad.",
    href: "#centros",
    icon: "users",
    tone: "ink",
  },
];

export const valorHero = [
  { title: "Diagnóstico claro", icon: "search" },
  { title: "Implementación práctica", icon: "clipboard" },
  { title: "Plataforma de gestión", icon: "layers" },
  { title: "Acompañamiento experto", icon: "users" },
] as const;

export const estadoHero = [
  { value: "26", label: "obligaciones al día", tone: "text-[#15803d]", dot: "bg-[#16a34a]" },
  { value: "7", label: "requieren revisión", tone: "text-[#b45309]", dot: "bg-[#f59e0b]" },
  { value: "3", label: "requieren atención prioritaria", tone: "text-[#c2410c]", dot: "bg-[#ef4444]" },
  { value: "4", label: "próximos vencimientos", tone: "text-[#2563eb]", dot: "bg-[#3d6bff]" },
] as const;

export const stats = [
  {
    value: "4.818",
    label: "Fiscalizaciones relacionadas con Ley Karin",
    note: "Ago 2024 – jun 2025",
  },
  {
    value: "2.231",
    label: "Terminaron con al menos una multa",
    note: "Mismo período",
  },
  {
    value: "$5.799",
    label: "Millones en multas iniciales por Ley Karin",
    note: "Dirección del Trabajo",
  },
  {
    value: "380.380",
    label: "Fiscalizaciones laborales en total, con 112.443 multas",
    note: "2022 – 2023",
  },
];

export const problemas = [
  "Tengo protocolos, pero son anteriores a los cambios normativos.",
  "Creíamos que estábamos cumpliendo hasta que llegó una fiscalización.",
  "La información está repartida entre RR.HH., prevención y administración.",
  "Tenemos los documentos, pero no podemos demostrar fácilmente que implementamos las medidas.",
] as const;

export const pasos = [
  {
    step: "01",
    title: "Diagnóstico",
    description: "Revisamos qué aplica a su empresa y detectamos brechas.",
  },
  {
    step: "02",
    title: "Plan de acción",
    description: "Priorizamos y definimos lo que se debe implementar o actualizar.",
  },
  {
    step: "03",
    title: "Implementación",
    description: "Desarrollamos y activamos protocolos, procedimientos y documentación.",
  },
  {
    step: "04",
    title: "Control permanente",
    description: "Plataforma, alertas, responsables y evidencias siempre disponibles.",
  },
];

export const beneficios = [
  { title: "Menor riesgo de multas", icon: "shield" },
  { title: "Cumplimiento demostrable", icon: "check" },
  { title: "Procesos organizados y responsables claros", icon: "users" },
  { title: "Más tiempo de su negocio", icon: "chart" },
] as const;

export const obligacionesArea = [
  { title: "Ley Karin", value: 82 },
  { title: "SST – DS 44", value: 85 },
  { title: "Laboral y RR.HH.", value: 80 },
  { title: "Protección de datos", value: 74 },
  { title: "Contratistas", value: 70 },
] as const;

export const confian = [
  "EMPRESA",
  "GRUPO ANDES",
  "SALUDVITA",
  "COLEGIO DEL VALLE",
  "CONSTRUCTORA NORTE",
  "SERVICIOS INTEGRADOS",
] as const;

export type PreguntaLink = { label: string; href: string };

export type Pregunta = {
  q: string;
  a: string;
  /** Enlaces internos opcionales que acompañan la respuesta en la página de preguntas frecuentes. */
  links?: readonly PreguntaLink[];
};

export const preguntas: Pregunta[] = [
  {
    q: "¿Qué hace Mentor Cumple?",
    a: "Identifica sus obligaciones, detecta brechas y le ayuda a implementar, documentar y demostrar su cumplimiento. Reúne consultoría, plataforma y acompañamiento. No promete ausencia de sanciones.",
    links: [{ label: "Cómo funciona", href: "/como-funciona" }],
  },
  {
    q: "¿Qué normativas cubre?",
    a: "Ley Karin, seguridad y salud en el trabajo (DS 44), laboral y RR.HH., protección de datos, inclusión laboral y contratistas. El alcance se ajusta a la operación de cada empresa.",
    links: [
      { label: "Ley Karin", href: "/materias/ley-karin" },
      { label: "Seguridad y Salud en el Trabajo", href: "/materias/seguridad-salud-trabajo" },
      { label: "Protección de datos", href: "/materias/proteccion-datos" },
    ],
  },
  {
    q: "¿Sirve si la organización es pequeña?",
    a: "Sí. Parte por lo esencial, sin exigir un área legal completa. Después puede sumar la implementación y un control permanente.",
    links: [{ label: "Evaluar mi empresa", href: "/evaluar" }],
  },
  {
    q: "¿Qué ocurre cuando la norma cambia?",
    a: "Se actualizan la obligación, la tarea y la evidencia. El control no queda pegado a una versión anterior de la ley.",
  },
  {
    q: "¿Cuánto demora el diagnóstico?",
    a: "El plazo depende del tamaño de la organización, de la cantidad de centros de trabajo y de la documentación disponible. Tras la solicitud, el equipo revisa el caso y confirma los tiempos antes de comenzar.",
    links: [{ label: "Solicitar el diagnóstico", href: "/evaluar" }],
  },
  {
    q: "¿Mentor Cumple reemplaza a un abogado o a un prevencionista?",
    a: "No. La información del sitio es orientativa y no sustituye asesoría legal formal. Mentor Cumple ordena obligaciones, responsables y evidencia para que el trabajo de esos profesionales quede respaldado y se mantenga al día.",
  },
  {
    q: "¿Garantiza que no habrá multas ni sanciones?",
    a: "No. Ninguna herramienta puede garantizar ese resultado, porque las decisiones de fiscalización corresponden a la autoridad. Lo que sí entrega es un estado claro de las obligaciones y la evidencia de las medidas adoptadas.",
    links: [{ label: "Cómo funciona", href: "/como-funciona" }],
  },
  {
    q: "¿Qué ocurre después del diagnóstico?",
    a: "La organización recibe un plan priorizado. Puede implementarlo con acompañamiento del equipo o por cuenta propia, y mantener el control en la plataforma con alertas, responsables y evidencias.",
    links: [
      { label: "Cómo funciona", href: "/como-funciona" },
      { label: "Laboral y RR.HH.", href: "/materias/laboral-rrhh" },
    ],
  },
];
export const normas = ["Ley Karin", "DS 44", "Dirección del Trabajo", "Protocolos", "Matriz de riesgos", "Jornada laboral"];
