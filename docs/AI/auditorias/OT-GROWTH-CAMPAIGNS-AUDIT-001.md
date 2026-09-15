# OT-GROWTH-CAMPAIGNS-AUDIT-001 — Auditoría funcional de Campañas Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CAMPAIGNS-AUDIT-001 |
| Tipo | Auditoría / contrato (sin implementación) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-11 |
| Entrada | Menú Growth OS «Campañas»; [ADR-010](../../architecture/ADR-010.md); [ADR-011](../../architecture/ADR-011.md); Growth Core CLOSE-001; Mensajes / Automatizaciones / Actividad existentes |
| Estado | **CERRADA · APTO CON AJUSTES** |
| Alcance | Revisar qué existe para crear, ejecutar, medir y automatizar campañas **sin** duplicar Personas, Mensajes, Automatizaciones ni tracking |
| Fuera de alcance | Implementación · schema final · UI visual · tocar Growth Core / Ventas / Mensajes / Automatizaciones / Canales / Shell / Actividad · Meta/WhatsApp real · DNS/Dokploy/Cloudflare · datos productivos |

**Restricciones cumplidas:** sin código de producto; sin nueva colección en runtime; multi-tenant obligatorio en el contrato propuesto; sin abrir OT de implementación automáticamente.

---

## Gate final

**APTO CON AJUSTES · recomendación B**

Sí se puede construir **Campañas** reutilizando Personas, Oportunidades, Origen, Formularios, Automatizaciones, Mensajes (lectura) y Actividad, **sin** segundo CRM, segunda bandeja ni segundo motor de automatización.

**Matiz crítico:** lo que hoy existe sostiene bien una Campaña como **coordinación de captación + seguimiento reactivo**. **No** sostiene envíos masivos WhatsApp/email ni Meta Ads. V1 debe acotarse a orquestación/atribución inbound + vínculo a Automatizaciones; el broadcast queda fuera.

---

## Pregunta principal

> ¿Campañas puede construirse reutilizando Personas, Oportunidades, Mensajes, Automatizaciones, Sitio web / formularios, origen / captación y Analítica existente, sin crear un segundo sistema de contactos, mensajes, automatizaciones o tracking?

**Sí, con alcance V1 acotado.**

| Pieza | ¿Reutilizable como SSOT? | Notas |
| --- | --- | --- |
| Personas | Sí | Audiencia = consulta/filtros sobre `growth_personas` |
| Oportunidades | Sí | Resultado comercial medible (`typeKey` / `status` / `origin`) |
| Mensajes | Parcial | Entrega 1:1 y respuestas; **no** motor de campaña |
| Automatizaciones | Sí | Comportamiento reactivo (sales-ops); **no** Campaign Engine |
| Sitio / forms | Sí | Captación real (Admission + Experience Forms → ingest) |
| Origen / captación | Parcial | Campo `origin.campaign` existe; **casi nunca se puebla** en vivo |
| Analítica | Parcial | Hechos en `growth_actividades` + mensajes; módulo Analítica = placeholder |

No hace falta duplicar contactos, inbox, Event Bus ni Automatizaciones. Sí hace falta una **entidad de coordinación** (probable `growth_campaigns`) y cablear identidad de campaña en captación.

---

## 1. Estado actual

### 1.1 Ruta / menú

| Qué cree el operador | Qué hay hoy |
| --- | --- |
| `/admin/campanas` | **No existe** (0 rutas App Router) |
| Ítem nav «Campañas» | `href: null` en `nav-domains.ts` y `master-nav.ts` |
| Permisos `growth.campaigns.*` | **No existen** |
| Colección `growth_campaigns` | **No existe** |

Mismo patrón que Analítica (`href: null`). Contrastar con Personas / Ventas / Mensajes / Automatizaciones / Actividad, que sí tienen ruta.

### 1.2 Código relacionado (inventario)

| Término | Hallazgo |
| --- | --- |
| `campaign` / `campaigns` | Campo opcional en `GrowthOrigin`; input opcional en `GrowthFormIngestInput`; etiqueta editorial Hero CMS (`campaign`); icono nav |
| `marketing` / `audience` / `segment` | **Sin** motor Growth. «Audience» en portal = bloque CMS `audience_profiles` (editorial), no audiencia CRM |
| `attribution` | ADR-010: **no hay** motor de attribution / UTMs / campañas |
| `source` / `sourceId` | Puntero a fila origen (`experience_form_submissions`, `portal_interesados`, …), **no** «fuente de marketing» |
| `utm` | **0** usos en Growth / Experience Forms |
| `broadcast` / `bulk` / `newsletter` | **No** en Growth messaging. Bulk en student-affairs = justificación de inasistencias (otro dominio) |
| `ads` / Meta Ads Marketing API | **No** existe. Meta en repo = WhatsApp Cloud / Tech Provider prep |

Conclusión: **no hay motor de campañas**; solo placeholder de nav + string opaco `origin.campaign` + etiqueta editorial Hero.

### 1.3 Separación de responsabilidades (hoy vs deseado)

| Concepto | Dueño hoy | Rol en Campañas |
| --- | --- | --- |
| Campaña | **No existe** | Coordinación: objetivo / audiencia / canal / ventana / tracking id |
| Personas | `growth_personas` | Audiencia (filtros) |
| Mensajes | `growth_conversaciones` / `growth_mensajes` | Entrega y conversación 1:1 |
| Canales | `growth_whatsapp_connections` (+ stubs canal) | Conexión técnica |
| Automatizaciones | `growth_automations*` | Comportamiento reactivo |
| Actividad | `growth_actividades` (+ proyección mensajes) | Qué pasó |

---

## 2. Componentes reutilizables

| Componente | Evidencia | Uso para Campañas |
| --- | --- | --- |
| `growth_personas` + listado filtrable | `personas-read.ts` | Audiencia dinámica |
| `GrowthOrigin` (`campaign`, `referrer`, `formId`, `channel`, …) | `types.ts` / `origin.ts` | Identidad de tracking (si se puebla) |
| `growth_oportunidades` | Core + Ventas | Contar resultados por origen / tipo / estado |
| Ingest forms + admisión | `ingest.ts` / `live-ingest.ts` | Entrada desde sitio |
| Experience Forms + páginas CMS | `experience_forms*` / `/admin/pages` | Landing / formulario |
| Automatizaciones (trigger → condición → acción → wait) | ADR-011 + runtime | Seguimiento post-captación |
| Condiciones `origin.kind` / `channel` / `formDestination` / `typeKey` / `status` | `catalog.ts` | Filtrar reacciones por origen de form |
| Mensajes WhatsApp reply | MESSAGING-003 | Conversación posterior (no broadcast) |
| `growth_actividades` + feed Actividad | ACTIVITY-001 | Timeline de hechos |
| Event Bus `Growth*` | `event-bus-port.ts` | Disparos de Automatizaciones |
| Resend / notificaciones | `lib/notifications/*` | Solo correo **transaccional** (no lista de campaña) |
| Aislamiento `tenantId` | Todo Growth | Multi-tenant obligatorio |

---

## 3. Qué NO debe duplicarse

| No crear | Por qué |
| --- | --- |
| Segunda libreta de contactos / leads | SSOT = `growth_personas` |
| Copia materializada de audiencia en V1 | Preferir filtros dinámicos |
| Segundo inbox / motor de mensajes | SSOT = `growth_mensajes` / conversaciones |
| Campaign Automation Engine | Reutilizar `growth_automations` + sales-ops |
| Motor de attribution multi-touch / UTM engine | ADR-010: Origen es snapshot, no attribution |
| CRM paralelo / `crm_*` | Cerrado en CORE-AUDIT / CLOSE-001 |
| Analítica como segundo Event Bus | Leer `growth_actividades` / mensajes / oportunidades |
| Credenciales Meta Ads / WABA por «campaña» | Credenciales por Espacio/canal, no por campaña |

---

## 4. Brechas reales

### 4.1 Personas / audiencias

| Capacidad | Estado |
| --- | --- |
| Listar Personas del Espacio | Sí |
| Filtros `q` / tipo oportunidad / estado oportunidad | Sí |
| Etiquetas / atributos libres | **No** |
| Filtrar por `origin.campaign` / `formId` / `channel` / `referrer` | **No** en UI ni en `GrowthPersonasListFilters` |
| Índice por `origin.campaign` | **No** |
| ¿Audiencia sin duplicar Personas? | **Sí** — por consulta; hoy la consulta es limitada |

### 4.2 Captación / tracking

| Capacidad | Estado |
| --- | --- |
| Campo `origin.campaign` / `referrer` en modelo | Sí |
| `GrowthFormIngestInput.campaign` / `referrer` | Sí (contrato) |
| `toGrowthFormInput` / live ingest pasan campaign/referrer | **No** — solo `formId`, `destination`, `data`, `createdAt` |
| Campos UTM / campaignId en `ExperienceFormSubmission` | **No** |
| Parsing UTM en formularios / portal | **No** |
| `campaignId` como FK a entidad Campaña | **No** (solo string opaco si viniera) |
| Hero CMS `campaign` | Editorial de slides; **no** alimenta Growth |

**Tracking disponible vs no conectado:** el hueco del modelo existe; el cableado de captación **no** escribe campaña/referrer hoy.

### 4.3 Mensajes / canales outbound

| Capacidad | Estado |
| --- | --- |
| Reply WhatsApp 1:1 en conversación existente | Sí |
| Ventana 24 h; fuera → `template_required` | Sí (sin gestión de plantillas) |
| Envío masivo / broadcast | **No** |
| Plantillas WhatsApp | **No** |
| Email marketing / newsletter | **No** (Resend = transaccional: invitaciones, convocatoria, handoff) |
| Instagram / Facebook / web_chat como conectores de campaña | Declarados en modelo; **sin** envío de campaña |

### 4.4 Automatizaciones vs campaña

| Pregunta | Respuesta |
| --- | --- |
| ¿Puede una campaña «iniciar» una automatización? | Hoy no hay entidad Campaña. Una automatización **activa** reacciona a eventos; no hay «play campaign → fan-out audiencia» |
| ¿Usar audiencia? | No: el runtime opera sobre **oportunidad** del evento, no sobre lista |
| ¿Disparar acciones existentes? | Sí (solo sales-ops) |
| ¿Esperar? | Sí (WAIT) |
| ¿Reaccionar a respuestas? | Parcial: trigger `GrowthMessageReceived` existe; acciones **no** envían mensajes |
| ¿Reaccionar a conversiones? | Sí vía `GrowthOpportunityTransitioned` + condición `status` |

### 4.5 Analítica

| Métrica deseada | ¿Sostenible hoy? |
| --- | --- |
| Personas alcanzadas (outbound) | **No** — no hay envíos de campaña |
| Personas que respondieron | Parcial — inbound en `growth_mensajes` (sin vínculo campaña) |
| Oportunidades generadas | Sí — contar `growth_oportunidades` (filtrar por `origin.*` si se puebla) |
| Conversiones | Parcial — `status: won` (u otros finales); sin dimensión campaña fiable |
| Fuente / campaña | Solo si `origin.campaign` (u otra clave) está escrito |
| Módulo Analítica | Placeholder (`href: null`) |

No inventar métricas de alcance/CTR/costo ads: **no hay datos**.

---

## 5. Modelo funcional recomendado

### 5.1 ¿Hace falta `growth_campaigns`?

**Sí, como entidad de coordinación/configuración**, no como motor.

Sin ella no hay listado estable («qué campañas tengo»), estado (borrador/activa/terminada), ventana temporal ni identidad de tracking nombrada. Con ella **no** se deben copiar Personas, Mensajes ni runs.

### 5.2 Campos mínimos (orientativos; no schema final)

Evidencia suficiente para **mínimos de producto**, no para schema congelado:

| Campo | Rol |
| --- | --- |
| `tenantId` | Aislamiento Espacio |
| `name` | Identidad humana |
| `status` | `draft` \| `active` \| `ended` (o equivalente) |
| `objective` | Texto / enum corto de producto |
| `channel` | Intención de canal (informativo; la entrega sigue en Mensajes/Canales) |
| `audience` | Definición por **filtros** (ref a query), no lista de ids |
| `contentRef` / template ref | Opcional; V1 puede omitir si no hay outbound |
| `automationId?` | Vínculo opcional a Automatización existente |
| `startAt` / `endAt` | Ventana |
| `trackingKey` | String opaco a escribir en `origin.campaign` (o futuro `campaignId`) |
| `createdBy` / `createdAt` / `updatedAt` | Auditoría |

**Fuera de esta entidad:** envíos, credenciales, timeline de mensajes, estados de oportunidad.

### 5.3 Audiencias V1

**Preferencia confirmada:** segmentación por consulta/filtros sobre `growth_personas` (+ joins a oportunidades).

Extensión pequeña recomendada (futura OT, no esta): filtros por `origin.kind` / `channel` / `formId` / `formDestination` / `campaign` / estado-tipo oportunidad. Sin etiquetas nuevas en V1 si no hacen falta.

### 5.4 UX funcional (sin diseño visual)

Campañas debe responder:

1. Qué campañas tengo.
2. Qué quiero lograr (`objective`).
3. A quién (`audience` = filtros).
4. Por qué canal (declarativo).
5. Estado: borrador / activa / terminada.
6. Qué pasó: oportunidades con `origin.campaign = trackingKey` + actividades asociadas + (si aplica) runs de la automatización vinculada.

---

## 6. Relación Campañas ↔ Personas ↔ Mensajes ↔ Automatizaciones

```text
                    ┌─────────────────────────┐
                    │  growth_campaigns (NEW) │
                    │  coordinación / config  │
                    └───────────┬─────────────┘
           audience filters     │ trackingKey      automationId?
                │               │                        │
                ▼               ▼                        ▼
        growth_personas   origin.campaign          growth_automations
                │          (en Persona / Opp)             │
                │               │                         │ sales-ops
                │               ▼                         ▼
                │      growth_oportunidades  ←── growth_actividades
                │               │
                └───────────────┼── personaId ──► growth_conversaciones
                                │                         │
                                │                 growth_mensajes (1:1)
```

- **Campaña no envía** mensajes: Mensajes entrega.
- **Campaña no duplica** contactos: Personas es la audiencia.
- **Campaña no ejecuta** lógica de negocio: Automatizaciones reaccionan a hechos.
- **Campaña sí nombra** el esfuerzo y deja huella en Origen + métricas derivadas.

---

## 7. Tracking / atribución disponible

| Pieza | Disponible | Conectada a Campañas |
| --- | --- | --- |
| `origin.kind` / `channel` / `formId` / `formDestination` | Sí | Parcial (Automatizaciones sí; UI Campañas no) |
| `origin.campaign` | Campo sí | **No cableado** en live ingest |
| `origin.referrer` | Campo sí | **No cableado** |
| `sourceCollection` / `sourceId` | Sí | Traza a submission/interesado; no marketing |
| UTM (`utm_source`, …) | No | — |
| Multi-touch attribution | No (ADR-010) | Fuera de alcance |
| `campaignId` FK | No | TrackingKey string basta para V1 inbound |

**Primera toque:** `growth_personas.origin` es inmutable. Si la Persona ya existía, la campaña nueva queda en **`growth_oportunidades.origin`** de la intención abierta por ese toque — correcto para «oportunidades que produjo la campaña», no para «primer origen histórico de la Persona».

---

## 8. Casos V1 posibles

| Caso | Clasificación | Motivo |
| --- | --- | --- |
| **A. Informativa a contactos** (push a lista) | **FUTURA / BLOQUEADA** | Sin bulk WhatsApp/email; WA exige plantillas fuera de ventana |
| **B. Seguimiento a interesados** | **REAL CON EXTENSIÓN PEQUEÑA** | Filtros Personas/Oportunidades + Automatización sales-ops (próxima acción / nota / transición). No es blast; es seguimiento operativo |
| **C. Desde formulario / landing** | **REAL CON EXTENSIÓN PEQUEÑA** | Forms + ingest ya crean Persona/Oportunidad; falta pasar `campaign`/`referrer` (o trackingKey) y superficie Campañas |
| **D. WhatsApp (broadcast)** | **FUTURA / BLOQUEADA** | Solo reply 1:1; sin plantillas; sin fan-out |
| **E. Email (marketing)** | **FUTURA / BLOQUEADA** | Resend transaccional; PROD-002 excluyó campañas |
| **F. Asociada a automatización** | **REAL CON EXTENSIÓN PEQUEÑA** | Runtime existe; falta entidad Campaña + `automationId` + (opcional) condición por `origin.campaign` |
| **G. Meta Ads** | **FUTURA / BLOQUEADA** | Sin Marketing API / ad accounts; Meta = WhatsApp TP |

**V1 sostenible hoy (con extensión pequeña):** **C + F**, con **B** como seguimiento humano/automatizado sobre oportunidades ya abiertas — **sin** pretender alcance masivo.

---

## 9. Qué dejar fuera de V1

- Envíos masivos WhatsApp / email / Instagram / Facebook.
- Gestión de plantillas WhatsApp.
- Motor UTM / attribution multi-touch.
- Meta Ads / presupuestos / creatividades.
- Listas de contactos materializadas / newsletters.
- Módulo Analítica completo (puede vivir lectura mínima dentro de ficha Campaña).
- Campaign Automation Engine.
- Etiquetas genéricas de Persona (salvo evidencia de necesidad).
- Diseño visual final / branding de pantalla.

---

## 10. Recomendación

### **B — reutilizable con extensión pequeña**

Casi todo el **núcleo comercial** existe. Falta:

1. Superficie Campañas (ruta + permisos + entidad de coordinación).
2. Cablear identidad de campaña en captación (`campaign` / `referrer` / trackingKey → Origen de la oportunidad).
3. Ampliar filtros de audiencia (origen / form) sin copiar Personas.
4. Vínculo opcional a Automatización existente.

No es **A**: no hay casi «todo» para ejecutar campañas outbound.  
No es **C** si V1 se limita a captación+seguimiento: la infraestructura pesada (broadcast, ads, email marketing) se declara fuera, no se inventa.

---

## 11. Próximo paso recomendado (NO abrir OT)

1. Congelar alcance V1: **Campaña inbound/coordinación** (casos C + F; B sin blast).
2. Redactar contrato corto (ADR o OT de diseño) de `growth_campaigns` como **solo configuración**, con `trackingKey` y audiencia por filtros.
3. Definir el cableado mínimo de captación (dónde nace el trackingKey: query param, hidden field, o config del form) **sin** motor UTM.
4. Solo después: OT de implementación de superficie + persistencia + ingest bridge.

**No abrir otra OT automáticamente desde esta auditoría.**

---

## Checklist multi-tenant

| Regla | Estado del contrato propuesto |
| --- | --- |
| Toda campaña con `tenantId` | Obligatorio |
| Audiencias solo Personas del Espacio | Obligatorio |
| Mensajes / credenciales / métricas por Espacio | Ya en motores existentes; Campañas no debe cruzar |
| Sin compartir campañas entre Espacios | Obligatorio |
| Joins Persona/Opp/Mensaje/Automatización mismo `tenantId` | Obligatorio |

---

## Veredicto

**CERRADA · APTO CON AJUSTES · B**

Campañas puede nacer como capa de orquestación sobre Growth existente. La pregunta principal se responde **sí** si V1 no confunde «campaña» con «broadcast». El riesgo de producto es ampliar V1 a WhatsApp/email/ads masivos: eso **sí** exige infraestructura que hoy no existe.
