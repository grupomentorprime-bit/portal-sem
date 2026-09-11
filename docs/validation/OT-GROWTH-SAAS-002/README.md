# OT-GROWTH-SAAS-002 — Resolver Host → TenantContext

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SAAS-002 |
| ADR | [ADR-008](../../architecture/ADR-008.md) |
| Fecha | 2026-09-03 |
| Criterio APTO | El portal público obtiene Espacio/Site por el host real del request; ya no depende conceptualmente de “la instancia SEM” |

## Objetivo

Dejar de resolver el tenant público desde el singleton de instancia y pasar a **Host → Domain → Site → Tenant → site_config → TenantContext**.

## Reutilizado (SAAS-001)

- Colecciones `tenants` / `sites` / `domains` / `site_config`
- `ensureSemTenantFoundation` / hosts de `APP_URL`
- **Un solo** `TenantContext` (`src/core/tenant/context.ts`) — extendido con `siteId` + `status`

## Fuera de alcance

- Selector / multi-espacio (SAAS-005)
- Aislamiento general de colecciones (SAAS-003)
- Hardening `ensure*` (SAAS-004)
- ADL / T002

## Comportamiento

| Caso | Resultado |
| --- | --- |
| Host en `domains` | TenantContext de ese Site/Tenant |
| Host desconocido | Sin contexto (`null` / 404 conceptual) — **no** cae a otro tenant |
| Tenant o Site inactivo | Contexto de **ese** espacio (página de estado); `getActiveTenantContext` = `null` |
| `?tenant=` / `x-tenant-id` | Ignorados para resolución |
| Host con puerto | `normalizeHost` → `host:port` lowercase |

`getActiveTenantId()` resuelve desde el host del request (mismo pipeline).

## Fallbacks temporales (documentados)

1. **`sem-app-url-compat`**: host en `APP_URL` / `NEXT_PUBLIC_APP_URL`, o **loopback** (`localhost` / `127.0.0.1`) con cualquier puerto si APP_URL también es loopback (dev multi-puerto). Solo esos hosts; no aplica a dominios públicos desconocidos.
2. **`sem-legacy-singleton`**: si falta foundation `tenants`/`sites`/`site_config` pero existe `cms_config` SEM — solo en hosts elegibles SEM.
3. **Sin Host de request** (scripts / fuera de HTTP): `getActiveTenantId` / `getTenantContext` caen al singleton — **nunca** para tapar un host desconocido.

## Archivos

| Ruta | Rol |
| --- | --- |
| `src/core/tenant/hosts.ts` | `normalizeHost`, `resolveRequestHost` |
| `src/core/tenant/resolve.ts` | Domain → Site → Tenant → config |
| `src/core/tenant/context.ts` | TenantContext público desde request |
| `src/core/identity/middleware/guards.ts` | `getActiveTenantId` desde contexto |
| `src/core/security/tenant-guard.ts` | `assertActiveTenant` vs tenant del host |
| `tests/baseline/saas-host-resolve.test.ts` | Pruebas mínimas |

## Pruebas

```bash
npm run test:baseline
npx tsc --noEmit
npm run build
```

## Pendientes

- Quitar compat `sem-app-url-compat` cuando todos los hosts SEM vivan en `domains`
- Sesión / `activeTenantId` multi-espacio (SAAS-005)
- 404 HTTP explícito en layout público para `unknown_host` (hoy: contexto null → mensaje / vacío)

## Veredicto

**APTO** — portal público resuelve Espacio/Site por host del request; `getActiveTenantId` usa el mismo pipeline; host desconocido no cae a otro tenant; baseline / tsc / build verdes; sin selector ni ADL.
