# OT-GROWTH-SAAS-007 — Extraer datos SEM del core

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SAAS-007 |
| ADR | [ADR-008](../../architecture/ADR-008.md) |
| Fecha | 2026-09-04 |
| Criterio APTO | Growth OS puede crear un Espacio nuevo sin heredar ningún dato específico de SEM, mientras T001 sigue funcionando igual |

## Objetivo

Conseguir que un tenant nuevo nazca limpio y que todo contenido específico de SEM exista como datos/configuración de T001, no como comportamiento por defecto de Growth OS.

## Fuera de alcance

- Tenant 002 ADL
- Onboarding completo / plantillas elegidas en alta
- Multi-realm Keycloak

## Auditoría (clasificación)

| Hallazgo | Clase | Acción |
| --- | --- | --- |
| Forms + convocatoria Talca Aurora | dato real T001 | `createSemDefaultForms` solo en T001; migración `010` materializa |
| Generaciones G-2023… | dato real T001 | `getConvocatoriaGenerations(tenant)` |
| Menús «El Seminario» / IPN | dato real T001 | `SEM_DEFAULT_MENUS` vs `PLATFORM_DEFAULT_MENUS` |
| Admisión DEFAULT + closing IPN | dato real T001 | merge solo SEM; vacío → `createEmptyAdmissionConfig` |
| Footer CTA / sello IPN | dato real T001 | `resolveFooterContent({ tenantId })` |
| Home demos / institutional-demo | demo runtime SEM | gated con `isSemTenant` |
| Seeds CMS (programas, equipo, …) | dato real T001 | `seedContentCollections` solo SEM |
| Showcases / mock admin / roster CSV demo | demo/dev | aislados (no runtime de Site vacío) |
| Vertical educación (roles AE, workflows, forms engine) | lógica legítima | conservada sin cliente hardcodeado |
| PDF Asuntos Estudiantiles | informe T001 | `institutionName` desde Site config |

## Contrato

| Regla | Implementación |
| --- | --- |
| Pack SEM solo T001 | `isSemTenant` / `materializeSemTenantContent` |
| Migración idempotente | `010-saas-sem-content` |
| Seed forms / content | no-op fuera de `seminario-ipn` |
| Admisión sin doc | SEM → DEFAULT pack; otro → shell vacío |
| Footer / home demos | SEM only |
| Convocatorias / generaciones | catálogo por tenant |

## Pruebas

Fixture: `tenant-saas007` (no contamina SEM).

```bash
npm run test:baseline
npx tsc --noEmit
npm run build
```

## Veredicto

**APTO** — Espacio nuevo sin plantilla no hereda SEM/IPN/Talca/generaciones; T001 conserva forms, admisión, menús y demos home; migración T001 idempotente; baseline / tsc / build.
