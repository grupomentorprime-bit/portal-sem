# OT-GROWTH-CORE-005 — Ingestión en vivo

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CORE-005 |
| Tipo | Implementación |
| Fecha | 2026-09-05 |
| Estado | **CERRADA · APTO** |
| ADR | [ADR-010](../../architecture/ADR-010.md) §4 · §6 |
| Predecesora | [OT-GROWTH-CORE-004](../OT-GROWTH-CORE-004/README.md) · **CERRADA · APTO** |
| Siguiente | [OT-GROWTH-CORE-006](../OT-GROWTH-CORE-006/README.md) (backfill) — **CERRADA · APTO** |
| Criterio APTO | Fuentes existentes proyectan a Growth Core tras persistir; idempotente; fail-soft; handoff Aprende Hoy intacto; sin UI ni backfill |

---

## Objetivo

Conectar las señales de captación ya vivas a Growth Core **sin reemplazarlas**: dual-write después de persistir la fuente.

## Alcance

- Después de persistir: `portal_interesados` y `experience_form_submissions` (destinos V1)
- `information_request` / `contact` → Oportunidad `inquiry`
- `event_registration` → `registration`
- Admisión / postulación → `conversion` (+ `handed_off` si handoff entregado)
- Persona idempotente (CORE-002); Oportunidad según ADR-010 (CORE-003); Actividad (CORE-004)
- Preservar `ingestKey`; fallo Growth **no** revierte la fuente
- Cablear Event Bus real + Workflow `growth.opportunity` en producción
- Tests focalizados + baseline + typecheck + `npx next build`

## Fuera de alcance

- Backfill histórico → CORE-006
- UI → CORE-007
- Campañas, inbox, automatizaciones, IA
- Jornadas, justificaciones, testimonios, suscripciones
- Cambiar payload / adapter Aprende Hoy
- Abrir CORE-006 aquí

## Contrato (ADR-010 §4)

| Fuente | Destino Growth |
| --- | --- |
| `POST /api/admission/apply` → `portal_interesados` | Persona · Origen `admission` · Oportunidad `conversion` · Actividad `application_received` (+ handoff) |
| destination `contact` / `information_request` | Persona · Origen `form` · Oportunidad `inquiry` · `form_submitted` |
| destination `event_registration` | Persona · Origen `event` · Oportunidad `registration` · `form_submitted` |
| attendance / absence / testimonial / subscription | Nada en V1 |

Orden: **fuente primero**; `processFormDestination` corre **después** de `save`. Conflicto email/teléfono → `identity_conflict`, fuente intacta.

---

## Entrega

### Qué reutilizó

- Persona / Oportunidad / Actividad / Event Bus (CORE-002–004)
- `createInteresadoFromApplication` + AdmissionAdapter (handoff intacto)
- `submitExperienceForm` / `processFormDestination`
- Workflow template `growth.opportunity`

### Qué cambió

| Pieza | Rol |
| --- | --- |
| `src/core/growth/ingest.ts` | Proyección idempotente `projectGrowthFromSignal` (+ Safe) |
| `src/core/growth/ingest-contact.ts` | Extracción email/teléfono/nombre desde forms |
| `src/core/growth/ingest-memory.ts` | Harness tests (actividades compartidas) |
| `src/lib/growth/live-ingest.ts` | Cableado Mongo + fail-soft |
| `src/lib/growth/opportunity-workflow.ts` | Port Workflow sin sesión de operador |
| `src/lib/growth/event-bus.ts` | Adapter a `core_events` |
| `interesado-repository` / `engine` | Dual-write **después** de persistir |
| `tests/baseline/growth-ingest.test.ts` | Validaciones de la OT |

**No tocó:** payload Aprende Hoy, `identity_users`, `content_people`, UI, `/platform` (branding), backfill.

### Pruebas

```bash
npx tsx --test tests/baseline/growth-ingest.test.ts
npm run test:baseline
npx tsc --noEmit
npx next build
```

| Caso | Resultado |
| --- | --- |
| Reintento no duplica Persona/Oportunidad/Actividad | OK |
| Mismo contacto por dos fuentes → una Persona | OK |
| Tenants aislados | OK |
| identity_conflict conserva fuente / sin Oportunidad nueva | OK |
| Fallo proyección no rompe captación (Safe) | OK |
| Handoff adapter sin cambios de contrato | OK |
| Destinos fuera de V1 omitidos | OK |
| Baseline + typecheck + `npx next build` | OK |

Nota: `npm run build` (script con `check:branding`) puede fallar por colores fuera de tokens en `src/app/platform/page.tsx` (UX Shell / Platform Admin — **deuda ajena, fuera de CORE-005**). No se tocó `/platform`. El compile Next (`npx next build`) es el gate de esta OT.

### Riesgos / deudas

- Backfill histórico → [CORE-006](../OT-GROWTH-CORE-006/README.md) · **CERRADA · APTO**
- UI admin → CORE-007
- Branding gate de `/platform` preexistente
- Workflow de captación usa actor sistema `growth-ingest` (sin auth de operador)

## Criterios de aceptación

- [x] Proyección después de persistir fuentes V1
- [x] Mapeo inquiry / registration / conversion según ADR-010
- [x] Persona idempotente; Oportunidad por reglas + `findBySource`
- [x] Actividad + `ingestKey`; reintento no duplica
- [x] identity_conflict sin romper captación
- [x] Fallo Growth no revierte fuente
- [x] Handoff Aprende Hoy intacto
- [x] Sin UI; sin abrir CORE-006 aquí
- [x] Baseline + typecheck + build

## Restricciones

- No reabrir SAAS, Productization, branding, Shell, Platform Admin
- No colecciones `crm_*`
- No cambiar adapter / payload Aprende Hoy
- No abrir CORE-006 hasta cerrar esta

---

## Veredicto

**CERRADA · APTO** — ingestión en vivo lista. Siguiente: [OT-GROWTH-CORE-006](../OT-GROWTH-CORE-006/README.md) (backfill) · **CERRADA · APTO**.
