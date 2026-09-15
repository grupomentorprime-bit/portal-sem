# OT-GROWTH-ANALYTICS-CONTRACT-002 — Contrato funcional congelado Analítica V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-ANALYTICS-CONTRACT-002 |
| Tipo | Contrato funcional (sin implementación) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-11 |
| Entrada | [OT-GROWTH-ANALYTICS-AUDIT-001](./OT-GROWTH-ANALYTICS-AUDIT-001.md) · [OT-GROWTH-CAMPAIGNS-CONTRACT-002](./OT-GROWTH-CAMPAIGNS-CONTRACT-002.md) · [ADR-010](../../architecture/ADR-010.md) |
| Estado | **CERRADA · APTO** |
| Alcance | Congelar el contrato exacto de Analítica V1 (definición, arquitectura, períodos, KPIs, conversión, campañas, mensajes, permisos, read-model, UX funcional) |
| Fuera de alcance | Código de producto · diseño visual · datos · Growth Core / Ventas / Mensajes / Actividad / Campañas / Automatizaciones / Shell / Inicio · Meta / WhatsApp · DNS/infra · abrir OT de implementación |

**Restricciones cumplidas:** sin implementar; sin diseñar visualmente; sin ampliar el alcance auditado; multi-tenant obligatorio; sin abrir otra OT automáticamente.

---

## Gate final

**APTO**

El contrato de Analítica V1 queda congelado como **capa READ-ONLY** sobre SSOT Growth existentes. Responde «¿cómo está funcionando mi negocio y dónde debo mirar?» con totales periodizados, desgloses humanos y pipeline de oportunidades — sin warehouse, sin Event Bus, sin KPIs de ads y sin embudo Personas→Ganadas.

Las ambigüedades auditadas quedan resueltas en este documento (§4, §7, §8): Resumen usa **snapshot** para «En seguimiento» y **cierres `closedAt`** para Ganadas/Perdidas; la cohorte `openedAt` vive en Conversión/Ventas/Campañas periodizadas con nombres distintos. Extensiones de implementación (índices, labels, empty states) están acotadas y no bloquean el congelado.

---

## 1. Definición final

### 1.1 Qué es

Analítica V1 es una **superficie de lectura agregada** del Espacio activo que responde:

> «¿Cómo está funcionando mi negocio y dónde debo mirar?»

Es una capa **READ-ONLY** sobre SSOT Growth existentes.

### 1.2 Qué no es

| No es | Motivo |
| --- | --- |
| BI avanzado | Sin explore libre, sin dimensiones arbitrarias |
| Data warehouse | Sin ETL ni materialización de métricas |
| Event Bus | `core_events` queda fuera |
| CRM | Growth Core ya es la proyección comercial |
| Colección de métricas | Sin `growth_analytics_events` / `growth_analytics_metrics` |
| Analítica publicitaria | Sin ads, CTR, ROAS, alcance, costos |

### 1.3 Principio de producto

Una sola pantalla. Totales claros. Orígenes humanos. Pipeline de oportunidades. Campañas reutilizando el contrato existente. Mensajes como lectura de canal — no SLA.

---

## 2. Arquitectura congelada

```text
/admin/analitica
        ↓
requirePermission(growth.analytics.view)
        ↓
analytics-read.ts  (READ MODEL)
        ↓
SSOT existentes (agregaciones tenant-scoped)
```

### 2.1 Fuentes permitidas

| Colección | Uso V1 |
| --- | --- |
| `growth_personas` | Captación: altas y primer origen |
| `growth_oportunidades` | Resumen comercial, pipeline, conversión, campañas periodizadas, pérdidas |
| `growth_conversaciones` | Hilos / canal / personas que escribieron / sin respuesta |
| `growth_mensajes` | Mensajes recibidos / enviados |
| `growth_campaigns` | Catálogo (nombre, estado) para comparar campañas |

### 2.2 `growth_actividades`

**Fuera del núcleo V1.**

Solo se admite en una extensión futura si aporta una lectura comercial que **no** se pueda obtener de oportunidades/personas/mensajes y **no** duplique KPIs. V1 no depende de ella.

### 2.3 Fuentes prohibidas como KPI

| Fuente | Decisión |
| --- | --- |
| `core_events` | **No** |
| `experience_form_submissions` como KPI paralelo | **No** (ya proyectado a Growth) |
| `portal_interesados` como KPI paralelo | **No** |
| `growth_automation_runs` como KPI de negocio | **No** |

### 2.4 Prohibido crear

- `growth_analytics_events`
- `growth_analytics_metrics`
- warehouse
- contadores materializados en campañas u otras colecciones

### 2.5 Regla de escritura

Analítica **no escribe** SSOT. Solo lee y agrega. No modifica motores de Personas, Ventas, Mensajes, Campañas ni Automatizaciones.

### 2.6 Superficie de lectura (API)

| Decisión | Valor |
| --- | --- |
| Endpoint agregado V1 | **Sí basta uno:** `GET /api/growth/analytics` |
| Query | Período (`preset` o `from`/`to`) + Espacio activo vía sesión/tenant |
| Respuesta | Read-model §15 (preparado para UI) |
| Fragmentación | **No** hace falta un endpoint por sección en V1 |
| Implementación | Diferida a OT de producto; este contrato solo congela la forma |

No crear infra adicional (jobs, queues, collections) solo para servir este GET.

---

## 3. Períodos globales

### 3.1 Presets V1 (congelados)

| Preset | Definición |
| --- | --- |
| Últimos 7 días | Ventana rodante de 7 × 24 h desde el instante de la query |
| Últimos 30 días | Ventana rodante de 30 × 24 h — **default** |
| Este mes | `[00:00:00.000 UTC del día 1 del mes calendario UTC actual, instante de la query)` — fin exclusivo en el instante de lectura |
| Mes anterior | Mes calendario UTC completo anterior: `[día 1 00:00 UTC, día 1 del mes siguiente 00:00 UTC)` |
| Rango personalizado | `[from, to)` elegido por el operador |

**Default:** Últimos 30 días.

### 3.2 Timezone

| Decisión | Valor |
| --- | --- |
| Timezone V1 | **UTC** |
| Motivo | No existe timezone de Espacio en Growth hoy |
| Futuro | Si el Espacio gana TZ propia, los presets de calendario («Este mes» / «Mes anterior») podrán migrar sin cambiar la semántica de métricas |

Todos los timestamps SSOT se interpretan en UTC para filtrar períodos.

### 3.3 Inclusión / exclusión

```text
período = [start, end)
```

- **Inicio inclusivo**
- **Fin exclusivo**

Ejemplo: «Mes anterior» septiembre 2026 = `[2026-09-01T00:00:00.000Z, 2026-10-01T00:00:00.000Z)`.

### 3.4 Límites de rango personalizado

| Límite | Valor |
| --- | --- |
| Máximo | **366 días** |
| Mínimo | 1 día (`end > start`) |
| Si excede | Rechazar con error de validación; no truncar en silencio |

### 3.5 Período anterior (definición, no UI de %)

Si una lectura futura necesitara «período anterior» de misma longitud:

| Período actual | Período anterior |
| --- | --- |
| Últimos N días | Los N días inmediatamente anteriores a `start` |
| Este mes | Mes calendario anterior completo |
| Mes anterior | Mes calendario previo al mes anterior |
| Custom `[start, end)` | `[start - duración, start)` donde `duración = end - start` |

**V1 no implementa comparación con período anterior en la UI** (ver §12). Esta definición queda documentada para no reinventarla.

### 3.6 Variaciones porcentuales

**Fuera de V1.** Sin ↑↓, sin «mejoró/empeoró», sin porcentajes de variación.

---

## 4. Resumen

Responde: **¿Qué está pasando?**

### 4.1 Indicadores principales (exactos)

| # | Label UI | Semántica |
| --- | --- | --- |
| 1 | Personas nuevas | Altas de Persona en el período |
| 2 | Oportunidades generadas | Oportunidades abiertas en el período |
| 3 | En seguimiento | Snapshot actual de oportunidades `active` |
| 4 | Ganadas | Cierres `won` **durante** el período |
| 5 | Perdidas | Cierres `lost` **durante** el período |

### 4.2 Definición por indicador

#### Personas nuevas

| Campo | Contrato |
| --- | --- |
| Fuente | `growth_personas` |
| Timestamp | `createdAt` ∈ `[start, end)` |
| Filtro | `tenantId` + excluir `status ∈ {merged, archived}` |
| Semántica | Cohorte de altas del período |

#### Oportunidades generadas

| Campo | Contrato |
| --- | --- |
| Fuente | `growth_oportunidades` |
| Timestamp | `openedAt` ∈ `[start, end)` |
| Filtro | `tenantId` + excluir `status === "archived"` |
| Semántica | Cohorte de oportunidades abiertas en el período |

#### En seguimiento — **A) SNAPSHOT (única definición en Resumen)**

| Campo | Contrato |
| --- | --- |
| Fuente | `growth_oportunidades` |
| Timestamp | **No usa el período** |
| Filtro | `tenantId` + `status === "active"` |
| Semántica | **Snapshot actual** del Espacio: cuántas oportunidades están en seguimiento **ahora** |

**Ambigüedad resuelta (elige UNA):**

| Opción | Definición | ¿Elegida en Resumen? |
| --- | --- | --- |
| **A** | Snapshot actual `status === "active"` | **Sí** |
| **B** | Cohorte `openedAt` ∈ período ∧ `status` actual `active` | **No** en Resumen |

**Justificación de A:**

1. Responde la pregunta operativa «dónde mirar **ahora**», no «cuántas del período siguen active».
2. Evita que un cambio de preset (7d ↔ 30d) mueva un indicador que el operador lee como backlog vivo.
3. La lectura tipo B ya vive en **Ventas** como desglose de la cohorte (`byStatus`) y en **Campañas** periodizadas — con otro contexto, no en las 5 tarjetas del Resumen.
4. Alineado al snapshot de Campañas módulo (`deriveCampaignMetrics`: `status === "active"`).

Copy funcional sugerido si hace falta desambiguar: «En seguimiento (ahora)».

#### Ganadas

| Campo | Contrato |
| --- | --- |
| Fuente | `growth_oportunidades` |
| Timestamp | `closedAt` ∈ `[start, end)` |
| Filtro | `tenantId` + `status === "won"` |
| Semántica | **Cierres del período** — opción **A** (§8) |

#### Perdidas

| Campo | Contrato |
| --- | --- |
| Fuente | `growth_oportunidades` |
| Timestamp | `closedAt` ∈ `[start, end)` |
| Filtro | `tenantId` + `status === "lost"` |
| Semántica | Cierres del período — misma disciplina que Ganadas (opción **A**) |

### 4.3 Lo que el Resumen no incluye

- Traspasadas (`handed_off`) — van en Ventas / Conversión, no en las 5 tarjetas principales
- Conversión % — sección Ventas
- Comparación vs período anterior
- Ingresos

---

## 5. Captación

Responde: **¿De dónde llegan?**

### 5.1 Base

```text
Personas nuevas del período
+
desglose por primer origen de Persona
```

| Campo | Contrato |
| --- | --- |
| Fuente | `growth_personas.origin` |
| Significado | **Primer origen** de la Persona (inmutable) |
| Timestamp | `createdAt` ∈ período |
| Exclusiones | `merged`, `archived` |

**No** usar `growth_oportunidades.origin` en Captación.

### 5.2 Agrupaciones humanas (UI)

| Grupo UI | Regla de resolución (orden de prioridad) |
| --- | --- |
| WhatsApp | `origin.channel === "whatsapp"` (aunque `kind` sea `unknown`) |
| Formulario | `kind === "form"` — mostrar **nombre humano del formulario** si se puede resolver; si no, label «Formulario» |
| Admisión | `kind === "admission"` |
| Registro manual | `kind === "manual"` |
| Sitio web / Portal | Cuando `channel` / destino permita identificar portal-admisión u origen web inequívoco **y** no caiga ya en Formulario/Admisión |
| Sin origen claro | `kind === "unknown"` sin canal útil, u origen ausente/irresoluble |
| Evento | `kind === "event"` → label «Evento» (si aparece; no inventar volumen) |

Reutilizar `growthOriginKindLabel` / `humanizeOriginDisplayLabel` / resolución de nombre de form existentes.

### 5.3 Nunca mostrar al operador

- `origin.kind` crudo
- `origin.channel` crudo
- `formId`
- `sourceId`
- `sourceCollection`
- `trackingKey`

### 5.4 Merged / archived

| Status Persona | Tratamiento |
| --- | --- |
| `active` | Incluir |
| `merged` | **Excluir** de todos los conteos de Captación |
| `archived` | **Excluir** |

No contar la Persona superviviente dos veces por merges del período.

### 5.5 Contenido mínimo de sección

1. Total Personas nuevas del período.
2. Tabla/lista de agrupaciones humanas con conteo.
3. Sin drill-down obligatorio a IDs técnicos.

---

## 6. Pipeline (Ventas)

Responde: **¿Qué pasa con las oportunidades?**

### 6.1 Regla

Pipeline **exclusivamente** de Oportunidades.

**No** crear embudo Personas → Ganadas.

### 6.2 Estados reales y copy

| Status técnico | Copy UI |
| --- | --- |
| `open` | Abierta |
| `active` | En seguimiento |
| `won` | Ganada |
| `lost` | Perdida |
| `handed_off` | Traspasada |
| `archived` | Archivada |

### 6.3 Lectura de pipeline en el período

Dos lecturas coexisten **con nombres distintos** (no mezclar en una sola tarjeta):

| Lectura | Definición | Dónde |
| --- | --- | --- |
| **Generadas del período** | `openedAt` ∈ período, excluye `archived` | Total + base de conversión |
| **Estado actual de esa cohorte** | Mismas opps, `status` al momento de la query | Desglose Abierta / En seguimiento / Ganada / Perdida / Traspasada |
| **Cierres del período** | `closedAt` ∈ período ∧ status final | Resumen (Ganadas/Perdidas) y opcional Traspasadas |

### 6.4 Archivadas

| Uso | Tratamiento |
| --- | --- |
| Pipeline / conversión | **Excluidas** |
| Conteos opcionales | Pueden mostrarse aparte como «Archivadas» si la implementación lo necesita; **no** entran al ratio |

### 6.5 Por tipo

Desglose por `typeKey` con **labels humanos del Espacio** (Consulta / Registro / Conversión-admisión, etc.).

**Nunca** interpretar `typeKey === "conversion"` como tasa de conversión.

### 6.6 Contenido mínimo de sección

1. Oportunidades generadas (período).
2. Desglose de la cohorte por estado actual (copy §6.2).
3. Conversión (§7).
4. Traspasadas (conteo cohort y/o cierres — etiquetado).
5. Pérdidas desglosadas (§11) — dentro de Ventas, no sección top-level.

---

## 7. Conversión

### 7.1 Fórmula exacta (congelada)

```text
cohorte =
  oportunidades del tenant
  con openedAt ∈ [start, end)
  y status ≠ archived

conversión =
  count(cohorte donde status actual === "won")
  /
  count(cohorte)
```

| Pieza | Definición |
| --- | --- |
| Numerador | Opps de la cohorte cuyo **estado actual** es `won` |
| Denominador | Todas las opps válidas de la cohorte (incluye open, active, won, lost, handed_off) |
| `handed_off` | En denominador: **sí**. En numerador: **no**. Mostrar conteo **aparte** («Traspasadas») |
| `archived` | **Fuera** de cohorte / ratio |
| Período | Define la cohorte por `openedAt`, **no** por `closedAt` |

### 7.2 Denominador = 0

| Caso | UI |
| --- | --- |
| `count(cohorte) === 0` | Mostrar **"—"** (sin tasa) |
| Nunca | `0%` fingido cuando no hay base; nunca `Infinity` / `NaN` |

Si hay cohorte y cero ganadas → **0%** es válido.

### 7.3 Redondeo

| Campo | Contrato |
| --- | --- |
| Representación interna | `rate` = proporción `0..1` (o `null` si denom = 0) |
| Display UI | Porcentaje entero **0–100**, redondeo **half-up** al entero más cercano |
| Ejemplos | `1/3` → **33%**; `2/3` → **67%**; `1/2` → **50%**; `0/5` → **0%** |
| Prohibido | Decimales decorativos en V1; `NaN` / `Infinity` |

### 7.4 Relación con Resumen

| Concepto | Semántica | Label humano |
| --- | --- | --- |
| Ganadas (Resumen) | Cierres `won` con `closedAt` ∈ período | **Ganadas** |
| Conversión | `won` actuales / cohorte `openedAt` ∈ período | **Conversión** |
| Won de la cohorte (si se muestra en Ventas) | Conteos en `sales.byStatus` / `conversion.won` | **Ganadas de lo generado** (o vía desglose de cohorte) — **nunca** reutilizar el label corto «Ganadas» del Resumen |

Pueden diferir numéricamente: una opp abierta antes del período y cerrada `won` ahora suma en Resumen pero **no** en la conversión del período; una opp abierta ahora y aún `open` está en denominador de conversión pero no en Ganadas del Resumen.

### 7.5 Prohibiciones

- No usar `typeKey "conversion"` para calcular la tasa.
- No llamar «conversión» a `handed_off`.
- No inventar ingresos ni ticket.

### 7.6 Conversión por campaña

Misma fórmula sobre el subconjunto:

```text
origin.campaign === trackingKey  (resolución interna)
∧ openedAt ∈ período
∧ status ≠ archived
```

El UI muestra el **nombre** de la campaña, nunca el `trackingKey`.

---

## 8. Semántica de ganadas / perdidas / cierres

### 8.1 Dos lecturas distintas (no mezclar)

| Letra | Pregunta humana | Definición operativa |
| --- | --- | --- |
| **A** | «Ganadas / perdidas **durante** el período» | `status` final ∧ `closedAt` ∈ `[start, end)` |
| **B** | «De lo **generado** en el período, cuántas están ganadas / perdidas **hoy**» | `openedAt` ∈ período ∧ `status` actual `won` / `lost` |

### 8.2 Decisión congelada

| Superficie | Lectura | Label |
| --- | --- | --- |
| **Resumen → Ganadas / Perdidas** | **A** (cierres del período) | **Ganadas** / **Perdidas** |
| **Ventas → Conversión** | **B** en el numerador (`won` actual de la cohorte) | **Conversión** (+ `conversion.won`) |
| **Ventas → desglose de cohorte** | **B** completo por estado | Labels de estado («Ganada», «Perdida») **bajo** el título de cohorte / «lo generado» |
| **Campañas (Analítica periodizada)** | Cohorte por `openedAt` + estado actual (familia **B**) | Mismos nombres de columna que Campañas V1, acotados al período |

### 8.3 Por qué A en el Resumen

1. El copy «Ganadas» / «Perdidas» junto a un selector de período se lee naturalmente como **cierres en esa ventana**.
2. Evita contar como «ganadas del mes» oportunidades cerradas hace meses que siguen `won`.
3. La lectura B queda explícita y con **nombre distinto** en Conversión / Ventas — ambas son útiles; no se fusionan en una sola tarjeta.

Misma disciplina para **Perdidas**.

### 8.4 Traspasadas

| Concepto | Definición |
| --- | --- |
| Traspasadas (cierres del período) — familia A | `status === "handed_off"` ∧ `closedAt` ∈ período |
| Traspasadas (cohorte) — familia B | Opps de la cohorte con estado actual `handed_off` |

No cuentan como ganadas en ningún KPI V1. En Resumen **no** ocupan una de las 5 tarjetas; viven en Ventas.

### 8.5 Lenguaje sencillo obligatorio

| Decir | No decir |
| --- | --- |
| Ganadas (Resumen = A) | «Ganadas de la cohorte» en el Resumen |
| Conversión / «Ganadas de lo generado» (B) | «Ganadas» a secas para el ratio |
| Traspasadas | «Ganadas académicas» sin copy de traspaso |

---

## 9. Campañas

Responde: **¿Qué está funcionando?**

### 9.1 Reutilizar contrato Campañas

Métricas humanas alineadas a [CONTRACT-002 §9.1](./OT-GROWTH-CAMPAIGNS-CONTRACT-002.md):

| Métrica | Base |
| --- | --- |
| Personas captadas | `COUNT DISTINCT personaId` en opps con campaña |
| Oportunidades | `COUNT` esas opps |
| En seguimiento | `status === "active"` |
| Ganadas | `status === "won"` |
| Perdidas | `status === "lost"` |
| Conversión | Fórmula §7 acotada a la campaña |

### 9.2 Período en Analítica

Para la sección Campañas de Analítica V1, el período **filtra por `openedAt`**:

```text
tenantId
+ origin.campaign presente
+ openedAt ∈ [start, end)
+ status ≠ archived
```

Sobre ese set periodizado se calculan las métricas:

| Columna | Semántica en Analítica (periodizada) |
| --- | --- |
| Personas captadas | `DISTINCT personaId` del set |
| Oportunidades | `COUNT` del set |
| En seguimiento / Ganadas / Perdidas | Estado **actual** de opps del set (familia B) |
| Conversión | Fórmula §7 sobre el set |

**Nota:** aquí «En seguimiento» **sí** es cohorte del período (opps abiertas en el rango que hoy están `active`), distinto del snapshot global del Resumen. El contexto de sección («campaña × período») lo hace legible.

### 9.3 `deriveCampaignMetrics` existente

| Decisión | Valor |
| --- | --- |
| ¿Modificar `deriveCampaignMetrics`? | **No** |
| Semántica actual | Snapshot **total** histórico de la campaña (sin período) |
| Si Analítica necesita periodización | Read-model propio en `analytics-read.ts` que **reutiliza el contrato de métricas** (mismos nombres/semántica de campos) sobre un set ya filtrado por período |

Campañas UI sigue con snapshot total. Analítica muestra lectura periodizada. Ambas coexisten sin romper la otra.

### 9.4 Contenido mínimo

1. Lista/ranking de campañas del tenant con al menos 1 opp en el período (o todas las campañas con ceros — ver §17).
2. Columnas: nombre · Personas captadas · Oportunidades · En seguimiento · Ganadas · Perdidas · Conversión.
3. Enlace de navegación a ficha de campaña cuando exista permiso/ruta.
4. Nombre humano; `trackingKey` solo interno.

### 9.5 Fuera

CTR · ROAS · alcance · impresiones · costos · ads.

---

## 10. Mensajes

Responde: **¿Por dónde nos hablan?**

### 10.1 Indicadores V1 (congelados)

| Indicador | Fuente | Timestamp / filtro |
| --- | --- | --- |
| Conversaciones | `growth_conversaciones` | `createdAt` ∈ período; `tenantId` |
| Mensajes recibidos | `growth_mensajes` | `direction === "inbound"` ∧ `occurredAt` ∈ período |
| Mensajes enviados | `growth_mensajes` | `direction === "outbound"` ∧ `occurredAt` ∈ período (incluir `sent` y `failed`; no inventar «entregados») |
| Personas que escribieron | Distinct `personaId` | Conversaciones/mensajes con al menos un inbound en el período; mismo `tenantId` |
| Canales | Agrupación por `channel` con labels humanos | Sobre conversaciones del período (`createdAt`) o mensajes del período — **una** base coherente: preferir conversaciones creadas en el período + canal de la conversación |

### 10.2 Conversaciones sin respuesta — **incluido**

| Campo | Contrato |
| --- | --- |
| Nombre UI | **Conversaciones sin respuesta** |
| Definición operativa | Conversaciones del tenant cuyo **último mensaje del hilo** tiene `direction === "inbound"` |
| Alcance | **Snapshot actual** del Espacio (no filtrado por período del selector) |
| Cómo derivarlo | Hoy `growth_conversaciones` solo expone `lastMessageAt` (no dirección del último mensaje). V1 deriva el último mensaje por `conversationId` + `occurredAt` máximo en `growth_mensajes` y lee su `direction`. Si en el futuro la conversación materializa dirección del último mensaje, puede usarse como atajo **equivalente** sin cambiar la semántica |
| No es | SLA · tiempo de respuesta · cola de Mensajes completa |

**Por qué snapshot:** «sin respuesta» responde «dónde mirar ahora», igual que «En seguimiento» del Resumen. El selector de período sigue aplicando a Conversaciones / recibidos / enviados / personas que escribieron.

### 10.3 Fuera de V1

- Tiempo promedio de respuesta
- Tiempo de primera respuesta
- Leídos / read receipts
- Aperturas
- CTR
- Cualquier métrica llamada «SLA»

### 10.4 Contenido mínimo

1. Totales §10.1.
2. Desglose por canal (labels humanos).
3. Conversaciones sin respuesta (conteo).

---

## 11. Pérdidas («¿Dónde estamos perdiendo?»)

### 11.1 Decisión de alcance

**Entra en V1** como **sublectura dentro de Ventas**, no como sección top-level propia.

### 11.2 Base

```text
oportunidades con status === "lost"
∧ closedAt ∈ [start, end)
∧ tenantId
```

### 11.3 Desgloses permitidos

| Dimensión | Campo | Presentación |
| --- | --- | --- |
| Por tipo | `typeKey` | Label humano del Espacio |
| Por origen | `oportunidad.origin` | Labels humanos (mismo criterio que §5, aplicado a origen de **oportunidad**) |
| Por campaña | `origin.campaign` | Nombre de campaña; «Sin campaña» si ausente |

### 11.4 Prohibido

- Motivo de pérdida / `lostReason` (no existe)
- Texto cualitativo inventado
- Embudo Personas→Perdidas

---

## 12. Comparaciones

### 12.1 V1

| Capacidad | Decisión |
| --- | --- |
| Totales absolutos del período | **Sí** |
| Comparación absoluta vs período anterior | **Fuera V1** |
| Porcentajes ↑↓ / flechas / «mejoró» | **Fuera V1** |

### 12.2 Motivo

La comparación vs período anterior añade reglas de UI (bases en 0, espacios nuevos, presets de calendario) sin mejorar la pregunta principal de V1. La definición de período anterior queda en §3.5 por si una OT futura la activa.

---

## 13. Índices

### 13.1 Estado actual (evidencia)

| Colección | Índices relevantes hoy |
| --- | --- |
| `growth_personas` | `tenantId+emailNormalized`, `tenantId+phoneNormalized`, `tenantId+updatedAt` — **sin** `createdAt` |
| `growth_oportunidades` | `tenantId+personaId+status`, `tenantId+personaId+typeKey+subject` — **sin** `openedAt` / `closedAt` / `origin.campaign` |
| `growth_actividades` | `tenantId+occurredAt`, persona/oportunidad+occurredAt |
| `growth_mensajes` | `tenantId+occurredAt`, `tenantId+conversationId+occurredAt` |
| `growth_conversaciones` | `tenantId+updatedAt`, persona/canal |

### 13.2 Índices justificados para Analítica V1

Crear solo si no existen equivalentes:

| Colección | Índice | Justificación |
| --- | --- | --- |
| `growth_personas` | `{ tenantId: 1, createdAt: -1 }` | Personas nuevas / Captación |
| `growth_oportunidades` | `{ tenantId: 1, openedAt: -1 }` | Generadas / cohorte conversión |
| `growth_oportunidades` | `{ tenantId: 1, status: 1, openedAt: -1 }` | Pipeline periodizado + snapshot filtrable |
| `growth_oportunidades` | `{ tenantId: 1, closedAt: -1 }` sparse | Cierres del período (Ganadas/Perdidas/Traspasadas) |
| `growth_oportunidades` | `{ tenantId: 1, "origin.campaign": 1, openedAt: -1 }` sparse | Campañas periodizadas |

### 13.3 No declarar

- Índices de `growth_automation_runs` (fuera del núcleo)
- Duplicar `tenantId+occurredAt` en mensajes/actividades (ya existen)
- Índices «por si acaso» sin query V1

Evaluación final de creación: OT de implementación; este contrato solo congela cuáles están **justificados**.

---

## 14. Permiso

### 14.1 Código congelado

| Código | Copy | Capacidad |
| --- | --- | --- |
| `growth.analytics.view` | Ver Analítica del Espacio | Solo lectura de `/admin/analitica` y su read-model |

### 14.2 Reglas

- Solo lectura.
- **No** crear `growth.analytics.manage` en V1 (no hay nada que administrar).
- **No** usar Identity (`identity.audit.*`).
- **No** sustituir por solo `growth.sales.read` / `growth.sales.view`: Analítica cruza captación + campañas + mensajes.
- Nav «Analítica»: exige `growth.analytics.view`.

### 14.3 Plantillas / roles que deben heredarlo

Mismo patrón que `growth.campaigns.view`:

| Rol | Hereda `growth.analytics.view` |
| --- | --- |
| `SUPER_ADMIN` | Sí (allAllowed) |
| `INSTITUTION_ADMIN` | **Sí** |
| `SUPPORT` | **Sí** |
| `ADMISSIONS` | **Sí** |
| Resto | **No** por defecto |

---

## 15. Contrato read-model

### 15.1 Forma de respuesta (conceptual, estable para UI)

```text
AnalyticsV1Response {
  period: {
    preset: "last_7d" | "last_30d" | "this_month" | "previous_month" | "custom"
    start: ISO8601
    end: ISO8601          // exclusivo
    timezone: "UTC"
  }

  summary: {
    personasNuevas: number
    oportunidadesGeneradas: number
    enSeguimiento: number          // snapshot ahora
    ganadas: number                // closedAt ∈ período
    perdidas: number               // closedAt ∈ período
  }

  acquisition: {
    total: number
    byOrigin: Array<{ label: string, count: number }>
  }

  sales: {
    generadas: number
    byStatus: Array<{ statusLabel: string, count: number }>  // cohorte openedAt
    conversion: {
      rate: number | null          // null → UI "—"; si number: 0..1; UI muestra % entero half-up
      won: number
      cohort: number
      handedOff: number            // aparte, no en numerador
    }
    closures: {
      ganadas: number
      perdidas: number
      traspasadas: number
    }
    losses: {
      byType: Array<{ label: string, count: number }>
      byOrigin: Array<{ label: string, count: number }>
      byCampaign: Array<{ label: string, count: number }>
    }
  }

  campaigns: Array<{
    id: string                     // navegación interna
    name: string
    personasCaptadas: number
    oportunidades: number
    enSeguimiento: number
    ganadas: number
    perdidas: number
    conversionRate: number | null
  }>

  messages: {
    conversaciones: number
    recibidos: number
    enviados: number
    personasQueEscribieron: number
    byChannel: Array<{ label: string, count: number }>
    conversacionesSinRespuesta: number
  }
}
```

### 15.2 Reglas de exposición

| Permitido | Prohibido |
| --- | --- |
| Labels humanos | `tenantId` en payload de UI |
| Conteos | Documentos Mongo crudos |
| `id` de campaña / enlaces de navegación | `trackingKey`, `formId`, `typeKey` crudo |
| `conversion.rate: null` → "—" | `origin.*` crudo |
| | IDs técnicos innecesarios de persona/opp en agregados |

### 15.3 Ubicación prevista

`analytics-read.ts` (lib/core growth read-model) — detalle de path en OT de implementación.

---

## 16. UX funcional (sin diseño visual)

### 16.1 Superficie

- **Una sola pantalla:** `/admin/analitica`
- Selector de período global arriba (§3)
- Sin 5 módulos nuevos, sin 20 pestañas

### 16.2 Orden de secciones

| Orden | Sección | Pregunta | Información mínima |
| --- | --- | --- | --- |
| 1 | **RESUMEN** | ¿Qué está pasando? | 5 indicadores §4 |
| 2 | **CAPTACIÓN** | ¿De dónde llegan? | Total + desglose origen Persona §5 |
| 3 | **VENTAS** | ¿Qué pasa con las oportunidades? | Pipeline cohorte + conversión + cierres + pérdidas §6–§8 / §11 |
| 4 | **CAMPAÑAS** | ¿Qué está funcionando? | Tabla periodizada §9 |
| 5 | **MENSAJES** | ¿Por dónde nos hablan? | Totales + canales + sin respuesta §10 |

### 16.3 Fuera de esta OT

Layout, cards, charts, colores, tipografía — no forman parte del contrato funcional.

---

## 17. Estados sin datos

| Escenario | Comportamiento |
| --- | --- |
| 0 Personas | Captación/Resumen en **0**; respuesta válida |
| 0 Oportunidades | Ventas/conversión `"—"`; Ganadas/Perdidas 0 |
| 0 Campañas | Sección Campañas vacía o lista vacía; resto intacto |
| 0 Mensajes / sin WhatsApp | Mensajes en 0; no rompe otras secciones |
| Espacio nuevo total | Toda la respuesta con ceros / "—" donde aplique |

### 17.1 Prohibido

- Seeds de demostración
- Datos falsos
- Hardcodear SEM/ADL u otros tenants
- Depender de datos de otro Espacio

---

## 18. Multi-tenant

| Regla | Contrato |
| --- | --- |
| Scope | `tenantId` del Espacio activo en **todas** las consultas |
| Período | Aplicado cuando la métrica lo define |
| Joins | Mismo `tenantId` siempre |
| Mezcla SEM/ADL | **Prohibida** |
| Analítica global `/platform` | **Fuera de alcance** |
| `/admin/analitica` | Solo el Espacio activo |

---

## 19. Diferidos / fuera de V1

Congelado explícitamente **fuera**:

| Ítem |
| --- |
| Ingresos · ticket promedio |
| ROAS · costos · Meta Ads |
| CTR · alcance · impresiones |
| Aperturas · leídos |
| SLA · tiempo medio / primera respuesta |
| Motivo cualitativo de pérdida |
| Telemetría de Automatizaciones como KPI de negocio |
| Funnel Personas → Ganadas |
| Porcentajes decorativos ↑↓ |
| Comparación vs período anterior (UI) |
| Warehouse · materialización de métricas |
| `growth_analytics_events` / `growth_analytics_metrics` |
| KPI desde `core_events` / submissions / interesados |
| `growth.analytics.manage` |
| Uso de `growth_actividades` como KPI primario |
| Timezone por Espacio (V1 = UTC) |

---

## 20. Entregables (checklist)

| # | Entregable | Sección |
| --- | --- | --- |
| 1 | Definición final Analítica V1 | §1 |
| 2 | Arquitectura | §2 |
| 3 | Períodos y timezone | §3 |
| 4 | Semántica exacta del Resumen | §4 |
| 5 | Diferencia Ganadas/Perdidas período vs cohorte | §8 |
| 6 | Fórmula definitiva de conversión | §7 |
| 7 | Captación | §5 |
| 8 | Pipeline | §6 |
| 9 | Campañas | §9 |
| 10 | Mensajes | §10 |
| 11 | Pérdidas | §11 |
| 12 | Contrato Read Model | §15 |
| 13 | Índices | §13 |
| 14 | Permiso | §14 |
| 15 | UX funcional | §16 |
| 16 | Multi-tenant | §18 |
| 17 | Estados sin datos | §17 |
| 18 | Diferidos | §19 |
| — | Comparaciones (explícito fuera UI %) | §12 |
| Gate | **APTO** | Gate final |

---

## Decisiones clave (resumen ejecutivo)

| Tema | Congelado |
| --- | --- |
| Pregunta de producto | ¿Cómo está mi negocio y dónde mirar? |
| En seguimiento (Resumen) | **A) Snapshot** actual `active` — no cohorte del período |
| Ganadas / Perdidas (Resumen) | **A) Cierres** por `closedAt` ∈ período |
| Conversión | Cohorte `openedAt` (familia B); won actual / cohorte; `handed_off` aparte; denom 0 → **"—"**; % entero half-up |
| Campañas en Analítica | Periodizado por `openedAt`; no tocar `deriveCampaignMetrics` |
| API | Un agregado `GET /api/growth/analytics` basta |
| Sin respuesta | Incluido; último mensaje inbound; snapshot |
| Comparaciones | Solo totales; sin vs anterior ni % |
| Pérdidas | Sublectura en Ventas (tipo / origen / campaña) |
| Permiso | `growth.analytics.view` only |
| TZ | UTC |

---

## Referencias

- Auditoría: [OT-GROWTH-ANALYTICS-AUDIT-001](./OT-GROWTH-ANALYTICS-AUDIT-001.md)
- Campañas métricas: [OT-GROWTH-CAMPAIGNS-CONTRACT-002](./OT-GROWTH-CAMPAIGNS-CONTRACT-002.md) §9
- Índices actuales: `src/core/growth/indexes.ts`, `messaging/indexes.ts`
- Métricas campañas: `src/core/growth/campaigns/metrics.ts`
- Plantillas rol: `src/core/identity/permissions/role-templates.ts`

---

## Cierre

| Pregunta | Respuesta |
| --- | --- |
| ¿Contrato congelado? | **Sí** |
| ¿Implementar ahora? | **No** |
| ¿Diseñar ahora? | **No** |
| ¿Abrir otra OT automáticamente? | **No** |
| ¿Gate? | **APTO** |
