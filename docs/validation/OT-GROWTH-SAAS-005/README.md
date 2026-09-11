# OT-GROWTH-SAAS-005 — Cuenta multi-Espacio

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SAAS-005 |
| ADR | [ADR-008](../../architecture/ADR-008.md) · [ADR-004](../../architecture/ADR-004.md) |
| Fecha | 2026-09-04 |
| Criterio APTO | La identidad deja de estar atada a SEM; una cuenta opera de forma segura sobre distintos Espacios, uno activo a la vez |

## Objetivo

Permitir que una misma cuenta pertenezca a varios Espacios con `activeTenantId` en sesión, reutilizando Identity, memberships y el cascarón UX aprobado (`Mi cuenta` / `Mi espacio`).

## Fuera de alcance

- Tenant 002 ADL real
- Onboarding completo S1–S8
- Branding sin fallbacks SEM (SAAS-006)
- Custom domains / multi-realm Keycloak

## Contrato

| Regla | Implementación |
| --- | --- |
| Espacios = membresías activas | `listAvailableSpacesForUser` |
| `activeTenantId` | `identity_sessions.tenantId` |
| Validar membresía antes de usar | `assertActiveMembership` / `reconcileSessionActiveTenant` |
| Cambio explícito | `POST /api/identity/spaces/switch` → Inicio `/admin` |
| 1 Espacio | entra directo con ese tenant |
| N Espacios | preferido (host) si válido; si no, el más antiguo |
| Activo obsoleto | recuperación al siguiente válido |
| 0 Espacios | `/admin/sin-espacio` (sin cascarón) |
| Permisos | membresía del Espacio activo |
| Anti-spoof | el cliente no fija tenant sin membresía |

Keycloak sigue siendo identidad global (1 realm); autorización por membresías en Mongo.

## APIs

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/identity/spaces` | Listar Espacios + `activeTenantId` |
| POST | `/api/identity/spaces/switch` | Cambiar Espacio (membresía obligatoria) |
| GET | `/api/identity/me` | Incluye `spaces` / `hasSpace` |

## Pruebas

Fixtures: `tenant-saas005-a` / `tenant-saas005-b` (no contaminan SEM).

```bash
npm run test:baseline
npx tsc --noEmit
npm run build
```

## Pendientes (OTs posteriores)

- SAAS-006: branding sin fallbacks SEM — cerrado en [OT-GROWTH-SAAS-006](../OT-GROWTH-SAAS-006/README.md)
- SAAS-007: seeds SEM fuera del código — cerrado en [OT-GROWTH-SAAS-007](../OT-GROWTH-SAAS-007/README.md)
- SAAS-009: Tenant 002 ADL

## Veredicto

**APTO** — sesión multi-Espacio con membresía validada; switch explícito; cero Espacios sin cascarón; Keycloak no ata la cuenta a SEM; fixtures aislados; baseline / tsc / build.
