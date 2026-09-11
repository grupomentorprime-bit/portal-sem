# OT-GROWTH-SAAS-003 — Aislamiento Mongo por tenant

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SAAS-003 |
| ADR | [ADR-008](../../architecture/ADR-008.md) |
| Fecha | 2026-09-03 |
| Criterio APTO | Ningún recurso tenantizado puede leerse o modificarse fuera del tenant activo por manipulación de ID, slug, body o query |

## Objetivo

Delimitir lectura/escritura de recursos tenantizados por el tenant del contexto (host / sesión). Reutilizar repositorios existentes; no crear un segundo acceso a datos.

## Fuera de alcance

- Hardening `ensure*` / blocks-templates globales (SAAS-004)
- Selector multi-espacio (SAAS-005)
- Activar Tenant 002 (ADL)

## Cambios

| Área | Cambio |
| --- | --- |
| Pages / menus / media | `findOne({ _id, tenant })`; writes con `{ _id, tenant }` |
| Menús | Eliminado `$or` leaky (tenant vacío / missing) |
| Workflows | Definiciones e instancias por `tenantId`; sin `$or` de defs globales; `ensureSystemDefinitions` inserta con `tenantId` |
| Invitations | `find` / `accept` / `revoke` con `tenantId` |
| Forms / content | Ya filtraban por tenant; APIs dejan de aceptar tenant spoofeable en body/query |
| APIs | `requireActiveTenant()` — tenant solo desde contexto |
| Migración | `007-saas-isolation` — índices compuestos + backfill leftovers |

## Regla de writes

Tenant efectivo = contexto (`requireActiveTenant` / `getActiveTenantId`). Body y query **no** definen el Espacio.

## Documentado sin parche aislado

| Tema | Motivo | OT posterior |
| --- | --- | --- |
| `cms_blocks` / `cms_templates` | Catálogo global de plataforma (ADR-008 D5) | Confirmado en SAAS-004 |
| `ensure*` en GET | Solo bootstrap/login/migración | **Cerrado en SAAS-004** |
| `platform_integrations` singleton | Migración a por-tenant | **Cerrado en SAAS-004** |
| `_id` global `home` / `main` | Namespacing `{tenantId}:{id}` | **Cerrado en SAAS-004** |
| `identity_memberships` por `_id` solo | Membresía ya embebe `tenantId`; auth valida pertenencia | SAAS-005 si hace falta endurecer lookups |
| `identity_users` | Globales por diseño (ADR-004) | — |

## Pruebas

```bash
npm run test:baseline
npx tsc --noEmit
npm run build
```

Migración (idempotente):

```bash
npm run migrate -- 007-saas-isolation
```

## Veredicto

**APTO** — recursos tenantizados priorizados consultan con `{ _id, tenant|tenantId }`; sin `$or` leaky en menús/workflows; writes desde contexto; índices/migración idempotentes; T002 no activado.
