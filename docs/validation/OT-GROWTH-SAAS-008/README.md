# OT-GROWTH-SAAS-008 — Dominios por Site

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SAAS-008 |
| ADR | [ADR-008](../../architecture/ADR-008.md) |
| Fecha | 2026-09-04 |
| Criterio APTO | Cualquier Site puede tener dominio propio o subdominio sin código específico del cliente; el Host determina de forma inequívoca su Site/Espacio |

## Objetivo

Cerrar el modelo y la resolución de dominios: múltiples hosts por Site, uno `isPrimary`, unicidad global del host normalizado, y mutaciones seguras — reutilizando `domains`, `normalizeHost` y el resolver Host → Domain → Site → Tenant existente.

## Fuera de alcance

- Provisioning automático DNS / TLS / certificados
- Tenant 002 ADL real
- Multi-realm Keycloak / cookies multi-host avanzadas

## Contrato

| Regla | Implementación |
| --- | --- |
| N dominios por Site | colección `domains` (`siteId` + `host`) |
| Un primary | `isPrimary`; `setPrimaryDomain` demota hermanos |
| Host único global | índice único + `assertHostAvailableForSite` |
| Primary o alias | mismo `resolvePublicTenantByHost` (`source: "domain"`) |
| Host de otro Site | `host_taken` — no se asigna |
| Custom / plataforma | `kind`: `custom` \| `platform_subdomain` \| `legacy` |
| Subdominio plataforma | `buildPlatformSubdomainHost` + `PLATFORM_BASE_DOMAIN` (solo host lógico) |
| Host desconocido | `unknown_host` — **no** cae a SEM |
| Inactivo | resuelve ese Site/Tenant (estado), no deriva a otro |
| Compat SEM | `sem-app-url-compat` / `legacy` hosts de APP_URL |

## API de aplicación

| Función | Uso |
| --- | --- |
| `addDomainToSite` | Alta (primer dominio → primary) |
| `setPrimaryDomain` | Cambio de principal |
| `changeDomainHost` | Renombrar host con unicidad |
| `removeDomainFromSite` | Baja; si era primary, promueve un hermano |
| `listSiteDomains` / `getPrimaryDomain` | Lectura |
| `buildPlatformSubdomainHost` | `{slug}.{PLATFORM_BASE_DOMAIN}` |

Resolver: **no** se duplica — sigue `resolvePublicTenantByHost`.

## Migración

```bash
npm run migrate -- 011-saas-domains
```

Idempotente: índices + backfill `kind` + repara multi-primary.

## Pruebas

Fixture: `tenant-saas008-*` (no contamina SEM).

```bash
npm run test:baseline
npx tsc --noEmit
npm run build
```

## Veredicto

**APTO** — primary/alias resuelven el mismo Site; host duplicado bloqueado; un solo `isPrimary`; host desconocido e inactivo no derivan a otro Espacio; modelo listo para custom y subdominio de plataforma sin DNS automático; baseline / tsc / build.
