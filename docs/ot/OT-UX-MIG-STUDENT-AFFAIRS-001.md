# OT-UX-MIG-STUDENT-AFFAIRS-001 — Consolidación Golden Standard AEK

| Atributo | Valor |
| --- | --- |
| Estado | **Completada** |
| Fecha cierre | 2026-07-03 |
| Dependencia | OT-SEM-AUDITORIA-EJECUTIVA-001 |

---

## Resultado

Asuntos Estudiantiles migrado al 100 % AEK. Referencia técnica y visual oficial del Portal Administrativo SEM.

**Modernización global portal:** 66 % → **67 %**  
**KPI AEK-MIGRATION:** 43 % → **57 %** (4/7 dominios)

---

## Componentes eliminados

| Legacy | Ubicación anterior |
| --- | --- |
| `AdminModuleLayout` | Home, Equipo, `[formId]/page.tsx` |
| `StatusPill` (local) | `StudentAffairsOperationsPanel` |
| `sa-ops__table` + CSS | `student-affairs-ops.css` (324 líneas) |
| Filtros chip custom | `FilterChip` local en ops panel |
| Expansión inline revisión | Reemplazada por `Drawer` |

---

## Componentes AEK incorporados

`AdminModulePage` · `ModuleHeader` · `KpiCard` · `ProgressCard` · `QuickActions` · `FilterBar` · `SearchBar` · `AdminDataTable` · `StatusBadge` · `ConfirmDialog` · `EmptyState` · `LoadingState` · `AlertBanner` · `Section` · `Drawer` · `ColumnActions`

---

## Archivos tocados

- `src/components/admin/student-affairs/StudentAffairsHomeClient.tsx`
- `src/components/admin/student-affairs/StudentAffairsTeamClient.tsx`
- `src/components/admin/student-affairs/StudentAffairsOperationsPanel.tsx`
- `src/components/admin/student-affairs/StudentAffairsFormPageClient.tsx` *(nuevo)*
- `src/app/admin/portal/asuntos-estudiantiles/[formId]/page.tsx`
- `src/app/globals.css` *(removido import CSS legacy)*
- `docs/aek/AEK-MIGRATION.md`
- `docs/audits/OT-SEM-AUDITORIA-EJECUTIVA-001.md`

## Archivo eliminado

- `src/styles/student-affairs-ops.css`

---

## Verificación

| Check | Estado |
| --- | --- |
| `tsc --noEmit` | ✅ |
| APIs / permisos / Firestore | ✅ Sin cambios |
| Shell V1 + V2 (`AdminModulePage`) | ✅ |
| Legacy en módulo | ✅ Cero |

---

## Riesgos detectados

1. **Drawer vs expansión inline** — La gestión de inasistencias abre en panel lateral (`Drawer`) en lugar de fila expandida. Funcionalidad idéntica; patrón alineado con Portal forms.
2. **KPIs home** — Métricas agregadas vía llamadas paralelas a API stats existente (sin modificar backend). Ligero costo de red en carga inicial.

---

## Lecciones aprendidas

1. Panel ops con gradiente corporativo: `KpiCard` + clases Tailwind sobre contenedor, sin CSS dedicado.
2. Check-in en tabla: columna custom en `AdminDataTable` preserva flujo operativo diario.
3. Reutilizar patrón `ConvocatoriaAdminPanel` + `ExperienceFormSubmissionsTable` aceleró la migración ops.

---

## Capturas Antes / Después

> Tomar con `ADMIN_SHELL_V2=true` en `.env`:
> - `/admin/portal/asuntos-estudiantiles`
> - `/admin/portal/asuntos-estudiantiles/equipo`
> - `/admin/portal/asuntos-estudiantiles/{formId}`
