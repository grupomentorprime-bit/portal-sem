# OT-GROWTH-PROD-005 — Operador de Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-PROD-005 |
| ADR | [ADR-004](../../architecture/ADR-004.md), [ADR-008](../../architecture/ADR-008.md), [ADR-009](../../architecture/ADR-009.md) |
| Fecha | 2026-09-04 |
| Criterio APTO | Existe una frontera inequívoca entre “administro mi Espacio” y “administro Growth OS”, sin romper aislamiento multi-tenant |

## Objetivo

Capacidad mínima y segura que distingue a un **operador de Growth OS** de un **administrador de un Espacio**.

Reutiliza `identity_users`, sesión e `identity_audit`. No construye catálogo, ficha ni creación de Espacios.

## Contrato

| Concepto | Significado |
| --- | --- |
| `super_admin` | Solo Owner del Espacio |
| `platform_owner` / `platform_operator` | Capacidad global en `identity_users.platformRoles` |
| `requirePlatformOperator` | Guard deny-by-default; no usa Espacio activo |
| Superficie | `/platform` y `/api/platform/*` — separadas de `/admin` del cliente |

## Reglas

- Ser Owner de SEM/ADL **no** entrega acceso global.
- Ser operador de Growth OS **no** crea membresías en clientes.
- No hardcodear emails. No usar `isSystemAccount` como autorización.
- No crear Tenant `platform`. No activar `PLATFORM_ROLES` legado (códigos que colisionan).
- No recuperar `IDENTITY_ENFORCE=false`. Deny-by-default.
- Acciones globales → `identity_audit` con `scope: "platform"` (un solo motor).

## Fuera de alcance

- Catálogo / ficha / alta de Espacios
- UI de gestión de operadores
- Growth Core, planes, CRM

## Pruebas

```bash
npm run test:baseline
npx tsc --noEmit
npm run build
```

Casos: operador autorizado; `super_admin` SEM/ADL sin rol global; usuario común; sin sesión; switch de Espacio no altera la capacidad.

## Criterios de aceptación

- [x] Códigos globales distintos de roles de Espacio
- [x] `requirePlatformOperator` independiente del Espacio activo
- [x] `/platform` preparado y protegido; `/admin` del cliente intacto
- [x] Auditoría global en `identity_audit`
- [x] Baseline + typecheck + build

## Veredicto

**APTO** — frontera inequívoca: `super_admin` = Owner de Espacio; `platform_owner` / `platform_operator` = operador de Growth OS en `identity_users`. `requirePlatformOperator` no usa Espacio activo, email ni `isSystemAccount`. `/platform` separado de `/admin`. Auditoría global en `identity_audit`. `test:baseline` 122 tests, `tsc --noEmit`, `npm run build`.
