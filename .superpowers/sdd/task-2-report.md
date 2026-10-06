# Task 2 Report: Contenido editorial en `laboral-rrhh`

## Status

**DONE** — Editorial opcionales añadidos; tests en verde.

## Commits

None (per task instructions).

## Changes

**File:** `src/sites/cumple/pages/materias.ts` (entrada `slug: "laboral-rrhh"`)

| Field | Action |
|-------|--------|
| `titleName`, `mark`, `markTone`, `path`, `eyebrow` | Sin cambio (`Laboral y RR.HH.`, `["RR.HH."]`, `hot`) |
| `baton` | Añadido: Reglamento / Jornada / Evidencia (`clipboard`, `chart`, `check`) |
| `heroAside` | Añadido: "Lo esencial", Marco, vigencia Código + 21.561, 3 duties, `BCN.codigoTrabajo` |
| `concepts` | 3 items: Reglamento interno, Jornada, Evidencia laboral |
| `checklist` | 4 items orientativos |
| `implicaPoints` | 3 items (Umbral y documento, Jornada demostrable, Encaje con otras materias) |
| `processSteps` | 4 etapas (Diagnóstico, Plan, Implementación, Control) |
| `implica.paragraphs`, `exige`, `cumple`, `sources` | Mantenidos; `sources: [BCN.codigoTrabajo]` |
| Otras materias | Sin cambios (proteccion-datos, inclusion-laboral, contratistas-terceros sin opcionales) |

**Not modified:** `MateriaPage`, `types.ts`, tests.

## TDD GREEN evidence

Command:

```bash
npx tsx --test tests/baseline/cumple-pages.test.ts
```

Result (2026-10-02):

```
ℹ tests 22
ℹ pass 22
ℹ fail 0
```

Relevant assertions now green:

- `Laboral y RR.HH. incluye el mismo patrón editorial que Ley Karin`
- `SST / DS 44 incluye el mismo patrón editorial que Ley Karin` (guard loop; otras 3 materias sin opcionales)
- Karin/SST tests unchanged and passing

## Self-review vs brief / spec

| Requirement | Met |
|-------------|-----|
| baton labels Reglamento · Jornada · Evidencia | Yes |
| heroAside heading "Lo esencial", source URL contains 207436 | Yes |
| concepts reglamento / jornada / evidencia titles | Yes |
| checklist ≥3 items | Yes (4) |
| implicaPoints ×3, processSteps ×4 | Yes |
| No invented jornada tramos or multa amounts | Yes (copy defers to Ley 21.561 / official text) |
| Icons clipboard / chart / check only | Yes |
| sources anchored to BCN.codigoTrabajo | Yes |
| No TBD/TODO in added copy | Yes |

## Visual verification (Step 3)

Not run in this session. Recommended: `http://cumple.localhost:3000/materias/laboral-rrhh`.

## Concerns

None blocking.
