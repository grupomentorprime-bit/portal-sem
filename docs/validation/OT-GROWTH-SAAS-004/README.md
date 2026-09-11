# OT-GROWTH-SAAS-004 — Eliminar singletons y bootstrap inseguro

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SAAS-004 |
| ADR | [ADR-008](../../architecture/ADR-008.md) |
| Fecha | 2026-09-03 |
| Criterio APTO | Ningún singleton o inicialización implícita conocida que provoque cruce/colisión al incorporar un segundo tenant |

## Objetivo

Cerrar estructuras que impiden habilitar con seguridad un segundo Espacio. Reutilizar TenantContext, migraciones y guards; no crear motores nuevos.

## Fuera de alcance

- Selector / multi-espacio (SAAS-005)
- ADL / T002
- Limpieza visual / branding
- Custom domains
- Growth Core

## Singletons / riesgos encontrados

| Ítem | Antes | Después |
| --- | --- | --- |
| `ensureTenantRoles` en GET roles/team/permissions/storage | Escritura al listar | Solo login / Keycloak / mutaciones / `sync-tenant-roles` |
| `ensureSystemDefinitions` en GET definitions | Insert silencioso | Solo publish (`ensureEntityWorkflow`) / `workflows/start` |
| `platform_integrations` `_id: storage` | Singleton de instancia | `storage:{tenantId}` + campo `tenantId` |
| `cms_pages` / `cms_menus` `_id: home` / `main` / … | `_id` global único | `{tenantId}:{logicalId}`; lookup acepta lógico o scoped |
| `cms_blocks` / `cms_templates` | Catálogo de plataforma | **Sin cambio** — globales (ADR-008 D5) |

## Estrategia

1. **GET = lectura**: listados usan `listRolesByTenant` / `listDefinitions` / `getStorageIntegrationPublic(tenantId)`.
2. **IDs tenantizados** vía `scopedResourceId` / `resourceIdCandidates` (compat bare → SEM).
3. **Integraciones** delimitadas por `tenantId`; cache por tenant; env S3 sigue como fallback de proceso.
4. **Migración `008-saas-singletons`**: rename pages/menus SEM, migrate storage, update `workflow_instances`/`history` entityId; idempotente.

## Compatibilidad temporal

- Lookup pages/menus: candidatos `[scoped, bare]` para T001 pre/post migración.
- Storage: si falta `storage:seminario-ipn`, lee legado `_id: storage` solo para SEM.
- `cms_config` `_id: site` y resolución host legado: intactos (SAAS-001/002).

## Pruebas

```bash
npm run migrate -- 008-saas-singletons
npm run test:baseline
npx tsc --noEmit
npm run build
```

## Pendientes (OTs posteriores)

- SAAS-006: branding sin fallbacks SEM
- SAAS-007: seeds SEM fuera del código
- SAAS-009: Tenant 002 ADL

## Veredicto

**APTO** — sin ensure* en GET conocidos; integraciones y IDs home/main tenantizados; blocks/templates globales; migración idempotente; T002 no activado.
