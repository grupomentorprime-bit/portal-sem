# OT-GROWTH-CORE-CLOSE-001 — Cierre Growth Core V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CORE-CLOSE-001 |
| Tipo | Acta de cierre (solo documentación) |
| Fecha | 2026-09-05 |
| Estado | **CERRADA · APTO** |
| ADR | [ADR-010](../../architecture/ADR-010.md) |
| Alcance | Documental — **sin código, datos, APIs ni comportamiento** |
| Criterio APTO | Growth Core V1 responde las cinco preguntas del modelo; CORE-001→007 cerradas; superficie `/admin/personas` aprobada; sin CORE-008 ni módulos posteriores |

---

## Objetivo

Cerrar documentalmente **Growth Core V1**. Congelar el contrato cumplido y el alcance de la entrega. No implementar. No abrir CORE-008.

---

## Modelo congelado (cinco respuestas)

Growth Core V1 permite responder, en este orden:

| # | Pregunta | Concepto | SSOT / superficie |
| --- | --- | --- | --- |
| 1 | Quién es | **Persona** | `growth_personas` · ficha `/admin/personas/[id]` |
| 2 | De dónde llegó | **Origen** | Value object en Persona (primer toque) y en Oportunidad |
| 3 | Qué quiere | **Oportunidad** | `growth_oportunidades` · detalle en ficha (`?oportunidad=`) |
| 4 | Qué ha pasado | **Actividad** | `growth_actividades` (append-only) · «Qué ha pasado» |
| 5 | Qué hacer ahora | **Próxima acción** | `nextAction` embebida en Oportunidad · «Qué hacer ahora» |

---

## Confirmaciones de cierre

| Afirmación | Estado |
| --- | --- |
| Persona es la identidad central del Growth Core | Confirmado |
| Una Persona puede tener Oportunidades | Confirmado (1 → N) |
| Actividad conserva los hechos relevantes | Confirmado (append-only; no es el Event Bus) |
| Origen permite saber de dónde llegó | Confirmado (sin attribution) |
| Próxima acción indica qué conviene atender | Confirmado (embebida; sin motor de tareas) |
| Ingestión live y backfill usan el mismo contrato/mapeo | Confirmado (`projectGrowthFromSignal` / `ingest-map`; CORE-005 = CORE-006) |
| `/admin/personas` y su ficha son la primera superficie visual aprobada | Confirmado · **CORE-007 CERRADA · APTO VISUAL** |
| Personas queda como función principal del Espacio | Confirmado (nav primer nivel; 007A/007B) |
| Todo mantiene aislamiento por `tenantId` / Espacio | Confirmado |
| No existe un segundo CRM ni colecciones `crm_*` | Confirmado |

---

## Resumen CORE-001 → CORE-007

| OT | Entrega | Veredicto |
| --- | --- | --- |
| [CORE-001](../OT-GROWTH-CORE-001/README.md) | Contrato mínimo · [ADR-010](../../architecture/ADR-010.md) | **CERRADA · APTO** |
| [CORE-002](../OT-GROWTH-CORE-002/README.md) | Persona + Origen + dedupe · `growth_personas` | **CERRADA · APTO** |
| [CORE-003](../OT-GROWTH-CORE-003/README.md) | Oportunidad + Workflow `growth.opportunity` + `nextAction` | **CERRADA · APTO** |
| [CORE-004](../OT-GROWTH-CORE-004/README.md) | Actividad append-only + tipos en Event Bus existente | **CERRADA · APTO** |
| [CORE-005](../OT-GROWTH-CORE-005/README.md) | Ingestión en vivo (dual-write tras persistir fuente) | **CERRADA · APTO** |
| [CORE-006](../OT-GROWTH-CORE-006/README.md) | Backfill histórico con el mismo contrato que live | **CERRADA · APTO** |
| [CORE-007](../OT-GROWTH-CORE-007/README.md) | UI `/admin/personas` + ficha (+ [007A](../OT-GROWTH-CORE-007A/README.md) · [007B](../OT-GROWTH-CORE-007B/README.md)) | **CERRADA · APTO VISUAL** |

Auditoría previa (fuera de la cadena de implementación, pero entrada del contrato): [CORE-AUDIT-001](../OT-GROWTH-CORE-AUDIT-001/README.md).

### Evidencia visual (CORE-007)

| Captura | Contenido |
| --- | --- |
| [`admin-personas-list.png`](../OT-GROWTH-CORE-007/admin-personas-list.png) | Listado |
| [`admin-personas-empty.png`](../OT-GROWTH-CORE-007/admin-personas-empty.png) | Estado vacío |
| [`admin-persona-detail.png`](../OT-GROWTH-CORE-007/admin-persona-detail.png) | Ficha Persona |
| [`admin-oportunidad-detail.png`](../OT-GROWTH-CORE-007/admin-oportunidad-detail.png) | Ficha con Oportunidad |

Validación visual humana **aprobada** (2026-09-05).

---

## Fuera de V1 (no abierto)

- **CORE-008** — no se abre
- Ventas, Mensajes, Campañas, Automatizaciones, IA, Analítica
- Merge de Personas, attribution, motor de tareas, CRM paralelo / `crm_*`
- UI Growth Core en `/platform`
- Cambios a SaaS Foundation, Shell, Platform Admin, Identity Master ≠ Espacio, branding, captación, Aprende Hoy

---

## Restricciones de esta OT

- Solo documentación / acta
- Sin código, migraciones, datos, APIs ni cambios de comportamiento
- Sin reabrir OTs de implementación salvo OT futura explícita

---

## Criterios de aceptación

- [x] Acta registra las cinco respuestas del modelo
- [x] Confirmaciones de cierre listadas y afirmadas
- [x] Resumen CORE-001 → CORE-007 con veredictos
- [x] CORE-007 registrada **CERRADA · APTO VISUAL**
- [x] Growth Core V1 registrada **CERRADO · APTO**
- [x] CORE-008 no abierta
- [x] Sin cambios de código en esta OT

---

## Veredicto

### CORE-007 = **CERRADA · APTO VISUAL**

Primera superficie de Personas en `/admin` del Espacio aprobada (listado + ficha + detalle de Oportunidad). Ajustes 007A/007B cerrados con la misma validación.

### Growth Core V1 = **CERRADO · APTO**

El núcleo comercial mínimo está cerrado: Persona → Origen → Oportunidad → Actividad → Próxima acción, con ingestión live y backfill unificados, aislamiento por Espacio, y Personas como función principal del admin del Espacio. Sin segundo CRM.

**No abrir CORE-008.** Trabajo posterior solo con OT futura explícita.
