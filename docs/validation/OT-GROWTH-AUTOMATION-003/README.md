# OT-GROWTH-AUTOMATION-003 — Runtime mínimo Automatizaciones (Event Bus → sales-ops)

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-AUTOMATION-003 |
| Tipo | Implementación (runtime) |
| Fecha | 2026-09-06 |
| Estado | **CERRADA · APTO TÉCNICO** |
| ADR | [ADR-011](../../architecture/ADR-011.md) |
| Entrada | [AUTOMATION-002](../OT-GROWTH-AUTOMATION-002/README.md) · [SALES-001](../OT-GROWTH-SALES-001/README.md) · Event Bus ([ADR-006](../../architecture/ADR-006.md)) |
| Criterio | Subscriber in-process: evento `Growth*` → Automatizaciones `active` (versión publicada) → condiciones ADR-011 → acción `sales-ops` con actor `growth-automation`; sin WAIT ni UI |

---

## Objetivo

Primer runtime mínimo de Automatizaciones reutilizando exclusivamente:

**Event Bus → Automatización active → Condiciones → Acción sales-ops → Resultado**

## REUTILIZÓ

| Pieza | Origen |
| --- | --- |
| `subscribeMany` / dispatcher / DLQ | Event Bus existente (`src/core/events`) |
| Tipos `Growth*` | `GROWTH_DOMAIN_EVENT_TYPES` |
| Definiciones versionadas | `growth_automations` / `growth_automation_versions` (AUTOMATION-002) |
| Acciones | `sales-ops` (`salesTransitionOpportunity` / follow-up / nextAction) — puerto, sin lógica paralela |
| Condiciones | Catálogo cerrado ADR-011 sobre Oportunidad del mismo `tenantId` |
| Actor | `growth-automation` (constante AUTOMATION-002) |

**No** se creó segundo bus, dispatcher ni capa de acciones distinta de Ventas.

## IMPLEMENTÓ

- Handler `growth.automations` registrado en `registerBuiltinHandlers` vía `subscribeMany(Growth*)`
- Runtime core inyectable: `handleGrowthAutomationEvent` (fail-soft; no lanza)
- Solo candidatas `status=active` + `publishedVersion` del Espacio del evento
- Evaluación de condiciones AND; resolución de `payload.oportunidadId`
- Ejecución de acciones declaradas con actor fijo `growth-automation` (nunca el visitante del evento)
- Adapter producción: `src/lib/growth/automations-runtime.ts` → Mongo + `sales-ops`

## PROTECCIÓN DE BUCLES

Un `sales-ops` puede republicar `Growth*` y reentrar el mismo subscriber. Protección mínima, trazable e idempotente:

1. **Stack ALS** (`reentrancy.ts`): `automationId` en cadena causal in-process; reentrada de la misma Automatización → `skipped_reentrant`
2. **Claim idempotente** `(tenantId, automationId, version, sourceEventId)` → `skipped_duplicate` (sin ejecuciones silenciosas ante reintento)
3. **Tope de profundidad** de cadena (`max_depth`)

No se usan flags globales ni se silencian eventos del bus.

## AISLAMIENTO

- Query siempre por `tenantId` del evento
- Oportunidad verificada del mismo Espacio
- Fallo de una Automatización no aborta otras ni el publish origen
- Tenant A no ve ni ejecuta definiciones de B

## PRUEBAS

```bash
npx tsx --test tests/baseline/growth-automation-003.test.ts
npx tsc --noEmit
```

Cubierto: trigger match/mismatch; condición true/false; draft/disabled; aislamiento tenant; versión publicada vs borrador; actor `growth-automation`; reentrada/bucle; acción inválida; eventos/actividad normales de sales-ops; fail-soft entre Automatizaciones.

## LÍMITES (no en esta OT)

| Prohibido / diferido |
| --- |
| WAIT / runner de `core_scheduled_events` |
| Editor visual / UI `/admin/automatizaciones` |
| IA, email Growth, WhatsApp |
| Nuevos tipos de acción fuera del catálogo |
| Segundo Event Bus / Workflow Engine |
| Nueva lógica de Ventas |
| Colección persistente de intentos/runs |

## Siguiente OT (propuesta; no abierta)

**OT-GROWTH-AUTOMATION-004** — Superficie admin mínima `/admin/automatizaciones` (lista + crear/editar borrador + publicar/activar) sobre las APIs de AUTOMATION-002; sin canvas visual, sin WAIT, sin cambios de runtime.

---

**Veredicto: APTO TÉCNICO** — runtime mínimo cableado al Event Bus existente, con aislamiento multi-tenant y protección anti-bucle, sin WAIT ni UI.
