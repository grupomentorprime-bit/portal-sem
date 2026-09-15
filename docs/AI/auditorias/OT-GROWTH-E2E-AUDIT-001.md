# OT-GROWTH-E2E-AUDIT-001 — Auditoría integral E2E — Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-E2E-AUDIT-001 |
| Tipo | Auditoría integral (sin implementación) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-14 |
| Entrada | Growth Core CLOSE-001 · módulos Personas / Ventas / Actividad / Automatizaciones / Mensajes / Campañas / Analítica / Inicio · suites baseline Growth |
| Estado | **CERRADA · APTO CON BLOQUEOS IDENTIFICADOS** |
| Alcance | Un solo viaje real de negocio de punta a punta; qué funciona, qué está conectado, cortes, pasos manuales, aptitud comercial |
| Fuera de alcance | Implementación · rediseño · OTs nuevas · tocar producción · inventar screenshots/métricas · reabrir Meta |

**Restricciones cumplidas:** solo diagnóstico sobre código, contratos y pruebas existentes; sin cambios de producto; sin abrir OTs automáticamente.

---

## Gate final

# APTO CON BLOQUEOS IDENTIFICADOS

Growth OS **sí tiene un viaje comercial conectado de verdad** para captación por **Formulario / Admisión → Persona → Oportunidad → Actividad → Ventas (transición / seguimiento / nextAction) → Analítica / Inicio**, con Automatizaciones cableadas al Event Bus y Campañas atribuyendo `origin.campaign` cuando hay campaña active.

**No es aún un producto E2E “plug-and-play” para un cliente real** porque el paso crítico **«aparece qué hacer ahora»** no ocurre solo tras captar: la Oportunidad nace con `nextAction: null`. Sin acción manual en Ventas o sin Automatización publicada, Inicio/Personas muestran vacío de atención aunque haya captaciones nuevas. WhatsApp crea Persona + conversación **sin** Oportunidad. El vínculo Conversación ↔ Oportunidad existe en modelo pero casi no se usa en el camino real inbound.

---

## 1. Viaje auditado

### 1.1 Escenario principal (preferente — ya existe)

```
Experience Form (destino V1) o Portal Admisión
  → dual-write fail-soft (live-ingest)
  → upsertGrowthPersona (dedupe email/teléfono, tenant)
  → openGrowthOpportunity (crear o reutilizar)
  → recordGrowthActivity (form_submitted | application_received + opportunity_opened)
  → Event Bus Growth* → subscriber Automatizaciones (si hay active)
  → [hueco] nextAction no se crea por defecto
  → operador (o automatización) define nextAction / follow-up / transición
  → open → active → won | lost
  → Analítica V1 + Inicio leen los mismos SSOT growth_*
```

### 1.2 Canales de entrada (realidad)

| Canal | ¿Crea Persona? | ¿Crea Oportunidad? | ¿Captura origen? | Recorrido real |
| --- | --- | --- | --- | --- |
| **Formulario** (destinos `contact` / `information_request` / `event_registration`) | Sí | Sí (`inquiry` o `registration`) | Sí (`kind: form\|event`, formId, campaign si aplica) | Captación comercial completa |
| **Portal / Admisión** (`portal_interesados`) | Sí | Sí (`conversion`) | Sí (`kind: admission`) | Completo; si handoff entregado → `active` → `handed_off` (no es won) |
| **WhatsApp** (Cloud webhook) | Sí (por teléfono) | **No** | Primer origen `unknown` + canal WhatsApp | Persona + Conversación + Mensaje; **fuera del pipeline de Ventas** hasta acción humana posterior |

**No se asume** que los tres crean Oportunidad: solo Formulario V1 y Admisión lo hacen hoy.

### 1.3 Preguntas centrales — respuesta con evidencia

| Pregunta | ¿Responde hoy? | Dónde |
| --- | --- | --- |
| ¿Quién llegó? | Sí | `growth_personas` · Personas / Inicio |
| ¿De dónde llegó? | Sí (primer toque + origen por oportunidad) | `persona.origin` inmutable · `oportunidad.origin` |
| ¿Qué quiere? | Sí (si hubo Form/Admisión) | `typeKey` + subject · Ventas / ficha Persona |
| ¿Qué ocurrió? | Sí | `growth_actividades` (+ proyección mensajes en Actividad) |
| ¿Qué debemos hacer ahora? | **Solo si alguien lo definió** | `oportunidad.nextAction` · Inicio / Personas / Ventas |
| ¿Qué hizo Growth OS? | Parcial | Automatizaciones + actor `growth-automation` en actividad/historial de runs |
| ¿Terminó convirtiendo? | Sí | `status: won\|lost` + `closedAt` · Analítica |
| ¿Podemos medirlo? | Sí | `/admin/analitica` sobre SSOT Growth (no `core_events`) |

---

## 2. Evidencia revisada

### 2.1 Código (conexiones reales)

| Pieza | Ubicación | Rol en el viaje |
| --- | --- | --- |
| Captura forms | `src/core/experience/forms/engine.ts` → `ingestFormSubmissionToGrowthSafe` | Dual-write post-persist |
| Captura admisión | `src/core/admission/interesado-repository.ts` → `ingestInteresadoToGrowthSafe` | Dual-write post-persist |
| Proyección | `src/core/growth/ingest.ts` (`projectGrowthFromSignal`) | Persona + Opp + Actividad + handoff |
| Live deps | `src/lib/growth/live-ingest.ts` | Stores + workflow + Event Bus + bridge campañas |
| Dedupe | `src/core/growth/upsert-persona.ts` | email/phone normalizados, tenant-scoped |
| Oportunidad | `src/core/growth/open-opportunity.ts` · `transition-opportunity.ts` | open/reuse · won/lost/handed_off/archive |
| Next action | `src/core/growth/next-action.ts` · `src/lib/growth/sales-ops.ts` | set/clear + actividad |
| Automatizaciones | `src/core/events/handlers/builtin.ts` → `automations-runtime` | Un solo motor; actor `growth-automation` |
| WhatsApp | `src/core/growth/whatsapp/receive.ts` | Persona + inbound; **sin** open opportunity |
| Campañas | `resolveFormCampaignTrackingKeyForIngest` | `origin.campaign` en form ingest |
| Analítica | `src/lib/growth/analytics-aggregate.ts` · `/admin/analitica` | Read model periodizado |
| Actividad UI | `/admin/actividad` · `actividad-read.ts` | Feed comercial + mensajes proyectados |
| Inicio | `load-home-snapshot.ts` · `project-home.ts` | Métricas + atención + historia |

### 2.2 Pruebas reejecutadas (2026-09-14)

| Suite | Resultado |
| --- | --- |
| `growth-ingest.test.ts` | PASS (cableado + proyección + multi-tenant + fail-soft) |
| `growth-sales-001.test.ts` | PASS (transiciones, nextAction, follow-up, tenant) |
| `growth-oportunidades.test.ts` | PASS (reuse, won/lost/handed_off, nextAction) |
| `growth-personas.test.ts` | PASS (dedupe, identity_conflict, tenant) |
| `growth-campaigns-003.test.ts` | PASS (bridge campaign, firstOrigin vs opp.origin, métricas) |
| `growth-analytics-003.test.ts` | PASS (cohorte, handed_off≠won, archive excluido, mensajes, tenant) |
| `growth-activity-001.test.ts` | PASS (superficie Actividad) |
| `growth-messaging-002.test.ts` | PASS (inbound WA sin Meta real; persona por teléfono) |

**No se inventaron métricas ni capturas.** No se escribió prueba nueva: las suites existentes demuestran cada tramo; el corte E2E es de producto (orquestación), no de falta de motor.

### 2.3 Datos reales / fixtures

- Viaje **Form/Admisión** demostrado con stores en memoria + cableado de producción verificado por test estático.
- Viaje **WhatsApp** demostrado en tests de dominio; **live Meta** = dependencia externa (fuera de bloqueo de esta auditoría).
- No se usó producción ni se fabricaron datasets solo para cuadrar Analítica.

---

## 3. Matriz E2E ejecutiva

| # | PASO | ESTADO | QUÉ FUNCIONA | QUÉ FALTA | SEVERIDAD | ¿BLOQUEA VENTA DEL PRODUCTO? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Captar | **FUNCIONA** | Forms V1 + Admisión dual-write fail-soft; campaign bridge; destinos fuera de alcance se omiten sin romper fuente | Destinos académicos/otros no proyectan a Growth (esperado) | S3 | No |
| 2 | Identificar Persona | **FUNCIONA** | Dedupe email/teléfono; primer origen inmutable; multi-tenant; crear manual admin | `identity_conflict` deja captura sin Oportunidad nueva (sin merge) | S2 | No (piloto con un identificador estable) |
| 3 | Crear Oportunidad | **FUNCIONA** (Form/Admisión) · **NO FUNCIONA** (solo WA) | Open/reuse por typeKey+asunto; origen propio; workflow `growth.opportunity` | WhatsApp no abre oportunidad | S1 (si el cliente vende por WA) / S2 (piloto form-first) | Condicional |
| 4 | Mostrar qué hacer | **FUNCIONA CON AJUSTE** | Contrato `nextAction` real; visible en Inicio/Personas/Ventas; Automatización puede setearlo | **No se crea al captar**; Inicio solo lista quien ya tiene nextAction | **S1** | **Sí** (promesa operativa rota) |
| 5 | Registrar seguimiento | **FUNCIONA** | note/contact vía sales-ops; actividad append-only; UI Actividad humana | Depende de operador (manual) salvo automatización | S2 | No |
| 6 | Automatizar | **FUNCIONA CON AJUSTE** | Evento→trigger→condición→acción→historial; wait/resume; tenant + actor fijo; un solo motor | **No hay playbook de arranque**; hay que publicar automation active | S2 | Parcial (piloto operable a mano) |
| 7 | Conversar | **FUNCIONA** (dominio) · **DEPENDE DE EXTERNO** (Meta) | Conversación↔Persona; inbound/outbound modelo; Actividad proyecta mensajes; ficha Persona lee hilos | WA sin opp; `oportunidadId` opcional y no cableado en receive; envío live Meta | S2 / externo | No para piloto form+manual |
| 8 | Avanzar venta | **FUNCIONA** | open→active→… vía Ventas; actividad de transición; mismo motor workflow | Transiciones son acción humana (o automation) | S2 | No |
| 9 | Convertir/perder | **FUNCIONA** | won/lost + `closedAt`; handed_off ≠ won; archive fuera de cohorte analítica | Motivo cualitativo de pérdida no modelado | S3 | No |
| 10 | Medir | **FUNCIONA** | Analítica V1: personas, opps, seguimiento, ganadas/perdidas, conversión, captación, campañas, mensajes | No usa `core_events` (correcto); coherencia temporal Inicio (snapshot) vs Analítica (período) | S3 | No |
| 11 | Ver resumen en Inicio | **FUNCIONA CON AJUSTE** | Métricas, orígenes, «Qué ha pasado», «Qué hacer ahora» desde SSOT | «Qué hacer ahora» vacío tras captación fresca | **S1** | **Sí** (primera impresión operativa) |

---

## 4. Hallazgos por dominio

### 4.1 Captura — FUNCIONA

- **Conectado de verdad:** `submitExperienceForm` / `interesado-repository` → live-ingest → `projectGrowthFromSignalSafe`.
- **Fail-soft:** fallos de Growth no revierten submission/interesado.
- **Campaign tracking:** solo si hay campaña `active` del Espacio ligada al `formId`; draft/ended no atribuyen (tests E/F/G/I/J/K).
- **Cortes:** destinos no-V1 no proyectan; formulario sin email ni teléfono → `missing_identity` (skip).

### 4.2 Persona — FUNCIONA

- Misma persona al reentrar con mismo email o teléfono **en el mismo Espacio** → `matched` (tests CORE-002/005).
- Primer origen **no se sobrescribe**; nueva intención puede abrir otra Oportunidad con su propio `origin` (incl. otra campaña).
- Relación 1→N Oportunidades, Conversaciones (read), Actividad: confirmada en proyección UI Personas.
- **Riesgo duplicados:** `identity_conflict` (email→A, teléfono→B) sin merge → S2.

### 4.3 Oportunidad — FUNCIONA (canal Form/Admisión)

Responde: qué quiere (`typeKey`/subject), estado (`status`), qué hacer (`nextAction` si existe).

Estados auditados: `open`, `active`, `won`, `lost`, `handed_off`, `archived` — plantilla única `growth.opportunity`.

**Corte:** WhatsApp no participa de este paso.

### 4.4 Qué hacer ahora — FUNCIONA CON AJUSTE (corte principal)

| Aspecto | Realidad |
| --- | --- |
| Cómo se crea | `setGrowthNextAction` / `salesSetNextAction` / acción automation |
| Quién lo crea | Operador humano **o** `growth-automation` |
| Dónde se ve | Inicio (solo con nextAction), Personas, Ventas, ficha |
| Cómo cambia / limpia | set / clear → actividad `next_action_set` |
| ¿Inicio = Ventas? | Misma fuente embebida; Inicio filtra a “con nextAction”; Ventas puede listar sin ella |
| ¿Automation puede? | Sí (`salesSetNextAction` / `salesClearNextAction`) |
| Hueco de producto | Tras captar, **estado abierto sin nextAction** es el default |

Clasificación: **S1 · FUNCIONA CON AJUSTE**.

### 4.5 Actividad — FUNCIONA

- Acciones manuales, transiciones, handoff, automation (vía sales-ops), mensajes proyectados en feed `/admin/actividad`.
- Operador puede entender “qué ha pasado” sin logs (`humanize` Inicio + labels Actividad).
- Identity audit permanece separado en `/admin/settings/activity` (correcto).

### 4.6 Automatizaciones — FUNCIONA CON AJUSTE

Cadena mínima útil ya soportada y testeada:

`GrowthOpportunityOpened` → condición → `salesSetNextAction` / follow-up / transition (+ wait/resume).

| Confirmación | Estado |
| --- | --- |
| Tenant isolation | Sí |
| Actor `growth-automation` | Sí |
| Acciones sobre opp vía sales-ops | Sí |
| Historial runs | Sí |
| Segundo motor | No |
| Playbook default post-onboarding | **No** |

Sin automation publicada, el viaje E2E comercial depende 100% de pasos manuales en Ventas → **S2**.

### 4.7 Mensajes — FUNCIONA (dominio) / DEPENDE DE EXTERNO (Meta)

| Caso | Resultado |
| --- | --- |
| WA sin oportunidad | Persona + hilo; **no** entra a Ventas solo |
| Conversación ↔ proceso comercial | Campo `oportunidadId` existe; receive WA **no lo setea**; UI Mensajes solo **muestra** link si ya está |
| Mensajes ↔ Ventas contexto | Parcial: ficha Persona tiene ambos; no hay puente operativo forzado |

No se bloquea la auditoría por Meta.

### 4.8 Campañas — FUNCIONA

Recorrido real: Campaña active → formId → ingest `campaign=trackingKey` → `oportunidad.origin.campaign` (+ `persona.origin.campaign` solo en alta). Métricas derivadas; automation condicionable por `origin.campaign`. Distinción firstOrigin vs Opportunity.origin **confirmada en tests**.

### 4.9 Conversión — FUNCIONA

- `open → active → won` y `→ lost` con actividad + `closedAt`.
- Analítica: won/lost por `closedAt`; cohorte por `openedAt`; `handed_off` no suma won; `archived` excluido.

### 4.10 Analítica — FUNCIONA

Misma materia del viaje (personas/opps/mensajes/campañas) en `/admin/analitica`. Fuente: colecciones Growth, **no** `core_events`.

### 4.11 Inicio — FUNCIONA CON AJUSTE

Coherente en fuentes con Personas/Actividad/Ventas, pero la sección operativa estrella queda vacía hasta que exista nextAction → refuerza el hallazgo S1.

### 4.12 Multi-tenant — FUNCIONA

- Lecturas/escrituras Growth filtradas por `tenantId` del Espacio.
- Tests de aislamiento en ingest, personas, sales, campaigns, analytics, messaging.
- Sin hardcodes SEM/ADL en `src/lib/growth`.
- Credenciales WhatsApp por conexión/`phone_number_id` (no compartidas entre Espacios en el diseño auditado).
- Sin fuga detectada en el recorrido E2E revisado.

**No S0** de fuga multi-tenant en este viaje.

---

## 5. Clasificación consolidada de hallazgos

| ID | Hallazgo | Severidad | Estado |
| --- | --- | --- | --- |
| H1 | Tras captación, Oportunidad nace sin `nextAction`; Inicio/Personas no muestran “qué hacer ahora” | **S1** | FUNCIONA CON AJUSTE |
| H2 | WhatsApp inbound no crea/reutiliza Oportunidad ni nextAction | **S1** (cliente WA-first) / **S2** (piloto form-first) | NO FUNCIONA (tramo comercial) |
| H3 | Conversación no se vincula automáticamente a Oportunidad; sin UI clara para enlazar | **S2** | FUNCIONA CON AJUSTE |
| H4 | Automatización útil existe pero requiere configuración/publicación por Espacio | **S2** | FUNCIONA CON AJUSTE |
| H5 | `identity_conflict` corta proyección de Oportunidad | **S2** | FUNCIONA CON AJUSTE |
| H6 | Admisión con handoff entregado cierra en `handed_off` (fuera de funnel won) | **S3** / diseño SEM | FUNCIONA |
| H7 | Envío/recepción WA live depende de Meta + conexión habilitada | **S2** | DEPENDE DE EXTERNO |
| H8 | Inicio = snapshot total vs Analítica = período | **S3** | FUNCIONA |

**S0:** ninguno en este recorrido (sin segundo CRM, sin fuga tenant demostrada, sin doble motor de automation).

---

## 6. Dependencias externas

| Dependencia | Impacto en E2E | ¿Bloquea auditoría? |
| --- | --- | --- |
| Meta WhatsApp Cloud | Inbound/outbound live | No |
| Experience Forms publicados + destinos V1 | Captación form | No (infra producto) |
| Event Bus / scheduled runner | Automation triggers y waits | No (ya cableado) |
| Identity / membresía Espacio | Acceso admin | No (Equipo V1 cerrado) |

---

## 7. Pasos manuales vs automáticos (hoy)

| Paso | Automático hoy | Manual hoy |
| --- | --- | --- |
| Persistir form/admisión | Sí | — |
| Persona + Opp + Actividad captación | Sí (Form/Admisión) | Crear Persona admin opcional |
| Atribuir campaña | Sí si campaña active | Crear/activar campaña |
| Definir nextAction | Solo si hay automation | Operador en Ventas |
| Follow-up note/contact | Solo si automation | Operador |
| Transición active/won/lost | Solo si automation | Operador |
| Responder WhatsApp | — | Operador (+ Meta) |
| Vincular hilo a oportunidad | — | No hay flujo UI claro |
| Leer Analítica / Inicio | Automático (lectura) | Interpretar |

---

## 8. Multi-tenant (resumen)

**APTO** para el viaje E2E auditado: datos, actividades, oportunidades, conversaciones, campañas, automatizaciones y analítica están scoped por Espacio. No se observó uso de config global como tenant ni credencial compartida entre clientes en el camino Growth revisado.

---

## 9. Pruebas (mapa por tramo)

| Tramo | Suites |
| --- | --- |
| Captura / ingest | `growth-ingest.test.ts` |
| Persona / dedupe | `growth-personas.test.ts`, `growth-personas-003` |
| Oportunidad / nextAction | `growth-oportunidades.test.ts`, `growth-sales-001*` |
| Actividad | `growth-activity-001`, `growth-actividades`, `growth-ux-activity-002` |
| Automatizaciones | `growth-automation-002`…`007` |
| Mensajes / WA | `growth-messaging-001`…`005` |
| Campañas | `growth-campaigns-003`, `growth-ux-campaigns-004` |
| Analítica | `growth-analytics-003`, `growth-ux-analytics-004` |
| Inicio / shell | `growth-os-admin-master`, `growth-os-admin-shell-002*` |
| Multi-tenant | embebido en las anteriores |

---

## 10. Veredicto

### ¿Growth OS ya puede operar de punta a punta para un cliente real?

# APTO CON BLOQUEOS IDENTIFICADOS

**Puede pilotearse** un cliente **form-first** si el equipo:

1. publica formularios V1,
2. opera Ventas (nextAction + seguimiento + won/lost), y/o
3. publica al menos una Automatización `GrowthOpportunityOpened → salesSetNextAction`.

**No** puede venderse aún como E2E comercial completo “llega alguien y el sistema ya sabe qué hacer / WhatsApp entra solo al embudo”, porque eso **no ocurre sin configuración u operación manual**.

### Bloqueos ordenados por impacto

1. **H1 — Captura no produce “qué hacer ahora”** (rompe el viaje narrado en producto).
2. **H2 — WhatsApp no entra al pipeline de Oportunidad** (rompe canal comercial frecuente).
3. **H3+H4 — Puente conversación↔venta y playbook de automatización de arranque** (operatividad diaria incompleta).

---

## 11. TOP 3 frentes siguientes

*(Máximo 3; no se abren OTs automáticamente.)*

1. **Cerrar Captura → Qué hacer ahora**  
   Garantizar que una captación Form/Admisión deje una próxima acción visible (default de producto y/o automatización de arranque del Espacio), para que Inicio y Ventas coincidan con la promesa operativa.

2. **WhatsApp → proceso comercial**  
   Definir y cablear qué ocurre cuando llega un mensaje sin Oportunidad (abrir/reutilizar opp + nextAction, o decisión explícita de alcance fuera de Ventas).

3. **Conversación ↔ Oportunidad operable**  
   Que Mensajes y Ventas compartan contexto suficiente en el camino real (vínculo automático razonable y/o acción de operador), sin segundo inbox.

---

## 12. Conclusión

Los **motores están conectados**: no es un conjunto de módulos aislados. El viaje Form/Admisión → Persona → Oportunidad → Actividad → Ventas → Analítica **es real y testeado**. La brecha comercial E2E no es “falta de CRM”, sino **orquestación del primer nextAction**, **entrada WhatsApp al embudo**, y **contexto conversación–venta**. Con esos tres frentes resueltos, el camino a un piloto comercialmente operable queda desbloqueado; hasta entonces el veredicto permanece **APTO CON BLOQUEOS IDENTIFICADOS**.
