# OT-GROWTH-PLATFORM-ADMIN-002 — Catálogo y ficha de Espacios

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-PLATFORM-ADMIN-002 |
| ADR | [ADR-004](../../architecture/ADR-004.md), [ADR-008](../../architecture/ADR-008.md), [ADR-009](../../architecture/ADR-009.md) |
| Fecha | 2026-09-04 |
| Criterio APTO | Desde `/platform` un operador autorizado puede ver todos los Espacios existentes y abrir su ficha sin romper aislamiento ni convertir `/admin` en consola global |

## Objetivo

Permitir que un operador autorizado de Growth OS vea todos los Espacios y abra una ficha operativa de cada uno.

Reutiliza: `tenants`, `sites`, `domains`, `site_config`, `identity_memberships`, roles existentes, `requirePlatformOperator`.

## Contrato

| Pieza | Significado |
| --- | --- |
| `listTenants` | Lectura global de Espacios (colección `tenants`) |
| `GET /api/platform/spaces` | Catálogo protegido |
| `GET /api/platform/spaces/:tenantId` | Ficha protegida |
| UI `/platform` | Catálogo |
| UI `/platform/spaces/:tenantId` | Ficha operativa |

### Catálogo

Nombre, estado, tipo, dominio principal, Sitio principal, cantidad básica de miembros (`countMembershipsByTenant`).

### Ficha

Nombre; `tenantId` solo como dato técnico secundario; estado del Espacio; estado del Sitio; dominio principal y demás; Dueño del Espacio; miembros principales; identidad básica desde `site_config`.

### Lenguaje visible

Espacio (no Tenant), Sitio (no Site), Dueño del Espacio (no `super_admin`), Growth OS como producto.

## Fuera de alcance

Crear / editar / suspender / borrar Espacio; planes; cobros; impersonación; Growth Core.

## Seguridad

- Toda API bajo `requirePlatformOperator`
- Owner de SEM/ADL sin rol global → denegación
- No depende del Espacio activo
- No usa `GET /api/identity/spaces` como catálogo global

## Pruebas

```bash
npm run test:baseline
npx tsc --noEmit
npm run build
```

Casos: operador ve SEM y ADL; admin de SEM sin rol global denegado; ficha SEM ≠ ADL; sin sesión → 401/login.

## Criterios de aceptación

- [x] Lectura global `listTenants` + servicio de catálogo/ficha
- [x] APIs `/api/platform/spaces` y `/:tenantId` con `requirePlatformOperator`
- [x] UI catálogo y ficha con lenguaje Growth OS
- [x] Aislamiento SEM/ADL en ficha
- [x] Baseline + typecheck + build

## Veredicto

**APTO** — desde `/platform` un operador autorizado ve el catálogo global de Espacios (`listTenants` + `GET /api/platform/spaces`) y abre la ficha (`/platform/spaces/:tenantId`, `GET /api/platform/spaces/:tenantId`) sin depender del Espacio activo ni de `/api/identity/spaces`. Owner de SEM/ADL sin rol global denegado. Ficha aislada por `tenantId`. `/admin` intacto. `test:baseline` 129 pass / 1 skip, `tsc --noEmit`, `npm run build`.
