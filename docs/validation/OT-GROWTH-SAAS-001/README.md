# OT-GROWTH-SAAS-001 — Base Tenant / Site / Domain

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SAAS-001 |
| ADR | [ADR-008](../../architecture/ADR-008.md) |
| Fecha | 2026-09-03 |
| Criterio APTO | SEM existe como T001/S001/Domain y sigue funcionando igual; sin segundo tenant |

## Objetivo

Primera capa del ADR-008: colecciones `tenants` / `sites` / `domains`, migración de `cms_config` hacia config por Site, compat de lectura, backfill de menús SEM sin tenant.

## Fuera de alcance (explícito)

- Host → TenantContext completo (SAAS-002)
- Aislamiento general de queries (SAAS-003)
- Hardening `ensure*` (SAAS-004)
- Selector / multi-espacio (SAAS-005)
- Limpieza branding/seeds SEM; ADL/T002

## Reutilizado

- `getSiteConfig` / `normalizeSiteConfig` / `SITE_CONFIG_ID`
- Framework `src/core/migrations` (`cms_migrations`)
- `institution.tenant` = `seminario-ipn` como tenant canónico
- Guías previas en `TENANT-GUIDELINES` (actualizadas)

## Modelo

| Entidad | Colección | SEM |
| --- | --- | --- |
| Tenant | `tenants` | `tenantId=seminario-ipn` (T001) |
| Site | `sites` | `siteId=seminario-ipn` (S001, default) |
| Domain | `domains` | hosts de `APP_URL` / `NEXT_PUBLIC_APP_URL` |
| Site config | `site_config` | mirror del portal config |

## Migración

```bash
npm run migrate -- 006-saas-foundation
```

`ensureSemTenantFoundation(db)` es **idempotente** (upsert por `_id` / `host`).

- Conserva `cms_config` `_id: "site"`
- Espeja a `site_config`
- Backfill `cms_menus` sin `tenant` → `seminario-ipn`

## Compatibilidad

- `getSiteConfig()` sigue leyendo el singleton; fallback a `site_config` SEM si falta
- `updateSiteConfig()` dual-write: singleton + mirror `site_config`
- `getActiveTenantId()` / resolución por host: **SAAS-002** (`docs/validation/OT-GROWTH-SAAS-002`)

## Pruebas

- `tests/baseline/saas-foundation.test.ts`
- `npm run test:baseline`
- `npx tsc --noEmit`
- `npm run build`

## Veredicto

**APTO** — SEM existe como T001/S001/Domain; `cms_config` singleton conservado; baseline / tsc / build verdes; sin segundo tenant.
