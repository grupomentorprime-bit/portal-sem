/**
 * OT-GROWTH-UX-HOME-003 — historias humanas para «Qué ha pasado» (solo presentación).
 * No cambia resúmenes persistidos ni Growth Core.
 */

import { growthOpportunityStatusLabel, growthOpportunityTypeLabel } from "@/lib/growth/labels";

export type HomeActivityTone =
  | "form"
  | "opportunity"
  | "followup"
  | "transfer"
  | "note"
  | "other";

const STATUS_KEY =
  /\b(open|active|won|lost|handed_off|archived)\b/gi;

const TYPE_KEY_IN_PARENS =
  /\(\s*(inquiry|registration|conversion|[a-z][a-z0-9_-]*)\s*\)/i;

const TRANSITION_ARROW =
  /Oportunidad\s+(\w+)\s*→\s*(\w+)/i;

function capitalizePhrase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Quita claves técnicas de estado/tipo que puedan colarse en el resumen. */
export function scrubTechnicalActivityTokens(summary: string): string {
  let text = summary.trim();
  text = text.replace(TYPE_KEY_IN_PARENS, (_, key: string) => {
    const human = growthOpportunityTypeLabel(key);
    return human !== key ? "" : "";
  });
  text = text.replace(STATUS_KEY, (key) => growthOpportunityStatusLabel(key.toLowerCase()));
  text = text.replace(/\s{2,}/g, " ").replace(/\s+([.,])/g, "$1").trim();
  return text;
}

/**
 * Convierte un hecho de actividad en una frase cotidiana para el Inicio.
 */
export function humanizeHomeActivityStory(input: {
  kind: string;
  summary: string;
  personaName?: string;
}): { story: string; tone: HomeActivityTone } {
  const name = input.personaName?.trim();
  const summary = input.summary.trim();
  const kind = input.kind;

  switch (kind) {
    case "form_submitted":
      return {
        story: name ? `${name} envió un formulario.` : "Alguien envió un formulario.",
        tone: "form",
      };
    case "application_received":
      return {
        story: name
          ? `${name} envió una postulación.`
          : "Se recibió una postulación.",
        tone: "form",
      };
    case "opportunity_opened":
      return {
        story: name
          ? `Se creó una oportunidad para ${name}.`
          : "Se creó una nueva oportunidad.",
        tone: "opportunity",
      };
    case "opportunity_transitioned": {
      const match = summary.match(TRANSITION_ARROW);
      if (match) {
        const toLabel = growthOpportunityStatusLabel(match[2].toLowerCase());
        return {
          story: `La oportunidad pasó a ${toLabel}.`,
          tone: "opportunity",
        };
      }
      return {
        story: "La oportunidad cambió de estado.",
        tone: "opportunity",
      };
    }
    case "next_action_set": {
      if (/cerrada/i.test(summary)) {
        return {
          story: "Se cerró el próximo paso.",
          tone: "followup",
        };
      }
      return {
        story: "Growth OS programó un seguimiento.",
        tone: "followup",
      };
    }
    case "handoff":
      return {
        story: "Una oportunidad fue traspasada.",
        tone: "transfer",
      };
    case "identity_updated":
      return {
        story: name
          ? `Se actualizaron los datos de ${name}.`
          : "Se actualizaron los datos.",
        tone: "other",
      };
    case "note":
      return {
        story: capitalizePhrase(scrubTechnicalActivityTokens(summary)) || "Se dejó una nota.",
        tone: "note",
      };
    case "contact":
      return {
        story:
          capitalizePhrase(scrubTechnicalActivityTokens(summary)) ||
          (name ? `Hubo contacto con ${name}.` : "Se registró un contacto."),
        tone: "note",
      };
    default: {
      const cleaned = scrubTechnicalActivityTokens(summary);
      if (name && cleaned) {
        return { story: `${name}: ${cleaned}`, tone: "other" };
      }
      return {
        story: cleaned || "Hubo actividad en el Espacio.",
        tone: "other",
      };
    }
  }
}

/**
 * Situación legible a partir de «Tipo · Estado» sin repetir la próxima acción.
 */
export function humanizeHomeSituation(opportunitySummary?: string): {
  typeLabel?: string;
  situationLabel?: string;
} {
  const raw = opportunitySummary?.trim();
  if (!raw) return {};

  const parts = raw.split(" · ").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const typeLabel = parts[0];
    const statusLabel = parts.slice(1).join(" · ");
    const statusLower =
      statusLabel.charAt(0).toLowerCase() + statusLabel.slice(1);
    const situationLabel = /^en\s/i.test(statusLabel)
      ? `${typeLabel} ${statusLower}`
      : `${typeLabel}: ${statusLabel}`;
    return { typeLabel, situationLabel };
  }

  return { situationLabel: raw };
}
