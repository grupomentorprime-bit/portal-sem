# OT-GROWTH-UX-ADMIN-SHELL-002 — Aplicar patrón maestro al `/admin` real

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-ADMIN-SHELL-002 |
| Tipo | Implementación de Shell / experiencia `/admin` |
| Fecha | 2026-09-05 |
| Cierre | 2026-09-06 |
| Estado | **CERRADA · APTO VISUAL** |
| Referencia visual | [OT-GROWTH-UX-ADMIN-MASTER-001A](../OT-GROWTH-UX-ADMIN-MASTER-001A/README.md) · **CERRADA · APTO VISUAL** |
| Ajuste de lenguaje | [OT-GROWTH-UX-ADMIN-SHELL-002A](../OT-GROWTH-UX-ADMIN-SHELL-002A/README.md) · **CERRADA · APTO** |
| Criterio APTO | Validación visual humana de `/admin` productivo (no automático) |

---

## Objetivo

Llevar al `/admin` productivo el patrón visual aprobado en la maqueta maestra, **sin** eliminar funcionalidad ni tocar Growth Core, contratos, seguridad ni `/platform`.

## Qué reutilizó

| Pieza | Origen |
| --- | --- |
| `GrowthOsAdminHomeMaster` + proyección / labels humanos | `components/admin/preview/growth-os-master/` (001 / 001A) |
| `loadGrowthOsHomeSnapshot` | misma carpeta (lectura Core existente) |
| `ProductMark`, `AdminUserAvatar`, AEK (`EmptyState`, `Timeline`, `aek.surface`) | existentes |
| Shell V2 (`AdminShellV2`, sidebar, topbar, CSS) | evolucionado in-place (sin segundo Shell) |
| IAM / `filterNavItem` / badges | sin cambios de contrato |

## Qué cambió

- Sidebar **claro** (blanco/neutro); Growth OS = producto; Espacio activo = secundario
- Layout: sidebar full-height · topbar + main a la derecha
- Topbar: buscador **solo Personas** (sin GlobalSearch)
- Navegación maestra: Core · Crecer · Sitio web / Equipo / Ajustes
- **Ventas** enlaza a `/admin/ventas` (superficie ya existente; no se inventó módulo)
- Mensajes, Campañas, Automatizaciones, Analítica: representación visual `href: null` — sin páginas vacías
- `/admin` Inicio = composición maestra (métricas + Qué hacer ahora + Oportunidades + Actividad + orígenes; CTA **Atender**)

## Rutas preservadas (accesibles)

`/admin`, `/admin/personas`, `/admin/personas/[id]`, `/admin/ventas`, `/admin/ventas/[id]`, `/admin/pages`, `/admin/menus`, `/admin/experience-studio`, `/admin/config`, `/admin/content/*`, `/admin/content/programs`, `/admin/content/courses`, `/admin/portal/forms`, `/admin/portal/asuntos-estudiantiles`, `/admin/portal/admission`, `/admin/media`, `/admin/settings/*`, `/admin/aek`, `/admin/workflows`, `/admin/events`, `/admin/experience`, etc.

Ninguna ruta legacy se borró.

## Capacidades reubicadas

| Antes (grupo) | Ahora |
| --- | --- |
| Institución (+ secciones config) | **Sitio web → Institución** (`/admin/config`; subsecciones siguen en la página) |
| Portal web | **Sitio web** (Portal, Menús, Editor visual) |
| Oferta académica | **Sitio web** (Programas, Cursos) — gated por `programs.manage` |
| Formularios | **Sitio web** (Formularios, Operación, Centro de admisión) |
| Comunicaciones | **Sitio web** (Comunicaciones, Medios) |
| Configuración / Desarrollo / Soporte | **Ajustes** (Usuarios, Roles, Seguridad, Integraciones, AEK, Ayuda) |
| Equipo | **Equipo** (`/admin/settings/team`) |
| Actividad | **Core → Actividad** (`/admin/settings/activity`) |

Vertical educación: sin `if tenant === ADL/SEM`. Programas/Cursos solo si hay permiso `programs.manage` (u otros ya declarados).

## Pendientes (no improvisados)

| Tema | Nota |
| --- | --- |
| Subsecciones de Institución en sidebar | Colapsadas a un enlace a `/admin/config`; nav interno de la página intacto |
| Parámetros vs Institución | Un solo destino `/admin/config` bajo Sitio web (se evitó duplicar ítem) |
| Mensajes / Crecer | Solo dirección visual; sin editor n8n ni páginas vacías |
| Secciones config detalladas en sidebar | Decisión funcional no reabierta; documentado |

## Pruebas

```bash
npx tsc --noEmit
npx tsx --test tests/baseline/growth-os-admin-shell-002.test.ts tests/baseline/growth-personas-ui.test.ts tests/baseline/growth-os-admin-master.test.ts tests/baseline/ux-shell-identity.test.ts
npx next build
# con npm run dev:
npx tsx --env-file=.env scripts/capture-growth-ux-admin-shell-002.ts
```

| Chequeo | Resultado |
| --- | --- |
| `tsc --noEmit` | OK |
| Baseline OT (shell-002, master, personas-ui, identity) | OK (36 tests) |
| `npx next build` | OK |
| Capturas ADL (`/admin` productivo) | OK — ver tabla abajo |
| Validación visual humana | **APROBADA** (condicionada a 002A; cerrada) |

## Evidencia visual (`/admin` productivo — no maqueta)

| Archivo | Rol |
| --- | --- |
| [`admin-home-data.png`](./admin-home-data.png) | Inicio con datos |
| [`admin-home-empty.png`](./admin-home-empty.png) | Inicio vacío (`?empty=1` solo en desarrollo; no muta Mongo) |
| [`admin-personas.png`](./admin-personas.png) | Personas (origen `Portal web / Admisión` tras 002A) |
| [`admin-ventas.png`](./admin-ventas.png) | Ventas |
| [`admin-sidebar-nav.png`](./admin-sidebar-nav.png) | Sidebar / navegación |
| [`admin-responsive.png`](./admin-responsive.png) | Vista responsive (móvil + menú) |
| [`admin-legacy-pages.png`](./admin-legacy-pages.png) | Legacy (`/admin/pages`) en Shell nuevo |

## Veredicto

**CERRADA · APTO VISUAL** — patrón maestro 001A integrado en `/admin` productivo. Corrección de lenguaje de origen: [002A](../OT-GROWTH-UX-ADMIN-SHELL-002A/README.md).

**GROWTH OS ADMIN SHELL V1 = CERRADO · APTO** 🔒

Patrón **congelado**. Sin más microajustes salvo OT futura explícita.
