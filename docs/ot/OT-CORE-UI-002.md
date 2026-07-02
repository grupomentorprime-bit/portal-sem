# OT-CORE-UI-002 — Canonización y Consolidación del Core UI

| Atributo | Valor |
| --- | --- |
| OT | OT-CORE-UI-002 |
| Épica | EP-CORE-001 — Consolidación del Core UI |
| Versión | 1.0.0 |
| Prioridad | Crítica |
| Estado | Completada |
| Dependencia | OT-CORE-UI-001 ✅ |
| Fecha cierre | 2026-06-30 |

## Objetivo

Declarar oficialmente el Core UI v1.0 de AprendeHoy, estableciendo el conjunto de componentes canónicos obligatorios para todos los portales institucionales.

## Alcance ejecutado

1. Canon oficial publicado en [CORE-UI-CANON.md](../frontend/CORE-UI-CANON.md).
2. Estados oficiales definidos: CANONICAL, LOCKED, INTERNAL, EXPERIMENTAL, DEPRECATED.
3. Componentes canónicos declarados (shell, hero, layout, cards, alias PortalBanner/Carousel/Feature/Timeline/Stats).
4. `@deprecated` aplicado en `institutional/`, `navigation/`, `blocks/` y huérfanos portal.
5. Preview CMS (`BlockRenderer`) migrado para hero, cta, stats, verse, teachers hacia componentes portal.
6. `InstitutionPresentation` y `TeachersGrid` delegan a componentes portal.
7. Handbook, UI-INVENTORY, PORTAL-ENGINE y CORE-HERO-v1 actualizados.

## Arquitectura

- [CORE-UI-CANON.md](../frontend/CORE-UI-CANON.md)
- [PORTAL-ENGINE.md](../core/PORTAL-ENGINE.md)
- [UI-INVENTORY.md](../frontend/UI-INVENTORY.md)

## UX

Sin cambios de UX visible intencionales; consolidación arquitectónica.

## Diseño

- [CORE-UI-CANON.md](../frontend/CORE-UI-CANON.md)
- [CORE-HERO-v1.md](../core/CORE-HERO-v1.md) — Hero LOCKED sin cambios

## APIs

No aplica.

## Base de datos

No aplica.

## Componentes

| Cambio | Archivos |
| --- | --- |
| Preview CMS migrado | `page-builder/BlockRenderer.tsx`, `preview-adapters.ts` |
| Puente legacy actualizado | `blocks/InstitutionPresentation.tsx`, `blocks/TeachersGrid.tsx` |
| Deprecación JSDoc | `institutional/*`, `navigation/*`, `blocks/*`, huérfanos `portal/*` |

## Seguridad

No aplica.

## Validaciones

```bash
npm run build
```

## Documentación

| Documento | Acción |
| --- | --- |
| CORE-UI-CANON.md | Creado |
| UI-INVENTORY.md | Actualizado |
| HANDBOOK.md | Reglas Core UI |
| PORTAL-ENGINE.md | Árbol + preview |
| CORE-HERO-v1.md | Referencia canon |
| OT-CORE-UI-002.md | Este registro |

## Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| Canon oficial publicado | ✅ |
| Componentes clasificados | ✅ |
| Estados oficiales definidos | ✅ |
| Legacy marcado como @deprecated | ✅ |
| Árbol Core UI oficial publicado | ✅ |
| Duplicidades documentadas | ✅ |
| Huérfanos clasificados | ✅ |
| Handbook actualizado | ✅ |
| Sin cambios funcionales en Hero/CMS/Media | ✅ |
| Build exitoso | ✅ `npm run build` |

## Restricciones respetadas

- Hero Premium: sin modificación de layout/CSS.
- Portal CMS, Media Manager, MongoDB: sin cambios.
- Branding, responsive, design tokens: sin cambios.
- Archivos legacy: no eliminados.

## Siguiente OT

**OT-CORE-UI-003 — Design Tokens**
