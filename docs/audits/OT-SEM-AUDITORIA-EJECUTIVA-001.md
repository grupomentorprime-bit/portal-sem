# OT-SEM-AUDITORIA-EJECUTIVA-001 — Auditoría Ejecutiva del Portal Administrativo SEM

| Atributo | Valor |
| --- | --- |
| Código | OT-SEM-AUDITORIA-EJECUTIVA-001 |
| Estado | **Completada** |
| Prioridad | Crítica |
| Tipo | Auditoría Ejecutiva |
| Fecha | 2026-07-03 |
| Restricción | **Cero código** — solo análisis, medición y propuesta |
| Referencias | [OT-UX-BLUEPRINT-001](./OT-UX-BLUEPRINT-001.md) · [OT-UX-PROTOTIPO-001](./OT-UX-PROTOTIPO-001.md) · [AEK-MIGRATION](../aek/AEK-MIGRATION.md) |

---

## Declaración de cumplimiento

| Criterio | Estado |
| --- | --- |
| No se modificó código fuente | ✅ |
| Evaluación basada en código real (34 rutas, 157+ componentes admin) | ✅ |
| Matriz por los 10 módulos del alcance | ✅ |
| Inventario de componentes legacy | ✅ |
| Comparación vs pantalla modelo (Asuntos Estudiantiles) | ✅ |
| Roadmap por impacto de usuario | ✅ |
| Dashboard ejecutivo con porcentajes | ✅ |

**Evidencia:** inspección estática de `src/app/admin/**`, `src/components/admin/**`, `src/components/content/**`, grep de primitivos legacy, revisión de `AEK-MIGRATION.md` y prototipo aprobado `docs/prototypes/ot-ux-prototipo-001/index.html`.

---

# Dashboard Ejecutivo

```
Portal Administrativo SEM — Modernización Visual General

███████████████░░░░░  67%

Portal ...................... 100%
Comunicaciones .............. 100%
Asuntos estudiantiles ....... 100%  ← Golden Standard AEK
Personas .................... 82%
Programas y cursos ............ 78%
Administración .............. 22%
Institución ................. 18%
Inicio ...................... 15%
Medios ...................... 12%
Centro de admisión .......... 10%
```

| Métrica | Valor |
| --- | --- |
| **Modernización global** | **67 %** |
| Pantallas admin inventariadas | 34 `page.tsx` |
| Pantallas con `AdminModulePage` (AEK) | 17 componentes / ~23 rutas efectivas |
| Dominios AEK completados (oficial) | 4 de 7 (Portal, Comunicaciones, Personas, Asuntos estudiantiles) |
| Shell V2 implementado en código | ✅ Sí |
| Shell V2 activo en `.env` local | ❌ No (`ADMIN_SHELL_V2` ausente → V1 por defecto) |

> **Nota metodológica:** El porcentaje global es el promedio ponderado por número de pantallas por módulo, evaluando 12 criterios visuales (ver §Metodología). KPI AEK-MIGRATION: **57 %** (4 de 7 dominios al 100 %). Actualizado post OT-UX-MIG-STUDENT-AFFAIRS-001.

---

# 1. Resumen Ejecutivo

El Portal Administrativo SEM se encuentra en una **fase intermedia de modernización**. La infraestructura objetivo (Shell V2, Sidebar, TopBar, Experience Kit Administrativo) está **implementada y operativa bajo feature flag**, y **tres dominios editoriales están completamente migrados**: Portal (listados), Comunicaciones y Personas.

Sin embargo, **siete de diez módulos del alcance** conservan capa visual legacy (`AdminModuleHero`, `AdminModuleStats`, layouts propios). El módulo referencia **Asuntos Estudiantiles** tiene la UX operativa más madura del sistema, pero aún **no usa componentes AEK** — representa el estándar visual aprobado en prototipo, no la implementación técnica final.

**Riesgo principal:** Con `ADMIN_SHELL_V2=true`, los módulos legacy muestran **triple encabezado** (TopBar + breadcrumb shell + `AdminModuleHero`), degradando la experiencia justo cuando se activa el shell moderno.

**Recomendación inmediata:** Priorizar migración de **Inicio** y **Administración (Usuarios)** — alto tráfico diario — seguido de **Asuntos Estudiantiles** (swap AEK sin rediseño funcional) y **Centro de Admisión**.

---

# 2. Metodología

## 2.1 Criterios de cumplimiento visual (12 ítems)

Por pantalla se evalúa presencia y calidad de:

| # | Criterio | Componente objetivo |
| ---: | --- | --- |
| 1 | Shell V2 | `AdminShellV2` |
| 2 | Sidebar | `AdminSidebarV2` |
| 3 | TopBar | `AdminTopBarV2` |
| 4 | ModuleHeader | `ModuleHeader` / `AdminModulePage` |
| 5 | KPIs | `KpiCard` + `ContentGrid` |
| 6 | Buscador | `SearchBar` / búsqueda en `FilterBar` |
| 7 | Acciones rápidas | `QuickActions` |
| 8 | FilterBar | `FilterBar` |
| 9 | Tablas AEK | `AdminDataTable` |
| 10 | Panel lateral | `RightPanel` / `SidePanel` / sidebar AEK |
| 11 | Responsive | overflow-x, breakpoints verificados en código |
| 12 | Consistencia visual | sin heroes duplicados, badges unificados |

**Escala por ítem:** ✅ = 100 % · ⚠️ = 50 % · ❌ = 0 %

**Porcentaje módulo** = promedio de ítems × peso por pantalla dentro del módulo.

## 2.2 Estados

| Estado | Definición |
| --- | --- |
| **No iniciado** | 100 % legacy, sin AEK |
| **En progreso** | Shell V2 disponible pero página sin migrar |
| **Parcialmente modernizado** | Algunos criterios AEK, UX heterogénea |
| **Modernizado** | ≥ 80 % criterios, `AdminModulePage` en pantallas principales |
| **Finalizado** | 100 % criterios, sin legacy detectable |

## 2.3 Pantalla modelo

Referencia: **Asuntos Estudiantiles** según prototipo aprobado (`docs/prototypes/ot-ux-prototipo-001/index.html` §s-asuntos, §s-asistencia) y blueprint §7.6.

---

# 3. Matriz de Estado por Módulo

## 3.1 Inicio (`/admin`)

| Atributo | Valor |
| --- | --- |
| **Estado** | No iniciado |
| **Cumplimiento** | **15 %** |
| **Archivo principal** | `AdminDashboardClient.tsx` |
| **Layout** | `AdminPageFrame` → `AdminModuleLayout` (legacy) |

| Criterio | Estado | Notas |
| --- | --- | --- |
| Shell V2 / Sidebar / TopBar | ⚠️ | Solo si `ADMIN_SHELL_V2=true` |
| ModuleHeader | ❌ | `AdminModuleHero` + H2 "Bienvenido de vuelta" (triple título) |
| KPIs | ⚠️ | `AdminModuleStats` (legacy), no `KpiCard` |
| Buscador | ❌ | — |
| Acciones rápidas | ⚠️ | `AdminQuickActions` legacy |
| FilterBar | ❌ | — |
| Tablas AEK | ❌ | `AuditTimeline` custom |
| Panel lateral | ❌ | — |
| Responsive | ⚠️ | Grid básico |
| Consistencia | ❌ | Patrón más antiguo del portal |

**Deuda visual:** Primera pantalla que ven todos los roles; no refleja el nuevo shell.

---

## 3.2 Institución (`/admin/config`)

| Atributo | Valor |
| --- | --- |
| **Estado** | No iniciado |
| **Cumplimiento** | **18 %** |
| **Archivo principal** | `ConfigurationLayout.tsx` |

| Criterio | Estado | Notas |
| --- | --- | --- |
| ModuleHeader | ❌ | `AdminModuleLayout` + `AdminModuleHero` duplicado |
| KPIs | ❌ | — |
| FilterBar / Tablas | ❌ | Formulario por secciones |
| Panel lateral | ⚠️ | Sidebar secciones custom (`adminUi.sidebarNav`), no AEK |
| Consistencia | ❌ | Triple capa documentada en Blueprint §Delta |

**Deuda visual:** Sidebar propio compite visualmente con Sidebar V2 global.

---

## 3.3 Portal

| Atributo | Valor |
| --- | --- |
| **Estado** | **Finalizado** (listados) / Custom (editores) |
| **Cumplimiento** | **100 %** (dominio gestión) |
| **Rutas** | 7 pantallas |

| Ruta | Componente | AEK | % |
| --- | --- | --- | ---: |
| `/admin/pages` | `PageListClient` | ✅ | 100 |
| `/admin/pages/[id]` | `PageEditorClient` | ⏳ Studio | N/A* |
| `/admin/menus` | `MenuListClient` | ✅ | 100 |
| `/admin/menus/[id]` | `MenuEditorClient` | ✅ | 100 |
| `/admin/portal/forms` | `FormsCenterClient` | ✅ | 100 |
| `/admin/portal/forms/[id]` | `FormDetailClient` | ✅ | 100 |
| `/admin/portal/forms/convocatorias/[slug]` | `ConvocatoriaAdminPanel` | ✅ | 100 |

\*Editor visual usa shell propio del builder — excluido del KPI por diseño (`AEK-MIGRATION.md`).

**Cumple estándar:** `AdminModulePage`, `KpiCard`, `FilterBar`, `AdminDataTable`, `QuickActions`, `useConfirmDialog`, `StatusBadge`.

**Pendiente menor:** `PageListClient` usa `useInputDialog` ✅; `TemplateSelector.tsx` aún tiene `confirm()` nativo (1 ocurrencia).

---

## 3.4 Programas y cursos (`/admin/content/programs`)

| Atributo | Valor |
| --- | --- |
| **Estado** | Modernizado |
| **Cumplimiento** | **78 %** |
| **Archivo principal** | `ContentListClient.tsx` + `ContentEditorClient.tsx` |

| Criterio | Estado | Notas |
| --- | --- | --- |
| ModuleHeader – Tablas – FilterBar – KPIs | ✅ | Patrón Comunicaciones |
| Acciones rápidas | ❌ | Sin hub dedicado de Programas |
| Consistencia nav | ⚠️ | Nav "Programas" apunta a sub-ruta de Comunicaciones |
| Código huérfano | ❌ | `ProgramsHubClient.tsx` + CSS sin ruta — confusión |

**Deuda visual:** Falta hub propio "Programas y cursos" con `QuickActions` como en prototipo; funcionalidad de listado/editor sí está modernizada.

---

## 3.5 Centro de admisión (`/admin/portal/admission`)

| Atributo | Valor |
| --- | --- |
| **Estado** | No iniciado |
| **Cumplimiento** | **10 %** |
| **Archivo principal** | `AdmissionCmsClient.tsx` |

| Criterio | Estado | Notas |
| --- | --- | --- |
| ModuleHeader | ❌ | `AdminModuleHero` + `AdminModuleStats` |
| Panel lateral / Preview | ⚠️ | Split 45/55 con iframe — alineado al blueprint pero legacy |
| FilterBar / Tablas | ❌ | Acordeón + sortable custom |
| KPIs | ⚠️ | Stats legacy estáticos |

**Deuda visual:** Segundo módulo de mayor complejidad visual; layout split es único en el portal.

---

## 3.6 Asuntos estudiantiles (`/admin/portal/asuntos-estudiantiles/*`)

| Atributo | Valor |
| --- | --- |
| **Estado** | **Finalizado** — Golden Standard AEK |
| **Cumplimiento** | **100 %** |
| **OT** | OT-UX-MIG-STUDENT-AFFAIRS-001 (2026-07-03) |
| **Rutas** | 3 pantallas |

| Ruta | Componente | AEK |
| --- | --- | ---: |
| Home | `StudentAffairsHomeClient` | ✅ |
| Equipo | `StudentAffairsTeamClient` | ✅ |
| Ops `[formId]` | `StudentAffairsOperationsPanel` | ✅ |

**Referencia técnica oficial** para nuevos módulos del portal. Ver `docs/aek/AEK-MIGRATION.md` §Asuntos estudiantiles.

---

## 3.7 Comunicaciones (`/admin/content/*`)

| Atributo | Valor |
| --- | --- |
| **Estado** | **Finalizado** |
| **Cumplimiento** | **100 %** |
| **Rutas** | 12+ pantallas (hub + 9 secciones + editores) |

**Archivos migrados:** `ContentHubClient`, `ContentListClient`, `ContentEditorClient`, `CategoryEditorClient`.

**Cumple:** Hub con `QuickActions` + `KpiCard`, listados con `FilterBar` + `AdminDataTable`, editores con `FormSection` + `ValidationSummary`, confirmaciones AEK.

---

## 3.8 Personas (`/admin/content/people`)

| Atributo | Valor |
| --- | --- |
| **Estado** | Modernizado |
| **Cumplimiento** | **82 %** |
| **Archivos** | `PeopleListClient`, `PersonEditorClient` |

| Criterio | Estado | Notas |
| --- | --- | --- |
| ModuleHeader – FilterBar – KPIs | ✅ | AEK completo |
| Tablas | ✅ | `AdminDataTable` (desviación vs blueprint card grid) |
| Layout personas | ⚠️ | Blueprint pide grid retrato; implementación usa tabla con avatar |

**Deuda visual:** Funcional y consistente con Comunicaciones; diverge del layout card del prototipo §s-personas.

---

## 3.9 Medios (`/admin/media`)

| Atributo | Valor |
| --- | --- |
| **Estado** | No iniciado |
| **Cumplimiento** | **12 %** |
| **Archivos** | `MediaLibraryClient.tsx`, `MediaListTable.tsx` |

| Criterio | Estado | Notas |
| --- | --- | --- |
| ModuleHeader / KPIs | ❌ | `AdminModuleHero` + `AdminModuleStats` |
| FilterBar | ❌ | — |
| Tablas | ❌ | `<table>` raw en `MediaListTable.tsx` |
| Grid masonry | ⚠️ | Parcial via `MediaManager` |
| Panel lateral asset | ❌ | Sin `RightPanel` |

---

## 3.10 Administración

| Atributo | Valor |
| --- | --- |
| **Estado** | No iniciado |
| **Cumplimiento** | **22 %** |
| **Rutas** | 10 pantallas |

| Ruta | Componente | Legacy detectado | % |
| --- | --- | --- | ---: |
| `/admin/settings/users` | `UsuariosCmsClient` | Hero, Stats, chips filtro | 25 |
| `/admin/settings/roles` | `RolesPermissionsClient` | Hero, matriz `<table>` | 20 |
| `/admin/settings/profile` | `ProfileProfessionalClient` | Hero, Stats | 25 |
| `/admin/settings/security` | `SecuritySettingsClient` | Hero, Stats | 25 |
| `/admin/settings/activity` | `ActivityClient` | Hero, Stats | 25 |
| `/admin/settings/integrations` | `StorageIntegrationsClient` | Hero, Stats | 25 |
| `/admin/settings/notifications` | placeholder | Hero | 15 |
| `/admin/settings/help` | estático | Hero | 15 |
| `/admin/workflows` | `WorkflowAdminClient` | SystemPanel, `<table>` | 20 |
| `/admin/events` | `EventsAdminClient` | SystemPanel, `<table>` | 20 |

**Deuda visual:** `/admin/settings/users` es la pantalla más crítica — uso diario por admins; prototipo §s-administracion ya define el target.

---

# 4. Componentes Legacy Pendientes

## 4.1 Inventario por primitivo

| Primitivo legacy | Ocurrencias | Archivos afectados | Reemplazo AEK |
| --- | ---: | --- | --- |
| `AdminModuleHero` | 11 | Dashboard, Config, Admission, Media, Users, Roles, Profile, Security, Activity, Integrations, Help, Notifications, Workflows | `ModuleHeader` |
| `AdminModuleStats` | 8 | Dashboard, Admission, Media, Users, Profile, Security, Activity, Integrations | `KpiCard` |
| `StatusPill` (local) | 2 | `AdminStatusBadges.tsx`, `StudentAffairsOperationsPanel.tsx` | `StatusBadge` |
| `AdminModuleLayout` (directo) | 8 | Dashboard, Config, Admission, Media, Student Affairs ×3, SystemPanel | `AdminModulePage` |
| `AdminPageFrame` | 6+ | Inicio, settings sub-pages | `AdminModulePage` |
| `AdminQuickActions` | 2 | Dashboard, Media | `QuickActions` |
| `AdminModuleSectionHeader` | 3 | Dashboard, Media, Users | `Section` |

## 4.2 Diálogos nativos

| API | Ocurrencias reales | Ubicación |
| --- | ---: | --- |
| `window.confirm` | **0** | Eliminado en dominios migrados ✅ |
| `confirm()` nativo | **1** | `TemplateSelector.tsx` L24 |
| `prompt()` / `useInputDialog` | 2 | `PageListClient` (AEK ✅), `ProgramsHubClient` (huérfano, `window.alert` L310) |
| `alert()` | **1** | `ProgramsHubClient.tsx` (sin ruta) |

## 4.3 Tablas HTML sin AdminDataTable

| Archivo | Contexto |
| --- | --- |
| `StudentAffairsOperationsPanel.tsx` | Tabla operativa asistencia |
| `MediaListTable.tsx` | Biblioteca medios |
| `PermissionMatrixEditor.tsx` | Matriz permisos roles |
| `WorkflowAdminClient.tsx` | Cola workflows |
| `EventsAdminClient.tsx` | Event bus técnico |
| `TeamSettingsClient.tsx` | Settings identidad (fuera admin principal) |

## 4.4 Buscadores y filtros propios

| Módulo | Implementación actual | Target |
| --- | --- | --- |
| Usuarios CMS | Chips `CMS_USER_GROUPS` | `FilterBar` |
| Asuntos estudiantiles ops | Selects asistencia/generación | `FilterBar` |
| Roles | Sin búsqueda | `FilterBar` + `SearchBar` |
| Medios | Búsqueda en `MediaManager` | `FilterBar` unificado |
| Admisión | Navegación acordeón | Mantener + `ModuleHeader` |

## 4.5 CSS legacy activo

| Hoja | Módulo |
| --- | --- |
| `student-affairs-ops.css` | Asuntos estudiantiles |
| `admin-module-center.css` | Heroes/stats globales |
| `admin-programs-hub.css` | Código huérfano |

---

# 5. Comparación vs Pantalla Modelo (Asuntos Estudiantiles)

Referencia prototipo: `docs/prototypes/ot-ux-prototipo-001/index.html`

## 5.1 Home Asuntos — Gap analysis

| Elemento modelo | Prototipo | Estado actual | Gap |
| --- | --- | --- | --- |
| Breadcrumb | `Estudiantes › Asuntos estudiantiles` | ✅ `AdminModuleLayout` | Migrar a breadcrumb V2 |
| ModuleHeader | H1 + descripción + CTA | ✅ Equivalente | Swap a `ModuleHeader` |
| KPIs (3) | Convocatorias / Pendientes / Operadores | ❌ Ausente | **Agregar `KpiCard`** |
| Cards convocatorias | Grid 3 col con métricas | ✅ Grid cards | Alinear estilo AEK |
| Card equipo | Acceso permisos | ✅ Botón header | OK |

## 5.2 Ops Asistencia — Gap analysis

| Elemento modelo | Prototipo | Estado actual | Gap |
| --- | --- | --- | --- |
| ModuleHeader | Título convocatoria + Exportar/Guardar | ✅ En page.tsx | `AdminModulePage` |
| FilterBar | Buscar + Asistencia + Generación | ⚠️ Custom | **Migrar a `FilterBar`** |
| DataTable | 4 columnas + badges | ⚠️ Tabla custom rica | **Migrar a `AdminDataTable`** o extraer `ExperienceFormSubmissionsTable` |
| StatusBadge | Presente/Ausente/Revisar | ⚠️ `StatusPill` local | `StatusBadge` |
| Acciones fila | Inline | ✅ Check-in, delete | OK |

## 5.3 Comparación otros módulos vs modelo

| Módulo | Elementos modelo presentes | Faltantes principales |
| --- | --- | --- |
| **Portal** | ✅ Todos | — |
| **Comunicaciones** | ✅ Todos | — |
| **Personas** | Header, Filter, Tabla | Card grid retrato |
| **Inicio** | Parcial (cards) | KPIs AEK, sin triple título |
| **Admisión** | Split preview | ModuleHeader, sin Hero duplicado |
| **Medios** | — | FilterBar, grid, panel lateral |
| **Administración** | — | Todo el stack AEK |
| **Institución** | Sidebar secciones | ModuleHeader, eliminar Hero |

---

# 6. Ranking de Prioridades (por impacto usuario)

Orden recomendado — **no** por complejidad técnica:

| Prioridad | Módulo | Impacto | Justificación |
| ---: | --- | --- | --- |
| **P0** | Inicio | 🔴 Crítico | Primera pantalla de todos los roles; percepción global del rediseño |
| **P0** | Administración › Usuarios | 🔴 Crítico | Gestión diaria de accesos; alta frecuencia super_admin |
| **P1** | Asuntos estudiantiles | 🟠 Alto | Rol dedicado (`isStudentAffairsOnlyUser`); UX casi lista — migración AEK rápida |
| **P1** | Centro de admisión | 🟠 Alto | Segundo módulo Portal; visible para marketing/admisión |
| **P2** | Medios | 🟡 Medio | Compartido entre comunicaciones y portal |
| **P2** | Institución | 🟡 Medio | Baja frecuencia pero alta visibilidad (branding) |
| **P3** | Administración › resto | 🟢 Bajo-Medio | Perfil, seguridad, actividad — uso individual |
| **P3** | Workflows / Events | 🟢 Bajo | Dominio técnico, usuarios restringidos |
| **P4** | Programas hub dedicado | 🟢 Bajo | Listado ya migrado; hub es mejora nav |

---

# 7. Roadmap Propuesto

## Fase A — Quick wins alto impacto (2–3 semanas)

| OT sugerida | Alcance | Resultado esperado |
| --- | --- | --- |
| **OT-UX-MIG-HOME-001** | `AdminDashboardClient` → AEK | Inicio 15 % → 85 % |
| **OT-UX-MIG-ADMIN-USERS-001** | `UsuariosCmsClient` → AEK | Admin 22 % → 45 % |
| **OT-UX-FLAG-SHELL-001** | Activar `ADMIN_SHELL_V2=true` en staging | Validar sin triple header en migrados |

## Fase B — Módulos operativos (3–4 semanas)

| OT sugerida | Alcance | Resultado esperado |
| --- | --- | --- |
| **OT-UX-MIG-STUDENT-AFFAIRS-001** | 3 pantallas → `AdminModulePage` + `FilterBar` + `AdminDataTable` | Asuntos 88 % → 100 % |
| **OT-UX-MIG-ADMISSION-001** | `AdmissionCmsClient` header + stats | Admisión 10 % → 60 % |
| **OT-UX-MIG-MEDIA-001** | `MediaLibraryClient` completo | Medios 12 % → 80 % |

## Fase C — Institucional y admin secundario (2–3 semanas)

| OT sugerida | Alcance |
| --- | --- |
| **OT-UX-MIG-CONFIG-001** | `ConfigurationLayout` → AEK sidebar |
| **OT-UX-MIG-ADMIN-SETTINGS-001** | Profile, Security, Activity, Integrations |
| **OT-UX-MIG-ROLES-001** | Roles + `PermissionMatrixEditor` wrapper AEK |

## Fase D — Cierre y deuda (1–2 semanas)

| OT sugerida | Alcance |
| --- | --- |
| **OT-UX-CLEANUP-LEGACY-001** | Eliminar `ProgramsHubClient`, CSS huérfano, `AdminModuleCenter` |
| **OT-UX-FIX-NATIVE-DIALOGS-001** | `TemplateSelector` confirm nativo |
| **OT-UX-SHELL-V2-DEFAULT-001** | V2 default ON; retirar V1 |

**Meta post-roadmap:** Modernización global **≥ 90 %**

---

# 8. Recomendaciones Ejecutivas

1. **Activar Shell V2 en staging ya.** El código está listo; la validación visual bloqueada por flag impide medir el impacto real.

2. **No iniciar módulos ERP nuevos** hasta completar Fase A–B. Cada módulo legacy añadido sin AEK aumenta deuda.

3. **Asuntos Estudiantiles: migración, no rediseño.** Reutilizar `ExperienceFormSubmissionsTable` (Portal forms) — evidencia en `OT-UX-MIG-PORTAL-001.md`.

4. **Eliminar código huérfano** (`ProgramsHubClient`) para evitar confusión del equipo sobre estado de Programas.

5. **Unificar Personas** a card grid en OT separada de baja prioridad — funcionalmente ya cumple.

6. **KPI de seguimiento:** usar matriz de 12 criterios por pantalla, no solo "dominio completado".

---

# 9. Proyección de Modernización

```
Hoy (2026-07-03)          ██████████████░░░░░░  66%
Post Fase A               █████████████████░░░  78%
Post Fase B               ██████████████████░░  88%
Post Fase C-D             ███████████████████░  94%
```

---

# 10. Anexo — Mapa de rutas y layouts

| Módulo | Rutas | Layout dominante |
| --- | ---: | --- |
| Inicio | 1 | Legacy |
| Institución | 1 | Legacy |
| Portal | 7 | AEK (6) + Studio (1) |
| Programas | 3 | AEK |
| Admisión | 1 | Legacy |
| Asuntos estudiantiles | 3 | Legacy (UX madura) |
| Comunicaciones | 12+ | AEK |
| Personas | 3 | AEK |
| Medios | 1 | Legacy |
| Administración | 10 | Legacy |

**Feature flag:** `src/lib/admin/feature-flags.ts` — `ADMIN_SHELL_V2` no presente en `.env` local (default V1).

**Puente V1/V2:** `src/components/admin/kit/layout/AdminModulePage.tsx`

---

*Informe generado sin modificación de código fuente. Para implementación, autorizar OTs de la §7.*
