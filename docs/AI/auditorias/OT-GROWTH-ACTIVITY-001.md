# OT-GROWTH-ACTIVITY-001 — Lectura comercial unificada de Actividad V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-ACTIVITY-001 |
| Tipo | Operatividad / contrato de lectura |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-11 |
| Entrada | [OT-GROWTH-ACTIVITY-AUDIT-001](./OT-GROWTH-ACTIVITY-AUDIT-001.md) · ADR-010 |
| Estado | **CERRADA · APTO** |
| Alcance | Adaptador tenant-scoped, API, ruta `/admin/actividad`, humanización, permisos, índices, pruebas |
| Fuera de alcance | Diseño final de pantalla · motores de escritura Ventas/Automatizaciones · Event Bus · schema `growth_actividades` · Shell/Inicio/Mensajes visual · DNS/Dokploy/Cloudflare · Meta/WhatsApp · datos productivos |

**Restricciones cumplidas:** sin nuevo motor ni colección; mensajes solo proyección READ-ONLY; sin alimentar el feed desde el Event Bus; sin mezclar con `identity_audit`; multi-tenant en toda lectura.

---

## Gate final

**APTO**

«Actividad» queda como historial comercial del Espacio sobre `growth_actividades` + proyección de `growth_mensajes`/`growth_conversaciones`, con contrato humano común, permisos Growth y superficie separada de la auditoría Identity.

---

## 1. Qué se reutilizó

| Pieza | Uso |
| --- | --- |
| `growth_actividades` | SSOT de hechos comerciales |
| `growth_mensajes` + `growth_conversaciones` | Proyección READ-ONLY del filtro Mensajes |
| `humanizeHomeActivityStory` | Catálogo único de frases (evolucionado con `variant: "feed"`) |
| `activitiesVisibleInUi` / patrón Inicio | Ocultar `identity_conflict` |
| Labels de estado/tipo (`growthOpportunityStatusLabel`, …) | Humanizar sin mostrar claves técnicas |
| `growthConversationChannelLabel` | Canal humano (WhatsApp, …) |
| Permisos `growth.sales.read` / `growth.sales.operate` | Mismo mínimo que Mensajes/Ventas |
| `GROWTH_AUTOMATION_SYSTEM_ACTOR` | Detectar Automatizaciones → «Growth OS» |
| `/admin/settings/activity` + `ActivityClient` | Sigue siendo auditoría Identity/CMS |

---

## 2. Qué se creó / modificó

### Creado

| Archivo | Rol |
| --- | --- |
| `src/lib/growth/actividad-view.ts` | Proyección pura + categorías + dedupe handoff + paginación |
| `src/lib/growth/actividad-read.ts` | Adaptador Mongo tenant-scoped del feed |
| `src/app/api/growth/actividad/route.ts` | `GET` JSON del feed |
| `src/app/admin/actividad/page.tsx` | Superficie comercial mínima (sin diseño final) |
| `tests/baseline/growth-activity-001.test.ts` | Casos A–L + superficie + índices |
| `docs/AI/auditorias/OT-GROWTH-ACTIVITY-001.md` | Esta acta |

### Modificado

| Archivo | Cambio |
| --- | --- |
| `humanize-home-activity.ts` | Extensión opcional (mensaje, actor, due, captureOrigin, `variant`) |
| `nav-domains.ts` | Core «Actividad» → `/admin/actividad` + Growth; Ajustes «Auditoría» → `/admin/settings/activity` |
| `GrowthOsAdminHomeMaster.tsx` / `master-nav.ts` | «Ver toda la actividad» / href → `/admin/actividad` |
| `src/core/growth/indexes.ts` | Índice `tenantId + occurredAt` en actividades |
| `src/core/growth/messaging/indexes.ts` | Índice `tenantId + occurredAt` en mensajes |
| `src/lib/growth/labels.ts` | Copy mínimo de la página Actividad |
| `src/lib/growth/index.ts` | Reexport del adaptador |
| Tests Inicio / shell | Href comercial actualizado; settings/activity sigue en nav de Ajustes |

### No tocado (según OT)

Motores de escritura Ventas · runtime Automatizaciones · Event Bus · schema de actividades · UI visual de Shell/Inicio/Mensajes · Meta/WhatsApp · datos productivos.

---

## 3. Contrato final del feed

### Item (`GrowthActividadFeedItem`)

| Campo | Descripción |
| --- | --- |
| `id` | Estable: `activity:{_id}` o `message:{_id}` |
| `category` | `personas` \| `ventas` \| `mensajes` \| `automatizaciones` |
| `story` | Frase humana (sin claves técnicas) |
| `personaId` / `personaLabel` | Persona del hecho |
| `oportunidadId?` / `oportunidadLabel?` | Tipo · estado legibles |
| `actorLabel` | Operador · «Growth OS» · «Formulario web» / «Admisión» · Persona (inbound) · «Equipo» |
| `occurredAt` | ISO del hecho |
| `channel?` | Etiqueta humana (p. ej. WhatsApp) — mensajes |

**No se expone:** `tenantId`, payload JSON, `eventId`, `sourceEventId`, claims, nombres de colección, nombres técnicos de eventos.

### Fuentes

1. **Actividades** → `growth_actividades` (excepto `identity_conflict`).
2. **Mensajes** → `growth_mensajes` + join a `growth_conversaciones` (mismo `tenantId`).
3. **Nunca** Event Bus ni `identity_audit`.

### Categorías / filtros

| Filtro | Criterio |
| --- | --- |
| Todos | Unión visible |
| Personas | `form_submitted`, `application_received`, `opportunity_opened` |
| Ventas | `opportunity_transitioned`, `note`, `contact`, `next_action_set`, `handoff` **y** actor ≠ automation |
| Mensajes | Solo proyección de mensajes |
| Automatizaciones | `actorUserId === growth-automation` |

### Dedupe

- Handoff + `opportunity_transitioned` → `handed_off` (mismo `sourceId` o misma oportunidad+instante): se conserva solo `handoff`.
- Mensaje: una fila por documento en `growth_mensajes` (no se copia a actividades).

### API

`GET /api/growth/actividad?category=&limit=&cursor=`

Respuesta: `{ ok, items, nextCursor }`.

### Rutas

| Ruta | Rol |
| --- | --- |
| `/admin/actividad` | Historial comercial Growth |
| `/admin/settings/activity` | Auditoría Identity / equipo / CMS |

---

## 4. Permisos

| Superficie | Permiso |
| --- | --- |
| `/admin/actividad` + API | `growth.sales.read` **o** `growth.sales.operate` |
| Nav Core «Actividad» | Idem |
| `/admin/settings/activity` (Ajustes › Auditoría) | `identity.audit.read` **o** `settings.team` |

**No se creó** permiso nuevo. **No** se usa `identity.audit.read` como puerta del historial comercial.

---

## 5. Índices

Justificados por el patrón real `find({ tenantId }).sort({ occurredAt: -1 })` del feed global (Inicio ya lo hacía sin índice dedicado):

| Colección | Índice |
| --- | --- |
| `growth_actividades` | `tenantId_occurredAt` → `{ tenantId: 1, occurredAt: -1 }` |
| `growth_mensajes` | `tenantId_occurredAt` → `{ tenantId: 1, occurredAt: -1 }` |

Idempotentes vía `ensureGrowthActivityIndexes` / `ensureGrowthMessagingIndexes`.

---

## 6. Pruebas

Suite: `tests/baseline/growth-activity-001.test.ts` (+ regresiones Inicio/shell).

| Caso | Resultado |
| --- | --- |
| A/B Tenant isolation (queries siempre con `tenantId`) | Pass |
| C Actividad una sola vez (`activity:`) | Pass |
| D Mensaje una sola vez (`message:`) | Pass |
| E/F Sin Event Bus / identity_audit en el adaptador | Pass |
| G Automatización → «Growth OS» | Pass |
| H Estados humanizados | Pass |
| I `identity_conflict` oculto | Pass |
| J Filtros por categoría | Pass |
| K Orden desc `occurredAt` | Pass |
| L Paginación cursor estable | Pass |
| Handoff+transition dedupe | Pass |
| Contrato sin campos técnicos | Pass |
| Índices | Pass |
| Separación rutas / permisos / nav | Pass |

Regresiones: `growth-os-admin-master`, `growth-os-admin-shell-002` — Pass.

---

## 7. Riesgos

| Riesgo | Severidad | Mitigación / nota |
| --- | --- | --- |
| UI de `/admin/actividad` es mínima (lista + filtros) | Baja | OT explícita: no diseñar pantalla final |
| Merge de dos fuentes + over-fetch puede omitir bordes en páginas profundas | Baja | Cursor estable; factor de over-fetch; índice nuevo |
| Outbound sin `actorUserId` en mensaje → actor «Equipo» | Baja | Modelo actual de mensajes; no se inventa operador |
| «Ver toda la actividad» en Inicio ahora va al feed comercial | Info | Intencional; Identity queda en Ajustes › Auditoría |
| Índice nuevo requiere ensure/migración en cada entorno | Baja | Mismos ensure idempotentes existentes |

---

## 8. Respuesta ejecutiva

| Pregunta | Respuesta |
| --- | --- |
| ¿Nuevo motor / colección? | **No.** |
| ¿SSOT comercial? | `growth_actividades` + proyección mensajes |
| ¿Event Bus en el feed? | **No.** |
| ¿Mezcla con Identity audit? | **No** — rutas y permisos separados |
| ¿Permiso nuevo? | **No** — reutiliza `growth.sales.*` |
| ¿Pantalla final? | **No** — solo contrato + superficie mínima |
| ¿Abrir otra OT? | **No** automáticamente |

---

**Fin del acta OT-GROWTH-ACTIVITY-001.**
