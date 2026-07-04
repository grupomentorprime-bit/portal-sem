/**
 * Experience Kit Administrativo (AEK) v1 — API pública
 * OT-UX-IMPLEMENTACION-001 Fase 2
 */

// Navigation
export { AdminSidebar } from "@/components/admin/kit/navigation/AdminSidebar";
export { AdminTopBar } from "@/components/admin/kit/navigation/AdminTopBar";
export { AdminBreadcrumb, Breadcrumbs } from "@/components/admin/kit/navigation/AdminBreadcrumb";
export { ModuleHeader } from "@/components/admin/kit/navigation/ModuleHeader";

// Layout
export { Section } from "@/components/admin/kit/layout/Section";
export { Workspace } from "@/components/admin/kit/layout/Workspace";
export { RightPanel } from "@/components/admin/kit/layout/RightPanel";
export { ContentGrid } from "@/components/admin/kit/layout/ContentGrid";
export { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
export type { AdminModulePageProps } from "@/components/admin/kit/layout/AdminModulePage";

// Hooks
export { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
export type { ConfirmOptions } from "@/components/admin/kit/hooks/useConfirmDialog";
export { useInputDialog } from "@/components/admin/kit/hooks/useInputDialog";
export type { InputDialogOptions } from "@/components/admin/kit/hooks/useInputDialog";

// Dashboard
export { KpiCard } from "@/components/admin/kit/dashboard/KpiCard";
export { MetricCard } from "@/components/admin/kit/dashboard/MetricCard";
export { SummaryCard } from "@/components/admin/kit/dashboard/SummaryCard";
export { ProgressCard } from "@/components/admin/kit/dashboard/ProgressCard";
export { ActivityCard } from "@/components/admin/kit/dashboard/ActivityCard";

// Tables
export { AdminDataTable } from "@/components/admin/kit/tables/AdminDataTable";
export type { AdminDataTableColumn, AdminDataTableProps } from "@/components/admin/kit/tables/AdminDataTable";
export { ColumnActions } from "@/components/admin/kit/tables/ColumnActions";
export { BulkActions } from "@/components/admin/kit/tables/BulkActions";
export { Pagination } from "@/components/admin/kit/tables/Pagination";
export { SortHeader } from "@/components/admin/kit/tables/SortHeader";

// Forms
export { FormSection } from "@/components/admin/kit/forms/FormSection";
export { FieldGroup } from "@/components/admin/kit/forms/FieldGroup";
export { InlineActions } from "@/components/admin/kit/forms/InlineActions";
export { ValidationSummary } from "@/components/admin/kit/forms/ValidationSummary";

// Search & filters
export { SearchBar } from "@/components/admin/kit/search/SearchBar";
export { GlobalSearch } from "@/components/admin/kit/search/GlobalSearch";
export { QuickFilter } from "@/components/admin/kit/search/QuickFilter";
export { FilterBar } from "@/components/admin/kit/filters/FilterBar";
export { FilterChip } from "@/components/admin/kit/filters/FilterChip";
export { SavedFilters } from "@/components/admin/kit/filters/SavedFilters";

// States
export { StatusBadge } from "@/components/admin/kit/states/StatusBadge";
export { ProgressBadge } from "@/components/admin/kit/states/ProgressBadge";
export { AlertBanner } from "@/components/admin/kit/states/AlertBanner";
export { EmptyState } from "@/components/admin/kit/states/EmptyState";
export { LoadingState } from "@/components/admin/kit/states/LoadingState";
export { Timeline } from "@/components/admin/kit/states/Timeline";
export { ToastProvider, useToast, ToastViewport } from "@/components/admin/kit/states/Toast";

// Dialogs & drawers
export { Dialog } from "@/components/admin/kit/dialogs/Dialog";
export { ConfirmDialog } from "@/components/admin/kit/dialogs/ConfirmDialog";
export { InputDialog } from "@/components/admin/kit/dialogs/InputDialog";
export type { InputDialogField, InputDialogProps } from "@/components/admin/kit/dialogs/InputDialog";
export { Drawer } from "@/components/admin/kit/drawers/Drawer";
export { SidePanel } from "@/components/admin/kit/drawers/SidePanel";

// Actions
export { QuickActions, type QuickActionItem } from "@/components/admin/kit/actions/QuickActions";
export { FloatingActions, FloatingActionButton } from "@/components/admin/kit/actions/FloatingActions";
export { ActionMenu, ActionMenuItem } from "@/components/admin/kit/actions/ActionMenu";

// Charts
export { ChartPlaceholder } from "@/components/admin/kit/charts/ChartPlaceholder";

// Utils
export { aek } from "@/components/admin/kit/utils/tokens";
export type { AdminShellContext, SortState, SortDirection } from "@/components/admin/kit/utils/types";

// Catalog
export { AekCatalog } from "@/components/admin/kit/catalog/AekCatalog";
