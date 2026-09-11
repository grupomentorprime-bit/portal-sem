# OT-GROWTH-SAAS-009 — ADL Tenant 002 y prueba multi-tenant

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SAAS-009 |
| ADR | [ADR-008](../../architecture/ADR-008.md) |
| Fecha | 2026-09-04 |
| Criterio APTO | SEM y ADL funcionan simultáneamente como dos clientes independientes del mismo Growth OS, sin contaminación cruzada y sin código específico para ADL |

## Objetivo

Crear ADL como segundo Espacio real (T002/S002) y demostrar que SEM T001 + ADL T002 conviven sobre el mismo core: resolución por host, branding, aislamiento Mongo, storage e Identity — reutilizando SAAS-001→008. Sin motores, resolvers ni modelos nuevos.

## Fuera de alcance

- Implementación académica específica de ADL (programas, convocatorias, forms propios)
- Provisioning DNS / TLS
- Multi-realm Keycloak / cookies multi-host avanzadas
- Onboarding S1–S8 completo para cualquier cliente

## Contrato

| Pieza | T001 SEM | T002 ADL |
| --- | --- | --- |
| `tenantId` | `seminario-ipn` | `adl` |
| Site | `seminario-ipn` (S001) | `adl` (S002) |
| Config | `site_config` propio (pack SEM) | `site_config` propio (identidad ADL) |
| Host dev | `APP_URL` / `localhost:3000` | `adl.localhost:3000` (`ADL_DEV_HOST`) |
| Branding | pack SEM (`semSiteBrandColors` / navy) + logos IPN | pack ADL (`adlSiteBrandColors`), distinto de SEM y Master |
| Menús | pack SEM (`El Seminario`, IPN) | `PLATFORM_DEFAULT_MENUS` |
| Forms / Talca / generaciones | datos T001 | ausentes |
| Home CMS | contenido SEM | shell `home` vacía (`adl:home`) |
| Storage | `storage:seminario-ipn` | stub `storage:adl` deshabilitado |
| Membresía de prueba | existente | email controlado (`ADL_BOOTSTRAP_MEMBER_EMAIL`) |

Regla crítica: **prohibido** `if (tenant === "adl")`, rutas `/adl` o componentes duplicados. Toda diferencia sale de configuración/datos. `isSemTenant` sigue siendo el gate del **pack SEM** (SAAS-007), no una rama ADL.

## Bootstrap

Alta genérica: `provisionTenantFoundation` (tenants / sites / domains / site_config / menús / home / roles / storage).

Pack de datos T002 (no runtime): `ADL_SITE_IDENTITY` + `ensureAdlTenantFoundation`.

```bash
npm run migrate -- 012-saas-adl-tenant
```

Idempotente. Separada de `010-saas-sem-content`. No copia `cms_config` SEM. No toma hosts de `APP_URL`.

## Validación en paralelo

| Caso | Resultado |
| --- | --- |
| Host SEM | T001 / S001 |
| Host ADL | T002 / S002 |
| Host desconocido | `unknown_host` — no cae a SEM ni ADL |
| Branding | `--brand-primary` distinto |
| IDs lógicos `home` / `main` | coexisten como `{tenant}:home` / `{tenant}:main` |
| Datos T001 desde T002 | `find({ _id, tenant })` vacío |
| Storage | documentos distintos; stub ADL no usa S3 de proceso |
| Switch SEM ↔ ADL | `pickActiveTenantId` + membresías; roles del Espacio activo |
| Desactivar T002 | host ADL sigue resolviendo T002 inactivo; T001 intacto |

## Fallbacks legacy (no son marca ADL)

| Ítem | Motivo |
| --- | --- |
| `sem-app-url-compat` / `sem-legacy-singleton` | SAAS-002; solo hosts SEM elegibles |
| `cms_config` `_id: site` | dual-write T001 |
| Storage `_id: storage` | legado T001 si falta `storage:seminario-ipn` |
| Env `S3_*` | fallback de proceso **solo si el tenant no tiene documento propio** |
| Alias CSS `--sem-*` | valores del Theme del Site activo |
| `isSemTenant` | pack de contenido T001 |

## Pruebas

```bash
npm run migrate -- 012-saas-adl-tenant
npm run test:baseline
npx tsc --noEmit
npm run build
```

## Veredicto

**APTO** — SEM T001 y ADL T002 conviven en la misma DB: hosts distintos, branding distinto, sin pack SEM en ADL, IDs lógicos coexistentes, storage aislado, switch de Espacio con permisos del activo, host desconocido y T002 inactivo no derivan a T001. Sin `if (tenant === "adl")`. baseline 89/89, `tsc --noEmit`, `npm run build`.
