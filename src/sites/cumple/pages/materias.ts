import type { MateriaContent, OfficialSource } from "./types";

/** URLs y nombres alineados con las fichas de `../norma.ts`. */
const BCN = {
  codigoTrabajo: {
    nombre: "Código del Trabajo, texto refundido en Ley Chile. Biblioteca del Congreso Nacional.",
    url: "https://www.bcn.cl/leychile/navegar?idNorma=207436",
  },
  decreto44: {
    nombre:
      "Decreto 44, de 27 de julio de 2024, Ministerio del Trabajo y Previsión Social. Ley Chile, Biblioteca del Congreso Nacional.",
    url: "https://www.bcn.cl/leychile/navegar?idNorma=1205298",
  },
  ley16744: {
    nombre: "Ley 16.744, accidentes del trabajo y enfermedades profesionales. Ley Chile, Biblioteca del Congreso Nacional.",
    url: "https://www.bcn.cl/leychile/navegar?idNorma=28650",
  },
  leyKarin: {
    nombre: "Ley 21.643, Ley Karin. Ley Chile, Biblioteca del Congreso Nacional.",
    url: "https://www.bcn.cl/leychile/navegar?idNorma=1200096",
  },
  ley19628: {
    nombre: "Ley 19.628, protección de la vida privada. Ley Chile, Biblioteca del Congreso Nacional.",
    url: "https://www.bcn.cl/leychile/navegar?idNorma=141599",
  },
  ley21015: {
    nombre: "Ley 21.015, inclusión laboral. Ley Chile, Biblioteca del Congreso Nacional.",
    url: "https://www.bcn.cl/leychile/navegar?idNorma=1103997",
  },
  ley20123: {
    nombre: "Ley 20.123, subcontratación. Ley Chile, Biblioteca del Congreso Nacional.",
    url: "https://www.bcn.cl/leychile/navegar?idNorma=254080",
  },
} satisfies Record<string, OfficialSource>;

const DISCLAIMER =
  "Esta página ofrece información orientativa con base en fuentes oficiales. No sustituye asesoría legal formal ni determina el estado de cumplimiento de una organización concreta.";

const CUMPLE_METODO =
  "El método de Mentor Cumple sigue cuatro etapas: diagnóstico, plan, implementación y control.";

export const materias: readonly MateriaContent[] = [
  {
    slug: "ley-karin",
    path: "/materias/ley-karin",
    eyebrow: "Información · Cumplimiento",
    titleName: "Ley Karin",
    normRef: "Ley 21.643",
    lead:
      "La Ley 21.643 (Ley Karin) obliga a la organización a prevenir, investigar y resguardar frente al acoso laboral, el acoso sexual y la violencia en el trabajo. Esta ficha resume el marco en lenguaje ejecutivo y muestra cómo Mentor Cumple ayuda a ordenar esas obligaciones y demostrarlas.",
    disclaimer: DISCLAIMER,
    concepts: {
      heading: "Qué conceptos considera la Ley Karin",
      items: [
        {
          title: "Acoso laboral",
          body: "Conductas de agresión o hostigamiento en el trabajo que el marco de la Ley Karin incorpora al régimen de prevención, investigación y sanción. El detalle de tipificación debe leerse en el texto oficial.",
          icon: "users",
          tone: "sand",
        },
        {
          title: "Acoso sexual",
          body: "Requerimientos de carácter sexual no consentidos que afectan la dignidad o las oportunidades laborales. La ley refuerza la obligación de prevenir e investigar estos hechos con resguardos.",
          icon: "shield",
          tone: "ink",
        },
        {
          title: "Violencia en el trabajo",
          body: "Hechos de violencia en el contexto laboral, incluidos los que pueden involucrar a terceros ajenos a la relación laboral directa. La organización debe prever cómo actuar y documentar.",
          icon: "briefcase",
          tone: "hot",
        },
      ],
    },
    checklist: {
      heading: "Qué debería poder mostrar la organización",
      intro:
        "Lista orientativa de evidencias típicas frente al marco descrito. No sustituye un diagnóstico ni fija el estándar de una fiscalización concreta.",
      items: [
        "Protocolo de prevención vigente y comunicado a quienes corresponde.",
        "Procedimiento de investigación definido, con pasos y responsables claros.",
        "Medidas de resguardo previstas y aplicables cuando un caso lo exige.",
        "Registros que permitan demostrar qué se hizo, quién respondió y cuándo.",
      ],
    },
    exige: {
      heading: "Qué exige el marco a la organización",
      paragraphs: [
        "Según la ficha de Ley Chile de la Biblioteca del Congreso Nacional, la Ley 21.643 fue publicada el 15 de enero de 2024 y rige desde el 1 de agosto de 2024. Modifica el Código del Trabajo en materia de prevención, investigación y sanción del acoso laboral, el acoso sexual y la violencia en el trabajo.",
        "En la práctica, el marco exige a la organización contar con un protocolo de prevención, un procedimiento de investigación y medidas de resguardo. Esas piezas deben ser operativas: no basta con archivar un documento sin uso.",
        "El detalle de artículos, plazos específicos de un procedimiento concreto y sanciones debe revisarse directamente en el texto oficial. Esta página no fija montos de multa, porque la ficha oficial consultada no los incluye.",
      ],
      citations: [
        {
          label: BCN.leyKarin.nombre,
          url: BCN.leyKarin.url,
          anchor: "la ficha de Ley Chile de la Biblioteca del Congreso Nacional",
        },
      ],
    },
    implica: {
      heading: "Qué implica para la empresa",
      paragraphs: [
        "Un protocolo que solo existe como documento no responde a lo que la norma describe. La organización debe poder mostrar que el protocolo se conoce, que el procedimiento de investigación está definido y que las medidas de resguardo se aplican cuando corresponde.",
        "Sin responsables claros, sin registros y sin un procedimiento operativo, la empresa queda expuesta en la gestión de cada caso y ante una eventual fiscalización. El costo del desorden aparece cuando hay que actuar con plazos, evidencia y coherencia.",
        "Ordenar Ley Karin también conecta con otras materias de cumplimiento (por ejemplo seguridad y salud en el trabajo). El alcance exacto depende de la operación de cada organización.",
      ],
    },
    cumple: {
      heading: "Cómo lo ordena Mentor Cumple",
      paragraphs: [
        CUMPLE_METODO,
        "El diagnóstico identifica brechas frente a lo que la norma describe. El plan prioriza acciones y responsables. La implementación activa el protocolo, el procedimiento de investigación y los registros. El control permanente mantiene plazos, responsables y evidencia a disposición de la organización.",
      ],
    },
    sources: [BCN.leyKarin],
    relatedPaths: ["/materias/seguridad-salud-trabajo", "/como-funciona", "/preguntas-frecuentes", "/evaluar"],
  },
  {
    slug: "seguridad-salud-trabajo",
    path: "/materias/seguridad-salud-trabajo",
    eyebrow: "Información · Cumplimiento",
    titleName: "Seguridad y salud en el trabajo",
    normRef: "Ley 16.744 · Decreto 44",
    lead: "La Ley 16.744 y el Decreto 44 ordenan la gestión de los riesgos laborales, incluidos los psicosociales. Mentor Cumple ayuda a transformar esas exigencias en una matriz, un programa y un control permanentes.",
    disclaimer: DISCLAIMER,
    exige: {
      heading: "Qué exige el marco a la organización",
      paragraphs: [
        "La Ley 16.744 declara obligatorio el seguro social contra riesgos de accidentes del trabajo y enfermedades profesionales. Sobre esa base, el Decreto 44 del Ministerio del Trabajo y Previsión Social, publicado el 27 de julio de 2024, aprueba el reglamento sobre gestión preventiva de los riesgos laborales.",
        "Conforme a ese decreto, el artículo 4 obliga a gestionar los riesgos laborales e implementar una matriz de identificación de peligros y evaluación de riesgos, junto con un programa de gestión. El artículo 7 regula la matriz, y el artículo 8 exige que el programa contenga medidas, plazos y responsables.",
        "El artículo 7 incluye además los riesgos psicosociales entre los factores que la entidad empleadora debe considerar al confeccionar la matriz. La vigencia del decreto se encuentra en su artículo primero transitorio y debe leerse en el texto oficial.",
      ],
      citations: [
        {
          label: BCN.decreto44.nombre,
          url: BCN.decreto44.url,
          anchor: "el Decreto 44 del Ministerio del Trabajo y Previsión Social",
        },
        { label: BCN.ley16744.nombre, url: BCN.ley16744.url, anchor: "La Ley 16.744" },
      ],
    },
    implica: {
      heading: "Qué implica para la empresa",
      paragraphs: [
        "La empresa necesita una matriz actualizada y un programa con medidas, plazos y responsables definidos. Una lista de riesgos sin seguimiento no satisface la estructura que el decreto describe.",
        "Además, la organización debe poder acreditar qué se identificó, quién responde de cada medida y en qué estado se encuentra. Esta página no detalla cotizaciones, porcentajes ni sanciones, porque las fichas oficiales consultadas no los incluyen.",
      ],
    },
    cumple: {
      heading: "Cómo lo ordena Mentor Cumple",
      paragraphs: [
        CUMPLE_METODO,
        "El diagnóstico revisa la matriz y el programa existentes. El plan ordena las brechas por prioridad. La implementación asigna medidas, plazos y responsables, y deja los registros. El control mantiene el programa vigente y la evidencia ordenada para la organización.",
      ],
    },
    sources: [BCN.decreto44, BCN.ley16744],
    relatedPaths: ["/materias/ley-karin", "/materias/contratistas-terceros", "/como-funciona", "/preguntas-frecuentes", "/evaluar"],
  },
  {
    slug: "laboral-rrhh",
    path: "/materias/laboral-rrhh",
    eyebrow: "Información · Cumplimiento",
    titleName: "Laboral y RR.HH.",
    normRef: "Código del Trabajo",
    lead: "El Código del Trabajo fija obligaciones como el reglamento interno y los límites de jornada. Mentor Cumple ayuda a mantenerlas ordenadas, con responsables y evidencia.",
    disclaimer: DISCLAIMER,
    exige: {
      heading: "Qué exige el marco a la organización",
      paragraphs: [
        "El texto refundido del Código del Trabajo, en Ley Chile, establece en su artículo 153 que las empresas que ocupen normalmente diez o más trabajadores permanentes deben confeccionar un reglamento interno de orden, higiene y seguridad.",
        "En materia de jornada, la nota marginal del artículo 22 atribuye su modificación a la Ley 21.561, publicada en el Diario Oficial el 26 de abril de 2023. Ese artículo señala que la jornada ordinaria no excederá de cuarenta horas semanales, y las reglas de aplicación gradual se encuentran en la propia Ley 21.561.",
      ],
      citations: [
        {
          label: BCN.codigoTrabajo.nombre,
          url: BCN.codigoTrabajo.url,
          anchor: "texto refundido del Código del Trabajo, en Ley Chile",
        },
      ],
    },
    implica: {
      heading: "Qué implica para la empresa",
      paragraphs: [
        "La organización debe verificar si alcanza el umbral que exige reglamento interno y mantener ese documento coherente con su realidad operativa. Igualmente, debe confirmar qué tramo de la gradualidad de jornada le corresponde, consultando la Ley 21.561, ya que esta página no declara qué tramo rige en una fecha concreta.",
        "Una jornada mal configurada o un reglamento desactualizado generan riesgo en la relación laboral y en una eventual fiscalización. Esta página no fija montos de multa, porque las fichas oficiales consultadas no los incluyen.",
      ],
    },
    cumple: {
      heading: "Cómo lo ordena Mentor Cumple",
      paragraphs: [
        CUMPLE_METODO,
        "El diagnóstico contrasta el reglamento interno y la organización de la jornada con el texto oficial. El plan define qué corregir primero. La implementación actualiza documentos y prácticas. El control mantiene responsables y evidencia para revisiones periódicas.",
      ],
    },
    sources: [BCN.codigoTrabajo],
    relatedPaths: ["/materias/ley-karin", "/materias/inclusion-laboral", "/como-funciona", "/preguntas-frecuentes", "/evaluar"],
  },
  {
    slug: "proteccion-datos",
    path: "/materias/proteccion-datos",
    eyebrow: "Información · Cumplimiento",
    titleName: "Protección de datos",
    normRef: "Ley 19.628",
    lead: "La Ley 19.628 regula la protección de la vida privada y el tratamiento de datos personales. Mentor Cumple ayuda a ordenar ese tratamiento dentro de la organización.",
    disclaimer: DISCLAIMER,
    exige: {
      heading: "Qué exige el marco a la organización",
      paragraphs: [
        "La Ley 19.628 regula la protección de la vida privada y el tratamiento de datos personales, según su texto en Ley Chile de la Biblioteca del Congreso Nacional.",
        "Toda organización que recoge, almacena o usa datos de personas, por ejemplo de sus trabajadores, postulantes o clientes, realiza tratamiento de datos personales y debe revisar qué le exige esa ley. El alcance exacto debe leerse en el texto oficial; la ficha consultada no describe una ley posterior ni una fecha de reemplazo.",
      ],
      citations: [
        {
          label: BCN.ley19628.nombre,
          url: BCN.ley19628.url,
          anchor: "su texto en Ley Chile de la Biblioteca del Congreso Nacional",
        },
      ],
    },
    implica: {
      heading: "Qué implica para la empresa",
      paragraphs: [
        "La empresa debe saber qué datos personales trata, con qué finalidad y quién los administra. Sin ese mapa, resulta difícil responder consultas o reclamos sobre el tratamiento.",
        "Por ello conviene mantener reglas internas y registros del tratamiento. Esta página no detalla sanciones ni plazos, porque la ficha oficial consultada no los incluye.",
      ],
    },
    cumple: {
      heading: "Cómo lo ordena Mentor Cumple",
      paragraphs: [
        CUMPLE_METODO,
        "El diagnóstico identifica qué datos se tratan y dónde. El plan prioriza ajustes de procesos y documentos. La implementación deja reglas y registros operativos. El control mantiene responsables y evidencia de cómo se aplica el tratamiento.",
      ],
    },
    sources: [BCN.ley19628],
    relatedPaths: ["/materias/laboral-rrhh", "/como-funciona", "/preguntas-frecuentes", "/evaluar"],
  },
  {
    slug: "inclusion-laboral",
    path: "/materias/inclusion-laboral",
    eyebrow: "Información · Cumplimiento",
    titleName: "Inclusión laboral",
    normRef: "Ley 21.015",
    lead: "La Ley 21.015 incorporó al Código del Trabajo la obligación de contratar personas con discapacidad en empresas de cierto tamaño. Mentor Cumple ayuda a verificar la situación de la organización y a mantener la evidencia.",
    disclaimer: DISCLAIMER,
    exige: {
      heading: "Qué exige el marco a la organización",
      paragraphs: [
        "El artículo 157 bis, incorporado por la Ley 21.015, dispone que las empresas de 100 o más trabajadores deberán contratar o mantener contratados al menos el 1% de personas con discapacidad o asignatarias de una pensión de invalidez, en relación con el total de sus trabajadores.",
        "El texto oficial se encuentra en Ley Chile. El detalle del cálculo anual y de las sanciones debe consultarse allí, ya que la ficha consultada no los describe.",
      ],
      citations: [{ label: BCN.ley21015.nombre, url: BCN.ley21015.url, anchor: "Ley Chile" }],
    },
    implica: {
      heading: "Qué implica para la empresa",
      paragraphs: [
        "La empresa debe establecer si su dotación alcanza el umbral de 100 o más trabajadores y, de ser así, cuántas personas en las condiciones que la norma describe mantiene contratadas frente al total.",
        "Para responder a una revisión, la organización necesita contar con información ordenada y actualizada de su dotación. Esta página no entrega montos de multa ni plazos, porque la ficha oficial consultada no los incluye.",
      ],
    },
    cumple: {
      heading: "Cómo lo ordena Mentor Cumple",
      paragraphs: [
        CUMPLE_METODO,
        "El diagnóstico revisa la dotación frente a la regla del artículo 157 bis. El plan define acciones si existe una brecha. La implementación las ejecuta y documenta. El control mantiene actualizada la información de la organización.",
      ],
    },
    sources: [BCN.ley21015, BCN.codigoTrabajo],
    relatedPaths: ["/materias/laboral-rrhh", "/como-funciona", "/preguntas-frecuentes", "/evaluar"],
  },
  {
    slug: "contratistas-terceros",
    path: "/materias/contratistas-terceros",
    eyebrow: "Información · Cumplimiento",
    titleName: "Contratistas y terceros",
    normRef: "Ley 20.123",
    lead: "La Ley 20.123 regula el trabajo en régimen de subcontratación. Mentor Cumple ayuda a ordenar el control de contratistas y la evidencia que la empresa principal necesita.",
    disclaimer: DISCLAIMER,
    exige: {
      heading: "Qué exige el marco a la organización",
      paragraphs: [
        "La Ley 20.123 regula el trabajo en régimen de subcontratación. Dispone que, sin perjuicio de las obligaciones del contratista, la empresa principal debe adoptar medidas para proteger la vida y la salud de todas las personas que laboran en su obra, empresa o faena, cualquiera sea su dependencia, conforme al artículo 66 bis de la Ley 16.744.",
        "Esto significa que la protección no se limita al personal propio: alcanza también a quienes trabajan para contratistas y subcontratistas dentro de la faena de la empresa principal.",
      ],
      citations: [
        { label: BCN.ley20123.nombre, url: BCN.ley20123.url, anchor: "La Ley 20.123" },
        { label: BCN.ley16744.nombre, url: BCN.ley16744.url, anchor: "artículo 66 bis de la Ley 16.744" },
      ],
    },
    implica: {
      heading: "Qué implica para la empresa",
      paragraphs: [
        "La empresa principal necesita saber qué contratistas operan en su faena, qué medidas de protección se adoptaron y quién responde de cada una. Delegar la tarea en el contratista no elimina la obligación propia de la empresa principal.",
        "Por ello conviene contar con registros de coordinación y de verificación. Esta página no fija montos de multa, porque la ficha oficial consultada no los incluye.",
      ],
    },
    cumple: {
      heading: "Cómo lo ordena Mentor Cumple",
      paragraphs: [
        CUMPLE_METODO,
        "El diagnóstico identifica contratistas, faenas y medidas vigentes. El plan prioriza los controles. La implementación define responsables y registros de coordinación. El control mantiene la evidencia a disposición de la empresa principal.",
      ],
    },
    sources: [BCN.ley20123, BCN.ley16744],
    relatedPaths: ["/materias/seguridad-salud-trabajo", "/materias/laboral-rrhh", "/como-funciona", "/preguntas-frecuentes", "/evaluar"],
  },
];

export function getMateria(slug: string): MateriaContent | undefined {
  return materias.find((materia) => materia.slug === slug);
}
