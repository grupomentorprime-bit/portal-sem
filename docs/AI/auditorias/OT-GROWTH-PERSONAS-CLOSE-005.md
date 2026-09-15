# OT-GROWTH-PERSONAS-CLOSE-005 — Validación integral y cierre Personas V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-PERSONAS-CLOSE-005 |
| Tipo | Validación / cierre (sin implementación) |
| Agente | VALIDACIÓN / CIERRE |
| Fecha | 2026-09-12 |
| Entrada | [AUDIT-001](./OT-GROWTH-PERSONAS-AUDIT-001.md) · [CONTRACT-002](./OT-GROWTH-PERSONAS-CONTRACT-002.md) · [IMPLEMENT-003](./OT-GROWTH-PERSONAS-IMPLEMENT-003.md) · [UX-004](./OT-GROWTH-UX-PERSONAS-004.md) |
| Estado | **CERRADA · APTO** |
| Alcance | Validar A+B+C+D del contrato + pasada visual; declarar cierre de producto Personas V1 |
| Fuera de alcance | Implementar · rediseñar · refactorizar · tocar datos/producción · `sync:tenant-roles` productivo · abrir otra OT |

**Restricciones cumplidas:** solo revisión de fuentes, código, evidencia y pruebas; sin funciones nuevas; sin cambios de UX; sin sync de roles en producción.

---

## Gate final

# PERSONAS V1 — CERRADA · APTO 🔒

Personas V1 cumple el contrato congelado (AUDIT → CONTRACT → IMPLEMENT → UX). Arquitectura sin duplicación, permisos Growth propios, multi-tenant, listado/ficha/crear operativos, proyección derivada de Oportunidades, conversaciones read-only, privacidad y evidencia visual desktop/mobile. No hay defecto bloqueante de cierre.

Pendiente operativo no bloqueante: `sync:tenant-roles` en despliegue para tenants ya sincronizados. Limitación de evidencia: sin preview real de conversación en tenant `adl` (empty state + tests cubren el read-model).

---

## 1. Fuentes revisadas

| Fuente | Rol | Estado previo |
| --- | --- | --- |
| `OT-GROWTH-PERSONAS-AUDIT-001.md` | Diagnóstico real pre-V1 | CERRADA · APTO CON AJUSTES |
| `OT-GROWTH-PERSONAS-CONTRACT-002.md` | Contrato funcional congelado | CERRADA · APTO |
| `OT-GROWTH-PERSONAS-IMPLEMENT-003.md` | Endurecimiento A+B+C+D | CERRADA · APTO |
| `OT-GROWTH-UX-PERSONAS-004.md` | Refinamiento visual | CERRADA · APTO VISUAL |
| `OT-GROWTH-PERSONAS-IMPLEMENT-003-evidence/` | RESULT.json + test-personas-003.txt | PASS |
| `OT-GROWTH-UX-PERSONAS-004-evidence/` | 8 capturas + RESULT.json | APTO VISUAL |
| Código / tests baseline | Verificación puntual cierre | Reejecutado 2026-09-12 |

---

## 2. Resumen ejecutivo

Personas V1 es un **endurecimiento** de CORE-007 sobre `growth_personas`, no un módulo nuevo:

- **SSOT** `growth_personas` + motor único `upsertGrowthPersona`.
- **Permisos** `growth.people.view` / `growth.people.manage` (SUPER_ADMIN, INSTITUTION_ADMIN, SUPPORT, ADMISSIONS).
- **Listado** con búsqueda, filtro de origen (WhatsApp no cae en «Sin origen claro»), resumen de oportunidades y «Qué hacer ahora».
- **Ficha** en jerarquía: Persona → Qué hacer ahora → Oportunidades → Conversaciones → Qué ha pasado.
- **Crear** vía wrapper admin → `upsertGrowthPersona` (CREATED / MATCHED / CONFLICT / VALIDACIÓN en lenguaje humano).
- **Sin** segundo CRM, inbox, timeline, `persona.nextAction`, ni fuga cross-tenant.

AGENTE 2 dejó A+B+C+D funcionales; AGENTE 1 dejó evidencia visual desktop + mobile. Esta OT confirma ambos y **cierra producto**.

---

## 3. Matriz final A–R

| # | Área | Resultado | Evidencia asociada |
| --- | --- | --- | --- |
| A | Arquitectura | **APTO** | `GrowthPersona` sin `nextAction`; create → `upsertGrowthPersona`; tests AD/AE/AF; sin rutas `/admin/contactos\|leads` |
| B | Permisos | **APTO** | registry/catalog/role-templates/defaults + nav/pages/API; tests IAM A–J |
| C | Multi-tenant | **APTO** | lecturas/escrituras con `tenantId` del Espacio; test AB + aislamiento CORE-007; ficha otro Espacio = inexistente |
| D | Listado | **APTO** | captura `01-desktop-listado`; búsqueda/filtros; UX-004 + personas-ui |
| E | Origen | **APTO** | `personas-origin-filter` + `humanize-origin-display`; tests K–Q + R |
| F | Ficha | **APTO** | capturas `03`/`08`; jerarquía contrato §6; PersonaDetailClient |
| G | Qué hacer ahora | **APTO** | `pickPrimaryNextAction`; `GROWTH_NO_NEXT_ACTION_LABEL`; test AD |
| H | Oportunidades | **APTO** | resumen en ficha; CTAs Ventas condicionados; sin ops de Ventas embebidas |
| I | Conversaciones | **APTO** | `listPersonaConversationViews` READ-ONLY; empty real `04`; test S–U; sin composer |
| J | Actividad | **APTO** | `growth_actividades` + `activitiesVisibleInUi` (oculta `identity_conflict`); sin segundo timeline |
| K | Crear Persona | **APTO** | modal UX + API manage + `personas-create.ts`; captura `05`; tests V–AA/Z |
| L | Dedupe | **APTO** | outcomes Core → copy humano; test Y (sin IDs); AB tenant |
| M | Privacidad | **APTO** | UI sin campos C/D; proyección ActivityView sin eventId/ingestKey/payload; capturas limpias |
| N | Estados | **APTO** | vacío filtros `02`/`06`; conversaciones vacío; no encontrada indistinguible; labels humanos |
| O | UX desktop | **APTO** | capturas 01–06; acta UX-004 revisión humana OK |
| P | UX mobile | **APTO** | capturas 07–08; jerarquía comprensible en 390×844 |
| Q | Pruebas | **APTO** | reejecución 2026-09-12: 37/37 PASS (003 + ui + ux-004) |
| R | Regresiones | **APTO** | documentadas en IMPLEMENT-003 (messaging/activity/sales/shell/master PASS); baseline tsc ajeno no Personas |

---

## 4. Validación funcional

### 4.1 Arquitectura

| Invariante | Confirmación |
| --- | --- |
| SSOT `growth_personas` | Sí — store + pages existentes |
| Motor único `upsertGrowthPersona` | Sí — `personas-create.ts` / API POST |
| Sin segundo CRM / modelo Persona / inbox / timeline | Sí — test AE + inspección UI |
| Sin `persona.nextAction` | Sí — `GrowthPersona` no lo define; proyección desde Opp |
| Dueños: Ventas / Mensajes / Actividad / Aprende Hoy | Intactos — Personas solo resume / proyecta |

### 4.2 Permisos

| Código | Roles iniciales |
| --- | --- |
| `growth.people.view` | SUPER_ADMIN, INSTITUTION_ADMIN, SUPPORT, ADMISSIONS |
| `growth.people.manage` | Mismos |

- Nav y pages: `view` **o** `manage` (manage implica lectura de superficie).
- Crear / API POST: solo `manage`.
- Nav ya no depende de `cms.pages.*` / `experience.forms.*` / `settings.team` / `identity.*`.
- CTAs Ventas/Mensajes/Actividad: flags `canOpenSales` / `canOpenMessages` / `canOpenActivity`.

### 4.3 Listado

Capacidades confirmadas: buscar nombre/correo/teléfono; contacto; origen humanizado; N oportunidades; «Qué hacer ahora»; abrir ficha.

Filtros origen: Todos / WhatsApp / Formulario / Admisión / Registro manual / Evento / Portal web / Sin origen claro.

Regla crítica: `unclear` = `kind=unknown` **y** channel ∉ `{whatsapp, portal-admision}` → WhatsApp **no** cae en «Sin origen claro».

### 4.4 Ficha / Qué hacer ahora / Opp / Conversaciones / Actividad

Jerarquía visual y de copy alineada al contrato. `primaryNextAction` = `pickPrimaryNextAction(oportunidades)`. Sin pendiente: *No hay nada pendiente por ahora.*

Conversaciones: proyección Mensajes, READ-ONLY, CTA condicionado. Actividad: `activitiesVisibleInUi` excluye `identity_conflict`; `toActivityView` no expone metadata técnica.

### 4.5 Crear + dedupe

Flujo: Nombre + Correo y/o teléfono → Crear → `upsertGrowthPersona` con `origin.kind=manual`. Copy humano CREATED / MATCHED / CONFLICT / VALIDACIÓN. Sin `insertOne` admin ni dedupe paralelo.

---

## 5. Validación UX

Revisión de evidencia visual (tenant **adl**, sin inventar conversaciones):

| Captura | Resultado |
| --- | --- |
| `01-desktop-listado.png` | Jerarquía clara; Crear persona; sin IDs técnicos |
| `02-desktop-filtros.png` | Filtro WhatsApp + sin coincidencias + Limpiar |
| `03-desktop-ficha.png` | Historia completa; Qué hacer ahora protagonista |
| `04-desktop-conversaciones.png` | Empty state humano; sin composer/inbox |
| `05-modal-crear.png` | Nombre / Correo / Teléfono; CTA Crear persona |
| `06-estado-vacio.png` | Sin coincidencias por búsqueda |
| `07-mobile-listado.png` | Escaneable en móvil |
| `08-mobile-ficha.png` | Secciones comprensibles en columna |

Consistencia Growth OS / Shell intacto / copy humano: **OK** (UX-004). Sin defecto UX bloqueante detectado en esta validación. **No se modifica UX en esta OT.**

**Limitación de evidencia (no bloquea):** Persona capturada en `adl` sin hilos → no hay preview real de conversación en capturas. Cubierto por read-model + tests S–U + empty state correcto.

---

## 6. Multi-tenant

| Superficie | Aislamiento |
| --- | --- |
| Persona / búsqueda / filtros / ficha | `tenantId` Espacio activo |
| Creación / dedupe | tenant-scoped; SEM ≠ ADL (test AB) |
| Opp / Conversaciones / Actividad | joins con mismo `tenantId` |
| Persona otro Espacio | `getGrowthPersonaDetailView` → null → UI «no encontrada» (indistinguible) |
| Hardcode SEM/ADL en producto | **No** en `personas-read` / create / UI |

Fuga cross-tenant: **no encontrada**.

---

## 7. Seguridad / privacidad

UI e inspecciones de proyección **no** exponen: `tenantId`, normalizados, `sourceCollection`/`sourceId`, `identityUserId`, `eventId`, `ingestKey`, hashes/tokens/secretos, payload `identity_conflict`, Mongo IDs como contenido humano.

Hallazgo de secreto: **ninguno**.

---

## 8. Pruebas / regresiones

### Reejecución cierre (2026-09-12)

```text
npx tsx --test \
  tests/baseline/growth-personas-003.test.ts \
  tests/baseline/growth-personas-ui.test.ts \
  tests/baseline/growth-ux-personas-004.test.ts

→ 37 pass / 0 fail
```

| Suite | Resultado |
| --- | --- |
| `growth-personas-003` (A–AF) | PASS |
| `growth-personas-ui` (CORE-007) | PASS (incluye aislamiento ADL/SEM) |
| `growth-ux-personas-004` | PASS |

### Regresiones documentadas (IMPLEMENT-003)

`growth-messaging-004`, `growth-activity-001`, `growth-sales-001`, `growth-sales-001a`, `growth-os-admin-shell-002a`, `growth-os-admin-master` → PASS en acta de implementación.

### Baseline ajeno (no Personas)

Errores `tsc` globales ya documentados (`actividad-view` props, campaigns fixture, platform-host ObjectId): **ajenos**; no corregidos en esta OT; **no** son regresión Personas.

---

## 9. Evidencia

| Origen | Contenido |
| --- | --- |
| `OT-GROWTH-PERSONAS-IMPLEMENT-003-evidence/` | RESULT.json · test-personas-003.txt |
| `OT-GROWTH-UX-PERSONAS-004-evidence/` | RESULT.json · 01…08 PNG |
| Reejecución cierre | 37/37 PASS (sección 8) |
| Código | `personas-create`, `personas-origin-filter`, `humanize-origin-display`, pages, nav, IAM, `Persona*Client` |

---

## 10. Pendientes operativos

| Ítem | Clasificación | Bloquea cierre? |
| --- | --- | --- |
| `sync:tenant-roles` para tenants ya sincronizados (heredar `growth.people.*`) | **PENDIENTE DE DESPLIEGUE / OPERACIÓN** | **No** — catálogo, templates y tests correctos en código |
| Preview visual de conversación con mensajes reales | Limitación de dato en tenant de captura | **No** — empty + tests cubren comportamiento |
| Vacío absoluto (0 Personas) no capturado en adl | Evidencia parcial (sí hay empty de filtros) | **No** — copy/CTA cubiertos en código + tests |

**No ejecutar** `sync:tenant-roles` sobre producción en esta OT.

---

## 11. Fuera de V1

Confirmado **no incorporado** (deliberado; no son pendientes de cierre):

- merge / archive / restore  
- tags / scoring IA / listas estáticas / segmentación avanzada  
- custom fields / importación masiva / newsletter / CDP  
- expediente académico  
- mini inbox / segundo timeline / segundo CRM  
- `persona.nextAction`  
- atribución multi-touch  
- cursor pagination / índices preventivos  

---

## 12. Veredicto final

| Pregunta | Respuesta |
| --- | --- |
| ¿Cumple contrato congelado A+B+C+D? | Sí |
| ¿Cumple pasada visual UX-004? | Sí |
| ¿Existe defecto bloqueante? | No |
| ¿Solo quedan pendientes operativos / evidencia parcial no bloqueante? | Sí (`sync:tenant-roles`; preview conversación real) |

### PERSONAS V1 — CERRADA · APTO 🔒

No se abre otra OT automáticamente. No se implementa ni se toca producción desde esta validación.
