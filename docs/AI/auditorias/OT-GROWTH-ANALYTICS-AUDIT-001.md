# OT-GROWTH-ANALYTICS-AUDIT-001 — Auditoría funcional de Analítica Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-ANALYTICS-AUDIT-001 |
| Tipo | Auditoría / contrato (sin implementación) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-11 |
| Entrada | Menú Growth OS «Analítica»; [ADR-010](../../architecture/ADR-010.md); Campañas CONTRACT-002 / CAMPAIGNS-003; Actividad ACTIVITY-001; Ventas / Mensajes / Automatizaciones existentes |
| Estado | **CERRADA · APTO CON AJUSTES** |
| Alcance | Auditar qué puede medir Growth OS **hoy** con datos reales y definir qué debe incluir Analítica V1 |
| Fuera de alcance | Implementación · diseño visual de dashboards · tocar Growth Core / Ventas / Mensajes / Actividad / Campañas / Automatizaciones / Shell / Inicio · Meta/WhatsApp · DNS/infra · datos productivos · abrir OT de implementación |

**Restricciones cumplidas:** sin código de producto; sin nueva colección; multi-tenant obligatorio en el contrato propuesto; sin abrir OT de implementación automáticamente.

---

## Gate final

**APTO CON AJUSTES · recomendación B**

Sí se puede construir **Analítica V1** como superficie de **lectura agregada** sobre SSOT Growth existentes (`growth_personas`, `growth_oportunidades`, `growth_mensajes` / `growth_conversaciones`, `growth_campaigns` + métricas derivadas, y opcionalmente conteos desde `growth_actividades`), **sin** warehouse, sin `growth_analytics_events`, sin duplicar `core_events` y sin segundo CRM.

**Matiz crítico:** el módulo Analítica **no existe** hoy (solo placeholder de nav). Los datos y varios read-models parciales **sí**. V1 debe responder “¿cómo está mi negocio y dónde mirar?” con conteos periodizados y desgloses humanos de origen/estado/campaña — no con telemetría técnica ni KPIs de ads.

---

## Pregunta principal

> ¿Qué preguntas del negocio puede responder Growth OS con evidencia real, reutilizando los motores y colecciones existentes?

**Las de captación, pipeline comercial y campañas atribuidas; parcialmente mensajes; no las de marketing ads ni “por qué se perdió” cualitativo.**

| Dominio | ¿Respuesta real hoy? | Fuente |
| --- | --- | --- |
| Personas nuevas / totales / origen de primer toque | Sí | `growth_personas` |
| Oportunidades creadas / estados / tipo / origen de intención | Sí | `growth_oportunidades` |
| Resultados por campaña | Sí (si hay `origin.campaign`) | `growth_oportunidades` + `deriveCampaignMetrics` |
| Conversaciones / mensajes / canal | Sí (conteos) | `growth_conversaciones` / `growth_mensajes` |
| SLA respuesta / leídos / CTR / ingresos | No o frágil | Faltan estados / montos |
| Automatizaciones (runs) | Sí, pero **operativa** | `growth_automation_runs` — fuera del núcleo V1 |

---

## 1. Estado actual de Analítica

### 1.1 Ruta / menú

| Qué cree el operador | Qué hay hoy |
| --- | --- |
| `/admin/analitica` | **No existe** (0 rutas App Router) |
| Ítem nav «Analítica» | `href: null` en `nav-domains.ts` y `master-nav.ts` |
| Permisos `growth.analytics.*` | **No existen** |
| Colección / APIs analytics Growth | **No existen** |
| Charts / reportes / queries agregadas de módulo | **No** |

Contraste: Personas, Ventas, Mensajes, Actividad, Campañas, Automatizaciones **sí** tienen ruta. Analítica es el único ítem del bloque «Crecer» que sigue en placeholder puro.

### 1.2 Inventario de términos (qué es real vs ruido)

| Término | Hallazgo |
| --- | --- |
| `analitica` / Analítica | Solo nav + icono; sin página |
| `src/core/analytics` | Stub de interfaz `AnalyticsService.track` — telemetría genérica de plataforma, **no** Analítica Growth |
| Métricas Campañas | **Reales y derivadas** (`campaigns/metrics.ts`, `campaigns-read.ts`) — viven en módulo Campañas, no en Analítica |
| `conversion` | En Growth es **`typeKey` de oportunidad** (admisión), **no** tasa de conversión |
| `core_events` / handlers `analytics.*` | Event Bus / logs — **no** UI comercial |
| Dashboard `/admin` Inicio | Home del Espacio; no es Analítica V1 |

**Conclusión:** Analítica = **placeholder**. Lo medible ya está en colecciones Growth + métricas de Campañas.

### 1.3 Principio de producto (congelado para V1)

Analítica ayuda a entender:

> «¿Cómo está funcionando mi negocio y dónde debo mirar?»

**No** debe convertirse en:

- segundo Event Bus;
- data warehouse prematuro;
- segundo CRM;
- colección paralela de métricas;
- dashboard de números sin decisión.

---

## 2. Fuentes reales disponibles

### 2.1 SSOT Growth (usar)

| Colección | Rol en Analítica V1 | Timestamp canónico |
| --- | --- | --- |
| `growth_personas` | Captación: altas, totales, primer origen | `createdAt` |
| `growth_oportunidades` | Ventas / conversión / campañas | `openedAt` (alta); `closedAt` (cierre won/lost/handed_off/archived); `updatedAt` (no para “nuevas”) |
| `growth_actividades` | Evolución de hechos comerciales (conteos por `kind` / período); **no** KPI primario de pipeline | `occurredAt` |
| `growth_conversaciones` | Hilos / canal / personas que escribieron | `createdAt` / `lastMessageAt` |
| `growth_mensajes` | Mensajes in/out; evolución temporal | `occurredAt` |
| `growth_campaigns` | Catálogo de campañas + `trackingKey` | config; resultados vía oportunidades |
| `growth_automations` / `growth_automation_runs` | Salud operativa (opcional / diferido del núcleo) | `startedAt` / `updatedAt` |

### 2.2 Fuentes de ingestión (no SSOT de Analítica)

| Colección | Relación | Uso en Analítica |
| --- | --- | --- |
| `experience_form_submissions` | Proyecta a Persona + Oportunidad vía live ingest | **No** contar submissions en Analítica; ya están en Growth |
| `portal_interesados` | Idem (admisión → tipo `conversion` + posible `handed_off`) | **No** mezclar con métricas Growth; pertenece al dominio académico/admission |

### 2.3 `core_events`

| Pregunta | Respuesta |
| --- | --- |
| ¿Debe alimentar Analítica V1? | **No.** |
| ¿Puede quedar fuera? | **Sí — debe quedar fuera** de la UI `/admin/analitica`. |
| Motivo | Es infraestructura del Event Bus (disparos, auditoría técnica). ADR-010 y ACTIVITY-AUDIT ya fijan el timeline comercial en `growth_actividades`, no en `core_events`. |

### 2.4 Multi-tenant

Toda métrica:

```text
tenantId del Espacio activo
+
rango temporal (cuando aplique)
```

Todo join conserva `tenantId`. SEM ∉ ADL y ADL ∉ SEM. **Sin** estadísticas globales en `/admin/analitica`. Analítica de plataforma (si existiera) = `/platform`, fuera de alcance.

---

## 3. Personas — qué se puede medir

| Pregunta | ¿Real? | Evidencia / regla |
| --- | --- | --- |
| Personas nuevas (período) | **Sí** | `count` donde `tenantId` + `createdAt` ∈ rango; excluir `status: merged` (y normalmente `archived`) |
| Personas totales | **Sí** | Mismo filtro sin rango (o “activas”) |
| Evolución por período | **Sí** | Buckets por `createdAt` |
| De dónde llegaron | **Sí** | `persona.origin` (primer origen **inmutable**) |
| Canal | **Sí** | `origin.channel` → label humano (`humanizeOriginDisplayLabel` / labels) |
| Formulario | **Sí** | `origin.formId` / `formDestination` → resolver nombre de form; **nunca** mostrar id crudo |
| Campaña (primer toque) | **Parcial** | Solo si al **alta** de Persona se escribió `origin.campaign` (ingest form con campaña active). Rematch **no** cambia origen de Persona |
| Personas con oportunidades | **Sí** | Distinct `personaId` en `growth_oportunidades` del tenant |

### 3.1 No mezclar orígenes

| Concepto | Campo | Significado |
| --- | --- | --- |
| Primer origen de **Persona** | `growth_personas.origin` | Primer toque de identidad comercial |
| Origen de **Oportunidad** | `growth_oportunidades.origin` | Origen de **esa** intención |

Una Persona WhatsApp (`kind: unknown`, `channel: whatsapp`) puede luego tener una Oportunidad de formulario con `origin.campaign`. Analítica V1 debe etiquetar secciones:

- Captación → origen de Persona  
- Ventas / Campañas → origen de Oportunidad  

### 3.2 Caso WhatsApp

Inbound WhatsApp crea Persona **sin** Oportunidad (`receive.ts`). Por eso **no** toda Persona implica embudo de ventas.

---

## 4. Ventas / Oportunidades

| Métrica | ¿Real? | Definición operativa |
| --- | --- | --- |
| Oportunidades creadas | **Sí** | `openedAt` ∈ rango |
| Abiertas (`open`) | **Sí** | `status === "open"` (snapshot o cohort) |
| En seguimiento (`active`) | **Sí** | Copy workflow: «En seguimiento» — alineado a Campañas V1 |
| Ganadas (`won`) | **Sí** | Sin monto |
| Perdidas (`lost`) | **Sí** | Sin motivo cualitativo |
| Traspasadas (`handed_off`) | **Sí** | Estado final real (admisión); **no** es `won` |
| Archivadas | **Sí** | Reportar aparte o excluir de conversión |
| Por `typeKey` | **Sí** | Consulta / Registro / Conversión (labels de espacio) |
| Por origen de oportunidad | **Sí** | `oportunidad.origin.*` humanizado |
| Por campaña | **Sí** | `origin.campaign === trackingKey` |
| Ingresos / ventas monetarias | **No** | No hay amount/currency en Growth |

### 4.1 Advertencia de vocabulario

`typeKey: "conversion"` = tipo de oportunidad de **admisión**, no “tasa de conversión”. En UI Analítica usar labels humanos («Registro», «Consulta», «Conversión») y reservar la palabra **conversión** para la tasa definida en §11.

---

## 5. Mensajes

### 5.1 Sostenible en V1

| Métrica | ¿Real? | Cómo |
| --- | --- | --- |
| Conversaciones (período / total) | **Sí** | `growth_conversaciones` + `createdAt` / actividad |
| Mensajes recibidos | **Sí** | `direction: inbound` + `occurredAt` |
| Mensajes enviados | **Sí** | `direction: outbound` + `occurredAt` (status `sent` / `failed`) |
| Personas que escribieron | **Sí** | Distinct `personaId` vía conversaciones con inbound |
| Canal | **Sí** | `channel` → labels (`whatsapp` → «WhatsApp»; otros canales declarados) |
| Evolución temporal | **Sí** | Buckets por `occurredAt` |

### 5.2 Frágil / fuera de V1

| Métrica | Decisión | Motivo |
| --- | --- | --- |
| Tiempo de primera respuesta | **Fuera V1** (o experimental diferido) | Calculable en teoría (1er inbound → 1er outbound del hilo), pero sin contrato de “respuesta humana vs automática”, sin cobertura de todos los canales, y sin SLA formal en ADR-010 |
| Conversaciones sin responder | **Extensión pequeña aceptable** | Heurística: último mensaje del hilo es `inbound` — útil y sostenible; etiquetar como «sin respuesta en bandeja», no SLA |
| Tiempo promedio de respuesta | **Fuera V1** | Misma fragilidad que primera respuesta |
| Entregados / leídos | **No** | Tipo admite `delivered`; runtime WhatsApp persiste `received` / `queued` / `sent` / `failed`. **No** hay read receipts |
| CTR / tasa de apertura | **No** | Sin ads ni email marketing |

---

## 6. Campañas

Reutilizar contrato Campañas V1 ([CONTRACT-002](./OT-GROWTH-CAMPAIGNS-CONTRACT-002.md) §9) y código existente:

`deriveCampaignMetrics` / `getCampaignMetrics`:

| Métrica | Definición |
| --- | --- |
| Personas captadas | `COUNT DISTINCT personaId` en opps con `origin.campaign === trackingKey` |
| Oportunidades generadas | `COUNT` esas opps |
| En seguimiento | `status === "active"` |
| Ganadas | `status === "won"` |
| Perdidas | `status === "lost"` |

### 6.1 Evaluaciones Analítica

| Capacidad | ¿V1? | Nota |
| --- | --- | --- |
| Comparación entre campañas | **Sí** | Tabla / ranking por métricas §9.1 del mismo tenant |
| Evolución temporal por campaña | **Sí con extensión** | Filtrar opps por `openedAt` + `origin.campaign` (hoy el derive es snapshot total) |
| Conversión por campaña | **Sí** | Misma fórmula §11 acotada al set de la campaña |
| Alcance / impresiones / CTR / ROAS / costos / ads | **No** | Sin datos |

Ingest actual (CAMPAIGNS-003): form submission → resuelve campaña `active` por `formId` → escribe `origin.campaign` en la proyección. Sin campaña active, no hay atribución (correcto).

---

## 7. Automatizaciones

`growth_automation_runs` permite:

| Métrica | ¿Datos? | ¿En Analítica V1? |
| --- | --- | --- |
| Ejecuciones | Sí (`startedAt`) | **No en núcleo** |
| Completadas / esperando / needs_attention | Sí (`status`) | **No en núcleo** |
| Automatizaciones más activas | Sí (group by `automationId`) | **No en núcleo** |

**Distinción:**

| Tipo | Ejemplo | Dónde |
| --- | --- | --- |
| Métrica de **negocio** | Personas, opps, ganadas, campañas | Analítica V1 |
| Métrica **operativa** | Runs, waits, fallos | Módulo Automatizaciones / historial |

V1 de Analítica **no** se llena de telemetría técnica. Como máximo, un indicador opcional diferido («Automatizaciones necesitaron atención») enlazando a `/admin/automatizaciones` — no charts de runner.

---

## 8. Orígenes / canales medibles

### 8.1 `GrowthOriginKind` real

| Técnico | Label humano (`labels.ts`) |
| --- | --- |
| `admission` | Admisión |
| `form` | Formulario |
| `event` | Evento |
| `manual` | Registro manual |
| `unknown` | Sin origen claro |

### 8.2 Agrupaciones humanas posibles (presentación)

Reutilizar `growthOriginKindLabel` + `humanizeOriginDisplayLabel` + labels de canal/destino:

| Agrupación UI | Base real |
| --- | --- |
| Sitio web / Portal | `channel` portal-admision / destinos de form humanizados |
| Formulario | `kind: form` (+ nombre form) |
| Admisión | `kind: admission` |
| WhatsApp | `channel: whatsapp` (aunque `kind` sea `unknown` en alta inbound) |
| Campaña | vía `origin.campaign` → **nombre** de `growth_campaigns`, no `trackingKey` |
| Manual | `kind: manual` |
| Otros / sin origen claro | `unknown` sin canal útil |

### 8.3 Nunca mostrar al usuario

`origin.kind` crudo · `origin.channel` crudo · `formId` · `trackingKey` · `sourceCollection` · `sourceId`.

---

## 9. Períodos y timestamps

### 9.1 Períodos sostenibles (propuesta; sin implementar)

| Período | Uso |
| --- | --- |
| Últimos 7 días | Operativo corto |
| Últimos 30 días | Default razonable V1 |
| Este mes | Calendario del Espacio (TZ a fijar en implementación; default UTC o TZ del tenant si existe) |
| Mes anterior | Comparable |
| Rango personalizado | Sí, con límite máximo razonable |

### 9.2 Timestamp por métrica

| Métrica | Timestamp |
| --- | --- |
| Persona nueva | `growth_personas.createdAt` |
| Oportunidad generada | `growth_oportunidades.openedAt` |
| Ganada / perdida / traspasada **en el período** | Preferir `closedAt` ∈ rango |
| Snapshot “cuántas están en seguimiento ahora” | `status` actual (no fecha de alta) |
| Mensaje | `growth_mensajes.occurredAt` |
| Actividad / hecho | `growth_actividades.occurredAt` |
| Campaña (resultados) | Derivados de oportunidades (openedAt/closedAt según KPI); **no** `campaign.createdAt` como proxy de resultados |
| Run automatización | `startedAt` (si alguna vez se muestra) |

**No** mezclar `updatedAt` de oportunidad como “nueva venta”.

---

## 10. Evaluación de funnel

### Concepto tentativo

```text
Personas
  ↓
Oportunidades
  ↓
En seguimiento
  ↓
Ganadas
```

### Veredicto

**Engañoso como embudo estricto de la misma población.**

| Problema | Evidencia |
| --- | --- |
| No toda Persona tiene Oportunidad | WhatsApp inbound crea Persona sin opp |
| “En seguimiento” no es hijo exclusivo de “Oportunidades nuevas del período” | Es estado workflow; una opp puede abrirse y quedarse `open` |
| `handed_off` es éxito de traspaso académico, no “ganada” | Admisión / tipo `conversion` |
| Personas rematchadas no “entran” otra vez | Origen de Persona inmutable; nuevas intenciones = nuevas opps |

### Recomendación V1

**No** vender un funnel Personas→Ganadas como conversión única.

Preferir **dos lecturas**:

1. **Captación:** Personas nuevas (+ desglose origen).  
2. **Pipeline comercial:** Oportunidades por estado (Abierta / En seguimiento / Ganada / Perdida / Traspasada), con cohort por `openedAt` cuando se hable de conversión.

Si se muestra un embudo visual, que sea **solo sobre oportunidades** (generadas → activas → ganadas) y con copy que no implique que toda Persona “debe” caer ahí.

---

## 11. Definición propuesta de conversión

### 11.1 Fórmula V1 (negocio comercial)

```text
Conversión = ganadas / oportunidades generadas
```

| Pieza | Definición |
| --- | --- |
| **Numerador** | Oportunidades con `status === "won"` |
| **Denominador** | Oportunidades con `openedAt` ∈ período (cohort) **o**, si se pide “tasa del período actual”, el mismo conjunto acotado por `tenantId` |
| **Período preferido** | **Cohort:** oportunidades **abiertas** en el rango; estado leído al momento de la query |
| Alternativa “cierres del período” | Numerador: `won` con `closedAt` ∈ rango; denominador: opps con `openedAt` ∈ rango — **no mezclar** sin etiquetar |

### 11.2 Tratamiento de estados

| Estado | En denominador cohort | En numerador | Nota UI |
| --- | --- | --- | --- |
| `open` | Sí | No | Abierta |
| `active` | Sí | No | En seguimiento |
| `won` | Sí | Sí | Ganada |
| `lost` | Sí | No | Perdida |
| `handed_off` | Sí | **No** | Traspasada — KPI **aparte** («Traspasadas»), no inflar “ganadas” |
| `archived` | **Excluir** del ratio | No | Ruido; mostrar conteo aparte si hace falta |

### 11.3 Qué no congelar

- No usar `typeKey === "conversion"` como proxy de tasa.  
- No inventar ingresos.  
- No llamar “conversión” a `handed_off` sin copy explícito de traspaso.

### 11.4 Conversión por campaña

Misma fórmula sobre el subconjunto `origin.campaign === trackingKey`.

---

## 12. Comparaciones período vs período

| Capacidad | ¿V1? | Condición |
| --- | --- | --- |
| Totales absolutos del período | **Sí** | Definiciones §9–§11 |
| «X vs período anterior» en absolutos | **Sí con extensión pequeña** | Misma métrica, misma longitud de ventana |
| «Subió 18%» con flechas | **Fuera V1** | Fácil de mentir con bases chicas (Espacio nuevo, 0→1); no inventar flechas decorativas |

Si el denominador del período anterior es 0 → mostrar “—” / “sin base”, nunca `Infinity%`.

---

## 13. Clasificación de las 10 preguntas de negocio

| # | Pregunta | Clasificación | Nota |
| --- | --- | --- | --- |
| 1 | ¿Cuántas personas nuevas llegaron? | **REAL HOY** | `createdAt` + tenant |
| 2 | ¿De dónde llegaron? | **REAL HOY** | Origen Persona + labels humanos |
| 3 | ¿Cuántas oportunidades se generaron? | **REAL HOY** | `openedAt` |
| 4 | ¿Cuántas siguen en seguimiento? | **REAL HOY** | `status: active` |
| 5 | ¿Cuántas ganamos? | **REAL HOY** | `won` (+ `closedAt` si es “en el período”) |
| 6 | ¿Cuántas perdimos? | **REAL HOY** | `lost` |
| 7 | ¿Qué campañas generan resultados? | **REAL HOY** | Métricas derivadas existentes; calidad depende de atribución ingest |
| 8 | ¿Cómo evolucionó la actividad comercial? | **REAL CON EXTENSIÓN PEQUEÑA** | Conteos periodizados de opps/actividades; feed Actividad ya existe pero no agrega KPIs |
| 9 | ¿Qué canales generan conversaciones? | **REAL HOY** | `growth_conversaciones.channel` |
| 10 | ¿Dónde estamos perdiendo oportunidades? | **REAL CON EXTENSIÓN PEQUEÑA** / parcial | **Sí:** desglose `lost` por origen / tipo / campaña. **No:** motivo cualitativo (no hay `lostReason`) |

---

## 14. Arquitectura recomendada

```text
/admin/analitica
  → requirePermission(growth.analytics.view)
  → analytics-read.ts (READ MODEL)
       → agregaciones Mongo tenant-scoped
       → reutiliza deriveCampaignMetrics / labels / humanize
  → SSOT existentes
```

| Decisión | Valor |
| --- | --- |
| ¿READ MODELS sobre SSOT? | **Sí — preferido** |
| ¿`growth_analytics_events`? | **No** |
| ¿Duplicar `core_events`? | **No** |
| ¿Warehouse / materialización? | **No** en V1 (salvo evidencia futura de rendimiento) |
| ¿Materializar contadores en campañas? | **No** — CONTRACT-002 ya lo prohíbe; Analítica tampoco |

### 14.1 Índices que podrían faltar

Existentes útiles: `tenantId+occurredAt` (actividades, mensajes); `tenantId+personaId+status` (opps); campañas por `trackingKey`.

| Índice propuesto | Colección | Para |
| --- | --- | --- |
| `{ tenantId: 1, createdAt: -1 }` | `growth_personas` | Personas nuevas / evolución |
| `{ tenantId: 1, openedAt: -1 }` | `growth_oportunidades` | Opps del período |
| `{ tenantId: 1, "origin.campaign": 1, openedAt: -1 }` | `growth_oportunidades` | Campañas + tiempo (sparse ok) |
| `{ tenantId: 1, status: 1, openedAt: -1 }` | `growth_oportunidades` | Pipeline periodizado |
| `{ tenantId: 1, closedAt: -1 }` | `growth_oportunidades` | Cierres del período (sparse) |
| `{ tenantId: 1, startedAt: -1 }` | `growth_automation_runs` | Solo si se expone algo operativo |

Evaluar en OT de implementación; no bloquear el contrato funcional.

---

## 15. Permisos

### 15.1 Hoy

| Módulo | Permiso |
| --- | --- |
| Analítica | **Ninguno** (`href: null`, sin `requiredAnyPermission`) |
| Ventas / Mensajes / Actividad | `growth.sales.read` / `operate` |
| Campañas | `growth.campaigns.view` / `manage` |
| Personas | permisos CMS/forms/team (legado de superficie) |

### 15.2 Propuesta (sin implementar)

| Código | Copy | Motivo |
| --- | --- | --- |
| `growth.analytics.view` | Ver Analítica del Espacio | Cruza captación + ventas + mensajes + campañas; no debe exigir `manage` ni Identity |

Reglas:

- No usar Identity (`identity.audit.*`).  
- Nav Analítica exige `growth.analytics.view`.  
- Roles comerciales (admin espacio / sales) lo reciben en plantillas, mismo patrón que `growth.campaigns.view`.  
- No sustituir por solo `growth.sales.read`: Analítica incluye captación/campañas más allá de la cola de Ventas.

---

## 16. Propuesta funcional de Analítica V1 (UX sin diseño visual)

**Una sola pantalla** `/admin/analitica` con secciones (evitar 20 pestañas):

| Sección | Pregunta que responde | Contenido mínimo |
| --- | --- | --- |
| **RESUMEN** | ¿Qué está pasando? | Personas nuevas · Opps generadas · En seguimiento · Ganadas · Perdidas (período) |
| **CAPTACIÓN** | ¿De dónde llegan? | Desglose origen/canal/formulario (Persona); totales |
| **VENTAS** | ¿Qué pasa con las oportunidades? | Por estado · por tipo · conversión §11 · traspasadas aparte |
| **CAMPAÑAS** | ¿Qué está funcionando? | Reutilizar métricas V1; top campañas; link a ficha |
| **MENSAJES** | ¿Por dónde nos hablan? | Conversaciones / in / out / por canal; opcional «sin respuesta» |

Selector de período global arriba (7d / 30d / mes / anterior / custom).

Estados vacíos: mostrar **0** y copy de Espacio nuevo (mismo espíritu que Personas/Ventas vacíos) — **sin** depender de datos SEM/ADL.

---

## 17. Datos vacíos (Espacio nuevo)

| Escenario | Comportamiento |
| --- | --- |
| 0 Personas / Opps / Campañas / Mensajes | Render OK; métricas en 0; secciones con empty state |
| Sin campañas active | Sección Campañas vacía o “aún no hay campañas”; resto intacto |
| Sin WhatsApp | Mensajes en 0; no romper Ventas/Captación |

No hardcodear tenants ni seeds de demostración.

---

## 18. Métricas sostenibles vs no sostenibles

### Sostenibles V1

- Personas nuevas / totales / por origen (Persona)  
- Opps generadas / open / active / won / lost / handed_off  
- Conversión cohort §11  
- Desglose por tipo y por origen de oportunidad  
- Métricas de campaña CONTRACT-002  
- Conversaciones, mensajes in/out, por canal  
- Evolución temporal de conteos  
- Comparación absoluta período anterior (sin %)  

### No sostenibles / fuera V1

- Ingresos, ticket, ROAS, costos, ads  
- Alcance, impresiones, CTR, aperturas, leídos  
- Embudo Personas→Ganadas como verdad única  
- % tendencias decorativas  
- Motivo de pérdida cualitativo  
- SLA / tiempo medio de respuesta (sin contrato)  
- Telemetría de automation runs como KPI de negocio  
- Cualquier agregado cross-tenant  

---

## 19. Qué dejar fuera

- Implementación y diseño visual en esta OT  
- `growth_analytics_events` / warehouse / materializaciones prematuras  
- Alimentar UI desde `core_events`  
- Contar `experience_form_submissions` / `portal_interesados` como KPIs paralelos  
- KPIs Meta Ads / email marketing  
- Segundo CRM o copia de Personas  
- Automatizaciones como protagonista de Analítica  
- Analítica global de plataforma en `/admin`  

---

## 20. Recomendación A / B / C

| Letra | Significado | ¿Aplica? |
| --- | --- | --- |
| **A** | Casi todo existe; falta superficie | Parcial — datos sí; falta ruta/permiso/read-model/períodos |
| **B** | Reutilizable con extensiones pequeñas | **Sí — elegida** |
| **C** | Falta infraestructura importante | No — no hace falta warehouse ni nuevo Event Bus |

### Por qué B (no A)

Extensiones pequeñas necesarias:

1. Superficie `/admin/analitica` + nav `href`.  
2. Permiso `growth.analytics.view`.  
3. Read-model de agregaciones periodizadas (reutilizando métricas de campañas y labels).  
4. Índices de tiempo/origen en opps/personas.  
5. Disciplina de producto: conversión §11, no funnel engañoso, no % decorativos, orígenes Persona≠Opp.

### Qué no hacer en la OT de implementación

- No crear colección de métricas.  
- No tocar motores de escritura de Core / Ventas / Mensajes / Campañas / Automations.  
- No diseñar dashboard “BI”.  

---

## 21. Entregables de esta acta (checklist)

| # | Entregable | Sección |
| --- | --- | --- |
| 1 | Estado actual | §1 |
| 2 | Fuentes reales | §2 |
| 3 | Métricas sostenibles | §18 |
| 4 | Métricas no sostenibles | §18 / §5.2 / §6 |
| 5 | Conversión propuesta | §11 |
| 6 | Funnel | §10 |
| 7 | Orígenes/canales | §8 |
| 8 | Campañas | §6 |
| 9 | Mensajes | §5 |
| 10 | Automatizaciones | §7 |
| 11 | Períodos / timestamps | §9 |
| 12 | Arquitectura | §14 |
| 13 | Índices | §14.1 |
| 14 | Permisos | §15 |
| 15 | Propuesta funcional V1 | §16 |
| 16 | Qué dejar fuera | §19 |
| 17 | 10 preguntas | §13 |
| 18 | Recomendación B | §20 |
| Gate | **APTO CON AJUSTES** | Gate final |

---

## Referencias de código (evidencia)

- Nav placeholder: `src/lib/admin/nav-domains.ts` (`id: "analitica"`, `href: null`); `master-nav.ts`
- Tipos SSOT: `src/core/growth/types.ts` (Persona, Origen, Oportunidad, Actividad, statuses)
- Workflow labels: `src/core/growth/opportunity-definition.ts`
- Origen UI: `src/lib/growth/labels.ts`, `src/lib/growth/humanize-origin-display.ts`
- Campañas métricas: `src/core/growth/campaigns/metrics.ts`, `src/lib/growth/campaigns-read.ts`, CONTRACT-002 §9
- Ingest campaña: `src/lib/growth/live-ingest.ts`, `src/core/growth/campaigns/resolve-active.ts`
- Mensajes: `src/core/growth/messaging/types.ts`; WhatsApp send → `sent` (`send-reply.ts`); inbound persona sin opp (`whatsapp/receive.ts`)
- Runs: `src/core/growth/automations/types.ts` (`GrowthAutomationRun`)
- Índices: `src/core/growth/indexes.ts`, `messaging/indexes.ts`, `campaigns/indexes.ts`, `automations/indexes.ts`
- Stub analytics plataforma: `src/core/analytics/index.ts`
- Permisos Growth: `src/core/identity/permissions/registry.ts` / `catalog.ts` (sin analytics)

---

## Respuesta ejecutiva

| Pregunta | Respuesta |
| --- | --- |
| ¿Existe Analítica hoy? | **No** — placeholder de menú |
| ¿Hay datos para V1? | **Sí** — Personas, Opps, Mensajes, Campañas |
| ¿`core_events`? | **Fuera** |
| ¿Conversión? | `won / opps generadas` (cohort); `handed_off` aparte |
| ¿Funnel Personas→Ganadas? | **No** como verdad; pipeline de opps sí |
| ¿Recomendación? | **B** |
| ¿Gate? | **APTO CON AJUSTES** |
| ¿Implementar ahora? | **No.** Solo esta acta |
