# OT-GROWTH-E2E-FIX-002 — WhatsApp → Oportunidad → Qué hacer ahora

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-E2E-FIX-002 |
| Tipo | Implementación funcional (cierre H2) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-14 |
| Entrada | [OT-GROWTH-E2E-AUDIT-001](./OT-GROWTH-E2E-AUDIT-001.md) H2 · [OT-GROWTH-E2E-FIX-001](./OT-GROWTH-E2E-FIX-001.md) playbook H1 |
| Estado | **CERRADA · APTO** |
| Alcance | Cablear inbound WhatsApp al pipeline comercial existente (Persona → Conversación → Oportunidad → GrowthOpportunityOpened → playbook H1) |
| Fuera de alcance | Segundo pipeline · segundo inbox · automatización especial WhatsApp · Meta Embedded Signup · hardcodes por cliente · rediseño UI · abrir otra OT |

**Restricciones cumplidas:** reutiliza receive, upsertGrowthPersona, openGrowthOpportunity, Event Bus, Automation Runtime, playbook H1, growth_conversaciones / growth_actividades, Ventas / Inicio; sin Meta live obligatorio.

---

## Gate final

# APTO

El viaje **WhatsApp inbound → Persona → Conversación → Oportunidad → nextAction («Contactar a la persona») → Ventas / Inicio** queda cerrado sobre los motores existentes. Mensajes posteriores reutilizan la Oportunidad abierta; tras won/lost/handed_off/archived se abre una nueva intención comercial coherente.

---

## 1. Qué cambió

### 1.1 Receive WhatsApp (dominio)

Tras resolver Persona, `receiveWhatsAppCloudWebhook`:

1. Resuelve Oportunidad comercial (si hay store + workflow).
2. Registra inbound con `oportunidadId` → Conversación queda vinculada.
3. Al **crear** Oportunidad, `openGrowthOpportunity` emite `GrowthOpportunityOpened` → playbook H1.

| Caso | Comportamiento |
| --- | --- |
| Hilo ya vinculado a opp **no final** | Reutiliza esa Oportunidad (no abre otra) |
| Sin vínculo / vínculo a opp **final** | `openGrowthOpportunity` (`inquiry` + `subjectType: none`) con reglas existentes |
| Segundo mensaje misma conversación | Reuse; no duplica opp ni republica `GrowthOpportunityOpened` |
| Opp previa won/lost/handed_off/archived | Crea nueva opp; **re-vincula** `conversation.oportunidadId` |

Origen de la Oportunidad nueva: modelo existente — `kind: unknown`, `channel: whatsapp`, `sourceCollection: whatsapp_cloud`.

Tipo: `GROWTH_WHATSAPP_OPPORTUNITY_TYPE_KEY = "inquiry"` (default de plataforma, mismo que Form contact).

### 1.2 Vínculo Conversación ↔ Oportunidad

`ensureGrowthConversation` ahora sincroniza `oportunidadId` cuando se pasa y difiere del actual (necesaria para nueva intención tras estado final). Sin inventar segundo vínculo ni UI.

### 1.3 Webhook de producción

`POST /api/webhooks/whatsapp` pasa `oportunidades` + `workflow` + Event Bus, y en `onTenantResolved` asegura (fail-soft) el playbook de arranque H1 antes de abrir Oportunidad — mismo patrón que live-ingest Form/Admisión.

### 1.4 Fail-soft

- Fallo al abrir Oportunidad → el mensaje **igual** entra al hilo (Persona + Conversación).
- Fallo del ensure H1 → inbound y Oportunidad continúan.
- Sin deps comerciales (tests legacy de firma/auth) → comportamiento MESSAGING-002 previo.

---

## 2. Qué se reutilizó

| Pieza | Uso |
| --- | --- |
| `receiveWhatsAppCloudWebhook` | Orquestación inbound (extendida, no reemplazada) |
| `upsertGrowthPersona` | Dedupe por teléfono, tenant-scoped |
| `openGrowthOpportunity` | Crear / reutilizar; emite actividad + evento |
| `recordGrowthInboundMessage` / `ensureGrowthConversation` | Hilo + mensaje + FK |
| `GrowthOpportunityOpened` | Trigger natural al crear |
| Playbook H1 (`ensureGrowthStartupNextActionAutomation`) | `salesSetNextAction` «Contactar a la persona» |
| Automation Runtime + sales-ops | Un solo motor; actor `growth-automation` |
| Inicio / Personas / Ventas | Misma SSOT `oportunidad.nextAction` |
| Modelo `origin` existente | Sin nuevo kind; canal `whatsapp` |

**No** se creó segundo pipeline, segundo inbox ni automatización especial WhatsApp.

---

## 3. Archivos

### Creados

| Archivo | Rol |
| --- | --- |
| `tests/baseline/growth-e2e-fix-002.test.ts` | Validación A–K + contexto Mensajes |
| `docs/AI/auditorias/OT-GROWTH-E2E-FIX-002.md` | Esta acta |

### Modificados

| Archivo | Cambio |
| --- | --- |
| `src/core/growth/whatsapp/receive.ts` | Open/reuse Opp + vínculo + `onTenantResolved` |
| `src/core/growth/whatsapp/types.ts` | `GROWTH_WHATSAPP_OPPORTUNITY_TYPE_KEY` |
| `src/core/growth/whatsapp/index.ts` | Reexport constante |
| `src/core/growth/index.ts` | Reexport constante |
| `src/core/growth/messaging/ensure-conversation.ts` | Re-vínculo `oportunidadId` si cambia |
| `src/app/api/webhooks/whatsapp/route.ts` | Stores opp + workflow + ensure H1 |

---

## 4. Pruebas

### Suite nueva

`tests/baseline/growth-e2e-fix-002.test.ts` — **PASS**

| Caso | Validación |
| --- | --- |
| Superficie | receive usa `openGrowthOpportunity`; webhook ensure H1; sin hardcode cliente |
| A–G | WA → Persona → Conversación → Opp → vínculo → nextAction → Inicio/Ventas SSOT |
| H | Segundo mensaje → misma opp; un solo `GrowthOpportunityOpened` |
| I | Teléfono existente → dedupe Persona; origen inmutable |
| J | Tenant A ≠ B (persona, opp, datos) |
| K | Opp won → nuevo mensaje crea opp nueva y re-vincula conversación |
| Contexto | `GrowthMessageReceived.payload.oportunidadId` presente |

### Suites reejecutadas (L — regresiones) — **PASS**

| Suite | Resultado |
| --- | --- |
| `growth-e2e-fix-002.test.ts` | PASS |
| `growth-e2e-fix-001.test.ts` | PASS |
| `growth-messaging-001` … `005` | PASS |
| `growth-sales-001.test.ts` | PASS |
| `growth-oportunidades.test.ts` | PASS |
| `growth-automation-002.test.ts` | PASS |
| `growth-automation-003.test.ts` | PASS |

Meta live **no** se usó; dominio + webhook con stores en memoria.

---

## 5. Resultado

- H2 cerrado: un mensaje WhatsApp comercial entra al embudo Ventas / Inicio sin configuración extra ni segundo motor.
- El playbook H1 existente cubre el primer «qué hacer ahora» al crear la Oportunidad.
- Conversación ↔ Oportunidad queda conectada de verdad (incl. re-vínculo tras oportunidad final).
- Aislamiento multi-tenant preservado.
- Sin Meta Embedded Signup; sin otra OT automática.

---

## 6. Veredicto

# APTO
