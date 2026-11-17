import {
  ADL_THEME,
  BrandedContact,
  BrandedHome,
} from "@/components/sites/branded/BrandedPublicSite";
import type { CodedPageViewProps } from "@/sites/page-views";

const SERVICES = [
  {
    title: "Programas de formación",
    text: "Rutas de aprendizaje con un alcance claro para el equipo y para quien conduce el espacio.",
  },
  {
    title: "Acompañamiento docente",
    text: "Criterios, materiales y seguimiento para que cada programa se pueda impartir con el mismo estándar.",
  },
  {
    title: "Gestión del aprendizaje",
    text: "Personas, convocatorias y evidencia de participación en un mismo lugar de trabajo.",
  },
] as const;

export function AdlHome(props: CodedPageViewProps) {
  return (
    <BrandedHome
      {...props}
      theme={ADL_THEME}
      intro="Un espacio de trabajo para formar equipos, ordenar programas y acompañar el aprendizaje de la organización."
      services={SERVICES}
    />
  );
}

export function AdlContact(props: CodedPageViewProps) {
  return <BrandedContact {...props} theme={ADL_THEME} />;
}
