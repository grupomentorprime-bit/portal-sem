# OT-UX-MIG-PORTAL-001 — Entregables

| Estado | **Completada** |
| --- | --- |
| Fecha | 2026-07-03 |
| Dominio | Portal (nav `/admin/pages`) |

---

## 1. Capturas Antes / Después

> Las capturas deben tomarse con `ADMIN_SHELL_V2=true` en `.env` comparando commit anterior vs actual.

| Pantalla | Antes | Después |
| --- | --- | --- |
| Páginas | Hero + cards | KPIs + QuickActions + AdminDataTable |
| Menús | Hero + cards | KPIs + AdminDataTable |
| Editor menú | Hero + stats | KPIs + Section + panel lateral |
| Formularios | Hero + cards featured | KPIs + QuickActions + AdminDataTable |
| Detalle formulario | StatusPill local | StatusBadge AEK |
| Convocatoria | Hero + `<table>` | KPIs + ExperienceFormSubmissionsTable |
| Roster | `<table>` + pills | AdminDataTable + FilterBar |

---

## 2. Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `PageListClient.tsx` | AEK completo + InputDialog + QuickActions |
| `MenuListClient.tsx` | AEK completo |
| `MenuEditorClient.tsx` | AdminModulePage, KpiCard, Section |
| `FormsCenterClient.tsx` | Tabla unificada, sin hero/cards legacy |
| `FormDetailClient.tsx` | AdminModulePage, StatusBadge |
| `FormSubmissionsPanel.tsx` | Delega a ExperienceFormSubmissionsTable |
| `ExperienceFormSubmissionsTable.tsx` | **Nuevo** — tabla + Drawer |
| `ConvocatoriaAdminPanel.tsx` | AEK completo |
| `ConvocatoriaRosterPanel.tsx` | AdminDataTable + FilterBar |
| `AdminModulePage.tsx` | Puente V1/V2 |
| `AdminChromeContext.tsx` | Contexto shell |
| `useInputDialog.tsx` / `InputDialog.tsx` | **Nuevo** |
| `QuickActions.tsx` / `SummaryCard.tsx` | Soporte `onClick` |
| `AdminShell.tsx` | AdminChromeProvider |
| `docs/aek/AEK-MIGRATION.md` | Matriz actualizada |

---

## 3. Componentes legacy eliminados (Portal)

- `AdminModuleHero`
- `AdminModuleStats`
- `AdminModuleSectionHeader` (en listados Portal)
- `window.confirm`, `prompt()`, `alert()`
- `StatusPill` local
- Tablas HTML directas
- `FilterButton` / `FilterChip` / filter pills custom en Portal

---

## 4. Componentes AEK utilizados

`AdminModulePage`, `ModuleHeader`, `KpiCard`, `ContentGrid`, `QuickActions`, `FilterBar`, `SearchBar`, `AdminDataTable`, `ColumnActions`, `StatusBadge`, `ConfirmDialog`, `InputDialog`, `EmptyState`, `LoadingState`, `Section`, `Drawer`, `useConfirmDialog`, `useInputDialog`, `useToast`

---

## 5. Problemas encontrados

| Problema | Resolución |
| --- | --- |
| Doble header con Shell V2 | `AdminModulePage` omite breadcrumb/H1 cuando `shellV2=true` |
| Filas expandibles en tablas | `Drawer` para gestión de inasistencias (patrón reutilizable) |
| `RightPanel` oculto en `< xl` | Editor de menú usa `aside` visible en `lg+` |
| Filtros duplicados convocatoria | Panel filtra asistencia/generación; tabla añade búsqueda local |

---

## 6. Riesgos para el siguiente módulo

| Módulo | Riesgo |
| --- | --- |
| Comunicaciones | Muchos tipos de contenido; reutilizar patrón tabla + FilterBar |
| Medios | Upload/preview; tabla + panel lateral para metadatos |
| Admisión CMS | Editor split-pane; no forzar AdminDataTable en preview |
| Asuntos estudiantiles | Tabla operativa compleja; reutilizar `ExperienceFormSubmissionsTable` |

---

## 7. Lecciones aprendidas

1. Migrar **infraestructura compartida** (`AdminModulePage`, hooks de diálogo) antes que módulos.
2. Extraer **tablas complejas** a componentes reutilizables cuando comparten dominio (respuestas de formularios).
3. **QuickActions + KPIs** responden al dashboard operativo sin saturar métricas.
4. **No mezclar** migración de listados con editores visuales (Experience Studio) en la misma OT.
5. Cada decisión debe ser **agnóstica del tenant** — válida para AprendeHoy multi-tenant.

---

## Verificación

```bash
npx tsc --noEmit   # ✅
```

Activar Shell V2: `ADMIN_SHELL_V2=true`

Compatibilidad V1: `ADMIN_SHELL_V2=false` — `AdminModulePage` usa `AdminModuleLayout` legacy.
