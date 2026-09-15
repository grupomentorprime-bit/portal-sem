# OT-GROWTH-CAMPAIGNS-CONTRACT-002 — Contrato funcional congelado Campañas V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-CAMPAIGNS-CONTRACT-002 |
| Tipo | Contrato funcional (sin implementación) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-11 |
| Entrada | [OT-GROWTH-CAMPAIGNS-AUDIT-001](./OT-GROWTH-CAMPAIGNS-AUDIT-001.md) · [ADR-010](../../architecture/ADR-010.md) · [ADR-011](../../architecture/ADR-011.md) |
| Estado | **CERRADA · APTO** |
| Alcance | Congelar definición, entidad, tracking, audiencias, automatización, métricas, permisos y UX funcional de Campañas V1 |
| Fuera de alcance | Código de producto · datos · Growth Core runtime · Mensajes · Automatizaciones runtime · Actividad · Shell · Meta · WhatsApp · DNS/infra · diseño visual · abrir OT de implementación |

**Restricciones cumplidas:** sin implementar; sin tocar producto ni datos; sin abrir otra OT automáticamente; multi-tenant obligatorio en todo el contrato.

---

## Gate final

**APTO**

El contrato mínimo de Campañas V1 queda congelado como **capa de configuración/coordinación** sobre Personas, Oportunidades, Origen, Formularios, Automatizaciones y Actividad existentes. Casos V1: **C + F + B** (sin broadcast). Extensiones de implementación posteriores están acotadas y listadas; no bloquean el congelado.

---

## 1. Definición final Campañas V1

### 1.1 Qué es

Una **Campaña** en Growth OS V1 es:

> **Una acción organizada para atraer personas y acompañar las oportunidades que genera.**

Es una entidad de **configuración y atribución inbound**, no un motor de envío.

### 1.2 Qué no es

| No es | Motivo |
| --- | --- |
| Envío masivo / broadcast | No existe fan-out WhatsApp/email |
| Newsletter / email marketing | Resend es transaccional |
| Lista de contactos materializada | SSOT = `growth_personas` |
| Segundo CRM | Growth Core ya es la proyección comercial |
| Segundo sistema de mensajes | SSOT = Mensajes / conversaciones |
| Segundo motor de automatizaciones | SSOT = `growth_automations` |
| Meta Ads manager | Sin Marketing API |

### 1.3 Casos V1 incluidos

| Caso | Nombre | Qué hace V1 |
| --- | --- | --- |
| **C** | Captación desde formulario/landing | Campaña vinculada a un formulario; cada submission proyectada escribe `origin.campaign = trackingKey` en la **oportunidad** (y en Persona solo si es primer origen) |
| **F** | Campaña vinculada a Automatización | `automationId` opcional; la Automatización reacciona a hechos; distingue oportunidades con `origin.campaign == trackingKey` |
| **B** | Seguimiento de interesados **sin** broadcast | Audiencia por filtros dinámicos sobre Personas/Oportunidades; acompañamiento humano y/o Automatización sales-ops; **sin** envío masivo |

### 1.4 Capacidad operativa mínima

1. Crear campaña.
2. Nombre.
3. Objetivo.
4. Estado.
5. Fuente/formulario asociado (cuando aplica C).
6. Audiencia por filtros (cuando aplica B u operación de seguimiento).
7. `trackingKey` único dentro del Espacio.
8. Automatización existente opcional (F).
9. Fecha de inicio/fin opcional.
10. Ver resultados reales derivados de Personas / Oportunidades / Actividad.

---

## 2. Límites

### 2.1 Regla de persistencia

`growth_campaigns` guarda **solo CONFIGURACIÓN**.

| Guarda | No guarda |
| --- | --- |
| Identidad, estado, objetivo, ventana | Copias de Personas |
| `source` (form/página) | Mensajes / conversaciones |
| `audience` (filtros) | Actividades |
| `trackingKey` | Ejecuciones de automatización |
| `automationId?` (vínculo) | Credenciales de canal/ads |
| Auditoría (`createdBy`, timestamps) | Estadísticas materializadas si se pueden derivar |

### 2.2 Fuera de V1 (explícito)

- WhatsApp masivo · email marketing · newsletter · Meta Ads
- Plantillas WhatsApp · fan-out · listas materializadas
- Motor UTM · attribution multi-touch
- Presupuesto publicitario · creatividades · métricas de ads (alcance, impresiones, CTR, aperturas, costo, ROAS, «respuestas de campaña» outbound)

### 2.3 Autoridad de estado vs fechas

- **`status` es autoritativo** (borrador / activa / terminada).
- `startAt` / `endAt` son **ventana informativa** para el operador.
- **No** hay auto-transición por calendario en V1 (diferido).

---

## 3. Contrato `growth_campaigns`

Colección nueva (implementación futura): `growth_campaigns`.

### 3.1 Campos congelados V1

| Campo | Tipo contractual | Obligatorio | Notas |
| --- | --- | --- | --- |
| `_id` | string | Sí | PK |
| `tenantId` | string | Sí | Espacio; aislamiento absoluto |
| `name` | string | Sí | Identidad humana corta |
| `status` | `draft` \| `active` \| `ended` | Sí | Ver §4 |
| `objective` | string | Sí | Texto corto de producto («qué quieres lograr»); max razonable en implementación (~200) |
| `trackingKey` | string | Sí | Opaco; único por `tenantId`; se escribe en `origin.campaign` |
| `source` | objeto | Sí | Ver §3.2 |
| `audience` | objeto \| omitido | No | Filtros dinámicos; ver §7. Si omitido = sin segmento declarado |
| `automationId` | string \| omitido | No | FK lógica a `growth_automations._id` del **mismo** `tenantId` |
| `startAt` | ISO string \| omitido | No | Informativo |
| `endAt` | ISO string \| omitido | No | Informativo |
| `createdBy` | string | Sí | Actor Identity del Espacio (o sistema documentado) |
| `createdAt` | ISO string | Sí | |
| `updatedAt` | ISO string | Sí | |

### 3.2 `source`

```text
source: {
  kind: "form" | "none"
  formId?: string   // obligatorio si kind === "form"
  pageId?: string   // opcional; solo contexto de landing / navegación; NO transporta tracking
}
```

| `kind` | Uso |
| --- | --- |
| `form` | Caso **C** (y C+F): captación desde Experience Form |
| `none` | Caso **B** puro: seguimiento sin formulario de captación propio |

**Reglas:**

- Si `kind === "form"` → `formId` obligatorio y debe existir en el mismo Espacio.
- `pageId` **no** es fuente canónica de tracking (ver §5).
- Un formulario (`formId`) puede estar vinculado como fuente de captación a **como máximo una campaña `active`** por Espacio. Varias campañas `draft`/`ended` pueden historiar el mismo form; la resolución de ingest usa solo la `active`.

### 3.3 `audience` (filtros, no lista)

```text
audience?: {
  filters: GrowthCampaignAudienceFilter[]  // AND entre filtros
}
```

Sin arrays de `personaId`. Sin materialización. Ver §7.

### 3.4 Invariantes multi-tenant

| Regla | Contrato |
| --- | --- |
| Toda campaña lleva `tenantId` | Obligatorio |
| `trackingKey` único por `tenantId` | Índice único compuesto |
| `formId` / `automationId` / Personas / Oportunidades resueltas | Mismo `tenantId` |
| Resolución de atribución | Siempre `tenantId + trackingKey` (nunca solo key global) |
| Sin compartir campañas entre Espacios | Obligatorio |

### 3.5 Inmutabilidad de `trackingKey`

| Estado | ¿Editable `trackingKey`? |
| --- | --- |
| `draft` | Sí (antes de primera activación) |
| `active` / `ended` | **No** — preserva integridad de `origin.campaign` ya escrito |

---

## 4. Estados

### 4.1 Catálogo V1 (cerrado)

| Técnico | Copy humano | Significado |
| --- | --- | --- |
| `draft` | Borrador | Configurable; **no** atribuye en ingest |
| `active` | Activa | Atribuye captación (si `source.kind === "form"`) y es la campaña vigente del form |
| `ended` | Terminada | Cerrada; **no** atribuye nuevas captaciones; resultados históricos siguen legibles |

### 4.2 ¿Hace falta `paused`?

**No en V1.**

| Alternativa | Suficiente porque |
| --- | --- |
| Dejar de atribuir | Pasar a `ended` |
| Ajustar antes de lanzar | Quedarse en `draft` |
| Sin outbound de campaña | No hay «pausa de envíos» que justificar |

Agregar `paused` sin necesidad real diluye el modelo. **Diferido** hasta evidencia operativa.

### 4.3 Transiciones mínimas

```text
draft  → active
active → ended
draft  → ended   (cancelar sin lanzar; opcional UX)
ended  →  (sin reabrir en V1; diferido)
```

Reabrir `ended` → `active` queda **diferido** (riesgo de reatribuir el mismo form).

---

## 5. TrackingKey

### 5.1 Naturaleza

- String opaco de producto (slug corto recomendado en implementación: `[a-z0-9][a-z0-9-_]*`).
- **No** es UTM.
- **No** es FK Mongo en Origen: se copia como `GrowthOrigin.campaign` (contrato ADR-010 ya existente).
- Unicidad: **`tenantId + trackingKey`**.

### 5.2 Dónde nace

Nace en la **Campaña** al crear (generado o elegido en borrador). Vive en `growth_campaigns.trackingKey`.

### 5.3 Fuente canónica de transporte (UNA)

**Canónica V1: resolución server-side en live ingest desde `growth_campaigns` por `(tenantId, source.formId)` cuando `status === "active"`.**

Flujo:

```text
Campaña (active, source.kind=form, formId, trackingKey)
        ↓
Experience Form (mismo formId) — sin campo marketing obligatorio
        ↓
experience_form_submissions
        ↓
live ingest (bridge futuro)
        ↓
lookup: campaña active del Espacio con source.formId == submission.formId
        ↓
GrowthFormIngestInput.campaign = trackingKey
        ↓
origin.campaign = trackingKey  (en Oportunidad; en Persona solo si alta nueva)
        ↓
Oportunidad → Actividad / Automatizaciones / resultados
```

| Mecanismo evaluado | Decisión |
| --- | --- |
| **Configuración Campaña ↔ formId + lookup en ingest** | **CANÓNICO** |
| Parámetro de página / query | Fuera V1 (mini-UTM) |
| Hidden field en el form | Fuera V1 (frágil; duplica config) |
| Campo nuevo en `ExperienceFormDefinition` | Fuera V1 (acopla Forms a Campañas) |
| `pageId` como transport | **No** — solo contexto UX |
| Motor UTM | **Prohibido** V1 |

Evidencia actual: `GrowthFormIngestInput.campaign` y `buildGrowthOrigin` **ya aceptan** `campaign`; `toGrowthFormInput` / `ingestFormSubmissionToGrowthSafe` **aún no lo pasan**. El contrato fija el bridge; no lo implementa.

### 5.4 Referrer

**`origin.referrer` queda fuera del contrato mínimo V1.**

El campo puede seguir existiendo en el modelo Growth; Campañas V1 **no** lo requiere, **no** lo cablea y **no** lo muestra como métrica. No ampliar alcance solo porque el campo existe.

---

## 6. Flujo de captación

### 6.1 Caso C (y C+F)

1. Operador crea campaña en `draft`: nombre, objetivo, `source.form`, `trackingKey`, opcional `automationId` / fechas.
2. Activa → `active`.
3. Persona envía el formulario vinculado.
4. Ingest proyecta Persona + Oportunidad + Actividad como hoy.
5. Bridge escribe `campaign: trackingKey` en el input de form **solo si** hay campaña `active` para ese `formId` en el Espacio.
6. Resultados y Automatizaciones leen `origin.campaign`.

### 6.2 Primer origen (ADR-010 — respetado)

| Entidad | Regla |
| --- | --- |
| **Persona existente** | `growth_personas.origin` es **inmutable**. La campaña **no** lo reemplaza. |
| **Persona nueva** | Si el alta ocurre por esta captación, su primer `origin.campaign` **puede** ser el `trackingKey`. |
| **Oportunidad nueva** generada por la captación | **Siempre** debe conservar `origin.campaign = trackingKey` cuando el bridge atribuyó. |

Métrica «Personas captadas» = personas distintas con **al menos una oportunidad** cuyo `origin.campaign === trackingKey`, **no** «personas cuyo primer origen es la campaña».

### 6.3 Caso B (sin formulario propio)

- `source.kind = "none"`.
- No hay atribución nueva por ingest de form de esta campaña.
- La campaña organiza seguimiento sobre audiencia filtrada (oportunidades/personas ya existentes) + opcional Automatización.
- Si se desea atribuir captación, usar caso **C** (form).

### 6.4 Admission / portal_interesados

**Fuera del cableado V1 de Campañas.** La atribución canónica V1 es Experience Forms → live ingest. Admission puede diferirse.

---

## 7. Audiencias

### 7.1 Principio

Audiencia = **consulta dinámica** (filtros AND). Nunca array persistido de personas.

### 7.2 Filtros permitidos V1

Basados en capacidades reales de Oportunidad/Origen (hoy parciales en UI Personas; el contrato autoriza estos predicados para Campañas):

| Filtro | Campo real | Ops V1 |
| --- | --- | --- |
| Tipo de oportunidad | `growth_oportunidades.typeKey` | `eq` |
| Estado de oportunidad | `growth_oportunidades.status` | `eq` |
| Origen · kind | `origin.kind` | `eq` |
| Origen · channel | `origin.channel` | `eq` |
| Formulario | `origin.formId` | `eq` |
| Campaña | `origin.campaign` | `eq` (típicamente el propio `trackingKey`) |

**No en V1:** etiquetas genéricas de Persona, listas estáticas, `referrer`, scores, RFM, etc.

### 7.3 Semántica de evaluación

- La audiencia se evalúa sobre **Oportunidades del Espacio** (y Personas vía `personaId`), no sobre un snapshot.
- Caso **B**: filtros definen «a quién estoy siguiendo».
- Caso **C**: `audience` es opcional; la captación la define el form. Si hay audience, sirve para seguimiento acotado post-captación, no para blast.

### 7.4 Evidencia de gap (implementación futura, no este OT)

Hoy `GrowthPersonasListFilters` solo expone `opportunityType` / `opportunityStatus`. Extender lectura por `origin.*` es trabajo de una OT posterior; el **contrato de filtros permitidos** queda aquí congelado.

---

## 8. Vínculo Automatizaciones

### 8.1 Rol de `automationId`

- Es **solo vínculo** de configuración / navegación / claridad operativa.
- La Campaña **no** ejecuta workflow propio.
- La Automatización sigue siendo dueña del runtime (ADR-011): trigger → condición → acción → wait.
- Validación: `automationId` debe existir, mismo `tenantId`. No se exige que esté `active` al guardar el vínculo (el runtime ignora inactivas).

### 8.2 Cómo distinguir oportunidades de la campaña

Predicado canónico:

```text
origin.campaign == trackingKey
```

(evaluado sobre la **Oportunidad** del evento, no sobre la Persona.)

### 8.3 Extensión mínima del catálogo de condiciones

**Hoy no existe** condición `origin.campaign` (catálogo: `origin.kind` / `origin.channel` / `origin.formDestination` / `status` / `typeKey` / `nextAction`).

**Contrato V1:** se autoriza **una** extensión mínima en Automatizaciones (OT de implementación futura):

```text
{
  field: "origin.campaign"
  op: "eq"
  value: string   // trackingKey
}
```

Sin otras condiciones nuevas. Sin acciones nuevas. Sin que Campañas invoque el runner.

### 8.4 Caso F operativo

1. Campaña `active` con `trackingKey` + `automationId`.
2. Automatización publicada/activa con condición `origin.campaign eq trackingKey` (y triggers existentes, p. ej. oportunidad abierta/transicionada).
3. Acciones solo sales-ops existentes (transición, nota/contacto, nextAction).
4. Campañas muestra el vínculo; el historial de runs sigue en Automatizaciones / Actividad.

---

## 9. Métricas reales V1

Todas **derivadas** al leer; no materializar contadores en `growth_campaigns`.

### 9.1 Incluidas (mínimo)

Filtro base: `tenantId` + `growth_oportunidades.origin.campaign === trackingKey`.

| Métrica UI | Definición |
| --- | --- |
| **Personas captadas** | `COUNT DISTINCT personaId` en oportunidades con ese `origin.campaign` |
| **Oportunidades generadas** | `COUNT` oportunidades con ese `origin.campaign` |
| **En seguimiento** | Subconjunto con `status === "active"` (copy workflow: «En seguimiento») |
| **Ganadas** | `status === "won"` |
| **Perdidas** | `status === "lost"` |

Opcional de detalle (no obligatorio en listado): desglose `open` («Abierta»), `handed_off`, `archived` — sin inventar métricas de marketing.

### 9.2 Actividad relacionada

Lectura de `growth_actividades` (y proyección de mensajes si el feed unificado ya la ofrece) **filtrada por oportunidades/personas** de la campaña — no un segundo Event Bus.

### 9.3 Excluidas (sin datos)

Alcance · impresiones · CTR · aperturas · costo por resultado · ROAS · «respuestas de campaña» outbound · cualquier KPI de ads.

---

## 10. Permisos

### 10.1 Decisión

El dominio Campañas **justifica** permisos propios (mismo patrón que Automatizaciones; no reutilizar Identity).

| Código | Copy | Uso |
| --- | --- | --- |
| `growth.campaigns.view` | Ver campañas del Espacio | Listado, detalle, métricas derivadas |
| `growth.campaigns.manage` | Crear y editar campañas | Crear/editar/activar/terminar |

### 10.2 Reglas

- `manage` implica capacidad de ver en plantillas de rol (como `automations.manage` / `view`).
- No reutilizar permisos Identity.
- No reutilizar solo `growth.sales.*` como dueño del módulo (Ventas opera oportunidades; Campañas configura esfuerzos). Lecturas cruzadas a Personas/Oportunidades/Actividad en detalle de campaña pueden apoyarse en los permisos Growth ya existentes **además** de `growth.campaigns.view`, según la OT de implementación — sin mezclar Identity.
- Nav «Campañas»: exigir `growth.campaigns.view` (o manage).

---

## 11. Contrato funcional UX (sin diseño visual)

Ruta futura esperada: `/admin/campanas` (hoy `href: null`).

### 11.1 Listado

El operador debe poder:

- Ver campañas del Espacio.
- Ver **estado** (Borrador / Activa / Terminada).
- Ver **objetivo** (texto).
- Ver **inicio** (`startAt` o fecha de activación/creación según implementación).
- Ver **resultados básicos**: al menos oportunidades generadas + ganadas (o el set §9.1 compacto).

Sin gráficos de ads. Sin columnas de alcance/CTR.

### 11.2 Detalle

Debe responder:

1. **Qué busca** esta campaña (`objective`, nombre, estado, ventana).
2. **De dónde llegan** las personas (`source.form` / formId; pageId solo como contexto si existe).
3. **Qué automatización acompaña** (`automationId` → nombre + enlace a Automatizaciones).
4. **Qué resultados lleva** (métricas §9.1).
5. **Actividad relacionada** (feed acotado o enlace filtrado a Actividad/Ventas).

### 11.3 Crear / editar (corto y guiado)

Flujo ideal en 4 pasos:

1. **Qué quieres lograr** — nombre + objetivo (+ fechas opcionales).
2. **De dónde llegarán las personas** — `source.form` + formId, o `none` para solo seguimiento; genera/confirma `trackingKey`.
3. **Qué seguimiento tendrán** — audience filtros (si aplica) + `automationId` opcional.
4. **Revisar y activar** — resumen; acción a `active` (o guardar `draft`).

Sin diseñadores de creatividades, presupuestos ni plantillas de mensaje.

---

## 12. Decisiones explícitamente diferidas

| Tema | Decisión V1 | Diferido |
| --- | --- | --- |
| Estado `paused` | No | Hasta evidencia |
| Reabrir `ended` → `active` | No | Política de reatribución |
| Auto `ended` por `endAt` | No | Scheduler |
| `origin.referrer` en Campañas | Fuera | Si un caso lo exige |
| Query param / hidden / UTM | Fuera | Motor de captación avanzada |
| Atribución via `pageId` | No canónica | Landing analytics |
| Admission → campaign | Fuera bridge V1 | Si se necesita |
| Etiquetas Persona | No | Segmentación avanzada |
| Listas materializadas | No | Outbound futuro |
| Contadores materializados | No | Solo si performance lo exige |
| Condiciones automation más allá de `origin.campaign` | No | Catálogo futuro |
| Acciones automation de mensajería | No | Mensajes / plantillas |
| Diseño visual / componentes UI | No | OT de superficie |
| Schema Mongo indexes exactos | Orientativo (`tenantId+trackingKey` unique) | OT implementación |
| Plantillas de rol concretas (quién recibe view/manage) | Solo códigos | Identity templates en OT impl. |

---

## 13. Mapa de extensiones para una OT de implementación futura

No se abren aquí. Inventario congelado de lo que **sí** hará falta después:

1. Colección `growth_campaigns` + índices tenant.
2. Permisos `growth.campaigns.view` / `manage` + nav `/admin/campanas`.
3. Bridge live ingest: resolver campaña `active` por `formId` → pasar `campaign` a `toGrowthFormInput` / ingest.
4. Condición automation `origin.campaign`.
5. Lecturas de métricas derivadas + filtros de audiencia.
6. Superficie listado / detalle / crear guiado (sin diseño final obligatorio en el primer corte).

---

## 14. Checklist de congelado

| # | Entrega | Estado |
| --- | --- | --- |
| 1 | Definición final Campañas V1 | Congelada §1 |
| 2 | Límites | Congelados §2 |
| 3 | Contrato `growth_campaigns` | Congelado §3 |
| 4 | Estados | Congelados §4 (`draft`/`active`/`ended`; sin `paused`) |
| 5 | TrackingKey | Congelado §5 (canónico = lookup Campaña↔form en ingest) |
| 6 | Flujo de captación | Congelado §6 + primer origen ADR-010 |
| 7 | Audiencias | Congeladas §7 (filtros; sin copias) |
| 8 | Vínculo Automatizaciones | Congelado §8 + extensión `origin.campaign` |
| 9 | Métricas reales | Congeladas §9 |
| 10 | Permisos | Congelados §10 |
| 11 | UX funcional listado/detalle/crear | Congelado §11 |
| 12 | Diferidos | Explicitados §12 |

---

## Veredicto

**CERRADA · APTO**

Campañas V1 queda definida como coordinación inbound + seguimiento sin broadcast. El contrato es implementable sobre Growth existente con extensiones pequeñas y acotadas. **No implementar en esta OT. No abrir otra OT automáticamente.**
