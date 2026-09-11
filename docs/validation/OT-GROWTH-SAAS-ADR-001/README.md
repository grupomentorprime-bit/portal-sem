# OT-GROWTH-SAAS-ADR-001 — Cerrar arquitectura base multi-tenant

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SAAS-ADR-001 |
| Tipo | ADR / contrato (solo documentación) |
| Fecha | 2026-09-03 |
| ADR | [ADR-008 — Fundación multi-tenant](../../architecture/ADR-008.md) |
| Criterio APTO | Se puede iniciar **OT-GROWTH-SAAS-001** sin inventar Tenant/Site/Domain/TenantContext/aislamiento/migración en código |

## Objetivo

Antes de modificar modelos o tenantizar código: revisar ADRs, auditoría SaaS y runtime; definir el **contrato mínimo** de la Fundación SaaS. Sin implementación.

## Entradas revisadas

- Código: `TenantContext`, `assertActiveTenant`, `getActiveTenantId`, `cms_config`, menús, Identity/Keycloak, `ensure*`
- `docs/architecture` ADR-003…007
- [OT-PORTAL-SAAS-000](../../AI/auditorias/OT-PORTAL-SAAS-000-AUDITORIA.md)
- UX Espacio (Frente 2 — cascarón / entrada)
- [TEST-001](../OT-GROWTH-TEST-001/README.md) / [TEST-002](../OT-GROWTH-TEST-002/README.md)

## Entrega (contrato)

Detalle normativo en **[ADR-008](../../architecture/ADR-008.md)**. Resumen:

| Tema | Decisión |
| --- | --- |
| Reutilizar | ADR-003…007, Identity enforce, UX Espacio, baseline TEST |
| Tenant / Espacio | Entidad raíz; UX «Espacio»; `tenantId`; membresías ADR-004 |
| Site | Tenant → 1..N; SEM 1:1; portal config en Site; org/membresías en Tenant |
| Domain | Host → site/tenant; APP_URL→T001; custom domain después |
| TenantContext | Público por host; auth por sesión+membresía; miss/inactive → 404/maintenance |
| Aislamiento | DB compartida; query siempre tenant-scoped; `cms_config` → site_config |
| Identidad | N espacios / cuenta; Keycloak realm plataforma v1 |
| Migración | SEM = T001 `seminario-ipn`; ADL = T002 solo al final |

### Primeras OTs de implementación (orden)

1. SAAS-001 — tenants/sites/domains + migrar cms_config T001  
2. SAAS-002 — resolución Host → TenantContext  
3. SAAS-003 — aislamiento Mongo (`_id`+tenant, menús, índices)  
4. SAAS-004 — hardening ensure* + singletons  
5. SAAS-005 — multi-espacio en sesión / Keycloak compat  
6. SAAS-006 — branding sin fallbacks SEM  
7. SAAS-007 — seeds SEM → datos T001  
8. SAAS-008 — dominios personalizados  
9. SAAS-009 — Tenant 002 ADL  

## Criterios de aceptación

- [x] No duplica ADR-004…007; solo cierra huecos de instancia SaaS
- [x] Resuelve Tenant/Espacio, Site, Domain, TenantContext, aislamiento, identidad, migración SEM→ADL
- [x] Disposition de ensure*, `_id`, menús, singletons, seeds
- [x] Lista ordenada de OTs de implementación
- [x] Sin código de producto ni cambios de modelos en esta OT

**Veredicto: APTO** — contrato suficiente para abrir **OT-GROWTH-SAAS-001**.
