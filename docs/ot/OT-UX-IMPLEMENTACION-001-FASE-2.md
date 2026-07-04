# OT-UX-IMPLEMENTACION-001 — Entrega Fase 2 (AEK v1)

| Atributo | Valor |
| --- | --- |
| Fase | 2 — Experience Kit Administrativo |
| Fecha | 2026-07-03 |
| Catálogo | `/admin/aek` |

---

## Entregables

| # | Entregable | Ubicación |
| ---: | --- | --- |
| 1 | AEK implementado | `src/components/admin/kit/` |
| 2 | API pública | `src/components/admin/kit/index.ts` |
| 3 | Catálogo navegable | `src/app/admin/aek/page.tsx` |
| 4 | Guía de uso | `src/components/admin/kit/README.md` |
| 5 | Shell V2 integrado | Navegación migrada a `kit/navigation/` |
| 6 | Toast en shell | `ToastProvider` en `AdminShellV2` |

---

## Componentes obligatorios — estado

| Grupo | Componentes | Estado |
| --- | --- | ---: |
| Navegación | AdminSidebar, AdminTopBar, Breadcrumbs, ModuleHeader | ✅ |
| Dashboard | KpiCard, MetricCard, SummaryCard, ProgressCard, ActivityCard | ✅ |
| Layout | Section, Workspace, RightPanel, ContentGrid, EmptyState, LoadingState | ✅ |
| Tablas | AdminDataTable, ColumnActions, BulkActions, Pagination, SortHeader | ✅ |
| Formularios | FormSection, FieldGroup, InlineActions, ValidationSummary | ✅ |
| Búsqueda | SearchBar, GlobalSearch, QuickFilter | ✅ |
| Filtros | FilterBar, FilterChip, SavedFilters | ✅ |
| Estados | StatusBadge, ProgressBadge, AlertBanner, Toast, Timeline | ✅ |
| Overlays | Dialog, ConfirmDialog, Drawer, SidePanel | ✅ |
| Acciones | QuickActions, FloatingActions, ActionMenu | ✅ |

---

## Compatibilidad Shell V2

- `AdminTopBarV2` → re-export `kit/navigation/AdminTopBar`
- `AdminSidebarV2` → re-export `kit/navigation/AdminSidebar`
- `AdminBreadcrumbV2` → re-export `kit/navigation/AdminBreadcrumb`
- `ModuleHeader`, `Workspace`, `RightPanel` → re-export kit
- Flag `ADMIN_SHELL_V2` sin cambios

---

## Legacy candidatos Fase 3

Ver tabla en `src/components/admin/kit/README.md`.

---

## Verificación

```bash
npx tsc --noEmit
npx next build
```

- [ ] `/admin/aek` renderiza catálogo completo
- [ ] V1 sin flag — sin regresión
- [ ] V2 con flag — sidebar incluye «Catálogo AEK» (settings.team)

---

## Riesgos Fase 3

| Riesgo | Mitigación |
| --- | --- |
| Doble header al migrar módulos | Sustituir `AdminModuleHero` por `ModuleHeader` |
| Tablas con lógica embebida | Extraer solo presentación a `AdminDataTable` |
| Confirmaciones nativas | Reemplazar `window.confirm` por `ConfirmDialog` |
