import { CUMPLE_FORM_ID } from "@/sites/cumple/site";

export const HEADCOUNT_OPTIONS = [
  { value: "lt10", label: "Menos de 10" },
  { value: "10-49", label: "10 a 49" },
  { value: "50-99", label: "50 a 99" },
  { value: "100+", label: "100 o más" },
] as const;

export const YES_NO_OPTIONS = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
] as const;

export const CHECK_OPTIONS = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "no_se", label: "No sé" },
] as const;

export type Headcount = (typeof HEADCOUNT_OPTIONS)[number]["value"];
export type YesNo = (typeof YES_NO_OPTIONS)[number]["value"];
export type CheckAnswer = (typeof CHECK_OPTIONS)[number]["value"];
export type MatterId = "ley-karin" | "sst" | "laboral" | "datos" | "inclusion" | "contratistas";
export type MatterStatus = "al_dia" | "dudoso" | "no_esta" | "incompleto";

/** Versión del cuestionario guardada con cada diagnóstico. */
export const DIAGNOSTICO_QUESTIONNAIRE_VERSION = "2026-10-16";

/** Etiquetas de lo declarado. No equivalen a cumplimiento legal verificado. */
export const MATTER_STATUS_LABEL: Record<MatterStatus, string> = {
  al_dia: "Sin brecha declarada",
  dudoso: "Duda declarada",
  no_esta: "Brecha declarada",
  incompleto: "Respuesta ausente",
};

export interface DiagnosticoCheck {
  id: string;
  prompt: string;
  gap: string;
  doubt: string;
}

export interface DiagnosticoInput {
  headcount: Headcount;
  contractors: YesNo;
  multiSite: YesNo;
  personalData: YesNo;
  answers: Partial<Record<MatterId, Partial<Record<string, CheckAnswer>>>>;
}

export interface DiagnosticoMatter {
  id: MatterId;
  label: string;
  exposure: string;
  checks: readonly DiagnosticoCheck[];
}

export interface DiagnosticoPriority extends DiagnosticoMatter {
  status: Exclude<MatterStatus, "al_dia">;
  findings: string[];
}

export interface DiagnosticoMatterResult {
  id: MatterId;
  label: string;
  exposure: string;
  status: MatterStatus;
  findings: string[];
  /** Orientación solo si la materia aplica y no quedó sin brecha declarada. */
  recommendation: string | null;
}

export interface DiagnosticoResult {
  questionnaireVersion: string;
  /** El resultado orienta. No certifica ni mide cumplimiento legal. */
  nature: "orientativo";
  /** Los estados salen de lo que la empresa declaró. */
  basis: "declarado";
  cumplimientoLegalVerificado: false;
  matters: DiagnosticoMatterResult[];
  priorities: DiagnosticoPriority[];
  recommendations: string[];
  headline: string;
  callLine: string;
  resumen: string;
  disclaimer: string;
}

const CHECKS: Record<MatterId, readonly DiagnosticoCheck[]> = {
  "ley-karin": [
    {
      id: "protocolo",
      prompt: "¿El protocolo de acoso y violencia está vigente y la gente lo conoce?",
      gap: "el protocolo no está vigente o no se conoce",
      doubt: "no consta si el protocolo se conoce",
    },
    {
      id: "investigacion",
      prompt: "¿Está definido cómo se investiga un caso y quién responde?",
      gap: "no hay procedimiento de investigación",
      doubt: "no consta el procedimiento de investigación",
    },
    {
      id: "registro",
      prompt: "¿Puede mostrar qué se hizo, quién respondió y cuándo?",
      gap: "no hay registro de lo actuado",
      doubt: "no consta el registro de lo actuado",
    },
  ],
  sst: [
    {
      id: "matriz",
      prompt: "¿Tiene una matriz de riesgos al día?",
      gap: "no hay matriz de riesgos vigente",
      doubt: "no consta si la matriz está al día",
    },
    {
      id: "programa",
      prompt: "¿Esa matriz tiene medidas, plazos y un responsable?",
      gap: "no hay programa con responsables",
      doubt: "no consta el programa con responsables",
    },
    {
      id: "evidencia",
      prompt: "¿Puede mostrar qué riesgo se identificó y qué se hizo?",
      gap: "no puede acreditar lo que se hizo",
      doubt: "no consta la evidencia de lo hecho",
    },
  ],
  laboral: [
    {
      id: "jornada",
      prompt: "¿Puede demostrar cómo se cumple la jornada?",
      gap: "la jornada no se puede demostrar",
      doubt: "no consta el control de jornada",
    },
    {
      id: "reglamento",
      prompt: "¿El reglamento interno está al día con la operación?",
      gap: "el reglamento interno está desactualizado",
      doubt: "no consta si el reglamento está al día",
    },
    {
      id: "registros",
      prompt: "¿Hay alguien a cargo de contratos y registros?",
      gap: "nadie tiene a cargo los registros laborales",
      doubt: "no consta quién responde de los registros",
    },
  ],
  datos: [
    {
      id: "mapa",
      prompt: "¿Sabe qué datos trata y para qué?",
      gap: "no hay mapa de los datos que trata",
      doubt: "no consta qué datos trata",
    },
    {
      id: "reglas",
      prompt: "¿Tiene reglas internas de ese tratamiento?",
      gap: "no hay reglas del tratamiento",
      doubt: "no constan las reglas del tratamiento",
    },
    {
      id: "respuesta",
      prompt: "¿Podría responder si alguien pregunta qué datos tienen de él?",
      gap: "no podría responder un reclamo de datos",
      doubt: "no consta cómo responder un reclamo de datos",
    },
  ],
  inclusion: [
    {
      id: "cuota",
      prompt: "¿Mantiene al menos el 1% de personas con discapacidad o pensión de invalidez?",
      gap: "no acredita la cuota del 1%",
      doubt: "no consta la cuota del 1%",
    },
    {
      id: "conteo",
      prompt: "¿Lleva el conteo de la dotación frente a esa regla?",
      gap: "no lleva el conteo de la dotación",
      doubt: "no consta el conteo de la dotación",
    },
    {
      id: "responsable",
      prompt: "¿Hay alguien a cargo de mantener esa información?",
      gap: "nadie responde de la inclusión",
      doubt: "no consta quién responde de la inclusión",
    },
  ],
  contratistas: [
    {
      id: "mapa",
      prompt: "¿Sabe qué contratistas trabajan en su local o faena?",
      gap: "no tiene mapa de contratistas",
      doubt: "no consta el mapa de contratistas",
    },
    {
      id: "proteccion",
      prompt: "¿Definió medidas de protección también para esas personas?",
      gap: "la protección no alcanza a los contratistas",
      doubt: "no consta la protección de los contratistas",
    },
    {
      id: "registro",
      prompt: "¿Guarda qué se coordinó y qué se verificó?",
      gap: "no hay registro de la coordinación",
      doubt: "no consta el registro de la coordinación",
    },
  ],
};

const MATTERS: readonly { id: MatterId; label: string; exposure: string }[] = [
  {
    id: "ley-karin",
    label: "Ley Karin",
    exposure: "Si aparece un caso o una fiscalización, no puede mostrar cómo se previene, se investiga y se resguarda.",
  },
  {
    id: "sst",
    label: "Seguridad y salud",
    exposure: "Si le piden la gestión de riesgos, no puede acreditar la matriz, las medidas ni quién responde.",
  },
  {
    id: "laboral",
    label: "Laboral y RR.HH.",
    exposure: "Si le piden jornada, reglamento o registros, no puede demostrarlos.",
  },
  {
    id: "datos",
    label: "Protección de datos",
    exposure: "Si alguien consulta o reclama por sus datos, la empresa no sabe qué trata ni cómo responder.",
  },
  {
    id: "inclusion",
    label: "Inclusión laboral",
    exposure: "Si la dotación exige la cuota del 1%, no puede mostrar el conteo ni quién lo mantiene.",
  },
  {
    id: "contratistas",
    label: "Contratistas",
    exposure: "Si hay una revisión en la faena, la protección no queda acreditada para quienes trabajan con contratistas.",
  },
];

const CALL_WITH_GAPS =
  "Estos son hallazgos declarados. No hay un contacto automático por WhatsApp.";
const CALL_CLEAR =
  "No hay brechas declaradas en las materias aplicables. No es una certificación y no hay un contacto automático.";

export const DIAGNOSTICO_DISCLAIMER =
  "Diagnóstico orientativo según lo declarado por la empresa. No es una certificación, no es un porcentaje de cumplimiento legal y no verifica el cumplimiento ante la autoridad.";

function checksFor(id: MatterId, headcount: Headcount): readonly DiagnosticoCheck[] {
  if (id === "laboral" && headcount === "lt10") {
    return CHECKS.laboral.filter((check) => check.id !== "reglamento");
  }
  return CHECKS[id];
}

export function applicableMatters(
  input: Pick<DiagnosticoInput, "headcount" | "contractors" | "personalData">
): DiagnosticoMatter[] {
  return MATTERS.filter((matter) => {
    if (matter.id === "datos") return input.personalData === "si";
    if (matter.id === "inclusion") return input.headcount === "100+";
    if (matter.id === "contratistas") return input.contractors === "si";
    return true;
  }).map((matter) => ({
    ...matter,
    checks: checksFor(matter.id, input.headcount),
  }));
}

function yesNo(value: YesNo): "sí" | "no" {
  return value === "si" ? "sí" : "no";
}

function headcountLabel(value: Headcount): string {
  return HEADCOUNT_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function recommendationFor(status: MatterStatus, matter: DiagnosticoMatter): string | null {
  if (status === "al_dia") return null;
  if (status === "incompleto") {
    return `Completar lo declarado en ${matter.label} antes de orientar esta materia.`;
  }
  return `Revisar ${matter.label}: ${matter.exposure}`;
}

function scoreMatter(matter: DiagnosticoMatter, input: DiagnosticoInput): {
  status: MatterStatus;
  findings: string[];
} {
  const given = input.answers[matter.id] ?? {};
  const findings: string[] = [];
  let hasNo = false;
  let hasDoubt = false;
  let hasMissing = false;
  for (const check of matter.checks) {
    const value = given[check.id];
    if (value === "no") {
      hasNo = true;
      findings.push(check.gap);
    } else if (value === "no_se") {
      hasDoubt = true;
      findings.push(check.doubt);
    } else if (value !== "si") {
      hasMissing = true;
      findings.push("falta la respuesta");
    }
  }
  const status: MatterStatus = hasNo
    ? "no_esta"
    : hasMissing
      ? "incompleto"
      : hasDoubt
        ? "dudoso"
        : "al_dia";
  return { status, findings };
}

function statusRank(status: MatterStatus): number {
  if (status === "no_esta") return 0;
  if (status === "incompleto") return 1;
  return 2;
}

export function buildDiagnostico(input: DiagnosticoInput): DiagnosticoResult {
  const applicable = applicableMatters(input);
  const scored = applicable.map((matter, index) => ({
    matter,
    index,
    ...scoreMatter(matter, input),
  }));
  const matters: DiagnosticoMatterResult[] = scored.map((item) => ({
    id: item.matter.id,
    label: item.matter.label,
    exposure: item.matter.exposure,
    status: item.status,
    findings: item.findings,
    recommendation: recommendationFor(item.status, item.matter),
  }));
  const ranked = scored
    .filter(
      (item): item is typeof item & { status: Exclude<MatterStatus, "al_dia"> } =>
        item.status !== "al_dia"
    )
    .sort((a, b) => statusRank(a.status) - statusRank(b.status) || a.index - b.index);

  const priorities = ranked.slice(0, 3).map((item) => ({
    ...item.matter,
    status: item.status,
    findings: item.findings,
  }));

  const points = priorities.reduce((total, item) => total + item.findings.length, 0);
  const headline =
    points === 0
      ? "Sin brechas declaradas"
      : points === 1
        ? "1 punto para mirar primero"
        : `${points} puntos para mirar primero`;

  const gapText =
    ranked.length === 0
      ? "Hallazgos declarados: ninguno en las materias aplicables."
      : `Hallazgos declarados: ${ranked
          .map((item) => `${item.matter.label}: ${item.findings.join("; ")}. Expuesto: ${item.matter.exposure}`)
          .join(" ")}`;

  const resumen = [
    `Dotación ${headcountLabel(input.headcount)}.`,
    `Contratistas: ${yesNo(input.contractors)}.`,
    `Más de un local: ${yesNo(input.multiSite)}.`,
    `Datos de clientes: ${yesNo(input.personalData)}.`,
    gapText,
  ].join(" ");

  return {
    questionnaireVersion: DIAGNOSTICO_QUESTIONNAIRE_VERSION,
    nature: "orientativo",
    basis: "declarado",
    cumplimientoLegalVerificado: false,
    matters,
    priorities,
    recommendations: matters.flatMap((matter) =>
      matter.recommendation ? [matter.recommendation] : []
    ),
    headline,
    callLine: points === 0 ? CALL_CLEAR : CALL_WITH_GAPS,
    resumen,
    disclaimer: DIAGNOSTICO_DISCLAIMER,
  };
}

const HEADCOUNT_VALUES = new Set<string>(HEADCOUNT_OPTIONS.map((option) => option.value));
const YES_NO_VALUES = new Set<string>(YES_NO_OPTIONS.map((option) => option.value));
const CHECK_VALUES = new Set<string>(CHECK_OPTIONS.map((option) => option.value));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseDiagnosticoPayload(
  data: Record<string, unknown>
): { ok: true; input: DiagnosticoInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const headcount = data.headcount;
  const contractors = data.contractors;
  const multiSite = data.multiSite;
  const personalData = data.personalData;

  if (typeof headcount !== "string" || !HEADCOUNT_VALUES.has(headcount)) {
    errors.headcount = "Indique la dotación de la empresa.";
  }
  if (typeof contractors !== "string" || !YES_NO_VALUES.has(contractors)) {
    errors.contractors = "Indique si trabaja con contratistas.";
  }
  if (typeof multiSite !== "string" || !YES_NO_VALUES.has(multiSite)) {
    errors.multiSite = "Indique si tiene más de un local.";
  }
  if (typeof personalData !== "string" || !YES_NO_VALUES.has(personalData)) {
    errors.personalData = "Indique si trata datos de clientes o trabajadores.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const profile = {
    headcount: headcount as Headcount,
    contractors: contractors as YesNo,
    multiSite: multiSite as YesNo,
    personalData: personalData as YesNo,
  };
  const applicable = applicableMatters(profile);
  const applicableIds = new Set(applicable.map((matter) => matter.id));
  const answersRaw = data.answers;
  if (!isRecord(answersRaw)) {
    return { ok: false, errors: { answers: "Faltan las respuestas de las materias aplicables." } };
  }

  const answers: DiagnosticoInput["answers"] = {};
  for (const key of Object.keys(answersRaw)) {
    if (!applicableIds.has(key as MatterId)) {
      errors.answers = "Hay respuestas de materias que no aplican a este perfil.";
    }
  }

  for (const matter of applicable) {
    const givenRaw = answersRaw[matter.id];
    if (!isRecord(givenRaw)) {
      errors.answers = "Faltan respuestas obligatorias. Una respuesta ausente no es cumplimiento.";
      continue;
    }
    const given: Partial<Record<string, CheckAnswer>> = {};
    const expected = new Set(matter.checks.map((check) => check.id));
    for (const checkId of Object.keys(givenRaw)) {
      if (!expected.has(checkId)) {
        errors.answers = "Hay respuestas de obligaciones que no aplican a este perfil.";
      }
    }
    for (const check of matter.checks) {
      const value = givenRaw[check.id];
      if (typeof value !== "string" || !CHECK_VALUES.has(value)) {
        errors.answers = "Faltan respuestas obligatorias. Una respuesta ausente no es cumplimiento.";
        continue;
      }
      given[check.id] = value as CheckAnswer;
    }
    answers[matter.id] = given;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, input: { ...profile, answers } };
}

const CLIENT_RESULT_KEYS = ["priorities", "matters", "headline", "cumplimiento", "recommendations"] as const;

/**
 * Recalcula el diagnóstico en el servidor y descarta el resumen del navegador.
 * Solo aplica al formulario Diagnóstico de Mentor CUMPLE.
 */
export function prepareCumpleDiagnosticoSubmission(
  formId: string,
  data: Record<string, unknown>
):
  | { applies: false }
  | { applies: true; ok: false; errors: Record<string, string> }
  | {
      applies: true;
      ok: true;
      data: Record<string, unknown>;
      input: DiagnosticoInput;
      result: DiagnosticoResult;
    } {
  if (formId !== CUMPLE_FORM_ID) return { applies: false };
  const parsed = parseDiagnosticoPayload(data);
  if (!parsed.ok) return { applies: true, ok: false, errors: parsed.errors };
  const result = buildDiagnostico(parsed.input);
  const next: Record<string, unknown> = { ...data, diagnosticoResumen: result.resumen };
  for (const key of CLIENT_RESULT_KEYS) delete next[key];
  return { applies: true, ok: true, data: next, input: parsed.input, result };
}
