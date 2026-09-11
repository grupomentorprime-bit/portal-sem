# OT-GROWTH-AUTOMATION-001 — Contrato mínimo Automatizaciones Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-AUTOMATION-001 |
| Tipo | Contrato (solo documentación) |
| Fecha | 2026-09-06 |
| Estado | **CERRADA · APTO** |
| ADR | [ADR-011 — Contrato mínimo Automatizaciones Growth OS V1](../../architecture/ADR-011.md) |
| Entrada | [ADR-010](../../architecture/ADR-010.md) · [SALES-001](../OT-GROWTH-SALES-001/README.md) · [ADR-005](../../architecture/ADR-005.md) · [ADR-006](../../architecture/ADR-006.md) |
| Criterio APTO | Queda explícito Automatización ≠ Workflow; modelo Evento→…→Resultado; V1 contractual acotada; WAIT conceptual sin habilitar; sin runtime |

Normativo: **[ADR-011](../../architecture/ADR-011.md)**. Esta OT no implementa.

---

## Objetivo

Fijar el contrato mínimo de Automatizaciones de Growth OS antes de cualquier ejecución, subscriber, colección o UI.

## Entrega (EXISTE → REUTILIZA → CONTRATO → LÍMITES → SIGUIENTE PASO)

Detalle en ADR-011. Resumen:

### EXISTE

Growth Core cerrado; eventos `Growth*` en el bus; Workflow de Oportunidad; `sales-ops`; `core_scheduled_events` sin runner; nav «Automatizaciones» solo visual.

### REUTILIZA

Event Bus, Growth Core, Workflow **solo vía acciones**, `sales-ops`, Identity/membresía, patrón de actor sistema (`growth-ingest` → `growth-automation`).

**No** reutilizar `workflow_definitions` como almacén de Automatizaciones.

### CONTRATO

- **Automatización ≠ Workflow de estados**
- Modelo: **Evento → Trigger → Condición → Acción → Espera → Reanudación → Resultado**
- Pertenencia obligatoria a Espacio (`tenantId`); definición **versionada**
- Triggers V1: únicamente `Growth*` ya publicados
- Condiciones V1: origen, estado, `typeKey`, presencia/ausencia de `nextAction`
- Acciones V1: solo operaciones reales de `sales-ops`
- Permisos: `growth.automations.view` · `growth.automations.manage`
- Actor sistema `growth-automation` ≠ visitante del evento
- Aislamiento multi-tenant obligatorio
- **WAIT** conceptual; **no habilitado** (falta runner de programados)

### LÍMITES (no en esta OT)

Ejecución, subscriber, worker, WAIT, colecciones nuevas, editor visual, nodos, IA, email Growth, WhatsApp, “respondió/no respondió”, segundo Event Bus, segundo Workflow Engine, segundo Growth Core.

### SIGUIENTE PASO (propuesta; no abierta)

**OT-GROWTH-AUTOMATION-002** — Persistencia de definiciones versionadas por Espacio + IAM de permisos; sin ejecución, sin WAIT, sin editor.

---

## Criterios de aceptación

- [x] Automatización ≠ Workflow dejado explícito
- [x] Modelo conceptual Evento → … → Resultado documentado
- [x] V1: tenantId, versionado, triggers Growth*, condiciones listadas, acciones `sales-ops`
- [x] Permisos y actor de sistema definidos
- [x] WAIT conceptual sin habilitar, con motivo (`core_scheduled_events` sin runner)
- [x] Sin código de runtime, sin colecciones, sin subscriber
- [x] Una sola OT siguiente propuesta, no abierta

## Restricciones

- No tocar producción ni runtime
- No reabrir ADR-005 / 006 / 010 salvo cita
- No inventar canales ni segundo core

**Veredicto: APTO** — contrato suficiente para abrir **OT-GROWTH-AUTOMATION-002** cuando se autorice.
