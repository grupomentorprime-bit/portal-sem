# OT-UX-IMPLEMENTACION-001 — Entrega Fase 1

| Atributo | Valor |
| --- | --- |
| Fase | 1 — Shell Administrativo V2 |
| Fecha | 2026-07-03 |
| Feature flag | `ADMIN_SHELL_V2=true` |

---

## Activación

```env
ADMIN_SHELL_V2=true
```

Reiniciar el servidor de desarrollo. Con el flag ausente o `false`, el sistema usa **Shell V1** sin cambios.

---

## Comparativa V1 vs V2

| Aspecto | V1 | V2 |
| --- | --- | --- |
| Navegación | Barra horizontal + drawer móvil | Sidebar fija por dominios |
| Marca | «Centro SEM» hardcodeado | Branding dinámico del tenant |
| Layout | Header + children | TopBar + Sidebar + Breadcrumbs + Workspace |
| Módulos | Sin cambios | `{children}` sin modificar |
| IAM | `filterAdminNav` | Mismo filtrado |

---

## Archivos creados

| Archivo | Rol |
| --- | --- |
| `src/lib/admin/feature-flags.ts` | Flag `ADMIN_SHELL_V2` |
| `src/lib/admin/nav-domains.ts` | Agrupación sidebar por dominios |
| `src/lib/admin/breadcrumb-from-path.ts` | Breadcrumbs automáticos |
| `src/lib/admin/tenant-branding.ts` | Branding multi-tenant |
| `src/components/admin/shell-v2/*` | Shell, TopBar, Sidebar, Layout Maestro |
| `docs/ot/OT-UX-IMPLEMENTACION-001-FASE-1.md` | Este documento |

## Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `src/app/admin/layout.tsx` | Pasa `shellV2` + `branding` |
| `src/components/identity/AdminShell.tsx` | Conmutador V1/V2 |
| `src/lib/admin/nav-access.ts` | `filterSupplementalNav` |
| `.env.example` | Documenta flag |

---

## Componentes reutilizables (Fase 1)

- `AdminShellV2`
- `AdminTopBarV2`
- `AdminSidebarV2`
- `AdminLayoutMaster`
- `AdminBreadcrumbV2`
- `AdminWorkspace`
- `ModuleHeader` (exportado; uso en Fase 3)
- `RightPanel` (exportado; uso en Fase 3)

---

## Verificación

```bash
npm run build
npm run lint
```

- [ ] `ADMIN_SHELL_V2=false` — comportamiento idéntico a pre-Fase 1
- [ ] `ADMIN_SHELL_V2=true` — sidebar + topbar en todas las rutas admin (excepto login)
- [ ] Permisos: usuario Student Affairs solo ve ítems acotados
- [ ] Responsive: drawer <1024px, colapso desktop

---

## Riesgos para Fase 2 (AEK)

| ID | Riesgo | Notas |
| --- | --- | --- |
| R1 | Doble header (breadcrumb + ModuleHero legacy) | Resolver en migración módulo a módulo |
| R2 | Tablas raw sin DataTable | AEK Fase 2 |
| R3 | `window.confirm` ×7 | ConfirmDialog en Fase 2 |
| R4 | AdminUserAvatar usa fallback logo plataforma | Aceptable Fase 1 |

---

## Capturas

> Completar tras validación manual en staging: dashboard, institución, formularios con flag ON/OFF.
