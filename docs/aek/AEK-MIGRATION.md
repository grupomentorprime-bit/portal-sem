# AEK-MIGRATION — Matriz de migración BackOffice

| OT | OT-UX-MIGRACION-001 / OT-UX-MIG-PORTAL-001 / OT-UX-MIG-COMMS-001 / **OT-UX-MIG-STUDENT-AFFAIRS-001** |
| --- | --- |
| Estado | **Portal, Comunicaciones y Asuntos estudiantiles completados** |
| Feature flag | `ADMIN_SHELL_V2` |
| Última actualización | 2026-07-03 |

---

## KPI global BackOffice

| Dominio | Progreso |
| --- | ---: |
| Portal | 100 % |
| Comunicaciones | 100 % |
| Medios | 0 % |
| Personas *(nav independiente, ruta `/admin/content/people`)* | 100 % |
| Académico | 0 % |
| Admisión | 0 % |
| Asuntos estudiantiles | **100 %** |

**Total migración BackOffice: 57 %** *(4 de 7 dominios completados)*

---

## Migración dominio Portal: **100 %**

| Módulo | Ruta | Estado |
| --- | --- | ---: |
| Páginas (listado) | `/admin/pages` | ✅ |
| Páginas (editor) | `/admin/pages/[id]` | ⏳ Studio* |
| Menús (listado) | `/admin/menus` | ✅ |
| Menús (editor) | `/admin/menus/[id]` | ✅ |
| Formularios (centro) | `/admin/portal/forms` | ✅ |
| Formularios (detalle) | `/admin/portal/forms/[id]` | ✅ |
| Convocatorias | `/admin/portal/forms/convocatorias/[slug]` | ✅ |
| Experience Studio | `/admin/experience-studio` | ⏳ Studio* |

\*Experience Studio (`visual-builder/`) usa shell propio del editor; fuera del alcance de listados administrativos.

---

## Migración dominio Comunicaciones: **100 %**

| Módulo | Ruta | Estado |
| --- | --- | ---: |
| Centro editorial (hub) | `/admin/content` | ✅ |
| Noticias | `/admin/content/news` | ✅ |
| Avisos / Comunicados | `/admin/content/avisos` | ✅ |
| Eventos | `/admin/content/events` | ✅ |
| Biblioteca | `/admin/content/library` | ✅ |
| Agenda académica | `/admin/content/academic-agenda` | ✅ |
| Programas | `/admin/content/programs` | ✅ |
| Personas | `/admin/content/people` | ✅ |
| Testimonios | `/admin/content/testimonials` | ✅ |
| Galería | `/admin/content/gallery` | ✅ |
| Categorías | `/admin/content/categories` | ✅ |
| Editores genéricos | `/admin/content/[section]/edit/[id]` | ✅ |

**Fuera de alcance (explicitamente excluido):**

| Módulo | Motivo |
| --- | --- |
| Experience Studio | Shell propio del editor visual |
| Event Bus (`/admin/events`) | Dominio técnico, no editorial |
| Blog | Sin módulo admin implementado |
| Banners / carruseles | Gestionados vía bloques / Studio |
| Etiquetas (taxonomía) | Sin pantalla admin; campo `tags` en modelo |
| `content_news_categories` | Colección backend sin ruta admin |

---

## Matriz Legacy → AEK

| Legacy | Nuevo AEK | Portal | Comunicaciones |
| --- | --- | ---: | ---: |
| `AdminModuleHero` | `ModuleHeader` / `AdminModulePage` | ✅ | ✅ |
| `AdminModuleStats` | `KpiCard` | ✅ | ✅ |
| `AdminModuleSectionHeader` | `Section` | ✅ | ✅ |
| `AdminQuickActions` | `QuickActions` | ✅ | ✅ |
| `window.confirm` / `confirm()` | `ConfirmDialog` + `useConfirmDialog` | ✅ | ✅ |
| `prompt()` | `InputDialog` + `useInputDialog` | ✅ | — |
| `alert()` | `useToast` | ✅ | — |
| Card lists / grids ad-hoc | `AdminDataTable` + `FilterBar` | ✅ | ✅ |
| Filtros/buscadores propios (chips) | `FilterBar` | ✅ | ✅ |
| Formularios sin estructura | `FormSection` + `ValidationSummary` + `InlineActions` | parcial | ✅ |
| Header de editor custom | `AdminModulePage` | parcial | ✅ |
| `StatusPill` | `StatusBadge` | ✅ | ✅ |

---

## Componentes AEK utilizados (Comunicaciones)

| Componente / Hook | Uso en Comunicaciones |
| --- | --- |
| `AdminModulePage` | Hub, listados, editores |
| `KpiCard` + `ContentGrid` | Dashboard por pantalla (máx. 4 KPIs) |
| `QuickActions` | Hub editorial |
| `Section` | Secciones del hub |
| `FilterBar` | Búsqueda y filtros en listados |
| `AdminDataTable` | Todas las tablas de contenido |
| `StatusBadge` | Estados publicado/borrador/activo |
| `EmptyState` / `LoadingState` | Estados vacío y carga |
| `AlertBanner` | Errores en hub |
| `FormSection` | Editores |
| `ValidationSummary` | Errores de formulario |
| `InlineActions` | Acciones guardar/cancelar/eliminar |
| `useConfirmDialog` | Eliminación de contenido |
| `ColumnActions` | Acciones por fila |

---

## Archivos Comunicaciones migrados

- `src/components/content/ContentHubClient.tsx`
- `src/components/content/ContentListClient.tsx`
- `src/components/content/PeopleListClient.tsx`
- `src/components/content/ContentEditorClient.tsx`
- `src/components/content/PersonEditorClient.tsx`
- `src/components/content/CategoryEditorClient.tsx`
- `src/components/content/content-list-utils.ts` *(utilidades compartidas de listado)*

## Archivos Portal migrados (referencia)

- `src/components/page-builder/PageListClient.tsx`
- `src/components/menu/MenuListClient.tsx`
- `src/components/menu/MenuEditorClient.tsx`
- `src/components/admin/forms/FormsCenterClient.tsx`
- `src/components/admin/forms/FormDetailClient.tsx`
- `src/components/admin/forms/FormSubmissionsPanel.tsx`
- `src/components/admin/forms/ExperienceFormSubmissionsTable.tsx` *(nuevo)*
- `src/components/admin/forms/ConvocatoriaAdminPanel.tsx`
- `src/components/admin/forms/ConvocatoriaRosterPanel.tsx`

---

## Migración dominio Asuntos estudiantiles: **100 %** *(Golden Standard)*

| Módulo | Ruta | Estado |
| --- | --- | ---: |
| Panel home | `/admin/portal/asuntos-estudiantiles` | ✅ |
| Asignar encargadas | `/admin/portal/asuntos-estudiantiles/equipo` | ✅ |
| Registro de asistencia | `/admin/portal/asuntos-estudiantiles/[formId]` | ✅ |

### Componentes AEK utilizados (Asuntos estudiantiles)

| Componente / Hook | Uso |
| --- | --- |
| `AdminModulePage` | Las 3 pantallas del módulo |
| `ModuleHeader` | Vía `AdminModulePage` (Shell V2) |
| `KpiCard` + `ContentGrid` | Home (3 KPIs) + panel ops (5 KPIs en gradiente) |
| `ProgressCard` | Barra de llegada en ops |
| `QuickActions` | Acceso a convocatorias en home |
| `FilterBar` + `SearchBar` | Búsqueda y filtros de asistencia |
| `AdminDataTable` | Tabla operativa con check-in |
| `StatusBadge` | Estados llegada / inasistencia / revisión |
| `Drawer` | Gestión de inasistencias |
| `EmptyState` / `LoadingState` | Estados vacío y carga |
| `AlertBanner` | Errores |
| `Section` | Controles ops y equipo |
| `ColumnActions` | Eliminar registro |
| `useConfirmDialog` | Confirmación de eliminación |

### Legacy eliminado

| Eliminado | Reemplazo |
| --- | --- |
| `AdminModuleLayout` | `AdminModulePage` |
| `AdminModuleHero` | `ModuleHeader` |
| `StatusPill` local | `StatusBadge` |
| `sa-ops__table` + `student-affairs-ops.css` | `AdminDataTable` + tokens Tailwind |
| Filtros chip custom | `FilterBar` + botones AEK |
| Expansión inline inasistencia | `Drawer` + `AbsenceReviewEditor` |

### Archivos migrados

- `src/components/admin/student-affairs/StudentAffairsHomeClient.tsx`
- `src/components/admin/student-affairs/StudentAffairsTeamClient.tsx`
- `src/components/admin/student-affairs/StudentAffairsOperationsPanel.tsx`
- `src/components/admin/student-affairs/StudentAffairsFormPageClient.tsx` *(nuevo)*
- `src/app/admin/portal/asuntos-estudiantiles/[formId]/page.tsx`

### Eliminado

- `src/styles/student-affairs-ops.css`

---

## Lecciones para próximas migraciones

1. **`AdminModulePage`** primero — elimina deuda de doble header con Shell V2.
2. **`content-list-utils.ts`** — extraer helpers de tabla cuando un mismo patrón sirve a N colecciones.
3. **`FilterBar` + botones** — reemplazo estándar de chips/pills custom (Personas grupos).
4. **`useConfirmDialog`** — sustituto obligatorio de `confirm()` en editores.
5. **Editores genéricos** — un solo `ContentEditorClient` con `FormSection` por bloques lógicos evita duplicar 10 editores.
6. **No migrar editores visuales** (Studio, block editor) en la misma OT que listados.
7. **Golden Standard ops** — panel gradiente con `KpiCard` + `ProgressCard` dentro de contenedor Tailwind; tabla check-in con `AdminDataTable` + `Drawer` para revisiones (patrón Asuntos estudiantiles).

---

## Definition of Done

### Portal
- [x] Shell V2 compatible (`AdminModulePage`)
- [x] Solo componentes AEK en capa visual de listados/gestión
- [x] Sin legacy en dominio Portal (listados)
- [x] Misma funcionalidad
- [x] `tsc` OK

### Comunicaciones
- [x] Shell V2 compatible (`AdminModulePage`)
- [x] Solo componentes AEK en capa visual
- [x] Sin `AdminModuleHero`, `AdminModuleStats`, `AdminQuickActions`, `confirm()` nativo
- [x] Tablas migradas a `AdminDataTable`
- [x] KPIs (máx. 4) en hub y listados
- [x] Misma funcionalidad (APIs, permisos, rutas intactos)
- [x] `tsc` OK

### Asuntos estudiantiles
- [x] Shell V2 compatible (`AdminModulePage`)
- [x] Solo componentes AEK en capa visual
- [x] Sin legacy (`AdminModuleLayout`, `sa-ops__*`, `StatusPill`)
- [x] Tabla ops migrada a `AdminDataTable`
- [x] KPIs + barra progreso en panel ops
- [x] Misma funcionalidad (APIs, permisos, check-in intactos)
- [x] Golden Standard oficial del portal
- [x] `tsc` OK
