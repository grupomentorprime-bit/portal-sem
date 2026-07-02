# OT-CORE-EXP-001 — Experience Actions Engine v1.0

| Atributo | Valor |
| --- | --- |
| OT | OT-CORE-EXP-001 |
| Épica | EP-CORE-001 — Experience Framework |
| Prioridad | Alta |
| Estado | Completada |
| Versión | 1.0.0 LOCKED |
| Fecha cierre | 2026-06-30 |

## Objetivo

Extraer la arquitectura de acciones configurables desde el CTA Premium y convertirla en el motor oficial de acciones del Core, reutilizable por cualquier módulo del Portal Experience Kit.

## Alcance

- Migrar `src/core/portal/cta-actions/` → `src/core/experience/actions/`.
- Renombrar contrato `cta-action.ts` → `experience-action.ts`.
- Dividir handlers en archivos individuales.
- Crear `ExperienceActionProvider` y `ExperienceActionButton` compartidos.
- Mantener compatibilidad `href` legacy.
- Documentar en `CORE-EXPERIENCE-ACTIONS-v1.md`.
- Agregar **Experience Action Rule** al Handbook.

## Arquitectura

- [CORE-EXPERIENCE-ACTIONS-v1.md](../core/CORE-EXPERIENCE-ACTIONS-v1.md)
- [CORE-CTA-PREMIUM-v1.md](../core/CORE-CTA-PREMIUM-v1.md)

## Entregables

| Entregable | Ubicación |
| --- | --- |
| Tipos | `src/types/experience-action.ts` |
| Motor | `src/core/experience/actions/` |
| Handlers | `src/core/experience/actions/handlers/*.ts` |
| Provider | `src/components/portal/experience/ExperienceActionProvider.tsx` |
| Botón UI | `src/components/portal/experience/ExperienceActionButton.tsx` |
| Documentación | `docs/core/CORE-EXPERIENCE-ACTIONS-v1.md` |

## Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| Motor desacoplado del CTA | ✅ |
| Registry oficial del Core | ✅ |
| Contrato `ExperienceAction` único | ✅ |
| Compatibilidad con `href` legacy | ✅ |
| Documentación creada | ✅ |
| Preparado para Forms, Contact Hub, Hero y futuros módulos | ✅ |
| Sin romper CTA Premium | ✅ |

## Siguiente OT

Integrar Experience Actions Engine en Hero Premium, Catalog Card y demás módulos del Experience Kit.
