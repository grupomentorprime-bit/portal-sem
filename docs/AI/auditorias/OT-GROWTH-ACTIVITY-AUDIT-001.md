# OT-GROWTH-ACTIVITY-AUDIT-001 — Auditoría del historial de actividad de Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-ACTIVITY-AUDIT-001 |
| Tipo | Auditoría / contrato (sin implementación) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-11 |
| Entrada | Menú Growth OS «Actividad»; [ADR-010](../../architecture/ADR-010.md); [OT-GROWTH-CORE-CLOSE-001](../../validation/OT-GROWTH-CORE-CLOSE-001/README.md) |
| Estado | **CERRADA · APTO CON AJUSTES** |
| Alcance | Revisar registros, eventos y motores existentes para un historial comercial real en «Actividad» |
| Fuera de alcance | Implementación · colección nueva · segundo activity engine · cambios a `growth_actividades` / Mensajes / Ventas / Automatizaciones / Shell · DNS / Dokploy / Cloudflare / Meta · datos simulados |

**Restricciones cumplidas:** sin código de producto; sin modificar colecciones ni motores; multi-tenant obligatorio en el contrato propuesto; sin abrir OT de implementación automáticamente.

---

## Gate final

**APTO CON AJUSTES · recomendación B**

Sí se puede construir **Actividad** como historial comercial **reutilizando** lo existente, **sin** segundo sistema de auditoría ni timeline paralelo.

La fuente visible canónica ya está definida en ADR-010: **`growth_actividades`** (append-only). `core_events` es el Event Bus (infraestructura), no la UI. La página a la que apunta hoy el menú **no** es ese historial: muestra auditoría de Identity/CMS.

La única brecha material para el contrato UX deseado es **Mensajes** (viven en `growth_mensajes` + eventos, **sin** proyección a `growth_actividades`). El resto (Captación, Ventas, Automatizaciones vía sales-ops) ya deja hechos en `growth_actividades`.

---

## Pregunta principal

> ¿Podemos construir Actividad reutilizando los registros, eventos y motores existentes, sin crear un segundo sistema de auditoría o timeline?

**Sí.** V1 debe ser una **vista/adaptador de lectura** sobre `growth_actividades` (más resolución de nombres de Persona/Oportunidad/actor), reutilizando el humanizado ya presente en Inicio. No hace falta colección nueva ni motor nuevo.

**Con matiz:** el filtro «Mensajes» **no** se sostiene solo con `growth_actividades` hoy. Opciones V1 sin segundo engine:

1. **No ofrecer** el filtro Mensajes hasta una OT posterior que proyecte (sin tocar esta auditoría).
2. **Lectura unificada de presentación**: feed = actividades + proyección ligera desde `growth_mensajes`/`growth_conversaciones` (solo join/read; SSOT del mensaje sigue siendo mensajería).

Se recomienda (2) solo si el producto exige el filtro en V1; si no, (1) es más limpio.

---

## 1. Estado actual

### 1.1 Ruta del menú

| Qué cree el operador | Qué hay hoy |
| --- | --- |
| `/admin/actividad` | **No existe** como ruta App Router |
| Ítem nav «Actividad» (zona core) | `href: /admin/settings/activity` (`nav-domains.ts`) |
| Inicio «Ver toda la actividad» | Mismo destino: `/admin/settings/activity` |

Permiso del ítem: `identity.audit.read` **o** `settings.team` — no `growth.*`.

### 1.2 Qué muestra hoy `/admin/settings/activity`

| Aspecto | Detalle |
| --- | --- |
| Página | `src/app/admin/settings/activity/page.tsx` — título «Mi actividad» |
| Cliente | `ActivityClient` → `GET /api/identity/team` → campo `audit` |
| Datos | Colección **`identity_audit`** (accesos, roles, invitaciones, cambios de equipo/CMS) |
| UI | `AuditTimeline` + copy «Historial de cambios y accesos» / «acciones recientes en el CMS» |
| Relación con Growth | **Ninguna.** No lee `growth_actividades`. |

Conclusión: el menú comercial «Actividad» está **cableado al historial de Identity**, no al timeline comercial de Growth Core.

### 1.3 Dónde sí se ve actividad comercial hoy

| Superficie | Fuente | Presentación |
| --- | --- | --- |
| Ficha Persona «Qué ha pasado» | `growth_actividades` por `personaId` | `summary` + `kindLabel`; oculta `identity_conflict` |
| Ventas · operar oportunidad | `growth_actividades` por `oportunidadId` | Idem |
| Inicio Growth OS (últimos 4) | `growth_actividades` del Espacio | `humanizeHomeActivityStory` — prosa humana |
| Automatizaciones · historial de ejecución | `growth_automation_runs.lines` | Prosa humana propia (`history-prose.ts`); refs `activityIds` |

ADR-010 / CORE-CLOSE ya fijan: **«Qué ha pasado» = `growth_actividades`**. La UI global del menú aún no cumple ese contrato.

---

## 2. Fuentes existentes

### 2.1 `growth_actividades` (SSOT del timeline comercial)

**Contrato** (`GrowthActivity` / ADR-010 §1.4):

| Campo | Rol | Útil para UI Actividad |
| --- | --- | --- |
| `tenantId` | Aislamiento Espacio | Filtro obligatorio; **no mostrar** |
| `personaId` | Con quién | Resolver → nombre visible |
| `oportunidadId?` | En qué oportunidad | Resolver → tipo/estado legible |
| `kind` | Tipo de hecho | Agrupar / filtrar / humanizar; **no mostrar crudo** |
| `summary` | Texto corto persistido | Base de la frase (a menudo técnica) |
| `actorUserId?` | Quién/qué | Operador, o `growth-automation` |
| `occurredAt` | Cuándo | Orden del feed |
| `payload?` | Recorte mínimo | Solo para humanizar (estados, nextAction); **no JSON al usuario** |
| `ingestKey` / `sourceCollection` / `sourceId` / `eventId` | Idempotencia / traza | **Internos; no UI** |

**Kinds existentes:**

| `kind` | Se escribe hoy | Origen típico |
| --- | --- | --- |
| `form_submitted` | Sí | Captación formularios |
| `application_received` | Sí | Captación admisión |
| `opportunity_opened` | Sí | Apertura oportunidad (captación / open) |
| `opportunity_transitioned` | Sí | Ventas / automatización |
| `next_action_set` | Sí | Ventas / automatización (set y clear) |
| `note` | Sí | Ventas / automatización (`salesRecordFollowUp`) |
| `contact` | Sí | Ventas / automatización |
| `handoff` | Sí | Transición a `handed_off` |
| `identity_conflict` | Sí | Upsert persona en conflicto |
| `identity_updated` | **En catálogo; no se escribe** | Ningún path de producción encontrado |

Índices: `tenantId+personaId+occurredAt`, `tenantId+oportunidadId+occurredAt`, unique sparse `tenantId+ingestKey`. **No** hay índice dedicado `tenantId+occurredAt` (Inicio ya lista por `tenantId` ordenando `occurredAt`; V1 feed global puede necesitar índice de lectura — extensión de ops, no de modelo).

### 2.2 `core_events` (Event Bus)

Tipos Growth registrados:

| Evento | Relación con `growth_actividades` | ¿Mostrar al usuario? |
| --- | --- | --- |
| `GrowthActivityRecorded` | Espejo genérico de varios kinds | **No** (duplicado del hecho) |
| `GrowthOpportunityOpened` | Espejo de `opportunity_opened` | **No** |
| `GrowthOpportunityTransitioned` | Espejo de `opportunity_transitioned` | **No** |
| `GrowthNextActionSet` | Espejo de `next_action_set` | **No** |
| `GrowthHandoffRecorded` | Espejo de `handoff` | **No** |
| `GrowthPersonaUpserted` | **Solo bus** (alta/match persona); no hay Actividad “persona creada” | **No** directo; el hecho visible de captación es `form_submitted` / `application_received` + `opportunity_opened` |
| `GrowthMessageReceived` | Mensaje entrante; **no** escribe Actividad | **No** como event name; el hecho humano vendría de mensaje |
| `GrowthMessageSent` | Mensaje saliente; **no** escribe Actividad | Idem |
| `GrowthAutomationResume` | Infra WAIT | **No** |
| Workflow / CMS / Identity / analytics | Fuera de Growth comercial | **No** en Actividad Growth |

Regla ADR-010: *«`core_events` no sustituye `growth_actividades`»*. Confirmed.

### 2.3 Mensajes

| Pieza | Qué guarda |
| --- | --- |
| `growth_conversaciones` | `tenantId`, `personaId`, `channel`, `oportunidadId?`, timestamps |
| `growth_mensajes` | dirección, body, status, channel, `occurredAt`, `eventId?` |
| Eventos | `GrowthMessageReceived` / `GrowthMessageSent` |

**No** llaman a `recordGrowthActivity`. Relación conversación → persona/oportunidad existe en el hilo. Actor saliente puede ir al evento (`userId` en publish); el documento mensaje **no** modela `actorUserId` como campo de primera clase.

### 2.4 Automatizaciones

| Pieza | Rol |
| --- | --- |
| Runtime | Dispara acciones sales-ops con actor fijo `growth-automation` |
| Efecto comercial | Misma escritura que Ventas → **`growth_actividades`** (+ eventos espejo) |
| `growth_automation_runs` | Proyección fina «Qué ha pasado» de la **ejecución** (líneas humanas, status, `activityIds[]`) |

Información convertible a actividad humana **ya está** en las Actividades generadas por la acción (nota, contacto, transición, próxima acción). El run es contexto de Automatizaciones, no SSOT del feed comercial global.

### 2.5 Ventas

Operaciones (`sales-ops`) → Core:

- Nota / contacto → `kind: note | contact`, `summary` libre del operador, `payload.source: "sales_ops"`, `actorUserId` del operador.
- Cambio de estado → `opportunity_transitioned`, summary tipo `Oportunidad open → active` (claves técnicas en persistido; humanizable).
- Próxima acción set/clear → `next_action_set`.

### 2.6 Captación

`projectGrowthFromSignal`:

1. Upsert Persona → evento `GrowthPersonaUpserted` (sin Actividad de alta).
2. Open/reuse Oportunidad → Actividad `opportunity_opened` si crea.
3. Actividad primaria: `form_submitted` o `application_received` con summaries humanos ya razonables («Solicitud de información recibida», «Postulación / admisión recibida», etc.).
4. Origen en Persona/Oportunidad (`kind` form/admission/event, channel, formId…).

Reutilización de oportunidad abierta: no duplica hechos (idempotencia por `ingestKey`).

---

## 3. Mapa de duplicaciones

Un mismo hecho comercial puede existir en varias capas. **Fuente visible** = la que debe alimentar Actividad V1.

| Hecho | `growth_actividades` | `core_events` | Mensaje | Automation run | Fuente visible |
| --- | --- | --- | --- | --- | --- |
| Formulario / admisión proyectada | Sí (primary + opened) | Sí (Activity* / Opportunity* / PersonaUpserted) | — | Puede disparar run | **Actividad** |
| Persona upserted sin conflicto | No | `GrowthPersonaUpserted` | — | Trigger posible | **No listar el evento**; cubierto por primary/opened |
| Cambio de estado | Sí | Sí + Workflow* | — | Run + `activityIds` | **Actividad** |
| Nota / contacto | Sí | `GrowthActivityRecorded` | — | Run + activity | **Actividad** |
| Próxima acción | Sí | `GrowthNextActionSet` | — | Run + activity | **Actividad** |
| Handoff | Sí (`handoff` + transition) | Sí | — | — | **Actividad** (una fila humanizada; evitar doble prosa) |
| Mensaje in/out | **No** | Sí | Sí | Puede trigger | **Mensaje** (proyección UI) o omitir en V1 |
| WAIT / resume | No | `GrowthAutomationResume` | — | Líneas waiting | Solo UI Automatizaciones |
| Login / invite CMS | — | Identity* / audit | — | — | **`identity_audit`** (otra superficie; no mezclar) |
| Conflicto identidad | Sí (`identity_conflict`) | `GrowthActivityRecorded` | — | — | **Ocultar** en feed comercial (ya filtrado en Personas/Inicio) |

---

## 4. Fuente recomendada por tipo

| Tipo de actividad (UX) | Fuente de lectura V1 | Notas |
| --- | --- | --- |
| Captación (form / postulación / nueva oportunidad) | `growth_actividades` | Humanizar con nombre Persona + origen |
| Cambio de estado / nota / contacto / próxima acción | `growth_actividades` | Actor: operador o «Growth OS» si `growth-automation` |
| Traspaso | `growth_actividades` `handoff` | Preferir una historia; no duplicar transition+handoff en copy |
| Mensaje WhatsApp (u otro canal) | `growth_mensajes` (+ conversación) | Solo si se incluye filtro Mensajes; **no** `core_events` |
| «Growth OS programó un seguimiento» | `growth_actividades` `next_action_set` con `actorUserId=growth-automation` | Ya hay frase similar en Inicio |
| Accesos / equipo / CMS | `identity_audit` | **Fuera** de Actividad comercial; mantener en Ajustes/Equipo |

---

## 5. Brechas reales

| # | Brecha | Severidad | Mitigación sin segundo engine |
| --- | --- | --- | --- |
| 1 | Menú/ruta apuntan a Identity, no a Growth | Alta (producto) | Nueva superficie de lectura o retarget del href (OT futura); **no** mezclar feeds |
| 2 | Mensajes no generan Actividad | Alta si se exige filtro Mensajes | Proyección read-only desde mensajes **o** diferir filtro |
| 3 | Summaries persistidos semi-técnicos (`open → active`, `typeKey`) | Media (UX) | Capa presentación (ya existe patrón `humanizeHomeActivityStory`) |
| 4 | Actor: hay `actorUserId`, falta resolución a nombre legible; sistema = `growth-automation` | Media | Lookup `identity_users` + label «Growth OS» |
| 5 | `identity_updated` nunca se escribe | Baja | No depender de él en V1 |
| 6 | `GrowthPersonaUpserted` sin Actividad dedicada | Baja | Cubierto por hechos de captación |
| 7 | Índice feed global `tenantId+occurredAt` | Baja/ops | Opcional en OT de implementación |
| 8 | Permisos: hoy Identity; comercial debería ser `growth.*` | Media | Definir en OT de UI (p. ej. read de personas/ventas) |
| 9 | Ejemplo UX «Contactado» ≠ estados plataforma | Doc | Estados: Abierta / En seguimiento / Ganada / Perdida / Traspasada / Archivada |
| 10 | Handoff puede generar 2 Actividades | Baja | Deduplicar en humanize o preferir `handoff` |

**No es brecha:** falta de motor de timeline. El motor append-only ya existe.

---

## 6. Contrato funcional propuesto — Actividad V1

### 6.1 Propósito

Historial comercial del **Espacio** (`tenantId` activo): qué pasó, con quién, en qué oportunidad, cuándo, quién/qué lo hizo — en lenguaje humano.

### 6.2 Fuera de V1

- Event names, IDs, payloads JSON, `tenantId`, `sourceEventId`, claims, nombres de colección.
- Mezclar `identity_audit` / CMS.
- Leer `core_events` como feed.
- Nueva colección o escritura masiva hacia un “activity 2”.
- Cambiar schema de `growth_actividades`.

### 6.3 Item de feed (contrato de presentación)

| Campo UI | Origen |
| --- | --- |
| `story` | Humanize de `kind` + `summary` + nombre Persona (+ canal si mensaje) |
| `personaLabel` | `growth_personas.displayName` vía `personaId` |
| `oportunidadLabel?` | Tipo/estado legibles vía `oportunidadId` |
| `when` | `occurredAt` (formato relativo/absoluto como Inicio/Automatizaciones) |
| `actorLabel` | Nombre operador · «Growth OS» · «Formulario web» / canal · «La persona» (inbound) |
| `category` | Derivada de `kind` (y/o origen mensaje) para filtros |

Ejemplos alineados a datos reales (ajustando «Contactado» → etiqueta de plataforma):

| Ejemplo deseado | Cómo se sostiene |
| --- | --- |
| «María envió un mensaje por WhatsApp» | Mensaje inbound + Persona + channel (proyección) |
| «Pedro pasó a En seguimiento» | `opportunity_transitioned` + humanize estado |
| «Se agregó una nota a la oportunidad» | `note` (+ nombre si cabe) |
| «Growth OS programó un seguimiento para mañana» | `next_action_set` + actor automatización + `dueAt` en payload |
| «Formulario web creó una nueva oportunidad» | `opportunity_opened` / `form_submitted` + origin form |

### 6.4 Filtros recomendados (solo con datos reales)

| Filtro | ¿Sostenible hoy? | Criterio de datos |
| --- | --- | --- |
| **Todos** | Sí | Actividades visibles (`kind ≠ identity_conflict`) [+ mensajes si se unifican] |
| **Personas / Captación** | Sí | `form_submitted`, `application_received`, `opportunity_opened` (opcional: conflictos ocultos) |
| **Ventas** | Sí | `opportunity_transitioned`, `note`, `contact`, `next_action_set`, `handoff` |
| **Mensajes** | **Condicional** | Solo si V1 incluye proyección desde `growth_mensajes`; si no → **no ofrecer** |
| **Automatizaciones** | Sí | `actorUserId === "growth-automation"` (hechos ya en Actividad) |

No recomendar filtros sin backing (p. ej. «Campañas») ni filtros que obliguen a escanear `core_events`.

### 6.5 Reglas multi-tenant

- Toda query con `tenantId` del Espacio de sesión primero.
- Joins Persona/Oportunidad/Mensaje/Usuario solo dentro del mismo `tenantId`.
- Sin dedupe cruzado entre Espacios.

### 6.6 Relación con superficies existentes

| Superficie | Relación |
| --- | --- |
| Inicio (4 hechos) | Misma fuente; Actividad = historial completo |
| Persona / Ventas | Timelines locales; Actividad = vista Espacio |
| Automatizaciones › runs | Sigue siendo historial de **ejecución**; no reemplaza Actividad |
| Ajustes › actividad Identity | Renombrar/aislar en OT futura; no es este producto |

---

## 7. Recomendación A / B / C

| Opción | Significado | ¿Aplica? |
| --- | --- | --- |
| **A** | Ya existe lo necesario; solo vista/adaptador | Casi: Captación/Ventas/Automatizaciones sí; ruta actual y Mensajes no |
| **B** | Reutilizable con extensión pequeña | **Sí — elegida** |
| **C** | Falta infraestructura importante | No: no hace falta nuevo engine ni colección |

### Por qué B (no A)

Extensiones pequeñas (solo lectura / presentación / ruta / permisos), **sin** tocar motores de escritura:

1. Superficie Actividad comercial (ruta distinta o retarget consciente) + adaptador de listado tenant-scoped.
2. Humanize (reutilizar/extender Inicio) + resolución de nombres/actores.
3. Decisión explícita Mensajes: omitir filtro **o** proyección read-only.
4. Permisos Growth; separar Identity audit.
5. Índice opcional `tenantId + occurredAt`.

### Qué no hacer

- No crear `growth_activity_feed` / timeline 2.
- No convertir `core_events` en UI comercial.
- No fusionar Identity audit en el mismo feed.
- No modificar Mensajes/Ventas/Automatizaciones **en esta OT** (auditoría únicamente).

---

## 8. Respuesta ejecutiva

| Pregunta | Respuesta |
| --- | --- |
| ¿Segundo sistema de auditoría? | **No.** |
| ¿SSOT visible? | **`growth_actividades`** (+ proyección opcional de mensajes). |
| ¿`core_events` en UI? | **No.** |
| ¿El menú actual sirve? | **No** — es Identity, no Growth. |
| ¿Recomendación? | **B** — vista/adaptador + humanize + decisión Mensajes. |
| ¿Implementar ahora? | **No.** Acta de auditoría solamente. |

---

## Referencias de código (evidencia)

- Nav: `src/lib/admin/nav-domains.ts` (`id: "actividad"` → `/admin/settings/activity`)
- UI actual: `src/app/admin/settings/activity/page.tsx`, `src/components/admin/ActivityClient.tsx`
- Modelo: `src/core/growth/types.ts`, `src/core/growth/activity.ts`, ADR-010 §1.4 / §4.4
- Eventos: `src/core/events/registry/index.ts`, `src/core/growth/event-bus-port.ts`
- Mensajes: `src/core/growth/messaging/record-inbound-message.ts` (sin `recordGrowthActivity`)
- Ventas: `src/lib/growth/sales-ops.ts`
- Automatizaciones: `GROWTH_AUTOMATION_SYSTEM_ACTOR`, `growth_automation_runs`, `history-prose.ts`
- Inicio: `load-home-snapshot.ts`, `humanize-home-activity.ts`

---

**Fin del acta OT-GROWTH-ACTIVITY-AUDIT-001.** Sin apertura automática de implementación.
