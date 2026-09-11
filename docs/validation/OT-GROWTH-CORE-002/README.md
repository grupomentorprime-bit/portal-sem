# OT-GROWTH-CORE-002 — Persona + Origen + dedupe

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CORE-002 |
| Tipo | Implementación |
| Fecha | 2026-09-04 |
| Estado | **CERRADA · APTO** |
| ADR | [ADR-010](../../architecture/ADR-010.md) §1.1 · §1.2 · §4.2 · §5 |
| Predecesora | [OT-GROWTH-CORE-001](../OT-GROWTH-CORE-001/README.md) · **CERRADA · APTO** |
| Siguiente | [OT-GROWTH-CORE-003](../OT-GROWTH-CORE-003/README.md) · **CERRADA · APTO** — no abrir CORE-004 hasta cerrar CORE-003 |
| Criterio APTO | Existe `growth_personas` con Origen embebido, dedupe por Espacio y conflicto `identity_conflict` sin merge ni auto-elección; captación intacta |

---

## Objetivo

Primera capa del núcleo: persistir **Persona** + **Origen** (value object) con dedupe e índices por `tenantId`, según ADR-010. Sin Oportunidad, sin Actividad collection completa (salvo el hecho de conflicto si hace falta stub), sin ingestión cableada a admisión/forms, sin UI.

## Alcance

- Colección `growth_personas` + tipos/helpers de dominio
- Campos Persona (ADR-010 §1.1) e `origin` inmutable al alta (ADR-010 §1.2)
- Normalización email / teléfono (reutilizar helpers existentes)
- Dedupe dentro del Espacio + regla de conflicto
- Índices unique sparse `{ tenantId, emailNormalized }` y `{ tenantId, phoneNormalized }` + `{ tenantId, updatedAt: -1 }`
- Tests de unidad / baseline del upsert y del conflicto

## Fuera de alcance

- `growth_oportunidades`, Workflow `growth.opportunity`, `nextAction` → CORE-003
- `growth_actividades` completa + Event Bus types → CORE-004 (aquí solo lo mínimo para registrar `identity_conflict` si el upsert lo exige)
- Cableado `createInteresadoFromApplication` / `processFormDestination` → CORE-005
- Backfill → CORE-006
- UI `/admin` → CORE-007
- Merge de Personas, attribution, UI de resolución de conflictos

## Contrato (ADR-010)

### Persona

Identidad comercial única por Espacio. Alta exige **al menos** email o teléfono normalizado. Sin ninguno → no hay Persona (la fuente se conserva en OTs posteriores; aquí el helper no inventa identidad).

`origin` = primer Origen; **inmutable** tras el alta.

### Origen

Snapshot: `kind`, `channel?`, `formId?`, `formDestination?`, `campaign?`, `referrer?`, `sourceCollection` / `sourceId`, `capturedAt`. Sin attribution.

### Dedupe (§4.2)

Ámbito: un solo `tenantId`.

1. Normalizar email y teléfono.
2. Buscar por `emailNormalized` (si viene).
3. Si no hay match, buscar por `phoneNormalized` (si viene).
4. Match único → misma Persona; completar canal faltante; alias en `emails[]` / `phones[]`.
5. Sin match → alta.
6. **Conflicto** (email → Persona A, teléfono → Persona B): **no fusionar**; **no elegir** automáticamente email ni teléfono; registrar `identity_conflict` (punteros a ambas Personas + fuente); no romper captación (la fuente vive fuera de este upsert; dual-write lo garantiza en CORE-005). Resolución manual **fuera de V1**.

### Frontera Aprende Hoy (no negociable aquí)

Growth OS dueño de Persona / Interesado / Oportunidad / seguimiento / handoff. Aprende Hoy dueño de postulante formal / admisión / matrícula / estudiante / operación académica. Esta OT **no** toca el adapter ni estados académicos.

## Entrega

### Qué reutilizó

- `normalizeEmail` (`src/lib/validation/identity.ts`)
- `normalizeChilePhone` / `extractChileNationalDigits` / `formatChilePhoneDisplay` (`src/lib/experience/forms/phone-chile.ts`)
- Patrón de migración idempotente + `ensureIndex` (SAAS-003 / 007)
- `ObjectId` string ids; Mongo via `Db` inyectable (mismo estilo que tenant/admission)

### Qué cambió

| Pieza | Rol |
| --- | --- |
| `src/core/growth/*` | Tipos, normalización, Origen, `upsertGrowthPersona`, `updateGrowthPersonaContact`, store memoria/Mongo, `buildGrowthIngestKey` |
| `013-growth-personas` | Índices sparse unique email/teléfono + `updatedAt` + `ingestKey` stub en actividades |
| `scripts/ensure-mongodb-indexes.ts` | También asegura índices Growth |
| `tests/baseline/growth-personas.test.ts` | Casos de dedupe / conflicto / idempotencia / frontera |

**No tocó:** `identity_users`, `content_people`, `portal_interesados`, adapter Aprende Hoy, forms, UI.

### Pruebas

```bash
npx tsx --test tests/baseline/growth-personas.test.ts
npm run test:baseline
npx tsc --noEmit
npm run build
```

| Caso | Resultado |
| --- | --- |
| Alta solo email / solo teléfono / ambos | OK |
| Rematch email o teléfono | Misma Persona; canal completado; Origen inmutable |
| Email→A y teléfono→B | `identity_conflict`; sin merge |
| Sin email ni teléfono | `missing_identity` |
| Mismo contacto en otro `tenantId` | Personas distintas |
| Reintento idempotente | Sin duplicar Persona ni actividad de conflicto |
| Cambio posterior de email | Alias conservado; conflicto si clave ajena |
| Captación existente | `interesado-repository` sin referencias Growth |

### Riesgos / deudas

- Stub de `growth_actividades` solo para `identity_conflict` — modelo completo en CORE-004 (Event Bus types, resto de kinds).
- Upsert **no** cableado a admisión/forms (CORE-005); helpers listos vía `openGrowthPersonaStore` / `upsertGrowthPersona`.
- Sparse unique: campos ausentes (no `null`) para no chocar Personas solo-email con solo-teléfono.
- Merge manual de Personas fuera de V1.

## Seguridad

- Toda query con `tenantId` primero.
- PII (email/teléfono) aislada por Espacio.
- Sin endpoints nuevos en esta OT (helpers internos / repositorio).

## Criterios de aceptación

- [x] Colección / modelo `growth_personas` según ADR-010 §1.1–§1.2
- [x] Índices §5 creados (migración o ensure idempotente del núcleo)
- [x] Dedupe §4.2 implementado; conflicto sin merge ni auto-elección
- [x] Origen inmutable al alta
- [x] Aislamiento por `tenantId`
- [x] Sin Oportunidad, ingestión cableada ni UI
- [x] Baseline + typecheck

## Restricciones

- No reabrir SAAS, Productization, branding, Shell, Platform Admin ni Identity Master ≠ Espacio
- No colecciones `crm_*`
- No cambiar payload / adapter Aprende Hoy

---

## Veredicto

**CERRADA · APTO** — Persona + Origen + dedupe listos. Siguiente: **[OT-GROWTH-CORE-003](../OT-GROWTH-CORE-003/README.md)** (cerrada).
