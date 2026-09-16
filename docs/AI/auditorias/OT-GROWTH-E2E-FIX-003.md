# OT-GROWTH-E2E-FIX-003 — Mensajes ↔ Venta operable

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-E2E-FIX-003 |
| Tipo | Implementación funcional (cierre H3) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-15 |
| Entrada | [OT-GROWTH-E2E-AUDIT-001](./OT-GROWTH-E2E-AUDIT-001.md) H3 · [OT-GROWTH-E2E-FIX-002](./OT-GROWTH-E2E-FIX-002.md) vínculo Conversación ↔ Oportunidad |
| Estado | **CERRADA · APTO** |
| Alcance | Hacer operable en Mensajes el vínculo ya creado por FIX-002: contexto comercial mínimo + CTA a la ficha de Ventas |
| Fuera de alcance | Segundo vínculo · segundo CRM · duplicar sales-ops · rediseño Mensajes · Meta · WhatsApp receive · Automatizaciones · H1 · Sales Core · IAM · Shell · /platform · CMS · abrir otra OT |

**Restricciones cumplidas:** reutiliza `conversation.oportunidadId`, `createMongoGrowthOpportunityStore.findById`, Persona, Ventas, nextAction SSOT y bandeja Mensajes existente; sin inventar oportunidad desde UI; sin operaciones comerciales en Mensajes.

---

## Gate final

# APTO

Cuando el operador abre una conversación con Oportunidad vinculada ve **quién es**, **qué oportunidad**, **en qué estado** y **qué hacer ahora**, y puede ir a la ficha existente de Ventas con **Ver oportunidad**. Sin opp vinculada (o sin resolución en el Espacio), el hilo se comporta como antes.

---

## 1. Qué cambió

### 1.1 Resolución de Oportunidad en el detalle

`getGrowthMensajesThread` resuelve la opp con el **mismo repositorio** que Ventas/Personas:

`createMongoGrowthOpportunityStore(db).findById(tenantId, conversation.oportunidadId)`

- Lookup siempre scoped al Espacio activo.
- Si no hay `oportunidadId`, o el id no resuelve en el Espacio, no se inventa contexto ni CTA.
- No se crea otra relación Conversation↔Opportunity.

### 1.2 Contexto comercial mínimo (solo lectura)

En el hilo, cuando hay vínculo resoluble:

| Campo UI | Origen SSOT |
| --- | --- |
| Oportunidad | `typeKey` → etiqueta humana (+ `subjectLabel` si existe) |
| Estado | `status` → etiqueta del workflow Growth |
| Qué hacer ahora | `nextAction.summary` o «No hay nada pendiente por ahora.» |

Mismas funciones de etiqueta que Ventas (`growthOpportunityTypeLabel` / `growthOpportunityStatusLabel` / `GROWTH_NO_NEXT_ACTION_LABEL`).

**No** se duplican en Mensajes: cambio de estado, edición de próximo paso, notas comerciales, cierre ganado/perdido, pipeline ni segunda ficha.

### 1.3 Acción principal

**Ver oportunidad** → `/admin/ventas/[oportunidadId]` (ficha existente `VentasOperateClient`).

### 1.4 Oportunidad final

Se muestra el estado real humano (Ganada / Perdida / Traspasada / …). Sin operaciones comerciales dentro de Mensajes. El re-vínculo ante nueva intención inbound sigue siendo FIX-002.

### 1.5 Permisos

Reutiliza `growth.sales.read` / `growth.sales.operate` de la página Mensajes. Sin permisos nuevos.

---

## 2. Qué se reutilizó

| Pieza | Uso |
| --- | --- |
| `conversation.oportunidadId` | Único vínculo Conversación ↔ Oportunidad |
| `createMongoGrowthOpportunityStore` | Resolver tenant-scoped (mismo que Ventas) |
| Labels Growth / nextAction | Misma proyección humana que Ventas / Personas |
| `/admin/ventas/[id]` + `VentasOperateClient` | Destino de la CTA |
| `MensajesInboxClient` | Extensión mínima del detalle de hilo |

**No** se creó segunda colección, segundo CRM ni segunda ficha de oportunidad.

---

## 3. Archivos

### Creados / actualizados

| Archivo | Rol |
| --- | --- |
| `tests/baseline/growth-e2e-fix-003.test.ts` | Validación A–J + frontera |
| `docs/AI/auditorias/OT-GROWTH-E2E-FIX-003.md` | Esta acta |

### Modificados

| Archivo | Cambio |
| --- | --- |
| `src/lib/growth/mensajes-view.ts` | `opportunity` en thread + `toMensajesThreadOpportunityView` |
| `src/lib/growth/mensajes-read.ts` | Resuelve opp vía opportunity store + proyecta contexto |
| `src/lib/growth/labels.ts` | Etiquetas «Oportunidad» / «Estado» / «Ver oportunidad» |
| `src/components/admin/growth/MensajesInboxClient.tsx` | Franja de contexto + CTA Ver oportunidad |
| `tests/baseline/growth-messaging-004.test.ts` | Guard alineado al resolver por store |

---

## 4. Validación A–L

| Caso | Resultado | Evidencia |
| --- | --- | --- |
| **A** Conversación + opp activa → contexto | PASS | Proyecta typeLabel / statusLabel / nextActionLabel |
| **B** Estado correcto | PASS | «Abierta» / «En seguimiento» vía `growthOpportunityStatusLabel` |
| **C** nextAction correcto | PASS | Summary humano; misma SSOT que Ventas |
| **D** Ver oportunidad → ficha Ventas | PASS | CTA → `/admin/ventas/[id]` existente |
| **E** Sin oportunidad → Mensajes normal | PASS | Sin bloque ni CTA si no hay vínculo resoluble |
| **F** Opp final → estado real | PASS | Ganada / Perdida / Traspasada; sin ops comerciales |
| **G** Sin nextAction → UI humana | PASS | `GROWTH_NO_NEXT_ACTION_LABEL` (no «null») |
| **H** Opp otro tenant → no se expone | PASS | `findById(tenantId, id)`; sin proyección si no resuelve |
| **I** SEM ↔ ADL aislados | PASS | Mismo aislamiento del store; suite Personas SEM↔ADL PASS |
| **J** Mobile usable | PASS | Stack + CTA full width en `sm:` breakpoints |
| **K** Mensajería/WhatsApp sin regresiones | PASS | messaging-001…005 PASS; receive/Meta no tocados |
| **L** Ventas/Personas/H1/H2 sin regresiones | PASS | e2e-fix-001/002 + sales-001 + personas-ui PASS |

### Suites reejecutadas (2026-09-15) — **PASS**

| Suite | Resultado |
| --- | --- |
| `growth-e2e-fix-003.test.ts` | PASS |
| `growth-e2e-fix-002.test.ts` | PASS |
| `growth-e2e-fix-001.test.ts` | PASS |
| `growth-messaging-001` … `005` | PASS |
| `growth-sales-001.test.ts` | PASS |
| `growth-personas-ui.test.ts` | PASS |

---

## 5. Resultado

- H3 cerrado: el vínculo FIX-002 es operable desde Mensajes (contexto + acceso).
- Mensajes conversa; Ventas gestiona — un solo CRM.
- Aislamiento multi-tenant preservado vía opportunity store.
- Sin tocar receive WhatsApp, H1/H2, Automation Runtime, Sales Core, IAM, Shell, Meta ni CMS.

---

## 6. Veredicto

# APTO
