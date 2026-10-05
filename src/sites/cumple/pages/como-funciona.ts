import { pasos } from "@/sites/cumple/content";

const detalle: Record<string, string[]> = {
  "01": [
    "El método parte por entender la organización: su giro, su dotación, sus centros de trabajo y los contratistas con que opera. Con esa información se determina qué obligaciones le aplican y cuáles no.",
    "Luego se contrasta lo que existe (protocolos, procedimientos, registros) con lo que la norma vigente exige. El resultado es un estado claro, con las brechas identificadas y ordenadas.",
  ],
  "02": [
    "Las brechas se priorizan según su relevancia para la operación y el plazo en que conviene abordarlas. Cada acción queda con un responsable y una fecha de referencia.",
    "El plan distingue lo que debe implementarse de lo que solo requiere actualización, de modo que el esfuerzo se concentre donde corresponde.",
  ],
  "03": [
    "Con el plan aprobado, se desarrollan y activan los protocolos, procedimientos y documentos necesarios, incluidas las capacitaciones cuando la materia las requiere.",
    "Cada medida implementada se registra con su evidencia, para que la organización pueda mostrar qué hizo, cuándo y quién fue responsable.",
  ],
  "04": [
    "La plataforma concentra obligaciones, tareas, responsables y evidencias en un solo lugar, y emite alertas ante próximos vencimientos o revisiones pendientes.",
    "Cuando una norma se actualiza, se ajustan la obligación, la tarea y la evidencia asociadas. El acompañamiento del equipo permite resolver dudas y mantener el control en el tiempo. Ningún proceso garantiza la ausencia de sanciones, pero sí deja a la organización ordenada y con respaldo.",
  ],
};

export const comoFunciona = {
  eyebrow: "Método",
  h1: "Cómo funciona Mentor Cumple",
  lead: "Cuatro pasos para pasar de la incertidumbre a un cumplimiento ordenado, documentado y vigente: diagnóstico, plan de acción, implementación y control permanente.",
  steps: pasos.map((paso) => ({
    step: paso.step,
    title: paso.title,
    summary: paso.description,
    paragraphs: detalle[paso.step] ?? [],
  })),
  ctaTitle: "¿Quiere conocer el punto de partida de su empresa?",
  ctaText: "El diagnóstico preliminar es el primer paso del método y no compromete a la organización a continuar.",
  ctaLabel: "Evaluar mi empresa",
} as const;