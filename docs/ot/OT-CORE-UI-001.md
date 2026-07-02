# OT-CORE-UI-001 — Auditoría e Inventario del Core UI

| Atributo | Valor |
| --- | --- |
| OT | OT-CORE-UI-001 |
| Épica | EP-CORE-001 — Consolidación Core UI |
| Versión | 1.0.0 |
| Prioridad | Alta |
| Estado | Completada |
| Fecha cierre | 2026-06-30 |

## Objetivo

Auditar completamente el Frontend para identificar componentes canónicos, duplicados, legacy y dependencias, estableciendo la base para la consolidación del Core UI.

## Alcance

- Inventariar todos los componentes de `src/components/` (252 archivos).
- Clasificar cada componente como: Canonical, Deprecated, Experimental, Internal.
- Detectar duplicidades entre `portal/`, `institutional/` y `ui/`.
- Generar mapa de dependencias.
- Identificar componentes candidatos a unificación.
- Proponer árbol definitivo del Core UI.

## Arquitectura

- [ADR-007 — Portal Engine](../architecture/ADR-007.md)
- [PORTAL-ENGINE.md](../core/PORTAL-ENGINE.md)
- DOC-000 — Frontend Constitution v1.0 (referencia; pendiente en repo)

## UX

- [UX-AUDIT-001](../audits/UX-AUDIT-001.md) — Gaps identificados alimentan OT-CORE-UI-007

## Diseño

- [DESIGN-SYSTEM.md](../design/DESIGN-SYSTEM.md)
- [CORE-HERO-v1.md](../core/CORE-HERO-v1.md) — Hero Premium v1.0 LOCKED

## APIs

No aplica — OT de análisis documental.

## Base de datos

No aplica.

## Componentes

Ámbito completo: `src/components/` — ver entregable.

## Seguridad

No aplica.

## Validaciones

Inventario verificado por búsqueda estática de imports (`@/components/*`) y revisión de rutas en `src/app/`.

## Documentación

| Documento | Acción |
| --- | --- |
| [UI-INVENTORY.md](../frontend/UI-INVENTORY.md) | **Creado** — entregable principal |
| OT-CORE-UI-001.md | Creado — este registro |

## Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| Inventario completo generado | ✅ |
| Componentes clasificados | ✅ |
| Duplicidades identificadas | ✅ |
| Base preparada para consolidación | ✅ |
| Sin modificar lógica ni estilos | ✅ |

## Restricciones

- No modificar lógica.
- No eliminar componentes.
- No refactorizar código.
- No cambiar estilos.
- No afectar funcionalidades existentes.

## Resultado

Entregado [UI-INVENTORY.md](../frontend/UI-INVENTORY.md) con:

- 252 componentes catalogados en 15 dominios.
- 135 Canonical, 37 Deprecated, 78 Internal, 2 Experimental.
- 18 pares de duplicidad identificados.
- 6 componentes huérfanos detectados.
- Árbol Core UI v1.0 propuesto.
- Roadmap de OT-CORE-UI-002 → OT-CORE-UI-009.

## Siguiente OT

**OT-CORE-UI-002 — Componentes Canónicos:** declarar oficialmente el canon, marcar deprecated, migrar `BlockRenderer` preview hacia componentes portal.
