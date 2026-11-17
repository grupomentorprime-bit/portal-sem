import {
  BrandedContact,
  BrandedHome,
  FORMACION_THEME,
} from "@/components/sites/branded/BrandedPublicSite";
import type { CodedPageViewProps } from "@/sites/page-views";

const SERVICES = [
  {
    title: "Capacitación laboral",
    text: "Programas para el puesto de trabajo, con formato y calendario definidos antes de empezar.",
  },
  {
    title: "Formación continua",
    text: "Actualización de equipos que ya están en la operación.",
  },
  {
    title: "Cursos especializados",
    text: "Contenidos acotados a una competencia, no a un catálogo genérico.",
  },
  {
    title: "Desarrollo de competencias",
    text: "Lo que el equipo debe poder hacer al terminar, dicho antes del curso.",
  },
  {
    title: "Programas para empresas e instituciones",
    text: "Diseño según la organización, no solo inscripción abierta.",
  },
] as const;

export function FormacionHome(props: CodedPageViewProps) {
  return (
    <BrandedHome
      {...props}
      theme={FORMACION_THEME}
      intro="Capacitación laboral, formación continua, cursos especializados y desarrollo de competencias para empresas e instituciones."
      services={SERVICES}
    />
  );
}

export function FormacionContact(props: CodedPageViewProps) {
  return <BrandedContact {...props} theme={FORMACION_THEME} />;
}
