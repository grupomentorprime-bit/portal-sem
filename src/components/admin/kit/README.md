# AEK v1 — Experience Kit Administrativo

API única del BackOffice AprendeHoy. Importar desde:

```ts
import { KpiCard, AdminDataTable, ConfirmDialog } from "@/components/admin/kit";
```

## Catálogo visual

`/admin/aek` (requiere permiso `settings.team`)

## Principios

- Presentacional: sin fetch, permisos ni lógica de negocio
- Tokens: `aek` + variables CSS `--color-*`
- Multi-tenant: sin branding hardcodeado
- Shell V2: navegación en `kit/navigation/`

## Inventario por carpeta

| Carpeta | Componentes |
| --- | --- |
| `navigation/` | AdminSidebar, AdminTopBar, AdminBreadcrumb, ModuleHeader |
| `layout/` | Section, Workspace, RightPanel, ContentGrid |
| `dashboard/` | KpiCard, MetricCard, SummaryCard, ProgressCard, ActivityCard |
| `tables/` | AdminDataTable, ColumnActions, BulkActions, Pagination, SortHeader |
| `forms/` | FormSection, FieldGroup, InlineActions, ValidationSummary |
| `search/` | SearchBar, GlobalSearch, QuickFilter |
| `filters/` | FilterBar, FilterChip, SavedFilters |
| `states/` | StatusBadge, ProgressBadge, AlertBanner, EmptyState, LoadingState, Timeline, Toast |
| `dialogs/` | Dialog, ConfirmDialog |
| `drawers/` | Drawer, SidePanel |
| `actions/` | QuickActions, FloatingActions, ActionMenu |
| `charts/` | ChartPlaceholder |

## Legacy — reemplazo en Fase 3

| Legacy | AEK |
| --- | --- |
| `AdminModuleHero` | `ModuleHeader` |
| Tablas `<table>` raw ×4 | `AdminDataTable` |
| `window.confirm` ×7 | `ConfirmDialog` |
| `StatusPill` local ×3 | `StatusBadge` |
| `AdminGlobalSearch` | `GlobalSearch` (alias) |
| `admin-ui.ts` clases ad-hoc | tokens `aek` + kit |
