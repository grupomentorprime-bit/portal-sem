export type Fuente = {
  nombre: string;
  url: string;
};

export type Ficha = {
  keys: string[];
  titulo: string;
  texto: string;
  fuente?: Fuente;
};

const codigoTrabajo: Fuente = {
  nombre: "Código del Trabajo, texto refundido en Ley Chile. Biblioteca del Congreso Nacional.",
  url: "https://www.bcn.cl/leychile/navegar?idNorma=207436",
};

const decreto44: Fuente = {
  nombre: "Decreto 44, de 27 de julio de 2024, Ministerio del Trabajo y Previsión Social. Ley Chile, Biblioteca del Congreso Nacional.",
  url: "https://www.bcn.cl/leychile/navegar?idNorma=1205298",
};

/** Si un dato no está en la ficha, la respuesta no puede afirmarlo. */
export const fichas: Ficha[] = [
  {
    keys: ["reglamento interno", "orden higiene", "higiene y seguridad", "articulo 153", "artículo 153"],
    titulo: "Código del Trabajo",
    texto:
      "Texto refundido del Código del Trabajo en Ley Chile. El artículo 153 obliga a confeccionar un reglamento interno de orden, higiene y seguridad a las empresas que ocupen normalmente diez o más trabajadores permanentes. Esta ficha no fija montos de multa.",
    fuente: codigoTrabajo,
  },
  {
    keys: ["jornada", "40 horas", "42 horas", "44 horas", "21.561", "21561", "horas semanales", "ley de 40 horas"],
    titulo: "Ley 21.561, jornada laboral",
    texto:
      "La nota marginal del artículo 22 del Código del Trabajo, en Ley Chile, atribuye la modificación a la Ley 21.561, Diario Oficial 26 de abril de 2023. Ese artículo, en el texto refundido, señala que la jornada ordinaria no excederá de cuarenta horas semanales. Las reglas de aplicación gradual están en la Ley 21.561. Esta ficha no declara qué tramo rige en una fecha concreta.",
    fuente: codigoTrabajo,
  },
  {
    keys: ["karin", "21.643", "21643", "acoso", "acoso laboral", "acoso sexual", "violencia en el trabajo"],
    titulo: "Ley 21.643, Ley Karin",
    texto:
      "Ley 21.643, publicada el 15 de enero de 2024 y vigente desde el 1 de agosto de 2024, según la ficha de la Biblioteca del Congreso Nacional. Modifica el Código del Trabajo en prevención, investigación y sanción del acoso laboral, el acoso sexual y la violencia en el trabajo. Exige protocolo de prevención, procedimiento de investigación y medidas de resguardo. Esta ficha no incluye números de artículo ni montos de multa.",
    fuente: {
      nombre: "Ley 21.643, Ley Karin. Ley Chile, Biblioteca del Congreso Nacional.",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=1200096",
    },
  },
  {
    keys: ["16.744", "16744", "accidente del trabajo", "enfermedad profesional", "enfermedades profesionales", "mutual", "isl"],
    titulo: "Ley 16.744 y seguridad y salud en el trabajo",
    texto:
      "La Ley 16.744 declara obligatorio el seguro social contra riesgos de accidentes del trabajo y enfermedades profesionales. Esta ficha no detalla cotizaciones ni porcentajes.",
    fuente: {
      nombre: "Ley 16.744, accidentes del trabajo y enfermedades profesionales. Ley Chile, Biblioteca del Congreso Nacional.",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=28650",
    },
  },
  {
    keys: ["ds 44", "ds44", "decreto 44", "decreto supremo 44", "sst", "seguridad y salud", "riesgo laboral", "prevencion de riesgos", "gestion preventiva", "matriz de riesgos"],
    titulo: "DS 44 y gestión preventiva",
    texto:
      "Decreto 44 del Ministerio del Trabajo y Previsión Social, publicado el 27 de julio de 2024 en Ley Chile. Aprueba el reglamento sobre gestión preventiva de los riesgos laborales. El artículo 4 obliga a gestionar esos riesgos e implementar una matriz de identificación de peligros y evaluación de riesgos y un programa de gestión. El artículo 7 regula la matriz. El artículo 8 exige que el programa contenga medidas, plazos y responsables. La vigencia está en el artículo primero transitorio: el primer día del sexto mes siguiente a la publicación en el Diario Oficial. No sustituir esa regla por otra fecha.",
    fuente: decreto44,
  },
  {
    keys: ["psicosocial", "ceal", "suseso", "riesgo psicosocial"],
    titulo: "Riesgos psicosociales",
    texto:
      "El artículo 7 del Decreto 44 incluye los riesgos psicosociales entre los factores que la entidad empleadora debe considerar al confeccionar la matriz de identificación de peligros y evaluación de riesgos. Esta ficha no describe un cuestionario ni una periodicidad distinta de la que ese artículo fija para la matriz.",
    fuente: decreto44,
  },
  {
    keys: ["inclusion", "inclusion laboral", "discapacidad", "21.015", "21015", "1%"],
    titulo: "Inclusión laboral, Ley 21.015",
    texto:
      "El artículo 157 bis, incorporado por la Ley 21.015, dispone que las empresas de 100 o más trabajadores deberán contratar o mantener contratados al menos el 1% de personas con discapacidad o asignatarias de una pensión de invalidez, en relación con el total de sus trabajadores. Esta ficha no detalla el cálculo anual ni sanciones.",
    fuente: {
      nombre: "Ley 21.015, inclusión laboral. Ley Chile, Biblioteca del Congreso Nacional.",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=1103997",
    },
  },
  {
    keys: ["dato personal", "datos personales", "privacidad", "vida privada", "19.628", "19628", "ley de datos"],
    titulo: "Protección de datos",
    texto:
      "La Ley 19.628 regula la protección de la vida privada y el tratamiento de datos personales. Esta ficha no describe una ley posterior ni una fecha de reemplazo.",
    fuente: {
      nombre: "Ley 19.628, protección de la vida privada. Ley Chile, Biblioteca del Congreso Nacional.",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=141599",
    },
  },
  {
    keys: ["emergencia", "evacuacion", "simulacro", "plan de emergencia", "184 bis", "riesgo grave"],
    titulo: "Emergencias",
    texto:
      "El Decreto 44 recuerda, en sus considerandos, que la Ley 21.012 incorporó el artículo 184 bis al Código del Trabajo sobre riesgo grave e inminente y situaciones de emergencia en el lugar de trabajo. El texto del Código está en Ley Chile. Esta ficha no agrega otro decreto de emergencias.",
    fuente: codigoTrabajo,
  },
  {
    keys: ["contratista", "contratistas", "subcontrato", "subcontratacion", "empresa principal", "20.123", "20123"],
    titulo: "Contratistas y terceros, Ley 20.123",
    texto:
      "La Ley 20.123 regula el trabajo en régimen de subcontratación. Dispone que, sin perjuicio de las obligaciones del contratista, la empresa principal debe adoptar medidas para proteger la vida y la salud de todas las personas que laboran en su obra, empresa o faena, cualquiera sea su dependencia, conforme al artículo 66 bis de la Ley 16.744. Esta ficha no fija montos de multa.",
    fuente: {
      nombre: "Ley 20.123, subcontratación. Ley Chile, Biblioteca del Congreso Nacional.",
      url: "https://www.bcn.cl/leychile/navegar?idNorma=254080",
    },
  },
  {
    keys: ["mentor prime", "mentorprime", "que hacen", "diagnostico"],
    titulo: "Qué hace Mentor Cumple",
    texto:
      "Reúne consultoría, gestión y tecnología: qué obligaciones aplican, quién responde, cuándo vence y dónde está la evidencia. El alcance inicial considera laboral y RR.HH., Ley Karin, DS 44 y seguridad y salud en el trabajo, riesgos psicosociales, inclusión, protección de datos, emergencias y contratistas. No promete ausencia de sanciones ni de fiscalizaciones. El paso siguiente es solicitar el diagnóstico.",
  },
];

export const dossier = fichas.map((ficha) => `${ficha.titulo}\n${ficha.texto}`).join("\n\n");

export function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function fichasPara(consulta: string) {
  const pregunta = normalizar(consulta);
  return fichas.filter((ficha) =>
    ficha.keys.some((key) => {
      const token = normalizar(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^a-z0-9])${token}([^a-z0-9]|$)`).test(pregunta);
    }),
  );
}
