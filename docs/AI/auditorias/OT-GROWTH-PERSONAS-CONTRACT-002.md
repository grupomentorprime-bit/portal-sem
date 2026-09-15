# OT-GROWTH-PERSONAS-CONTRACT-002 — Contrato funcional congelado Personas V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-PERSONAS-CONTRACT-002 |
| Tipo | Contrato funcional (sin implementación) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-12 |
| Entrada | [OT-GROWTH-PERSONAS-AUDIT-001](./OT-GROWTH-PERSONAS-AUDIT-001.md) · [ADR-010](../../architecture/ADR-010.md) · [OT-GROWTH-CORE-007](../../validation/OT-GROWTH-CORE-007/README.md) |
| Estado | **CERRADA · APTO** |
| Alcance | Congelar el contrato definitivo de Personas V1 como endurecimiento de CORE-007 |
| Fuera de alcance | Código de producto · rediseño visual · datos · migraciones · producción · segundo CRM · segundo motor de identidad · abrir OT de implementación |

**Restricciones cumplidas:** sin implementar; sin modificar CORE-007; sin tocar datos ni producción; sin abrir otra OT automáticamente; multi-tenant obligatorio en todo el contrato.

---

## Gate final

**APTO**

Personas V1 queda congelada como **endurecimiento** de la superficie comercial ya existente sobre `growth_personas` (CORE-007). No es un módulo nuevo, no es otro CRM y no introduce otro modelo Persona ni otro motor de identidad.

El contrato resuelve las decisiones de producto que la auditoría dejó abiertas (permisos `growth.people.*`, filtro de origen resoluble, conversaciones read-only, creación manual vía `upsertGrowthPersona`, humanización WhatsApp, acceso cruzado fail-safe, paginación/índices). La implementación siguiente no debe inventar alcance; solo aplicar este documento.

---

## 1. Alcance congelado

### 1.1 Principio

Persona responde:

| Pregunta | Respuesta en Personas V1 |
| --- | --- |
| ¿Quién es? | Nombre + contacto principal |
| ¿De dónde llegó? | Primer origen humanizado (`Persona.origin`) |
| ¿Qué quiere? | Oportunidades ligadas (asunto / tipo / estado) |
| ¿Qué está pasando? | Actividad «Qué ha pasado» |
| ¿Qué necesita atención? | Proyección `pickPrimaryNextAction` sobre sus Oportunidades |

### 1.2 Fronteras (no negociables)

| Persona ≠ | Dueño real |
| --- | --- |
| Oportunidad | Ventas / `growth_oportunidades` |
| Conversación | Mensajes / `growth_conversaciones` + `growth_mensajes` |
| Usuario Identity | `identity_users` |
| Alumno / expediente | Aprende Hoy |

### 1.3 SSOT y relaciones

```text
SSOT: growth_personas

Persona
├── 0..N Oportunidades     (growth_oportunidades.personaId + tenantId)
├── 0..N Conversaciones    (growth_conversaciones.personaId + tenantId)
├── 0..N Actividades       (growth_actividades.personaId + tenantId)
└── primer origen          (Persona.origin — inmutable)
```

No duplicar ninguno de estos motores.

### 1.4 Personas V1 = A + B + C + D

| Bloque | Qué incluye |
| --- | --- |
| **A** | Listado existente endurecido: búsqueda actual + filtro origen + permisos Growth |
| **B** | Ficha existente endurecida: conversaciones read-only + humanización WhatsApp + relaciones |
| **C** | Crear Persona: wrapper seguro sobre `upsertGrowthPersona` + dedupe + `origin.manual` + actor + tenant |
| **D** | Operaciones relacionadas: reutilizar Ventas, Mensajes y Actividad (sin reimplementar) |

**Nada más.**

---

## 2. Rutas

### 2.1 Congeladas (ya existen)

| Ruta | Uso |
| --- | --- |
| `/admin/personas` | Listado |
| `/admin/personas/[id]` | Ficha |

### 2.2 Prohibidas

No crear rutas paralelas:

- `/admin/contactos`
- `/admin/clientes`
- `/admin/leads`
- `/admin/crm/personas`

Personas sigue siendo la superficie comercial. `content_people` (`/admin/content/people`) permanece fuera: es Autoridades editoriales, no Personas Growth.

---

## 3. Listado Personas V1

### 3.1 Capacidades obligatorias

| Capacidad | Contrato |
| --- | --- |
| Buscar por nombre | Sí (`displayName`) |
| Buscar por email | Sí (display + normalizado en query; UI muestra solo display) |
| Buscar por teléfono | Sí (display + normalizado en query; UI muestra solo display) |
| Mostrar nombre | Sí |
| Mostrar contacto principal | Sí (email y/o teléfono) |
| Mostrar de dónde llegó | Sí (label humanizado del **primer origen**) |
| Mostrar cantidad/resumen de oportunidades | Sí |
| Mostrar si necesita atención | Sí (label derivado de `pickPrimaryNextAction`) |
| Ordenar por actividad/actualización reciente | Sí (`updatedAt` desc — proxy existente) |
| Filtro por origen | Sí — ver §5 |

### 3.2 Filtros de Oportunidad existentes

Se **mantienen** los filtros actuales por tipo/estado de Oportunidad cuando aportan valor operativo (encontrar personas con cierta intención o estado).

Regla de producto:

- Útiles para acotar «quién tiene una oportunidad en X».
- **No** convierten el listado en tablero de Ventas.
- Copy y UX deben hablar de Personas, no de pipeline.

### 3.3 Fuera del listado V1

- Segmentador avanzado
- Tablero kanban / pipeline
- Filtros operativos de estado Persona (`merged` / `archived`) — ver §4.2
- Filtro por campaña como atributo permanente de Persona
- Asunción UI de que «siempre caben todas» en una página (ver §18)

---

## 4. Estado Persona (lectura solamente)

### 4.1 Catálogo técnico existente

`GrowthPersonaStatus = "active" | "merged" | "archived"`

| Estado | Writers de producción hoy | UI V1 |
| --- | --- | --- |
| `active` | Único al insertar vía upsert | Compatible en lectura |
| `merged` | Ninguno | Lectura compatible; listado sigue excluyendo `merged` |
| `archived` | Ninguno | Lectura compatible; **sin** filtro operativo ni botones |

### 4.2 Prohibido en V1

- Botón Archivar
- Botón Fusionar / merge
- Restauración
- Campo inventado `mergedInto` / `survivorId`
- Filtros que hagan creer que archive/merge están disponibles

Compatibilidad: el tipo y las lecturas existentes no se rompen; simplemente no se opera estado Persona en V1.

---

## 5. Origen

### 5.1 Semántica

`Persona.origin` = **primer origen** (inmutable tras el alta).

`Opportunity.origin` = origen de **esa** intención; puede diferir del primer origen de la Persona.

### 5.2 Modelo real (no inventar kinds)

`GrowthOriginKind`:

| Técnico | Label humano base |
| --- | --- |
| `admission` | Admisión |
| `form` | Formulario |
| `event` | Evento |
| `manual` | Registro manual |
| `unknown` | Sin origen claro |

Campos crudos **nunca** en UI: `origin.kind`, `origin.channel`, `formId`, `campaign` / `trackingKey`, `sourceCollection`, `sourceId`.

### 5.3 Filtro por origen V1 (resoluble)

Solo valores que el modelo puede resolver hoy. Un filtro activo a la vez (además de «Todos»).

| Token UI | Criterio técnico (tenant-scoped) |
| --- | --- |
| **Todos** | Sin filtro de origen |
| **WhatsApp** | `origin.channel` identifica WhatsApp (canal canónico `whatsapp`) |
| **Formulario** | `origin.kind === "form"` |
| **Admisión** | `origin.kind === "admission"` |
| **Registro manual** | `origin.kind === "manual"` |
| **Evento** | `origin.kind === "event"` |
| **Portal web** | `origin.channel === "portal-admision"` (label real del humanizer; equivale al ejemplo «Sitio web» del brief) |
| **Sin origen claro** | `origin.kind === "unknown"` **y** el canal **no** es un canal humano conocido (p. ej. no `whatsapp`, no `portal-admision`) |

**Reglas:**

1. WhatsApp y Portal web filtran por **canal**, no inventan un `GrowthOriginKind`.
2. No hardcodear categorías sin mapeo a `kind` o `channel` real.
3. No filtrar por `formId`, `campaign` ni `sourceCollection` en el listado Personas V1.

### 5.4 Humanización WhatsApp (presentación, no SSOT)

Evidencia auditada: inbound WhatsApp persiste `kind: "unknown"` + `channel: "whatsapp"`.

| Antes (típico) | Contrato V1 |
| --- | --- |
| «Sin origen claro / WhatsApp» | **«WhatsApp»** |

Regla congelada:

> Si el canal identifica claramente WhatsApp, la presentación prioriza el canal humano conocido y **no** antepone «Sin origen claro».

Esto es humanización de labels. **No** cambia el documento persistido ni el enum de kinds.

La misma disciplina aplica a otros canales ya mapeados (p. ej. `portal-admision` → «Portal web») sin alterar el SSOT.

### 5.5 Campañas y origen

| Afirmación | Contrato |
| --- | --- |
| Persona «pertenece» a una campaña | **No** |
| `Persona.origin.campaign` | Dato opcional del **primer** origen |
| `Opportunity.origin.campaign` | Campaña de esa intención |
| Mostrar campaña como atributo permanente de Persona | Solo si viene del primer origen; no proyectar campañas solo presentes en Oportunidades |
| Listas materializadas Persona↔Campaña | **Fuera de V1** |

---

## 6. Ficha Persona V1

### 6.1 Contenido congelado

Mantener y endurecer:

| Bloque | Rol |
| --- | --- |
| Datos principales | Quién es + contacto |
| De dónde llegó | Primer origen humanizado + fecha de captura |
| Qué hacer ahora | Proyección (ver §7) |
| Oportunidades | 0..N resumen + deep-link |
| Conversaciones | Proyección read-only (ver §8) — **nuevo en endurecimiento** |
| Qué ha pasado | Timeline Actividad (ver §9) |

### 6.2 Orden conceptual recomendado

```text
PERSONA
  ↓
Qué necesita atención
  ↓
Oportunidades
  ↓
Conversaciones
  ↓
Qué ha pasado
```

El diseño visual final corresponde al AGENTE 1. Esta OT congela **contenido y comportamiento**, no layout.

### 6.3 Acciones mutadoras

La ficha **no** reimplementa Sales Ops ni inbox.

| Necesidad | Contrato |
| --- | --- |
| Entender oportunidades | Resumen en ficha |
| Operar (nota, contacto, estado, nextAction, handoff) | Deep-link / reutilizar `/admin/ventas/[id]` + APIs existentes |
| Responder mensajes | Deep-link a Mensajes |

---

## 7. Qué hacer ahora

### 7.1 Decisión congelada

**NO** crear `persona.nextAction`.

`nextAction` pertenece **exclusivamente** a Oportunidad.

### 7.2 Proyección

```text
PersonaAttention =
  pickPrimaryNextAction(oportunidades de la Persona)
  // prioridad existente: no finales → dueAt más cercano → setAt más reciente
```

UI de ficha: sección **«Qué hacer ahora»** (o equivalente humano ya usado) como proyección.

- Si hay atención primaria: mostrarla (y las nextAction por oportunidad en cada tarjeta).
- Si no hay ninguna:

> «No hay nada pendiente por ahora.»

(o el equivalente humano ya estabilizado, p. ej. alineado a `GROWTH_NO_NEXT_ACTION_LABEL` / copy de ficha — sin inventar un segundo campo persistido).

### 7.3 Persistencia

Nunca persistir una segunda próxima acción en Persona.

---

## 8. Oportunidades

### 8.1 Cardinalidad

Persona → **0, 1 o N** Oportunidades.

Personas **no** reemplaza Ventas.

### 8.2 Desde la ficha se puede

- Entender las oportunidades (tipo, estado, asunto, origen de la oportunidad).
- Ver su próxima acción.
- Abrir una oportunidad (focus en ficha `?oportunidad=` y/o `/admin/ventas/[id]`).

### 8.3 No reimplementar

| Operación | Motor a reutilizar |
| --- | --- |
| Guardar nota | Sales Ops existente |
| Registrar contacto | Sales Ops existente |
| Cambiar estado | Sales Ops / transiciones |
| Handoff | Sales Ops / handoff existente |
| Definir / limpiar nextAction | Sales Ops existente |

Si se necesita operar: deep-link o reutilización directa del motor — nunca un segundo composer de ventas dentro de Personas.

### 8.4 Señal Aprende Hoy

Si una Oportunidad está `handed_off` (u homólogo humano del workflow), la ficha **puede** mostrar una señal humana de traspaso.

| Permitido | Prohibido |
| --- | --- |
| «Traspasada» / equivalente | Cargar expediente académico |
| Enlace a la Oportunidad en Ventas | Duplicar estados académicos |
| | Modificar Aprende Hoy |

---

## 9. Conversaciones

### 9.1 Inclusión V1

**Incluidas** en Personas V1 como proyección **READ-ONLY**.

Mensajes sigue siendo dueño de:

- `growth_conversaciones`
- `growth_mensajes`
- inbox
- respuesta
- canales

### 9.2 Qué muestra la ficha

Por conversación (o resumen de la más reciente), filtrado `tenantId + personaId`:

| Campo | Contrato |
| --- | --- |
| Canal | Label humano |
| Última conversación / hilo | Identidad humana mínima |
| Fecha del último mensaje | `lastMessageAt` (u homólogo existente) |
| Preview corto del último mensaje | Texto corto; sin payloads técnicos |
| Estado útil | Si existe en el modelo de conversación |

### 9.3 CTA

> «Abrir en Mensajes»

(o equivalente simple). Sujeto a permisos cruzados (§13).

### 9.4 Prohibido

- Mini inbox
- Caja para responder
- Segundo composer
- Segunda conversación creada desde Personas
- Segundo historial de mensajes

Toda lectura: **`tenantId` + `personaId`**.

---

## 10. Actividad («Qué ha pasado»)

### 10.1 Reutilizar

- Colección: `growth_actividades`
- Proyección existente por `personaId` (hasta el límite de lectura ya usado en ficha)

**NO** crear otro timeline.

### 10.2 Presentación

Puede alinearse la humanización con Actividad V1 / `humanizeHomeActivityStory` (presentación).

### 10.3 No mostrar

- `identity_conflict` (ya oculto; mantener)
- Payloads técnicos
- Event IDs
- Metadata interna (`ingestKey`, hashes, etc.)

---

## 11. Crear Persona

### 11.1 Inclusión V1

**Incluida.** Capa delgada sobre `upsertGrowthPersona`.

**NO** implementar otro create engine ni `insertOne` directo desde API.

### 11.2 Flujo conceptual

```text
Personas
  → Crear persona
  → Nombre
  → Email y/o teléfono
  → Crear
```

### 11.3 Campos V1 (mínimos, solo existentes en SSOT)

| Campo UI | Persistencia | Obligatorio |
| --- | --- | --- |
| Nombre | `displayName` (y/o first/last si el flujo los deriva) | Sí (identidad humana) |
| Email | `email` → normalizado en Core | Al menos email **o** teléfono |
| Teléfono | `phone` → normalizado en Core | Al menos email **o** teléfono |

**No agregar** en V1: empresa, cargo, RUT, dirección, tags, notas, custom fields.

### 11.4 Reglas Core

- Debe existir al menos email o teléfono **normalizable** (misma regla de `upsertGrowthPersona`).
- `origin.kind = "manual"` (y canal/source acordes al origen manual existente).
- Actor: usuario autenticado de la sesión (`actorUserId` en la capa admin cuando se registre auditoría/actividad; el upsert de Persona ya existente no se reemplaza).
- Tenant: **Espacio activo** de la sesión — nunca otro.

### 11.5 Permiso

Requiere `growth.people.manage` (ver §12).

---

## 12. Dedupe en creación manual

### 12.1 Motor único

Toda creación manual **debe** pasar por `upsertGrowthPersona`.

Nunca:

- `insertOne` directo desde API admin
- Lógica de dedupe duplicada en la ruta HTTP

### 12.2 Resultados conceptuales → UX humana

Mapeo al resultado real del motor (`created` / `matched` / `identity_conflict` / errores de validación):

| Resultado Core | Presentación humana | Comportamiento |
| --- | --- | --- |
| **CREATED** (`ok` + `outcome: "created"`) | «Persona creada.» | Abrir / navegar a la ficha nueva |
| **MATCHED** (`ok` + `outcome: "matched"`) | «Esta persona ya estaba registrada.» | Abrir la Persona existente (mismo Espacio) |
| **CONFLICT** (`ok: false`, `reason: "identity_conflict"`) | «Encontramos datos que podrían pertenecer a personas distintas.» | **No** fusionar automáticamente; no exponer IDs técnicos; orientar a revisar contactos / soporte operativo sin UI de merge |
| Validación (`missing_identity`, etc.) | «Necesitamos un correo o un teléfono válido.» (o equivalente) | Quedarse en el formulario |

### 12.3 Privacidad en dedupe

- **NO** exponer IDs técnicos (`emailPersonaId`, `phonePersonaId`, `_id` como contenido).
- **NO** implementar merge.
- El conflicto puede registrar Actividad `identity_conflict` en Core (como hoy); la UI de Personas **no** muestra ese kind.

---

## 13. Permisos

### 13.1 Códigos propios (congelados)

| Código | Copy | Autoriza |
| --- | --- | --- |
| `growth.people.view` | Ver Personas del Espacio | Listado, ficha, lectura de relaciones **permitidas** en proyección |
| `growth.people.manage` | Gestionar Personas | Creación manual + futuras operaciones Persona **expresamente** autorizadas |

`manage` implica capacidad de ver en plantillas de rol (mismo patrón que `growth.campaigns.*` / `growth.automations.*`).

### 13.2 Prohibido como dueño de Personas

| No usar | Motivo |
| --- | --- |
| `cms.pages.read` / `cms.pages.*` | Legado de menú; no es permiso comercial Growth |
| `experience.forms.*` | Forms ≠ Personas |
| `settings.team` | Equipo ≠ Personas |
| Permisos Identity (`identity.*`) | Identity ≠ Personas |
| Solo `growth.sales.*` como dueño del módulo | Ventas opera Oportunidades; Personas es superficie propia |

Nav «Personas» y páginas `/admin/personas*`: exigir `growth.people.view` (o `manage`).

### 13.3 Roles iniciales (sin inventar roles nuevos)

Evaluación sobre roles reales existentes:

| Rol | `growth.people.view` | `growth.people.manage` | Motivo |
| --- | --- | --- | --- |
| `SUPER_ADMIN` | Sí | Sí | Techo total |
| `INSTITUTION_ADMIN` | Sí | Sí | Opera Growth comercial hoy (`sales` / `campaigns` / …) |
| `SUPPORT` | Sí | Sí | Misma audiencia comercial operativa |
| `ADMISSIONS` | Sí | Sí | Audiencia comercial / admisión ya con `growth.sales.*` |

Otros roles (`STUDENT_AFFAIRS`, `COMMUNICATIONS`, `REVIEWER`, `GUEST`, `TEACHER`, `FINANCE`, `STUDENT`): **sin** Personas por defecto, salvo override explícito posterior — coherente con que hoy no reciben `growth.sales.*` / campañas.

La OT de implementación registra los códigos en catálogo Identity + plantillas; este contrato congela **quién** y **qué**.

---

## 14. Acceso cruzado (fail-safe)

### 14.1 Principio

> Ver una Persona **no** salta permisos de módulos más sensibles.

`growth.people.view` autoriza la superficie Personas y proyecciones de lectura **dentro** de la ficha. Los CTA operativos hacia otros módulos requieren el permiso de ese módulo.

### 14.2 Matriz congelada

Hoy Ventas / Mensajes / Actividad se gobiernan con `growth.sales.view` / `growth.sales.read` (legacy) y `growth.sales.operate`.

| Capacidad en ficha Personas | Requisito adicional |
| --- | --- |
| Resumen de oportunidades (read projection) | Cubierto por `growth.people.view` |
| Deep-link / CTA «Abrir en Ventas» / operar opp | `growth.sales.view` **o** `growth.sales.read` **o** `growth.sales.operate` |
| Operar opp (si alguna vez se embebe acción) | `growth.sales.operate` |
| Resumen de conversaciones (read projection) | Cubierto por `growth.people.view` |
| CTA «Abrir en Mensajes» | Mismo permiso que abre Mensajes hoy (`growth.sales.view` / `read` / `operate`) |
| Resumen «Qué ha pasado» en ficha | Cubierto por `growth.people.view` |
| CTA a feed global `/admin/actividad` | Mismo permiso que abre Actividad hoy |

### 14.3 Comportamiento fail-safe

| Situación | Comportamiento |
| --- | --- |
| Tiene `people.view`, no tiene Ventas | Muestra resumen permitido de oportunidades; **oculta** CTAs que terminarían en 403 |
| Tiene `people.view`, no tiene Mensajes | Muestra proyección read-only si se puede servir en Personas; **oculta** CTA «Abrir en Mensajes» |
| Sin `people.view` | Sin nav, sin listado, sin ficha (403 / redirect de auth del Espacio) |
| `people.manage` sin `people.view` en mapa crudo | Plantillas deben otorgar view con manage; guards: manage implica acceso de lectura a la superficie |

Nunca ofrecer un CTA operativo que el permiso del usuario no pueda completar.

---

## 15. Handoff Aprende Hoy

### 15.1 Frontera

| Capa | Responsabilidad |
| --- | --- |
| Growth OS | Captación / pre-admisión |
| Aprende Hoy | Postulación formal / admisión / matrícula / académico |

### 15.2 En Personas V1

- Señal humana si una Oportunidad fue traspasada (`handed_off` / actividad `handoff`).
- **NO** cargar expediente académico.
- **NO** duplicar estados académicos.
- **NO** modificar Aprende Hoy.

---

## 16. Multi-tenant

### 16.1 Obligatorio

Todas las lecturas y escrituras usan `tenantId` del **Espacio activo** de la sesión.

Incluye:

- Persona
- Oportunidades
- Conversaciones / Mensajes
- Actividad
- Creación manual
- Dedupe / identity resolution

### 16.2 Invariantes

| Regla | Contrato |
| --- | --- |
| Nunca resolver Persona entre Espacios | Obligatorio |
| SEM ≠ ADL | Obligatorio |
| Joins Persona↔Opp↔Mensaje↔Actividad | Mismo `tenantId` |
| Sin hardcodes por tenant | Obligatorio |
| Persona inexistente vs otro tenant | Indistinguible hacia el cliente (ver §17) |

---

## 17. Privacidad

### 17.1 Nunca mostrar en UI

- `tenantId`
- `emailNormalized` / `phoneNormalized`
- `sourceCollection` / `sourceId`
- `identityUserId`
- `eventId` / `ingestKey`
- Hashes / tokens / secretos
- Payload de `identity_conflict`
- IDs Mongo como **contenido visible** (OK opacos en URL de ruta)

### 17.2 PII

Email y teléfono son datos personales: mostrar solo a usuarios autorizados (`growth.people.view` / `manage` en el Espacio activo).

---

## 18. Estados de UI (comportamiento funcional)

Lenguaje humano. Sin errores técnicos ni stack traces.

| Estado | Comportamiento / copy conceptual |
| --- | --- |
| Listado sin Personas | Vacío verdadero: p. ej. «Aún no hay Personas» + descripción de captación; CTA Crear si `manage` |
| Filtros sin coincidencias | «No encontramos Personas» (o equivalente ya usado) |
| Persona sin oportunidades | Sección vacía humana («Todavía no hay oportunidades») — no error |
| Persona sin conversaciones | Sección vacía humana — no mini inbox |
| Persona sin actividad | «Aún no hay actividad» / equivalente |
| Persona sin próxima acción | «No hay nada pendiente por ahora.» |
| Error recuperable | «No pudimos cargar…» + reintentar; sin detalle técnico |
| Persona inexistente | No encontrada — mismo patrón seguro que «no existe» |
| Persona de otro tenant | **Misma respuesta** que inexistente: no filtrar existencia entre Espacios |

---

## 19. Paginación e índices

### 19.1 Paginación V1

| Decisión | Valor |
| --- | --- |
| Cursor pagination | **No** es bloqueo de V1 |
| Comportamiento actual | `limit` 1–200 (default 100) aceptable |
| UI | **No** diseñar como si siempre existieran &lt; 100/200 Personas; copy/estructura deben tolerar «hay más de las mostradas» |
| Extensión futura | Cursor (`updatedAt` + `_id`) documentada; no construir infra prematura |

### 19.2 Índices

**NO** agregar índices por costumbre en la OT de implementación salvo evidencia.

| Índice | Decisión contrato |
| --- | --- |
| Existentes (`tenantId+emailNormalized`, `tenantId+phoneNormalized`, `tenantId+updatedAt`, `tenantId+createdAt`) | Mantener |
| Filtro origen V1 | Para volumen V1 típico, **no** exigir índice nuevo |
| Si el filtro origen se vuelve hot-path | Propuesta mínima tenant-scoped: `tenantId + origin.kind + updatedAt` y, si WhatsApp/Portal web pesan, `tenantId + origin.channel + updatedAt` |
| Text search | Fuera de V1 |

**No implementar índices en esta OT de contrato.**

---

## 20. Fuera de Personas V1

Queda expresamente fuera:

- Merge de Personas / UI de fusión
- Archivar / restaurar Persona
- Tags / scoring IA / listas estáticas / segmentador avanzado
- Custom fields / importación masiva
- Newsletter / marketing masivo / CDP
- Expediente académico
- Mini inbox / segundo timeline / segundo CRM
- `persona.nextAction`
- Atribución multi-touch / motor UTM
- Edición avanzada de identidad (aliases, forzar canales, etc.)
- Búsqueda global cross-tenant
- Rutas alternativas de «contactos/leads/clientes»
- Writers de `merged` / `archived`

---

## 21. Contrato de implementación siguiente

Inventario congelado para una OT futura ( **no** se abre aquí):

### 21.1 Debe hacer

1. Registrar `growth.people.view` / `growth.people.manage` en catálogo + registry + plantillas de rol (§13.3).
2. Nav y pages Personas: exigir permisos Growth (retirar dependencia CMS/Experience/settings).
3. Extender read-model de listado con filtro de origen (§5.3) sin inventar kinds.
4. Endurecer humanización WhatsApp (§5.4).
5. Bloque Conversaciones read-only en ficha (§9) + CTA condicionado (§14).
6. API/UI Crear Persona: wrapper de `upsertGrowthPersona` con `origin.manual`, actor, tenant, UX de CREATED/MATCHED/CONFLICT (§11–§12).
7. Fail-safe de CTAs cruzados Ventas/Mensajes/Actividad (§14).
8. Empty/error states humanos (§18); UI de listado sin asumir volumen total en una página (§19.1).

### 21.2 No debe hacer

- Nuevo modelo / colección / CRM paralelo
- Cambiar CORE-007 de identidad (salvo presentación y capa admin delgada)
- Merge / archive
- Cursor pagination u índices «por si acaso» sin evidencia
- Embebido de Sales Ops o composer de Mensajes
- Abrir Aprende Hoy ni expediente

### 21.3 Agentes

| Agente | Responsabilidad |
| --- | --- |
| AGENTE 1 | Diseño / composición visual de listado, ficha, crear, empty states |
| AGENTE 2 / implementación | Cumplir este contrato funcional sin reabrir producto |

### 21.4 Criterio de cierre de Personas V1 (futuro)

Personas V1 se considerará cerrada solo cuando una OT de implementación (y su validación) demuestren A+B+C+D de §1.4 bajo este contrato. **Esta OT no cierra Personas V1.**

---

## Checklist de congelado

| # | Entrega | Estado |
| --- | --- | --- |
| 1 | Alcance congelado | Congelado §1 |
| 2 | Rutas | Congeladas §2 |
| 3 | Listado | Congelado §3 |
| 4 | Ficha | Congelada §6 |
| 5 | Origen + filtro + WhatsApp | Congelado §5 |
| 6 | Oportunidades | Congeladas §8 |
| 7 | Qué hacer ahora | Congelado §7 |
| 8 | Conversaciones | Congeladas §9 |
| 9 | Actividad | Congelada §10 |
| 10 | Crear Persona | Congelado §11 |
| 11 | Dedupe UX | Congelado §12 |
| 12 | Permisos | Congelados §13 |
| 13 | Acceso cruzado | Congelado §14 |
| 14 | Handoff Aprende Hoy | Congelado §15 |
| 15 | Multi-tenant | Congelado §16 |
| 16 | Privacidad | Congelada §17 |
| 17 | Estados vacíos/error | Congelados §18 |
| 18 | Índices / paginación | Congelados §19 |
| 19 | Fuera de V1 | Explicitado §20 |
| 20 | Contrato de implementación siguiente | Congelado §21 |

---

## Veredicto

**CERRADA · APTO**

Personas V1 queda definida como endurecimiento de CORE-007: listado + ficha + conversaciones read-only + crear manual seguro + permisos Growth propios. El contrato es implementable sin decisiones de producto nuevas. **No implementar en esta OT. No modificar CORE-007. No abrir otra OT automáticamente. No cerrar Personas V1 todavía.**
