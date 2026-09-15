/**
 * OT-GROWTH-UX-PERSONAS-004 — superficie visual Personas V1.
 * Valida copy humano, jerarquía, CTAs condicionados y ausencia de jerga técnica.
 * No toca motores, contratos ni APIs.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";
import {
  GROWTH_NO_NEXT_ACTION_LABEL,
  GROWTH_PERSONAS_CREATE_DESCRIPTION,
  GROWTH_PERSONAS_CREATE_CTA,
  GROWTH_PERSONAS_NO_MATCH_TITLE,
  GROWTH_PERSONAS_PAGE_DESCRIPTION,
  GROWTH_PERSONA_ORIGIN_FILTER_OPTIONS,
  GROWTH_VIEW_PERSONA_LABEL,
} from "../../src/lib/growth/labels";

const root = resolve(__dirname, "../..");

function readSrc(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

const FORBIDDEN =
  /\b(CRM|pipeline|lead|Identity|Activity log|Resolution|Trigger|Payload|Metadata|tenantId|origin\.kind|origin\.channel)\b/i;

describe("OT-GROWTH-UX-PERSONAS-004 — diseño Personas", () => {
  it("copy de cabecera, vacío y crear persona es humano", () => {
    assert.equal(
      GROWTH_PERSONAS_PAGE_DESCRIPTION,
      "Todas las personas que se han relacionado con tu negocio."
    );
    assert.equal(
      GROWTH_PERSONAS_NO_MATCH_TITLE,
      "No encontramos personas con esos filtros."
    );
    assert.equal(
      GROWTH_PERSONAS_CREATE_DESCRIPTION,
      "Agrega un correo o un teléfono."
    );
    assert.equal(GROWTH_PERSONAS_CREATE_CTA, "Crear persona");
    assert.equal(GROWTH_VIEW_PERSONA_LABEL, "Ver persona");
    assert.equal(
      GROWTH_NO_NEXT_ACTION_LABEL,
      "No hay nada pendiente por ahora."
    );
    assert.equal(GROWTH_PERSONA_ORIGIN_FILTER_OPTIONS[0]?.label, "Todos");
  });

  it("listado prioriza nombre, origen, oportunidades y qué hacer ahora", () => {
    const list = readSrc("src/components/admin/growth/PersonasListClient.tsx");
    assert.match(list, /GROWTH_PERSONAS_PAGE_DESCRIPTION/);
    assert.match(list, /GROWTH_VIEW_PERSONA_LABEL/);
    assert.match(list, /GROWTH_NEXT_ACTION_SECTION_LABEL/);
    assert.match(list, /Buscar por nombre, correo o teléfono/);
    assert.match(list, /opportunityCountLabel|oportunidades/);
    assert.match(list, /data-personas-filters/);
    assert.match(list, /Limpiar filtros/);
    assert.doesNotMatch(list, /GROWTH_SITUATION_SECTION_LABEL/);
    assert.doesNotMatch(list, /StatusBadge/);
    assert.doesNotMatch(list, FORBIDDEN);
    assert.doesNotMatch(list, /\bEmail\b/);
    assert.match(list, /label="Correo"/);
    assert.match(list, /GROWTH_PERSONAS_CREATE_CTA/);
  });

  it("ficha cuenta historia sin inbox ni cards excesivas", () => {
    const detail = readSrc(
      "src/components/admin/growth/PersonaDetailClient.tsx"
    );
    assert.match(detail, /GROWTH_PERSONAS_ARRIVED_PREFIX|Llegó por/);
    assert.match(detail, /GROWTH_NEXT_ACTION_SECTION_LABEL/);
    assert.match(detail, /Oportunidades/);
    assert.match(detail, /GROWTH_PERSONAS_CONVERSATIONS_SECTION/);
    assert.match(detail, /GROWTH_TIMELINE_SECTION_LABEL/);
    assert.match(detail, /data-persona-detail/);
    assert.match(detail, /data-persona-conversations/);
    assert.match(detail, /Contexto reciente/);
    assert.doesNotMatch(detail, /textarea|composer|Enviar respuesta/i);
    assert.doesNotMatch(detail, /persona\.nextAction/);
    assert.doesNotMatch(detail, /\bscoring\b/i);
    assert.doesNotMatch(detail, /\bmerge\b/i);
    assert.doesNotMatch(detail, FORBIDDEN);
    assert.match(detail, /GROWTH_PERSONAS_OPEN_IN_MESSAGES/);
    assert.match(detail, /GROWTH_PERSONAS_OPEN_IN_SALES/);
    assert.match(detail, /canOpenMessages/);
    assert.match(detail, /canOpenSales/);
  });

  it("no toca motores, contratos ni APIs de Personas", () => {
    const api = readSrc("src/app/api/growth/personas/route.ts");
    assert.match(api, /createGrowthPersonaAdmin|upsertGrowthPersona/);
    const create = readSrc("src/lib/growth/personas-create.ts");
    assert.match(create, /upsertGrowthPersona/);
    const list = readSrc("src/components/admin/growth/PersonasListClient.tsx");
    assert.match(list, /\/api\/growth\/personas/);
    assert.doesNotMatch(list, /upsertGrowthPersona|insertOne/);
    const detail = readSrc(
      "src/components/admin/growth/PersonaDetailClient.tsx"
    );
    assert.doesNotMatch(detail, /upsertGrowthPersona|pickPrimaryNextAction/);
  });

  it("shell y nav Personas no se rediseñan en esta OT", () => {
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    assert.match(nav, /href: "\/admin\/personas"/);
    assert.match(nav, /growth\.people\.(view|manage)/);
  });
});
