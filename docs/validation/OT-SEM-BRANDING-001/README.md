# OT-SEM-BRANDING-001 — Validación visual

## Alcance

Refinamiento de paleta y componentes AEK del Portal Administrativo. Sin cambios funcionales.

## Archivos clave

| Área | Ruta |
| --- | --- |
| Tokens admin | `src/styles/tokens/admin-branding.css` |
| KPI | `src/components/admin/kit/dashboard/KpiCard.tsx` |
| Progreso | `src/components/admin/kit/dashboard/ProgressCard.tsx` |
| Badges | `src/components/ui/badge.tsx` |
| Botones | `src/components/ui/button.tsx` |
| Sidebar | `src/components/admin/kit/navigation/AdminSidebar.tsx` |
| Módulo referencia | `src/components/admin/student-affairs/StudentAffairsOperationsPanel.tsx` |
| Guía | `docs/design/ADMIN-COLOR-GUIDE.md` |

## Rutas de revisión

1. `/admin` — Dashboard (welcome card + KPIs)
2. `/admin/portal/asuntos-estudiantiles` — Hub
3. `/admin/portal/asuntos-estudiantiles/[formId]` — Panel operativo (KPIs + tabla)
4. Módulos legacy con `AdminModuleHero` — Usuarios CMS, etc.

## Checklist

- [ ] KPIs: fondo blanco, acento mínimo, sin gradientes
- [ ] Sidebar: azul institucional, hover suave
- [ ] Progreso: azul en curso, verde al 100%
- [ ] Badges: solo azul / ámbar / rojo / verde semántico
- [ ] Tabla: hover azul muy suave
- [ ] Sin regresiones funcionales

## Comparativa Antes / Después

Colocar capturas en `screenshots/`:

- `01-dashboard-before.png` / `01-dashboard-after.png`
- `02-student-affairs-before.png` / `02-student-affairs-after.png`
- `03-sidebar-before.png` / `03-sidebar-after.png`

Referencia “antes”: captura multicolor del panel de asuntos estudiantiles (jul 2026).
