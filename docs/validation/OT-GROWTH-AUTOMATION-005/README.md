# OT-GROWTH-AUTOMATION-005 — Runner de esperas y reanudación

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-AUTOMATION-005 |
| Tipo | Implementación (infraestructura WAIT) |
| Fecha | 2026-09-07 |
| Estado | **ENTREGADA · APTO TÉCNICO** |
| ADR | [ADR-011](../../architecture/ADR-011.md) |
| Entrada | [AUTOMATION-003](../OT-GROWTH-AUTOMATION-003/README.md) · Event Bus ([EVENTS.md](../../core/EVENTS.md)) · `core_scheduled_events` |
| Criterio | Acción → Esperar → Continuar sin mantener HTTP abierto; flush fuera del request; idempotencia; aislamiento `tenantId` |

---

## REUTILIZÓ

| Pieza | Origen |
| --- | --- |
| `core_scheduled_events` / `schedule()` / `flushScheduledEvents()` | Event Bus existente |
| `dispatch` / subscribers / DLQ | ADR-006 |
| Runtime Automatizaciones | AUTOMATION-003 (`handleGrowthAutomationEvent`) |
| Claims anti-bucle | `reentrancy.ts` (ampliado con `releaseAutomationAttempt`) |
| Acciones | `sales-ops` (sin lógica paralela) |

**No** se creó segundo scheduler, Event Bus ni Workflow Engine.

## IMPLEMENTÓ

- Claim atómico `scheduled → publishing → published` (o release a `scheduled` si falla)
- Evento `GrowthAutomationResume` + handler `growth.automations.resume`
- Catálogo: `Trigger → Condición* → Acción+ → (Wait → Acción+)?`
- Runtime: pre-wait ejecuta y programa; resume continúa post-wait con `resumeKey`
- Despertador mínimo: poll opcional (`SCHEDULED_EVENTS_POLL_MS`) + `POST /api/events/scheduled/flush` + script CLI

## CÓMO DESPIERTA

1. Persistencia en Mongo (`core_scheduled_events`) — sobrevive reinicios.
2. Runner in-process si `SCHEDULED_EVENTS_POLL_MS ≥ 1000`.
3. Cron/worker externo: `Authorization: Bearer $CRON_SECRET` → `POST /api/events/scheduled/flush`.
4. Prueba técnica: mismo endpoint con `events.manage`, o script `scripts/flush-scheduled-events.ts`.

## REANUDACIÓN

`schedule({ type: GrowthAutomationResume, tenantId, payload: { automationId, version, sourceEventId, resumeKey, oportunidadId, … } })` → flush → `dispatch` → runtime post-wait (sin reevaluar trigger/condiciones).

## IDEMPOTENCIA

| Capa | Mecanismo |
| --- | --- |
| Wake | Claim atómico del documento programado |
| Pre-wait | Claim `(tenantId, automationId, version, sourceEventId)` |
| Post-wait | Claim por `resumeKey` estable |
| Fallo acción | `releaseAutomationAttempt` + release del programado → reintento sin éxito duplicado |

## AISLAMIENTO

`tenantId` en documento programado, publish y payload; mismatch evento/payload → `skipped_tenant`. Tenant A no reanuda B.

## PRUEBAS

```bash
npx tsx --test tests/baseline/growth-automation-005.test.ts
npx tsx --test tests/baseline/growth-automation-002.test.ts tests/baseline/growth-automation-003.test.ts tests/baseline/growth-automation-004.test.ts
npx tsc --noEmit
```

## LÍMITES

| No en esta OT |
| --- |
| UI de WAIT en `/admin/automatizaciones` |
| Canvas / drag & drop / IA / email / WhatsApp |
| Historial visual de runs / métricas |
| Segundo bus / scheduler / Workflow Engine |
| Cambios al Admin Shell |

## Siguiente OT (propuesta; no abierta)

**OT-GROWTH-AUTOMATION-006** — Exponer WAIT en la UI operativa de Automatizaciones (Acción → Esperar X → Continuar) sobre el runner 005; sin canvas.

---

**Veredicto: APTO TÉCNICO** — infraestructura de espera/reanudación cableada al Event Bus y `core_scheduled_events` existentes.
