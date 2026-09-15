# OT-GROWTH-NEXT-ACTION-AUDIT-001 — Cierre conceptual del puente Captura → Qué hacer ahora

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-NEXT-ACTION-AUDIT-001 |
| Tipo | Auditoría + propuesta de decisión (sin implementación) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-14 |
| Entrada | [OT-GROWTH-E2E-AUDIT-001](./OT-GROWTH-E2E-AUDIT-001.md) H1 · ADR-010 · ADR-011 · Growth Core / Ventas / Automatizaciones / Inicio |
| Estado | **CERRADA · APTO PARA IMPLEMENTAR — OPCIÓN B** |
| Alcance | Resolver conceptualmente el bloqueo E2E H1: captación → Persona → Oportunidad → primera acción útil automática → Inicio «Qué hacer ahora» |
| Fuera de alcance | Implementación · segundo motor · hardcodes por cliente · WhatsApp→Oportunidad (H2) · abrir otra OT automáticamente |

**Restricciones cumplidas:** solo diagnóstico y decisión; sin código de producto; sin seeds reales; sin reglas SEM/ADL.

---

## Gate final

# APTO PARA IMPLEMENTAR — OPCIÓN B

El viaje comercial **ya tiene** todos los motores para el primer «qué hacer ahora»:

`openGrowthOpportunity` → Actividad `opportunity_opened` → Event Bus `GrowthOpportunityOpened` → Automation Runtime → `salesSetNextAction` → `nextAction` embebido → Inicio / Personas / Ventas.

**No falta un CRM ni un segundo runner.** Falta un **playbook de arranque por Espacio**: una Automatización de plataforma, tenant-scoped, active por defecto, editable/desactivable, que reutilice el Runtime existente.

| Opción | Veredicto |
| --- | --- |
| **A** — nextAction hardcodeada en captura | Rechazada: política invisible, no configurable, no escala el modelo de producto |
| **B** — automatización de arranque | **Elegida** — simple por fuera, potente por dentro; un solo motor |
| **C** — política default sin persistir | Rechazada: acciones fantasma; rompe SSOT Inicio↔Ventas↔Actividad |

---

## 1. Resumen ejecutivo

Hoy, tras Formulario V1 o Admisión, Growth OS crea Persona + Oportunidad + Actividad, pero la Oportunidad nace con `nextAction: null` (`open-opportunity.ts`). Inicio solo lista personas cuya proyección tiene próxima acción real (`project-home.ts` filtra ≠ `GROWTH_NO_NEXT_ACTION_LABEL`) → la sección operativa estrella queda vacía aunque haya captaciones frescas (**H1**, S1).

La promesa de producto es:

> una persona completa un formulario → aparece en Growth OS → Inicio dice claramente qué hacer  
> **sin** que el cliente configure Automatizaciones antes de usar el producto.

Eso se cumple sembrando, al crear/asegurar el Espacio, la misma cadena que un operador experto publicaría a mano:

`GrowthOpportunityOpened` → (condición `nextAction` ausente) → `salesSetNextAction` («Contactar a la persona», kind `contact`).

El cliente ve Inicio útil desde el día 1. Si más adelante abre Automatizaciones, encuentra una definición real, versionada, desactivable — no magia oculta.

---

## 2. Qué existe y qué se reutiliza

### 2.1 Inventario auditado

| Pieza | Ubicación | Estado real | Reutilizable para H1 |
| --- | --- | --- | --- |
| Abrir Oportunidad | `src/core/growth/open-opportunity.ts` | Crea/reusa; **siempre** `nextAction: null` al crear | Sí (no poner política de producto aquí) |
| nextAction dominio | `src/core/growth/next-action.ts` | set / clear + Actividad `next_action_set` | Sí — SSOT del campo |
| sales-ops | `src/lib/growth/sales-ops.ts` | UI + APIs + Automation port | Sí — única vía operativa |
| Evento `GrowthOpportunityOpened` | `event-bus-port.ts` ↔ Actividad `opportunity_opened` | Publicado al **crear** (reuse no emite) | Sí — trigger natural |
| Event Bus | `publisher/index.ts` `await dispatch` | In-process, mismo request | Sí |
| Automation Runtime | `automations/runtime.ts` + `automations-runtime.ts` | Un motor; fail-soft; actor `growth-automation` | Sí — **no crear otro** |
| Handler | `handlers/builtin.ts` `growth.automations` | Suscrito a todos los `Growth*` | Sí |
| Catálogo acciones | `automations/types.ts` · `catalog.ts` | `salesSetNextAction` / `salesClearNextAction` / follow-up / transition | Sí |
| Condición `nextAction` | `automations/conditions.ts` | `exists` / `absent` | Sí — idempotencia blanda |
| Editor create defaults | `AutomatizacionEditorClient.tsx` | Trigger `GrowthOpportunityOpened` + acción `salesSetNextAction` | Patrón de producto confirmado; **copy/condición actuales son SESGADOS** (ver §2.3) |
| Inicio | `project-home.ts` | «Qué hacer ahora» = personas con nextAction real | Sí — sin cambio de modelo |
| Personas | `persona-view.ts` `pickPrimaryNextAction` | Prioriza no finales; si solo hay finales con nextAction, **aún puede mostrarlas** | Sí + higiene (§7) |
| Ventas | `VentasOperateClient` + API next-action | set / clear manual | Sí |
| Space config | `space-config.ts` `ensureGrowthSpaceConfig` | Defaults de tipos por Espacio (patrón ensure idempotente) | Patrón análogo para seed |
| Creación Espacio | `create-platform-space.ts` → `provisionTenantFoundation` | Menús/site; **sin** seed Growth/automations | Punto de enganche |
| Modelo `GrowthAutomation` | `automations/types.ts` | Sin `seedKey` / `platformOrigin` | Hueco mínimo de contrato |
| Plantillas automation | — | **No hay** playbook de arranque | Hueco a cerrar |

### 2.2 Cadena ya cableada (evidencia)

```text
Form / Admisión
  → live-ingest → projectGrowthFromSignal
  → openGrowthOpportunity  (nextAction: null)
  → recordGrowthActivity(opportunity_opened)
  → publish GrowthOpportunityOpened  (await dispatch, in-process)
  → handler growth.automations
  → [si hay automation active + published] salesSetNextAction (actor growth-automation)
  → nextAction persistido + Actividad next_action_set + GrowthNextActionSet
  → Inicio / Personas / Ventas leen el mismo campo
```

**Confirmado:** `publish` → `await dispatch` (`src/core/events/publisher/index.ts`); el subscriber de Automatizaciones corre en el mismo request de ingest. No hace falta cola ni segundo runner para el primer nextAction.

**Confirmado:** reuse de Oportunidad **no** emite `GrowthOpportunityOpened` → no re-dispara el playbook (correcto).

**Confirmado:** Runtime ya usa solo sales-ops (`automations-runtime.ts` → `salesSetNextAction`); actor fijo `GROWTH_AUTOMATION_SYSTEM_ACTOR = "growth-automation"`.

### 2.3 Matiz del editor (no confundir con el seed)

El create default del editor **sí** arranca en `GrowthOpportunityOpened` → `salesSetNextAction`, pero hoy propone:

- summary: «Llamar para confirmar interés»
- condición: origen canal `portal-admision`

Eso confirma la **intención de producto** del patrón, pero **no** es un default multi-negocio. El seed de arranque debe ser **neutro** (sin asumir cursos, admisión ni SEM/ADL).

### 2.4 Qué NO hay hoy

- Seed/idempotencia de Automatización de arranque por Espacio.
- Campo `seedKey` (o equivalente) en `GrowthAutomation`.
- Limpieza automática de `nextAction` al pasar a estado final (gap de ciclo de vida; §7).

---

## 3. Comparación A / B / C

### A — nextAction hardcodeada en captura

**Idea:** en `openGrowthOpportunity` (o justo después en ingest), llamar `setGrowthNextAction` / `salesSetNextAction` con un summary fijo (p. ej. «Contactar a la persona»).

| Criterio | Evaluación |
| --- | --- |
| Reutilización | Parcial: usa dominio nextAction / sales-ops; **no** usa Automation Runtime ni UI Automatizaciones |
| Simplicidad (fuera) | Alta a corto plazo |
| Escalabilidad | Baja: nueva política = cambio de código; no desactivable por Espacio |
| Riesgo | Política invisible; duplica orquestación respecto a Automatizaciones; tentación de `if typeKey / if tenant` |
| Impacto | Inicio se llena; Actividad correcta; pero el cliente no ve «por qué» en Automatizaciones |
| Multi-tenant | OK si el default es neutro; **no** configurable por negocio |
| Contra principios | Viola «potente por dentro» (orquestación fuera del motor declarado) y «configurable posteriormente» |

**Ventajas:** sync duro; puede personalizar summary con `displayName` en el mismo request; cero dependencia de seed; sin fail-soft del Runtime.

**Riesgos:** segundo lugar de verdad; cliente no puede apagarlo sin deploy; si más tarde se añade B, hay doble set; no aparece en Automatizaciones.

### B — Automatización de arranque (recomendada)

**Idea:** al crear/asegurar un Espacio, Growth OS dispone (idempotente) de una Automatización **active** con versión **published**:

| Paso | Definición propuesta |
| --- | --- |
| Trigger | `GrowthOpportunityOpened` |
| Condición | `nextAction` **absent** (recomendada) |
| Acción | `salesSetNextAction` · summary neutro «Contactar a la persona» · `nextActionKind: contact` |
| Actor ejecución | `growth-automation` (ya existe) |
| Actor seed (createdBy) | identificador de sistema de plataforma (p. ej. `growth-platform`) — no Identity |

| Criterio | Evaluación |
| --- | --- |
| Reutilización | **Máxima:** Event Bus + Runtime + sales-ops + historial de runs + UI Automatizaciones |
| Simplicidad (fuera) | Alta: el cliente no configura nada; Inicio funciona |
| Escalabilidad | Alta: editar/desactivar/versionar sin código; distintos negocios cambian el summary |
| Riesgo | Residual fail-soft si Runtime falla (igual que hoy cualquier automation); mitigable con tests de seed + smoke E2E |
| Impacto | Cierra H1; aparece en Automatizaciones; Actividad y Analytics coherentes |
| Multi-tenant | Una definición **por** `tenantId`; sin if SEM/ADL; copy genérico (no asume cursos) |
| Principio | «Simple por fuera. Potente por dentro.» |

**Ventajas:** mismo camino que un playbook humano; desactivable; visible; versionable; compatible con condiciones futuras (origen, campaña, typeKey).

**Riesgos/mitigaciones:**

| Riesgo | Mitigación |
| --- | --- |
| Seed duplicado | `seedKey` estable por tenant (ver §5) |
| Espacios existentes vacíos | `ensure*` idempotente + backfill en migración o al primer acceso Growth admin |
| Summary sin nombre propio | Inicio ya muestra `displayName`; summary neutro cierra H1 (ver §6) |
| Fail-soft deja nextAction null | Tests de arranque; no cambiar fail-soft del Runtime |
| Create nace en `draft` | Seed debe **publicar** (publish → `active` + `publishedVersion`) vía service existente |

### C — Política default del motor (sin persistir)

**Idea:** si Oportunidad abierta y `nextAction == null`, Inicio/Personas/Ventas **derivan** «Contactar…» solo en proyección.

| Criterio | Evaluación |
| --- | --- |
| Reutilización | Baja: inventa capa de sugerencias paralela al campo SSOT |
| Simplicidad (fuera) | Engañosa: la pantalla se llena, pero Ventas no tiene acción real que completar |
| Escalabilidad | Mala: Analytics/Actividad no ven hechos; completar/cambiar es ambiguo |
| Riesgo | **Acciones ficticias** (explícitamente prohibidas en esta OT) |
| Impacto | Inicio≠Ventas; «Completar» no tiene qué limpiar; métricas de seguimiento distorsionadas |
| Multi-tenant | Técnicamente fácil, producto incorrecto |

**Rechazo claro:** contradice ADR-010 (`nextAction` embebido = verdad operativa) y la restricción «no acciones ficticias solo para llenar la pantalla».

### Tabla comparativa

| | A Hardcode captura | **B Arranque automation** | C Default proyección |
| --- | --- | --- | --- |
| Reutiliza Runtime | No | **Sí** | No |
| Configurable / off | No | **Sí** | N/A (siempre “on” en UI) |
| Persistido / SSOT | Sí | **Sí** | No |
| Visible en Automatizaciones | No | **Sí** | No |
| Actor `growth-automation` | No (ingest/humano) | **Sí** | No |
| Riesgo segundo motor | Bajo (pero política dual) | **Ninguno** | Alto (motor de sugerencias) |
| Encaje principio producto | Medio | **Alto** | Bajo |
| **Recomendación** | No | **Sí** | No |

---

## 4. Principio de producto

| Requisito | Cómo lo cumple B |
| --- | --- |
| Form → Growth OS sin fricción | Ingest actual sin cambios de captura |
| Inicio dice qué hacer | Tras `GrowthOpportunityOpened`, Runtime setea `nextAction` en el mismo request |
| Cliente no entiende Automatizaciones | Seed active por defecto; UI Inicio no menciona config |
| Potente por dentro | Misma Automatización editable, desactivable, versionada |
| Un solo motor | Automation Runtime + sales-ops; sin tareas, sin agenda, sin CRM |

---

## 5. Nacimiento de la Automatización (opción B)

### 5.1 Cuándo nace

| Momento | Acción |
| --- | --- |
| **Creación de Espacio** | Tras `provisionTenantFoundation` / `createPlatformSpace` exitoso → `ensureGrowthStartupNextActionAutomation(tenantId)` |
| **Espacios existentes** | Misma `ensure*` (idempotente): migración one-shot **o** ensure al primer acceso Growth admin del Espacio |
| **Onboarding humano** | No obligatorio; no mostrar wizard técnico en Inicio |

No depender de que el cliente «publique» nada.

### 5.2 Cómo nace (reutilizar service, no otro runner)

Flujo propuesto sobre APIs de dominio existentes:

1. `createGrowthAutomation` (nace `draft` + versión 1 draft) — `service.ts`.
2. `publishGrowthAutomation` (draft → `published`; automation → `active` + `publishedVersion`) — ya cableado.
3. Actor de seed: `growth-platform` (o constante equivalente) en `createdByUserId` / `publishedByUserId` — **no** cuenta Identity.

Alternativa aceptable: helper interno que inserta automation+versión published en una sola escritura **si** respeta el mismo modelo e índices; preferible reutilizar `create` + `publish` para no bifurcar reglas de validación del catálogo.

### 5.3 Idempotencia y anti-duplicados

Propuesta de contrato mínimo (implementación futura):

1. Marcador estable por Automatización, p. ej. `seedKey: "growth.startup.next_action_on_opportunity"` + `tenantId`.
2. `ensure*`: si ya existe documento con ese `seedKey` en el Espacio → **no crear otra**.
3. Si el cliente la **renombró / editó / desactivó** → respetar; `ensure*` no la recrea ni la re-activa.
4. Condición `nextAction absent` evita pisar una próxima acción ya definida por otra automation o por un humano en carrera rara.
5. Runtime ya procesa candidatas en secuencia por evento; la condición reduce doble set.

Alternativa aceptable sin campo nuevo: índice lógico por nombre canónico de plataforma — **peor** (el cliente puede renombrar). Preferir `seedKey`.

Índice sugerido (futuro): unique parcial `{ tenantId, seedKey }` donde `seedKey` exista.

### 5.4 Versión / activación / edición

| Aspecto | Comportamiento |
| --- | --- |
| Estado inicial | `active` + versión `published` (no dejar en draft) |
| Edición | Flujo actual: draft → publish (ADR-011 / AUTOMATION-002) |
| Desactivar | `setGrowthAutomationActive(false)` → capturas nuevas dejan de recibir nextAction (elección consciente) |
| Listado Automatizaciones | Aparece como cualquier otra; nombre humano (p. ej. «Primera acción al crear oportunidad») |
| Historial runs | Runtime + OT-007 ya proyectan «Qué ha pasado» |

### 5.5 Copy de la acción (multi-negocio)

- Summary V1: **«Contactar a la persona»** (neutro; no asume cursos, eventos ni admisión).
- `kind: contact`.
- Sin tokens/templates en V1 (el catálogo hoy solo admite summary estático).
- El nombre («María González») ya vive en la tarjeta de Inicio vía Persona; no hace falta interpolar para cerrar H1.
- Experiencia esperada del brief («Contactar a María») se cumple en lectura: **displayName + summary neutro**; personalización del summary queda en edición de la Automatización o evolución futura de templates.

Fuera de alcance de esta decisión: templates `{firstName}` en acciones (evolución del catálogo, no bloqueante).

### 5.6 Actividad generada

1. `opportunity_opened` (ingest) → evento trigger.
2. `next_action_set` con `actorUserId = growth-automation` → visible en Actividad / Inicio «Qué ha pasado».
3. Run de Automatización (recorder OT-007) → coherente con Automatizaciones.

### 5.7 Qué no hacer

- No segundo runner.
- No `if (tenantId === 'sem')`.
- No hardcode en Inicio.
- No seed SEM-only en `provision` nominativo.
- No dejar el playbook en `draft` (no ejecutaría).

---

## 6. Experiencia esperada (Espacio nuevo)

### 6.1 Día 1 (sin configurar Automatizaciones)

1. Visitante envía formulario V1 (o Admisión).
2. Growth crea Persona + Oportunidad.
3. Playbook de arranque setea próxima acción.
4. Operador abre **Inicio** y ve atención del estilo:

| Campo UI | Fuente |
| --- | --- |
| Nombre | `persona.displayName` (p. ej. María González) |
| Qué hacer | `oportunidad.nextAction.summary` («Contactar a la persona») |
| Situación | proyección tipo/estado (p. ej. consulta / nueva oportunidad) |

5. En **Ventas / ficha**: misma `nextAction`; puede **Registrar contacto**, **cambiar** próxima acción (`salesSetNextAction`), **completar/limpiar** (`salesClearNextAction`).

### 6.2 Después (opcional)

Abrir Automatizaciones → ver/editar/desactivar el playbook → publicar nueva versión (p. ej. summary distinto, condición por origen/campaña).

---

## 7. Ciclo de vida del nextAction (hoy vs propuesto)

### 7.1 Comportamiento actual (auditoría)

| Evento | ¿Qué pasa con `nextAction`? |
| --- | --- |
| Crear Oportunidad | `null` |
| `setGrowthNextAction` / automation / Ventas | Se escribe / reemplaza; Actividad `next_action_set` |
| `clearGrowthNextAction` | `null`; Actividad «Próxima acción cerrada» |
| Transición `won` / `lost` / `handed_off` / `archived` | **No se limpia** (`transition-opportunity.ts` hace spread de `existing` y no toca el campo) |
| `pickPrimaryNextAction` | Prioriza no finales; si **solo** hay finales con nextAction, **aún puede mostrar** una acción de opp cerrada |
| Inicio | Filtra por label ≠ «No hay nada pendiente…» → riesgo de atención obsoleta si no se limpió |

### 7.2 Propuesta de cierre de ciclo (alcance de la futura implementación B)

| Momento | Comportamiento deseado |
| --- | --- |
| Cambia | Nuevo `set` reemplaza (ya existe) |
| Completa | Operador limpia vía Ventas / automation `salesClearNextAction` (ya existe) |
| Reemplaza | Idem set (ya existe) |
| `won` / `lost` / `handed_off` / `archive` | **Limpiar** `nextAction` en la misma transición (vía `clearGrowthNextAction` o clear embebido + Actividad), para no dejar basura en Inicio |
| Lectura Inicio/Personas | Defensa en profundidad: `pickPrimaryNextAction` **ignora** oportunidades en estado final aunque conserven dato legacy |

Esto no es un segundo motor: es higiene del campo embebido ADR-010 alineada con estados finales del Workflow.

---

## 8. Impacto por superficie

| Superficie | Con B |
| --- | --- |
| Inicio | «Qué hacer ahora» y métrica `porAtender` se llenan tras captación |
| Ventas | Lista/ficha con nextAction real operable |
| Personas | Misma proyección primaria |
| Actividad | Hechos reales (opened + next_action_set automation) |
| Automatizaciones | Aparece playbook; runs visibles |
| Analytics | Sin cambio de modelo; no depende de nextAction hoy; no inventa métricas |
| WhatsApp | **Fuera de alcance** (sigue sin crear Oportunidad; H2) |

---

## 9. Multi-tenant

| Requisito | Cumplimiento B |
| --- | --- |
| Reutilizable todos los Espacios | Mismo `seedKey` / definición plantilla |
| Configurable después | Editar/desactivar por Espacio |
| Sin if SEM/ADL | Copy y trigger genéricos |
| Tenant-scoped | `tenantId` obligatorio en automation (ADR-011) |
| Distintos negocios | Summary editable; condición ampliable por typeKey/origen |

---

## 10. No hacer (confirmado)

- Segundo motor de tareas / agenda / CRM  
- Nuevo Automation Runtime  
- Reglas por cliente en código  
- Config técnica visible en Inicio  
- Acciones ficticias solo en proyección (opción C)  
- Hardcode permanente en `openGrowthOpportunity` como política de producto (opción A)  
- Abrir otra OT automáticamente desde este documento  

---

## 11. Alcance sugerido de la futura implementación (no abierta aquí)

1. `ensureGrowthStartupNextActionAutomation(tenantId)` idempotente + enganche en creación de Espacio + backfill existentes.  
2. Marcador `seedKey` (o equivalente) en modelo automation + índice unique parcial.  
3. Seed vía `createGrowthAutomation` + `publishGrowthAutomation` (o escritura equivalente al mismo contrato).  
4. Tests: seed idempotente · tenant isolation · Form/Admisión → nextAction → Inicio projection · desactivar → no set · clear en final.  
5. Higiene ciclo de vida: clear en estados finales + filtro lectura (§7.2).  
6. Copy humano del nombre de la Automatización en listado (sin jerga de eventos); **no** reutilizar el create-default SEM-leaning del editor.

**Contrato formal (CONTRACT) e IMPLEMENT** quedan para OTs posteriores si el proceso del repo lo exige; esta auditoría ya elige **B** con detalle suficiente para implementar sin ambigüedad de motor.

---

## 12. Veredicto

# APTO PARA IMPLEMENTAR — OPCIÓN B

**Decisión:** Automatización de arranque por Espacio (`GrowthOpportunityOpened` → condición `nextAction` absent → `salesSetNextAction`), sembrada de forma idempotente, active por defecto, editable/desactivable, sobre el Automation Runtime y sales-ops existentes.

**No** hardcodear en captura. **No** inventar sugerencias no persistidas.

Con B + higiene de clear en estados finales, el bloqueo E2E **H1** queda conceptualmente cerrado: captación produce un «Qué hacer ahora» real sin segundo motor y sin configuración previa del cliente.
