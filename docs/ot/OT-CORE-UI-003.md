# OT-CORE-UI-003 — Sistema Oficial de Design Tokens

| Atributo | Valor |
| --- | --- |
| OT | OT-CORE-UI-003 |
| Épica | EP-CORE-001 |
| Versión | 1.0.0 |
| Prioridad | Crítica |
| Estado | Completada |
| Dependencia | OT-CORE-UI-002 ✅ |
| Fecha cierre | 2026-06-30 |

## Objetivo

Implementar el Sistema Oficial de Design Tokens, eliminando variables `--sem-*` y estableciendo branding multi-tenant vía tokens semánticos.

## Resultado

| Entregable | Ubicación |
| --- | --- |
| Tokens TS | `src/design/tokens/*` |
| Tokens CSS | `src/styles/design-tokens.css` |
| DOC-002 | `docs/frontend/DOC-002-DESIGN-TOKENS.md` |
| Branding bridge | `body { --color-*: var(--brand-*, default) }` |

## Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| Sistema oficial de tokens creado | ✅ |
| Variables `--sem-*` eliminadas del Core | ✅ |
| Branding desacoplado (`--brand-*` → `--color-*`) | ✅ |
| Breakpoints centralizados | ✅ |
| Colores hardcodeados auditados | ✅ DOC-002 §12 |
| Documentación creada | ✅ |
| Build exitoso | ✅ |

## Restricciones respetadas

Hero, Header, Footer, CMS, MongoDB, Media Manager: sin cambios de lógica. Solo sustitución de variables CSS `--sem-*` por tokens semánticos.

## Siguiente OT

**OT-CORE-UI-004 — Breakpoints Oficiales**
