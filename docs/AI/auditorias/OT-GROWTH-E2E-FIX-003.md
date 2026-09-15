# OT-GROWTH-E2E-FIX-003 — Mensajes ↔ Venta operable

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-E2E-FIX-003 |
| Tipo | Implementación funcional (cierre H3) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-14 |
| Entrada | [OT-GROWTH-E2E-AUDIT-001](./OT-GROWTH-E2E-AUDIT-001.md) H3 · [OT-GROWTH-E2E-FIX-002](./OT-GROWTH-E2E-FIX-002.md) vínculo Conversación ↔ Oportunidad |
| Estado | **CERRADA · APTO** |
| Alcance | Hacer operable en Mensajes el vínculo ya creado por FIX-002: contexto comercial mínimo + CTA a la ficha de Ventas |
| Fuera de alcance | Segundo vínculo · segundo CRM · duplicar sales-ops · rediseño Mensajes · Meta · WhatsApp receive · Automatizaciones · abrir otra OT |

**Restricciones cumplidas:** reutiliza `conversation.oportunidadId`, `growth_conversaciones` / `growth_oportunidades`, Persona, Ventas, nextAction SSOT y bandeja Mensajes existente; sin inventar oportunidad desde UI.

---

## Gate final

# APTO

Cuando el operador abre una conversación con Oportunidad vinculada ve **quién es**, **qué oportunidad**, **en qué estado** y **qué hacer ahora**, y puede ir a la ficha existente de Ventas con **Ver oportunidad**. Sin opp vinculada, el hilo se comporta como antes.

---

## 1. Qué cambió

### 1.1 Resolución de Oportunidad en el detalle

`getGrowthMensajesThread` ya no proyecta solo el `_id` de la opp: carga el documento completo **tenant-scoped** (`findOne({ tenantId, _id })`) y lo proyecta a etiquetas humanas.

Si no hay `oportunidadId`, o el id no resuelve en el Espacio, no se inventa contexto ni CTA.

### 1.2 Contexto comercial mínimo

En el hilo, cuando hay vínculo resoluble:

| Campo UI | Origen SSOT |
| --- | --- |
| Oportunidad | `typeKey` → etiqueta humana (+ `subjectLabel` si existe) |
| Estado | `status` → etiqueta del workflow Growth |
| Qué hacer ahora | `nextAction.summary` o «No hay nada pendiente por ahora.» |

Mismas funciones de etiqueta que Ventas (`growthOpportunityTypeLabel` / `growthOpportunityStatusLabel` / `GROWTH_NO_NEXT_ACTION_LABEL`).

### 1.3 Acción principal

**Ver oportunidad** → `/admin/ventas/[oportunidadId]` (ficha existente).  
No se duplican controles de Ventas (cambiar estado, registrar actividad, administrar nextAction).

### 1.4 Oportunidad final

Se muestra el estado real (Ganada / Perdida / …). El re-vínculo ante nueva intención inbound sigue siendo responsabilidad de FIX-002.

---

## 2. Qué se reutilizó

| Pieza | Uso |
| --- | --- |
| `conversation.oportunidadId` | Único vínculo Conversación ↔ Oportunidad |
| `growth_oportunidades` | Lectura tenant-scoped del documento comercial |
| Labels Growth / nextAction | Misma proyección humana que Ventas / Personas |
| `/admin/ventas/[id]` + `VentasOperateClient` | Destino de la CTA |
| `MensajesInboxClient` | Extensión mínima del detalle de hilo |

**No** se creó segundo CRM, segunda ficha comercial ni duplicación de sales-ops.

---

## 3. Archivos

### Creados

| Archivo | Rol |
| --- | --- |
| `tests/baseline/growth-e2e-fix-003.test.ts` | Validación A–H + frontera |
| `docs/AI/auditorias/OT-GROWTH-E2E-FIX-003.md` | Esta acta |

### Modificados

| Archivo | Cambio |
| --- | --- |
| `src/lib/growth/mensajes-view.ts` | `opportunity` en thread + `toMensajesThreadOpportunityView` |
| `src/lib/growth/mensajes-read.ts` | Resuelve opp completa y proyecta contexto |
| `src/lib/growth/labels.ts` | Etiquetas «Oportunidad» / «Estado» para el contexto |
| `src/components/admin/growth/MensajesInboxClient.tsx` | Franja de contexto + CTA Ver oportunidad |
| `tests/baseline/growth-messaging-004.test.ts` | Condición de CTA alineada al nuevo guard |

---

## 4. Pruebas

### Suite nueva

`tests/baseline/growth-e2e-fix-003.test.ts` — **PASS**

| Caso | Validación |
| --- | --- |
| Superficie | Lectura/proyección/UI sin sales-ops / Meta / receive / automations |
| A | Opp → typeLabel / statusLabel / nextActionLabel |
| B | CTA → `/admin/ventas/[id]` (ficha existente) |
| C/D | nextAction y estado = mismas etiquetas que Ventas |
| E | Sin opp → sin contexto inventado |
| F | Opp final → estado real + nextAction ausente humano |
| G | Lookup siempre con `tenantId` |
| H | Stack mobile (contexto + CTA full width) |

### Suites reejecutadas (I — regresiones) — **PASS**

| Suite | Resultado |
| --- | --- |
| `growth-e2e-fix-003.test.ts` | PASS |
| `growth-e2e-fix-002.test.ts` | PASS |
| `growth-e2e-fix-001.test.ts` | PASS |
| `growth-messaging-001` … `005` | PASS |
| `growth-sales-001.test.ts` | PASS |

---

## 5. Resultado

- H3 cerrado en el tramo UI: el vínculo FIX-002 es operable desde Mensajes.
- El operador entiende persona + oportunidad + estado + qué hacer ahora sin salir del hilo.
- Operaciones comerciales siguen en Ventas (un solo CRM).
- Aislamiento multi-tenant preservado en la resolución.
- Sin Meta, receive, Automatizaciones ni otra OT automática.

---

## 6. Veredicto

# APTO
