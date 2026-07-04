"use client";

import { useState } from "react";
import { FileText, LayoutGrid } from "lucide-react";
import { ActionMenu, ActionMenuItem } from "@/components/admin/kit/actions/ActionMenu";
import { FloatingActionButton, FloatingActions } from "@/components/admin/kit/actions/FloatingActions";
import { QuickActions } from "@/components/admin/kit/actions/QuickActions";
import { ChartPlaceholder } from "@/components/admin/kit/charts/ChartPlaceholder";
import { ActivityCard } from "@/components/admin/kit/dashboard/ActivityCard";
import { KpiCard } from "@/components/admin/kit/dashboard/KpiCard";
import { MetricCard } from "@/components/admin/kit/dashboard/MetricCard";
import { ProgressCard } from "@/components/admin/kit/dashboard/ProgressCard";
import { SummaryCard } from "@/components/admin/kit/dashboard/SummaryCard";
import { ConfirmDialog } from "@/components/admin/kit/dialogs/ConfirmDialog";
import { SidePanel } from "@/components/admin/kit/drawers/SidePanel";
import { FieldGroup } from "@/components/admin/kit/forms/FieldGroup";
import { FormSection } from "@/components/admin/kit/forms/FormSection";
import { InlineActions } from "@/components/admin/kit/forms/InlineActions";
import { ValidationSummary } from "@/components/admin/kit/forms/ValidationSummary";
import { FilterBar } from "@/components/admin/kit/filters/FilterBar";
import { FilterChip } from "@/components/admin/kit/filters/FilterChip";
import { SavedFilters } from "@/components/admin/kit/filters/SavedFilters";
import { ContentGrid } from "@/components/admin/kit/layout/ContentGrid";
import { Section } from "@/components/admin/kit/layout/Section";
import { ModuleHeader } from "@/components/admin/kit/navigation/ModuleHeader";
import { QuickFilter } from "@/components/admin/kit/search/QuickFilter";
import { SearchBar } from "@/components/admin/kit/search/SearchBar";
import { AlertBanner } from "@/components/admin/kit/states/AlertBanner";
import { EmptyState } from "@/components/admin/kit/states/EmptyState";
import { LoadingState } from "@/components/admin/kit/states/LoadingState";
import { ProgressBadge } from "@/components/admin/kit/states/ProgressBadge";
import { StatusBadge } from "@/components/admin/kit/states/StatusBadge";
import { Timeline } from "@/components/admin/kit/states/Timeline";
import { useToast } from "@/components/admin/kit/states/Toast";
import { AdminDataTable } from "@/components/admin/kit/tables/AdminDataTable";
import { ColumnActions } from "@/components/admin/kit/tables/ColumnActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEMO_ROWS = [
  { id: "1", name: "Juan Pérez", status: "active" as const },
  { id: "2", name: "María López", status: "pending" as const },
];

function CatalogToastDemo() {
  const { push } = useToast();
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => push({ title: "Guardado", description: "Cambios aplicados.", tone: "success" })}
    >
      Mostrar toast
    </Button>
  );
}

function KitSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-border pb-10 last:border-0">
      <h2 className="mb-4 text-lg font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function AekCatalog() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState("all");
  const [savedFilter, setSavedFilter] = useState("f1");

  return (
    <div className="space-y-10">
      <ModuleHeader
        title="Experience Kit Administrativo"
        description="Catálogo AEK v1 — AprendeHoy BackOffice. Componentes presentacionales reutilizables."
        actions={
          <Button size="sm" variant="outline" href="/internal/design-system">
            Design System portal
          </Button>
        }
      />

      <nav className="flex flex-wrap gap-2 text-xs">
        {["dashboard", "layout", "tables", "forms", "filters", "states", "actions", "overlays"].map((id) => (
          <a key={id} href={`#${id}`} className="rounded-lg border border-border px-2.5 py-1 font-semibold text-muted hover:text-foreground">
            {id}
          </a>
        ))}
      </nav>

      <KitSection id="dashboard" title="Dashboard">
        <ContentGrid cols={4}>
          <KpiCard label="Publicados" value={24} delta="+2 semana" variant="success" />
          <MetricCard label="Visitas" value={1280} sparkline={[0.2, 0.5, 0.4, 0.8, 0.6, 0.9]} />
          <ProgressCard label="Convocatoria" value={47} max={60} hint="47 de 60 cupos" />
          <SummaryCard title="Ver comunicaciones" description="Hub editorial" href="/admin/content" icon={<FileText className="h-5 w-5" />} />
        </ContentGrid>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ActivityCard items={[
            { id: "1", time: "12:04", label: "Hero actualizado" },
            { id: "2", time: "11:22", label: "Asistencia registrada" },
          ]} />
          <ChartPlaceholder label="Métricas — integración futura" />
        </div>
        <div className="mt-4">
          <QuickActions
            items={[
              { id: "1", title: "Nueva noticia", description: "Comunicaciones", href: "/admin/content/news" },
              { id: "2", title: "Subir medio", description: "Biblioteca", href: "/admin/media" },
            ]}
            cols={2}
          />
        </div>
      </KitSection>

      <KitSection id="layout" title="Layout">
        <Section title="Sección ejemplo" description="Contenedor con título y acciones">
          <ContentGrid cols={3}>
            <div className="rounded-lg border border-border p-4 text-sm text-muted">Celda 1</div>
            <div className="rounded-lg border border-border p-4 text-sm text-muted">Celda 2</div>
            <div className="rounded-lg border border-border p-4 text-sm text-muted">Celda 3</div>
          </ContentGrid>
        </Section>
      </KitSection>

      <KitSection id="tables" title="Tablas">
        <AdminDataTable
          columns={[
            { id: "name", header: "Nombre", cell: (r) => r.name, sortable: true },
            { id: "status", header: "Estado", cell: (r) => <StatusBadge tone={r.status} /> },
          ]}
          data={DEMO_ROWS}
          rowKey={(r) => r.id}
          rowActions={(r) => (
            <ColumnActions>
              <Button size="sm" variant="ghost">Editar {r.name.split(" ")[0]}</Button>
            </ColumnActions>
          )}
          pagination={{ page: 1, totalPages: 3, onPageChange: () => {} }}
        />
      </KitSection>

      <KitSection id="forms" title="Formularios">
        <FormSection title="Datos generales" description="Ejemplo de campos">
          <ValidationSummary errors={["El título es obligatorio"]} />
          <FieldGroup label="Título" required hint="Visible en el portal">
            <Input placeholder="Nombre del recurso" />
          </FieldGroup>
          <InlineActions>
            <Button size="sm">Guardar</Button>
            <Button size="sm" variant="outline">Cancelar</Button>
          </InlineActions>
        </FormSection>
      </KitSection>

      <KitSection id="filters" title="Filtros y búsqueda">
        <FilterBar
          search={{ placeholder: "Buscar…" }}
          filters={<FilterChip label="Activo" onRemove={() => {}} />}
          onReset={() => {}}
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <QuickFilter
            options={[
              { id: "all", label: "Todos" },
              { id: "active", label: "Activos" },
            ]}
            value={quickFilter}
            onChange={setQuickFilter}
          />
          <SavedFilters
            filters={[
              { id: "f1", label: "Mis borradores" },
              { id: "f2", label: "Publicados" },
            ]}
            activeId={savedFilter}
            onSelect={setSavedFilter}
          />
        </div>
        <div className="mt-3 max-w-md">
          <SearchBar placeholder="Búsqueda con debounce" />
        </div>
      </KitSection>

      <KitSection id="states" title="Estados">
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="active" />
          <StatusBadge tone="pending" />
          <StatusBadge tone="draft" />
          <ProgressBadge value={72} />
        </div>
        <AlertBanner variant="info" title="Información" className="mt-4">
          Mensaje de alerta persistente.
        </AlertBanner>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <EmptyState title="Sin registros" description="Crea el primero." action={{ label: "Crear" }} icon={<LayoutGrid className="h-8 w-8" />} />
          <LoadingState variant="cards" rows={2} />
        </div>
        <div className="mt-4">
          <Timeline items={[
            { id: "1", time: "Hoy 12:00", title: "Publicación", description: "Noticia activa" },
            { id: "2", time: "Ayer", title: "Borrador guardado" },
          ]} />
        </div>
        <div className="mt-4">
          <CatalogToastDemo />
        </div>
      </KitSection>

      <KitSection id="actions" title="Acciones">
        <ActionMenu>
          <ActionMenuItem onClick={() => {}}>Editar</ActionMenuItem>
          <ActionMenuItem destructive onClick={() => {}}>Eliminar</ActionMenuItem>
        </ActionMenu>
        <FloatingActions>
          <FloatingActionButton label="Crear" onClick={() => {}} />
        </FloatingActions>
      </KitSection>

      <KitSection id="overlays" title="Overlays">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setConfirmOpen(true)}>ConfirmDialog</Button>
          <Button size="sm" variant="outline" onClick={() => setPanelOpen(true)}>SidePanel</Button>
        </div>
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
          title="¿Eliminar registro?"
          description="Esta acción no se puede deshacer."
          destructive
        />
        <SidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title="Inspector">
          <p className="text-sm text-muted">Panel lateral de ejemplo.</p>
        </SidePanel>
      </KitSection>
    </div>
  );
}
