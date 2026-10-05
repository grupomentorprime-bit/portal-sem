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
  islLeyKarin: {
    nombre: "Ley Karin. Instituto de Seguridad Laboral (ISL).",
    url: "https://www.isl.gob.cl/ley-karin/",
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
    mark: ["LEY", "KARIN"],
    markTone: "ink",
    normRef: "Ley 21.643",
    baton: [
      { label: "Prevenir", icon: "prevent" },
      { label: "Investigar", icon: "investigate" },
      { label: "Resguardar", icon: "shelter" },
    ],
    heroAside: {
      heading: "Lo esencial",
      vigenciaLabel: "Vigente desde",
      vigencia: "1 de agosto de 2024",
      dutiesHeading: "Qué debe asegurar la empresa",
      duties: [
        { label: "Prevenir", detail: "Protocolo de prevención operativo", icon: "prevent" },
        { label: "Investigar", detail: "Procedimiento con pasos y responsables", icon: "investigate" },
        { label: "Resguardar", detail: "Medidas aplicables cuando un caso lo exige", icon: "shelter" },
      ],
      source: BCN.leyKarin,
      sourceLabel: "Texto oficial en Ley Chile",
    },
    lead:
      "La Ley 21.643 (Ley Karin) obliga a la organización a prevenir, investigar y resguardar frente al acoso laboral, el acoso sexual y la violencia en el trabajo. Esta ficha resume el marco en lenguaje ejecutivo y muestra cómo Mentor Cumple ayuda a ordenar esas obligaciones y demostrarlas.",
    disclaimer: DISCLAIMER,
    concepts: {
      heading: "Qué conceptos considera la Ley Karin",
      items: [
        {
          title: "Acoso laboral",
          body: "Agresión u hostigamiento —una vez o reiterado— que cause menoscabo, maltrato o humillación, o perjudique la situación laboral. La organización debe prevenirlo, investigarlo y aplicar resguardos.",
          icon: "hostility",
          tone: "sand",
        },
        {
          title: "Acoso sexual",
          body: "Requerimientos de carácter sexual no consentidos que amenacen o perjudiquen la situación laboral u oportunidades de empleo. Exige el mismo régimen de prevención, investigación y resguardo.",
          icon: "boundary",
          tone: "ink",
        },
        {
          title: "Violencia en el trabajo",
          body: "Violencia ejercida por terceros ajenos a la relación laboral —clientes, proveedores o usuarios— con ocasión del servicio. La entidad empleadora debe prever protección y documentar su actuación.",
          icon: "workplace-alert",
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
        "En la práctica, el marco exige a la organización contar con un protocolo de prevención, un procedimiento de investigación y medidas de resguardo frente a esos tres fenómenos. Esas piezas deben ser operativas: no basta con archivar un documento sin uso.",
        "El Instituto de Seguridad Laboral publica una guía orientativa sobre estos fenómenos y el rol de la entidad empleadora. El detalle de artículos, plazos de un procedimiento concreto y sanciones debe revisarse en el texto oficial. Esta página no fija montos de multa.",
      ],
      citations: [
        {
          label: BCN.leyKarin.nombre,
          url: BCN.leyKarin.url,
          anchor: "la ficha de Ley Chile de la Biblioteca del Congreso Nacional",
        },
        {
          label: BCN.islLeyKarin.nombre,
          url: BCN.islLeyKarin.url,
          anchor: "El Instituto de Seguridad Laboral",
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
    implicaPoints: {
      heading: "Qué implica para la empresa",
      items: [
        {
          title: "Documento no basta",
          body: "Un protocolo archivado no responde al marco. Debe conocerse, aplicarse y poder demostrarse junto con el procedimiento de investigación y los resguardos.",
        },
        {
          title: "Exposición operativa",
          body: "Sin responsables, registros ni procedimiento claro, la organización queda débil ante cada caso y ante una eventual fiscalización. El costo aparece cuando hay plazos y evidencia.",
        },
        {
          title: "Encaje con otras materias",
          body: "Ordenar Ley Karin suele conectar con seguridad y salud en el trabajo y otras obligaciones. El alcance exacto depende de la operación de cada organización.",
        },
      ],
    },
    processSteps: {
      heading: "Cómo lo ordena Mentor Cumple",
      intro: "El método sigue cuatro etapas para pasar del marco a evidencia usable.",
      items: [
        {
          title: "Diagnóstico",
          body: "Identifica brechas frente a lo que la norma describe: protocolo, procedimiento, resguardos y registros.",
        },
        {
          title: "Plan",
          body: "Prioriza acciones y responsables para cerrar lo crítico primero, con orden y plazos.",
        },
        {
          title: "Implementación",
          body: "Activa el protocolo, el procedimiento de investigación y los registros que la organización necesita.",
        },
        {
          title: "Control",
          body: "Mantiene vigentes plazos, responsables y evidencia a disposición cuando se requiera.",
        },
      ],
    },
    cumple: {
      heading: "Cómo lo ordena Mentor Cumple",
      paragraphs: [
        CUMPLE_METODO,
        "El diagnóstico identifica brechas frente a lo que la norma describe. El plan prioriza acciones y responsables. La implementación activa el protocolo, el procedimiento de investigación y los registros. El control permanente mantiene plazos, responsables y evidencia a disposición de la organización.",
      ],
    },
    sources: [BCN.leyKarin, BCN.islLeyKarin],
    relatedPaths: ["/materias/seguridad-salud-trabajo", "/como-funciona", "/preguntas-frecuentes", "/evaluar"],
  },
  {
    slug: "seguridad-salud-trabajo",
    path: "/materias/seguridad-salud-trabajo",
    eyebrow: "Información · Cumplimiento",
    titleName: "Seguridad y salud en el trabajo",
    mark: ["SST"],
    markTone: "sand",
    normRef: "DS 44 · Ley 16.744",
    baton: [
      { label: "Matriz", icon: "layers" },
      { label: "Programa", icon: "clipboard" },
      { label: "Control", icon: "chart" },
    ],
    heroAside: {
      heading: "Lo esencial",
      vigenciaLabel: "Publicado",
      vigencia: "27 de julio de 2024 · vigencia art. 1° transitorio",
      dutiesHeading: "Qué debe asegurar la empresa",
      duties: [
        { label: "Matriz", detail: "Identificación de peligros y evaluación de riesgos", icon: "layers" },
        { label: "Programa", detail: "Medidas, plazos y responsables definidos", icon: "clipboard" },
        { label: "Control", detail: "Seguimiento y evidencia disponibles", icon: "chart" },
      ],
      source: BCN.decreto44,
      sourceLabel: "Texto oficial del Decreto 44",
    },
    lead:
      "La Ley 16.744 y el Decreto 44 ordenan la gestión preventiva de los riesgos laborales, incluidos los psicosociales. Esta ficha resume el marco en lenguaje ejecutivo y muestra cómo Mentor Cumple ayuda a pasar de la norma a una matriz, un programa y un control demostrables.",
    disclaimer: DISCLAIMER,
    concepts: {
      heading: "Qué piezas ordena el marco SST",
      items: [
        {
          title: "Matriz de riesgos",
          body: "Identificación de peligros y evaluación de riesgos que la entidad empleadora debe implementar junto con la gestión preventiva. Es la base para priorizar y documentar qué se controla en la operación.",
          icon: "layers",
          tone: "sand",
        },
        {
          title: "Programa de gestión",
          body: "Conjunto de medidas con plazos y responsables. Una matriz sin programa no cierra el ciclo que describe el Decreto 44: hay que definir qué se hace, quién responde y cuándo.",
          icon: "clipboard",
          tone: "ink",
        },
        {
          title: "Riesgos psicosociales",
          body: "Factor que la entidad empleadora debe considerar al confeccionar la matriz. Conecta la gestión SST con otras materias de cumplimiento, incluida la prevención de acoso y violencia.",
          icon: "users",
          tone: "hot",
        },
      ],
    },
    checklist: {
      heading: "Qué debería poder mostrar la organización",
      intro:
        "Lista orientativa de evidencias típicas frente al marco descrito. No sustituye un diagnóstico ni fija el estándar de una fiscalización concreta.",
      items: [
        "Matriz de identificación de peligros y evaluación de riesgos vigente y conocida por quienes corresponde.",
        "Programa de gestión con medidas, plazos y responsables definidos.",
        "Seguimiento que permita ver el estado de cada medida y quién responde.",
        "Registros que acrediten qué se identificó, qué se hizo y cuándo.",
      ],
    },
    exige: {
      heading: "Qué exige el marco a la organización",
      paragraphs: [
        "La Ley 16.744 declara obligatorio el seguro social contra riesgos de accidentes del trabajo y enfermedades profesionales. Sobre esa base, el Decreto 44 del Ministerio del Trabajo y Previsión Social, publicado el 27 de julio de 2024, aprueba el reglamento sobre gestión preventiva de los riesgos laborales.",
        "Conforme a ese decreto, el artículo 4 obliga a gestionar los riesgos laborales e implementar una matriz de identificación de peligros y evaluación de riesgos, junto con un programa de gestión. El artículo 7 regula la matriz, y el artículo 8 exige que el programa contenga medidas, plazos y responsables.",
        "El artículo 7 incluye además los riesgos psicosociales entre los factores que la entidad empleadora debe considerar al confeccionar la matriz. La vigencia del decreto se encuentra en su artículo primero transitorio y debe leerse en el texto oficial. Esta página no detalla cotizaciones, porcentajes ni sanciones.",
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
    implicaPoints: {
      heading: "Qué implica para la empresa",
      items: [
        {
          title: "Lista no basta",
          body: "Una matriz archivada sin programa ni seguimiento no responde al marco. Debe actualizarse, aplicarse y poder demostrarse con medidas y responsables.",
        },
        {
          title: "Evidencia operativa",
          body: "Sin plazos, responsables ni registros, la empresa queda débil ante una revisión. El costo aparece cuando hay que mostrar qué se hizo y cuándo.",
        },
        {
          title: "Encaje con otras materias",
          body: "Los riesgos psicosociales y el control de contratistas suelen conectar SST con Ley Karin y otras obligaciones. El alcance exacto depende de la operación.",
        },
      ],
    },
    processSteps: {
      heading: "Cómo lo ordena Mentor Cumple",
      intro: "El método sigue cuatro etapas para pasar del marco a evidencia usable.",
      items: [
        {
          title: "Diagnóstico",
          body: "Revisa la matriz y el programa existentes frente a lo que el Decreto 44 describe.",
        },
        {
          title: "Plan",
          body: "Ordena las brechas por prioridad y asigna responsables con plazos claros.",
        },
        {
          title: "Implementación",
          body: "Activa medidas, plazos y registros que la organización necesita para demostrar gestión.",
        },
        {
          title: "Control",
          body: "Mantiene el programa vigente y la evidencia ordenada cuando se requiera.",
        },
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
    mark: ["RR.HH."],
    markTone: "hot",
    normRef: "Código del Trabajo",
    baton: [
      { label: "Reglamento", icon: "clipboard" },
      { label: "Jornada", icon: "chart" },
      { label: "Evidencia", icon: "check" },
    ],
    heroAside: {
      heading: "Lo esencial",
      vigenciaLabel: "Marco",
      vigencia: "Código del Trabajo · Ley 21.561",
      dutiesHeading: "Qué debe asegurar la empresa",
      duties: [
        {
          label: "Reglamento",
          detail: "Art. 153 cuando hay normalmente 10 o más trabajadores permanentes",
          icon: "clipboard",
        },
        {
          label: "Jornada",
          detail: "Tope de 40 horas semanales; gradualidad en el texto oficial",
          icon: "chart",
        },
        {
          label: "Evidencia",
          detail: "Documentos, responsables y registros que demuestren lo anterior",
          icon: "check",
        },
      ],
      source: BCN.codigoTrabajo,
      sourceLabel: "Texto oficial en Ley Chile",
    },
    lead: "El Código del Trabajo fija obligaciones como el reglamento interno y los límites de jornada. Mentor Cumple ayuda a mantenerlas ordenadas, con responsables y evidencia.",
    disclaimer: DISCLAIMER,
    concepts: {
      heading: "Qué piezas ordena el marco laboral",
      items: [
        {
          title: "Reglamento interno",
          body: "El artículo 153 del Código del Trabajo obliga a confeccionar un reglamento interno de orden, higiene y seguridad a las empresas que ocupen normalmente diez o más trabajadores permanentes. Debe reflejar la realidad operativa, no solo existir como archivo.",
          icon: "clipboard",
          tone: "hot",
        },
        {
          title: "Jornada",
          body: "El artículo 22, modificado por la Ley 21.561, señala que la jornada ordinaria no excederá de cuarenta horas semanales. Las reglas de aplicación gradual están en esa ley; esta ficha no declara qué tramo rige en una fecha concreta.",
          icon: "chart",
          tone: "ink",
        },
        {
          title: "Evidencia laboral",
          body: "La organización debe poder mostrar el reglamento cuando aplica, cómo está configurada la jornada y quién responde de cada pieza. Sin registros ni responsables, el marco no se demuestra.",
          icon: "check",
          tone: "sand",
        },
      ],
    },
    checklist: {
      heading: "Qué debería poder mostrar la organización",
      intro:
        "Lista orientativa de evidencias típicas frente al marco descrito. No sustituye un diagnóstico ni fija el estándar de una fiscalización concreta.",
      items: [
        "Verificación de si alcanza el umbral de normalmente diez o más trabajadores permanentes (art. 153).",
        "Reglamento interno de orden, higiene y seguridad coherente con la operación, cuando el umbral aplica.",
        "Organización de la jornada alineada al tope de cuarenta horas semanales y al tramo de gradualidad que corresponda según la Ley 21.561 (consultar texto oficial).",
        "Responsables y registros que permitan demostrar qué se mantiene y quién responde.",
      ],
    },
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
    implicaPoints: {
      heading: "Qué implica para la empresa",
      items: [
        {
          title: "Umbral y documento",
          body: "Hay que saber si aplica el reglamento interno y mantenerlo coherente con la operación. Un texto desactualizado no responde al artículo 153.",
        },
        {
          title: "Jornada demostrable",
          body: "Configurar la jornada sin revisar el tramo aplicable de la Ley 21.561 genera riesgo. Esta página no fija el tramo vigente en una fecha concreta.",
        },
        {
          title: "Encaje con otras materias",
          body: "El orden laboral suele conectar con inclusión, Ley Karin y otras obligaciones. El alcance exacto depende de la operación de cada organización.",
        },
      ],
    },
    processSteps: {
      heading: "Cómo lo ordena Mentor Cumple",
      intro: "El método sigue cuatro etapas para pasar del marco a evidencia usable.",
      items: [
        {
          title: "Diagnóstico",
          body: "Contrasta el reglamento interno y la organización de la jornada con el texto oficial.",
        },
        {
          title: "Plan",
          body: "Define qué corregir primero: umbral, documento, jornada o registros.",
        },
        {
          title: "Implementación",
          body: "Actualiza documentos y prácticas, con responsables claros.",
        },
        {
          title: "Control",
          body: "Mantiene evidencia y revisiones periódicas a disposición de la organización.",
        },
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
    mark: ["DATOS"],
    markTone: "ink",
    normRef: "Ley 19.628",
    baton: [
      { label: "Datos", icon: "folder" },
      { label: "Tratamiento", icon: "list" },
      { label: "Evidencia", icon: "check" },
    ],
    heroAside: {
      heading: "Lo esencial",
      vigenciaLabel: "Marco",
      vigencia: "Ley 19.628",
      dutiesHeading: "Qué debe asegurar la empresa",
      duties: [
        {
          label: "Datos",
          detail: "Saber qué datos personales trata la organización",
          icon: "folder",
        },
        {
          label: "Tratamiento",
          detail: "Finalidad clara y quién administra el tratamiento",
          icon: "list",
        },
        {
          label: "Evidencia",
          detail: "Reglas internas y registros que demuestren el tratamiento",
          icon: "check",
        },
      ],
      source: BCN.ley19628,
      sourceLabel: "Texto oficial en Ley Chile",
    },
    lead: "La Ley 19.628 regula la protección de la vida privada y el tratamiento de datos personales. Mentor Cumple ayuda a ordenar ese tratamiento dentro de la organización.",
    disclaimer: DISCLAIMER,
    concepts: {
      heading: "Qué piezas ordena el marco de datos",
      items: [
        {
          title: "Datos personales",
          body: "La organización debe saber qué datos de personas recoge, almacena o usa — por ejemplo de trabajadores, postulantes o clientes — porque ese inventario es la base para revisar qué exige la Ley 19.628.",
          icon: "folder",
          tone: "ink",
        },
        {
          title: "Tratamiento",
          body: "Recoger, almacenar o usar datos personales es tratamiento. Conviene definir con qué finalidad se hace y quién lo administra. El alcance exacto se lee en el texto oficial; esta ficha no describe una ley posterior ni una fecha de reemplazo.",
          icon: "list",
          tone: "sand",
        },
        {
          title: "Evidencia",
          body: "Sin reglas internas ni registros del tratamiento, resulta difícil responder consultas o reclamos. La evidencia demuestra qué se trata, para qué y quién responde.",
          icon: "check",
          tone: "hot",
        },
      ],
    },
    checklist: {
      heading: "Qué debería poder mostrar la organización",
      intro:
        "Lista orientativa de evidencias típicas frente al marco descrito. No sustituye un diagnóstico ni fija el estándar de una fiscalización concreta.",
      items: [
        "Mapa de qué datos personales se tratan y de quiénes.",
        "Finalidad conocida del tratamiento y quién lo administra.",
        "Reglas internas o políticas operativas coherentes con ese tratamiento.",
        "Registros o evidencia que permitan responder consultas o reclamos.",
      ],
    },
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
    implicaPoints: {
      heading: "Qué implica para la empresa",
      items: [
        {
          title: "Mapa primero",
          body: "Sin saber qué datos personales se tratan, es difícil cumplir o responder. El inventario es el punto de partida.",
        },
        {
          title: "Tratamiento ordenado",
          body: "Finalidad y responsables claros reducen el riesgo operativo. Esta página no fija sanciones ni plazos no anclados en la ficha oficial.",
        },
        {
          title: "Encaje con otras materias",
          body: "Los datos de trabajadores y postulantes suelen conectar con laboral y otras obligaciones. El alcance exacto depende de la operación.",
        },
      ],
    },
    processSteps: {
      heading: "Cómo lo ordena Mentor Cumple",
      intro: "El método sigue cuatro etapas para pasar del marco a evidencia usable.",
      items: [
        {
          title: "Diagnóstico",
          body: "Identifica qué datos se tratan y dónde frente a lo que la Ley 19.628 describe.",
        },
        {
          title: "Plan",
          body: "Prioriza ajustes de procesos y documentos.",
        },
        {
          title: "Implementación",
          body: "Deja reglas y registros operativos.",
        },
        {
          title: "Control",
          body: "Mantiene responsables y evidencia de cómo se aplica el tratamiento.",
        },
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
    mark: ["INCLUSIÓN"],
    markTone: "sand",
    normRef: "Ley 21.015",
    baton: [
      { label: "Umbral", icon: "users" },
      { label: "Cuota", icon: "chart" },
      { label: "Evidencia", icon: "check" },
    ],
    heroAside: {
      heading: "Lo esencial",
      vigenciaLabel: "Marco",
      vigencia: "Ley 21.015",
      dutiesHeading: "Qué debe asegurar la empresa",
      duties: [
        { label: "Umbral", detail: "Empresas de 100 o más trabajadores", icon: "users" },
        { label: "Cuota", detail: "Al menos el 1% en las condiciones del art. 157 bis", icon: "chart" },
        { label: "Evidencia", detail: "Información de dotación que permita verificarlo", icon: "check" },
      ],
      source: BCN.ley21015,
      sourceLabel: "Texto oficial en Ley Chile",
    },
    lead: "La Ley 21.015 incorporó al Código del Trabajo la obligación de contratar personas con discapacidad en empresas de cierto tamaño. Mentor Cumple ayuda a verificar la situación de la organización y a mantener la evidencia.",
    disclaimer: DISCLAIMER,
    concepts: {
      heading: "Qué piezas ordena el marco de inclusión",
      items: [
        {
          title: "Umbral",
          body: "El artículo 157 bis aplica a empresas de 100 o más trabajadores. La organización debe establecer si su dotación alcanza ese umbral.",
          icon: "users",
          tone: "sand",
        },
        {
          title: "Cuota",
          body: "Cuando el umbral aplica, la empresa deberá contratar o mantener contratados al menos el 1% de personas con discapacidad o asignatarias de una pensión de invalidez, en relación con el total de sus trabajadores. El detalle del cálculo anual debe consultarse en el texto oficial.",
          icon: "chart",
          tone: "ink",
        },
        {
          title: "Evidencia",
          body: "Para verificar umbral y cuota, la organización necesita información ordenada y actualizada de su dotación. Esta ficha no detalla sanciones ni el cálculo anual.",
          icon: "check",
          tone: "hot",
        },
      ],
    },
    checklist: {
      heading: "Qué debería poder mostrar la organización",
      intro:
        "Lista orientativa de evidencias típicas frente al marco descrito. No sustituye un diagnóstico ni fija el estándar de una fiscalización concreta.",
      items: [
        "Verificación de si la dotación alcanza 100 o más trabajadores.",
        "Conteo de personas en las condiciones del art. 157 bis frente al total.",
        "Información de dotación actualizada y ordenada.",
        "Responsables claros de mantener esa información.",
      ],
    },
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
    implicaPoints: {
      heading: "Qué implica para la empresa",
      items: [
        {
          title: "Saber si aplica",
          body: "Sin verificar el umbral de 100 trabajadores, no se puede saber si la cuota del 1% rige para la organización.",
        },
        {
          title: "Dotación demostrable",
          body: "Hay que poder mostrar cuántas personas en las condiciones de la norma se mantienen contratadas frente al total. Esta página no fija el cálculo anual ni sanciones.",
        },
        {
          title: "Encaje con laboral",
          body: "La inclusión conecta con la gestión de personas y otras obligaciones laborales. El alcance exacto depende de la operación.",
        },
      ],
    },
    processSteps: {
      heading: "Cómo lo ordena Mentor Cumple",
      intro: "El método sigue cuatro etapas para pasar del marco a evidencia usable.",
      items: [
        { title: "Diagnóstico", body: "Revisa la dotación frente a la regla del artículo 157 bis." },
        { title: "Plan", body: "Define acciones si existe una brecha." },
        { title: "Implementación", body: "Ejecuta y documenta las acciones priorizadas." },
        { title: "Control", body: "Mantiene actualizada la información de la organización." },
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
    mark: ["TERCEROS"],
    markTone: "hot",
    normRef: "Ley 20.123",
    baton: [
      { label: "Empresa principal", icon: "building" },
      { label: "Faena", icon: "shield" },
      { label: "Control", icon: "clipboard" },
    ],
    heroAside: {
      heading: "Lo esencial",
      vigenciaLabel: "Marco",
      vigencia: "Ley 20.123 · Ley 16.744",
      dutiesHeading: "Qué debe asegurar la empresa",
      duties: [
        { label: "Contratistas", detail: "Saber quiénes operan en su obra, empresa o faena", icon: "building" },
        { label: "Protección", detail: "Medidas para proteger vida y salud, cualquiera sea la dependencia", icon: "shield" },
        { label: "Evidencia", detail: "Registros de coordinación y verificación", icon: "clipboard" },
      ],
      source: BCN.ley20123,
      sourceLabel: "Texto oficial en Ley Chile",
    },
    lead: "La Ley 20.123 regula el trabajo en régimen de subcontratación. Mentor Cumple ayuda a ordenar el control de contratistas y la evidencia que la empresa principal necesita.",
    disclaimer: DISCLAIMER,
    concepts: {
      heading: "Qué piezas ordena el marco de contratistas",
      items: [
        {
          title: "Empresa principal",
          body: "Sin perjuicio de las obligaciones del contratista, la empresa principal debe adoptar medidas de protección. Delegar la tarea no elimina la obligación propia.",
          icon: "building",
          tone: "hot",
        },
        {
          title: "Protección en faena",
          body: "Conforme al artículo 66 bis de la Ley 16.744, la protección alcanza a todas las personas que laboran en la obra, empresa o faena, cualquiera sea su dependencia.",
          icon: "shield",
          tone: "ink",
        },
        {
          title: "Documentos y control",
          body: "La empresa principal necesita saber qué contratistas operan, qué medidas se adoptaron y quién responde. Conviene contar con registros de coordinación y verificación. Esta ficha no fija una lista cerrada de documentos ni montos de multa.",
          icon: "clipboard",
          tone: "sand",
        },
      ],
    },
    checklist: {
      heading: "Qué debería poder mostrar la organización",
      intro:
        "Lista orientativa de evidencias típicas frente al marco descrito. No sustituye un diagnóstico ni fija el estándar de una fiscalización concreta.",
      items: [
        "Identificación de contratistas y subcontratistas que operan en la faena.",
        "Medidas de protección de vida y salud definidas para quienes laboran ahí.",
        "Responsables claros de coordinación y verificación.",
        "Registros que acrediten qué se coordinó y qué se verificó.",
      ],
    },
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
    implicaPoints: {
      heading: "Qué implica para la empresa",
      items: [
        {
          title: "No basta delegar",
          body: "La empresa principal mantiene deberes propios de protección. El contratista no los elimina.",
        },
        {
          title: "Mapa de terceros",
          body: "Hay que saber quién opera en la faena y con qué medidas. Sin ese mapa, el control es débil.",
        },
        {
          title: "Encaje con SST",
          body: "La protección en faena conecta con seguridad y salud en el trabajo. El alcance exacto depende de la operación.",
        },
      ],
    },
    processSteps: {
      heading: "Cómo lo ordena Mentor Cumple",
      intro: "El método sigue cuatro etapas para pasar del marco a evidencia usable.",
      items: [
        { title: "Diagnóstico", body: "Identifica contratistas, faenas y medidas vigentes." },
        { title: "Plan", body: "Prioriza los controles y responsables." },
        { title: "Implementación", body: "Define registros de coordinación y verificación." },
        { title: "Control", body: "Mantiene la evidencia a disposición de la empresa principal." },
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
