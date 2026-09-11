# OT-GROWTH-CORE-001 — Contrato mínimo Growth Core V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CORE-001 |
| Tipo | Contrato (solo documentación) |
| Fecha | 2026-09-04 |
| Estado | **CERRADA · APTO** |
| ADR | [ADR-010 — Contrato mínimo Growth Core V1](../../architecture/ADR-010.md) |
| Predecesora | [OT-GROWTH-CORE-AUDIT-001](../OT-GROWTH-CORE-AUDIT-001/README.md) |
| Siguiente | [OT-GROWTH-CORE-002](../OT-GROWTH-CORE-002/README.md) |
| Criterio APTO | Se puede implementar el núcleo sin inventar CRM, sin tocar Identity/editorial y sin reemplazar interesados, forms, Workflow ni Event Bus |

Normativo: **[ADR-010](../../architecture/ADR-010.md)**. Esta OT no implementa.

---

## Objetivo

Fijar el modelo mínimo reutilizable que conecta las señales ya existentes de Growth OS:

**Persona → Origen → Oportunidad → Actividad → Próxima acción**

## Alcance

- Contrato de los 5 conceptos, SSOT, claves, índices, dedupe, idempotencia e ingestión.
- Relación exacta con `portal_interesados`, Experience Forms/submissions, Workflow, Event Bus y handoff a Aprende Hoy.
- Lista ordenada de OTs de implementación.

Fuera: código, UI, migraciones, backfill, attribution, motor de tareas, CRM paralelo.

## Arquitectura

Reutiliza ADR-005 (Workflow), ADR-006 (Event Bus), ADR-008 (tenantId), ADR-009 (producto ≠ Aprende Hoy), handoff OT-PORTAL-004. No reabre SAAS ni Productization. No reabre Identity Master ≠ Espacio ni Platform Admin.

## UX / Diseño / APIs / Componentes

N/A — sin superficie ni endpoints en esta OT. Superficie futura: admin del Espacio, nunca `/platform`.

## Base de datos (contrato)

| Colección | SSOT de |
| --- | --- |
| `growth_personas` | Persona |
| *(ninguna)* | Origen — value object en Persona (primer toque) y Oportunidad |
| `growth_oportunidades` | Oportunidad + `nextAction` |
| `growth_actividades` | Actividad (append-only) |
| `growth_space_config` | Tipos/etiquetas de oportunidad por Espacio |

Campo canónico `tenantId`. Fuentes legacy conservan `tenant`. Detalle: ADR-010 §1 y §5.

## Seguridad

PII (email/teléfono) aislada por Espacio. Dedupe nunca cruza `tenantId`. Operador de plataforma ≠ visibilidad de Personas de un cliente.

## Validaciones

Definidas en ADR-010 (alta con email y/o teléfono; conflicto email/teléfono sin merge ni auto-elección; ingestKey único). No se ejecutan aquí.

---

## Contrato corto

### Modelo

Persona comercial única por Espacio. Origen = de dónde llegó (sin attribution). Oportunidad = intención genérica configurable. Actividad = timeline append-only. Próxima acción = qué / cuándo / quién, embebida en la Oportunidad.

### Relaciones

Una Persona, N Oportunidades. Cada Oportunidad 0..1 `nextAction`. Actividad cuelga de Persona y, si aplica, de Oportunidad. `portal_interesados` y submissions **alimentan**; no se sustituyen. Workflow instancia la Oportunidad. Event Bus publica; no es el timeline.

### Estados mínimos

Persona: `active` (V1). Oportunidad (default Workflow `growth.opportunity`): `open` → `active` → `won` \| `lost` \| `handed_off` \| `archived`. Tras handoff de admisión: `handed_off` (salida de Growth OS como dueño del proceso académico). Sin estados de matrícula/alumno.

### Frontera Aprende Hoy

| Producto | Dueño de |
| --- | --- |
| **Growth OS** | Persona · Interesado · Oportunidad · seguimiento · handoff |
| **Aprende Hoy** | Postulante formal · admisión · matrícula · estudiante · operación académica |

Growth OS conserva Persona, Origen y resultado del handoff para seguimiento / atribución.

### Ingestión

Después de persistir la fuente. Admisión → `conversion`. contact / information_request → `inquiry`. event_registration → `registration`. Jornadas, justificaciones, testimonios, subscription: **no** en V1. Dedupe por email/teléfono normalizados; si apuntan a Personas distintas → `identity_conflict`, sin merge ni auto-elección; fuente intacta. Idempotencia por `ingestKey`.

### Aislamiento

Todo `tenantId`. Índices con prefijo de Espacio. Unique sparse de email y de teléfono. UI Growth Core no entra en `/platform`.

### Compatibilidad

Interesados, forms, adapter Aprende Hoy, Identity y `content_people` intactos. Dual-write: fuente primero; si Growth falla, no se revierte la captación. Colecciones `crm_*` prohibidas.

---

## OTs de implementación (orden exacto)

Tras este contrato (**sin código aquí**):

| # | OT | Entrega |
| --- | ---: | --- |
| 1 | **[OT-GROWTH-CORE-002](../OT-GROWTH-CORE-002/README.md)** | Persistencia Persona + Origen + dedupe + índices `growth_personas` |
| 2 | **[OT-GROWTH-CORE-003](../OT-GROWTH-CORE-003/README.md)** | Oportunidad genérica + Workflow default + `nextAction` + `growth_space_config` |
| 3 | **[OT-GROWTH-CORE-004](../OT-GROWTH-CORE-004/README.md)** | Actividad append-only + tipos en Event Bus (el existente) |
| 4 | **[OT-GROWTH-CORE-005](../OT-GROWTH-CORE-005/README.md)** | Ingestión idempotente: interesado + `processFormDestination` (después de persistir) · **CERRADA · APTO** |
| 5 | **[OT-GROWTH-CORE-006](../OT-GROWTH-CORE-006/README.md)** | Backfill de `portal_interesados` y submissions V1 ya existentes · **CERRADA · APTO** |
| 6 | **[OT-GROWTH-CORE-007](../OT-GROWTH-CORE-007/README.md)** | Listado/ficha en `/admin` del Espacio (no `/platform`) — **CERRADA · APTO VISUAL** |
| — | **[OT-GROWTH-CORE-CLOSE-001](../OT-GROWTH-CORE-CLOSE-001/README.md)** | Acta de cierre Growth Core V1 — **CERRADO · APTO** |

002–005 = núcleo. 006 = datos históricos. 007 = primera superficie. CLOSE-001 = acta V1. Ninguna abre recorridos, planes, attribution, CRM académico ni CORE-008.

## Documentación

- Creado: este README + [ADR-010](../../architecture/ADR-010.md)
- Actualizado: Handbook, glosario, `docs/README.md`, README de entrada, puntero en CORE-AUDIT-001, D6 de ADR-009
- Ajuste final 2026-09-04: frontera Aprende Hoy + conflicto identity (ADR-010 §3 / §4.2)

## Criterios de aceptación

- [x] Cinco conceptos con SSOT, sin CRM paralelo ni segunda Persona ni segundo bus
- [x] Persona ≠ `identity_users` ≠ `content_people`; dedupe email/teléfono con cambio y conflicto (`identity_conflict`, sin merge ni auto-elección)
- [x] Origen sin motor de attribution; Oportunidad genérica (no estados educativos hardcodeados)
- [x] Actividad append-only; Próxima acción explícita sin motor de tareas
- [x] `portal_interesados` y submissions alimentan; `handed_off` cierra dueño académico en Growth; Growth conserva Persona / Origen / resultado
- [x] Índices, idempotencia e ingestión definidos
- [x] OTs de implementación ordenadas
- [x] Sin código, UI ni migraciones en esta OT

## Restricciones

- No tocar producción ni schemas vivos
- No reabrir SAAS, Productization, branding, Shell ni Platform Admin
- Baseline: esta OT no corre tests (solo docs)

---

## Veredicto

**CERRADA · APTO** — contrato suficiente. Abrir **[OT-GROWTH-CORE-002](../OT-GROWTH-CORE-002/README.md)** (Persona + Origen + dedupe).
