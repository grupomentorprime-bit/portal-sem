/**
 * Contenido institucional — bloque ¿Por qué estudiar? (web antigua SEM → Home v2)
 */

export const SEM_INSTITUTIONAL_ABOUT = {
  overline: "Sobre nosotros",
  visionTitle: "Visión",
  vision:
    "Seguir alcanzando la presencia de la Iglesia de Dios en todo el mundo, llevando el Evangelio más allá de nuestras fronteras en cada área geográfica.",
  missionTitle: "Misión",
  mission:
    "Formar hombres y mujeres para el ministerio ordenado, con excelencia académica, profundidad bíblica y acompañamiento pastoral.",
  enrolledValue: "180+",
  enrolledLabel: "matriculados",
} as const;

export const SEM_WHY_STUDY_BANNER = {
  title: "¿Por qué nosotros?",
  description:
    "Nuestro equipo estará encantado de compartir su experiencia sobre el llamado ministerial y la formación online del SEM.",
} as const;

export const SEM_PLATFORM_SHOWCASE = {
  overline: "Experiencia de aprendizaje",
  title: "Formación a tu ritmo pastoral",
  description:
    "Estudia en modalidad 100% online con una experiencia de aprendizaje pensada para tu servicio en la Iglesia y tu crecimiento en la fe.",
  image: "/images/demo/programs/hero-online.jpg",
  imageAlt: "Estudiante del SEM en estudio bíblico",
  features: [
    {
      id: "flexibility",
      title: "Flexibilidad horaria",
      description:
        "Estudia en el horario que más te acomode, desde cualquier lugar, sin dejar de lado tu servicio en la Iglesia.",
      icon: "Clock" as const,
    },
    {
      id: "self-directed",
      title: "Formación autodirigida en la fe",
      description:
        "Asume la responsabilidad de tu crecimiento espiritual con recursos claros, acompañamiento docente y metas de estudio personal.",
      icon: "Compass" as const,
    },
  ],
} as const;
