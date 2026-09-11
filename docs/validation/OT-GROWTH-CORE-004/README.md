# OT-GROWTH-CORE-004 — Actividad + Event Bus

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CORE-004 |
| Tipo | Implementación |
| Fecha | 2026-09-04 |
| Estado | **CERRADA · APTO** |
| ADR | [ADR-010](../../architecture/ADR-010.md) §1.4 · §4.3 · §4.4 · §5 |
| Predecesora | [OT-GROWTH-CORE-003](../OT-GROWTH-CORE-003/README.md) · **CERRADA · APTO** |
| Siguiente | [OT-GROWTH-CORE-005](../OT-GROWTH-CORE-005/README.md) · **CERRADA · APTO** |
| Criterio APTO | `growth_actividades` SSOT append-only + tipos en Event Bus existente; stub `identity_conflict` unificado; sin segundo bus ni UI |

---

## Objetivo

Tercera capa del núcleo: persistir **Actividad** como timeline comercial append-only y publicar al **Event Bus** (`core_events`) tras el insert. Sin ingestión cableada, sin UI, sin backfill.

## Alcance

- Colección `growth_actividades` como SSOT del timeline (modelo definitivo)
- Solo insert / append-only (`eventId` técnico post-bus permitido)
- `tenantId` + `personaId` obligatorios; `oportunidadId` opcional
- Kinds ADR-010 §1.4 (mínimos ejercidos: `form_submitted`, `opportunity_opened`, `opportunity_transitioned`, `next_action_set`, `handoff`, `identity_conflict`, `note`, …)
- Payload pequeño; `actorUserId` / origen vía `source*` cuando existen
- `ingestKey` idempotente (unique sparse `{ tenantId, ingestKey }`)
- Publicar evento **después** de persistir; si el bus falla, la Actividad **no** se revierte
- Reutilizar stub `identity_conflict` de CORE-002 → `recordGrowthActivity` (una sola implementación)
- Tipos Domain Event ADR-010 §4.4 en el catálogo del bus existente
- Migración `015-growth-actividades`
- Tests focalizados + baseline + typecheck + build

## Fuera de alcance

- Ingestión real desde forms/admisión → CORE-005
- Backfill → CORE-006
- UI `/admin` → CORE-007
- Campañas, inbox, automatizaciones, IA
- Segundo Event Bus o timeline paralelo

## Contrato (ADR-010)

### Actividad

Hecho comercial append-only. SSOT = `growth_actividades`. `core_events` es efecto/infraestructura, no el timeline.

### Event Bus

Tras persistir Actividad (y al abrir/transicionar vía esa Actividad), publicar en `core_events`. Tipos: `GrowthPersonaUpserted`, `GrowthOpportunityOpened`, `GrowthOpportunityTransitioned`, `GrowthActivityRecorded`, `GrowthNextActionSet`, `GrowthHandoffRecorded`.

Mapeo kind → tipo (un evento por Actividad):

| kind | Evento |
| --- | --- |
| `opportunity_opened` | `GrowthOpportunityOpened` |
| `opportunity_transitioned` | `GrowthOpportunityTransitioned` |
| `next_action_set` | `GrowthNextActionSet` |
| `handoff` | `GrowthHandoffRecorded` |
| resto | `GrowthActivityRecorded` |

---

## Entrega

### Qué reutilizó

- Colección e índices stub de CORE-002/003 (`growth_actividades`, ingestKey)
- Stores Persona / Oportunidad (mismo `recordActivity` semántico vía `activity-persist`)
- Event Bus ADR-006 (`DOMAIN_EVENT_TYPES` / `core_events`) — sin segundo bus
- `buildGrowthIngestKey`, Workflow `growth.opportunity`

### Qué cambió

| Pieza | Rol |
| --- | --- |
| `src/core/growth/activity.ts` | `recordGrowthActivity` — única vía append + publish |
| `src/core/growth/event-bus-port.ts` | Puerto inyectable + tipos Growth + memoria para tests |
| `src/core/growth/activity-persist.ts` | Insert idempotente + `setEventId` técnico |
| open / transition / nextAction / identity_conflict | Cableados a `recordGrowthActivity` |
| `src/core/events/registry` | Tipos Growth en catálogo |
| `015-growth-actividades` | Reafirma índices timeline |
| `tests/baseline/growth-actividades.test.ts` | Validaciones de la OT |

**No tocó:** `identity_users`, `content_people`, `portal_interesados`, Experience Forms, adapter Aprende Hoy, UI, `/platform`.

### Pruebas

```bash
npx tsx --test tests/baseline/growth-actividades.test.ts
npm run test:baseline
npx tsc --noEmit
npx next build
```

| Caso | Resultado |
| --- | --- |
| Append-only; mismo ingestKey no duplica | OK |
| Aislamiento por tenant | OK |
| Actividad con o sin Oportunidad | OK |
| Cambio de estado → Actividad | OK |
| Handoff → Actividad `handoff` | OK |
| Fallo Event Bus no borra Actividad | OK |
| `identity_conflict` unificado | OK |
| Admisión/forms sin referencias Growth | OK |
| Baseline completo | OK |
| `tsc --noEmit` | OK |
| `npx next build` | OK |

Nota: `npm run build` (script con `check:branding`) falla por colores fuera de tokens en `src/app/platform/page.tsx` (UX Shell / Platform Admin — **deuda ajena, fuera de esta OT**). No se tocó `/platform`. El compile Next (`npx next build`) de CORE-004 pasa.

### Riesgos / deudas

- Publisher real (`@/core/events`) es `server-only`; Growth usa puerto inyectable. Cableo producción al `publish` real en rutas/servicios (CORE-005+).
- `GrowthPersonaUpserted` registrado; aún no se publica en alta Persona (ingestión CORE-005).
- Sin endpoints ni UI en esta OT.
- Branding gate de `/platform` preexistente.

## Criterios de aceptación

- [x] `growth_actividades` SSOT append-only según ADR-010 §1.4
- [x] `ingestKey` idempotente; aislamiento por `tenantId`
- [x] Actividad con o sin Oportunidad
- [x] Transición y handoff generan Actividad
- [x] Event Bus existente; fallo no revierte Actividad
- [x] Stub `identity_conflict` convertido (una implementación)
- [x] Sin impacto en forms/admisión
- [x] Sin UI; sin abrir CORE-005 aquí
- [x] Baseline + typecheck + build

## Restricciones

- No reabrir SAAS, Productization, branding, Shell, Platform Admin
- No colecciones `crm_*` ni segundo bus
- No cambiar payload / adapter Aprende Hoy
- No abrir CORE-005 hasta cerrar esta

---

## Veredicto

**CERRADA · APTO** — Actividad + Event Bus listos. Abrir **OT-GROWTH-CORE-005** solo tras este cierre.
