# OT-SEM-DOC-001 — Normalización del Repositorio y Gobierno Documental

| Atributo | Valor |
| --- | --- |
| OT | OT-SEM-DOC-001 |
| Versión | 1.0 |
| Prioridad | Alta |
| Estado | Completado |

## Objetivo

Normalizar completamente la documentación del Portal SEM, eliminando duplicidad de archivos, definiendo una única estructura oficial y estableciendo el repositorio como fuente única de verdad.

## Alcance

Reorganización documental exclusiva. Sin cambios en código funcional, APIs, MongoDB, CMS ni UI.

## Arquitectura

- Estructura oficial en `docs/` con subcarpetas: `architecture`, `design`, `ux`, `development`, `cms`, `ot`, `legacy`
- [HANDBOOK.md](../HANDBOOK.md) como punto de entrada
- [ARQ-001](../architecture/ARQ-001.md), [ARQ-002](../architecture/ARQ-002.md), [ARQ-003](../architecture/ARQ-003.md)

## UX

- [UX-SEM-001](../ux/UX-SEM-001.md)

## Diseño

- Documentos consolidados en [design/](../design/)
- Duplicados movidos a [legacy/](../legacy/)

## APIs

Sin cambios.

## Base de datos

Sin cambios.

## Componentes

Sin cambios funcionales. Referencia de rutas de documentación actualizada donde aplica.

## Seguridad

Sin cambios.

## Validaciones

- No existen documentos duplicados en ubicaciones activas
- Enlaces internos verificados
- `npm run lint` sin errores críticos

## Documentación

| Acción | Archivo |
| --- | --- |
| Creado | [HANDBOOK.md](../HANDBOOK.md) |
| Creado | [CHANGELOG.md](../../CHANGELOG.md) |
| Creado | [RELEASES.md](../../RELEASES.md) |
| Actualizado | [README.md](../../README.md) |
| Actualizado | [docs/README.md](../README.md) |
| Actualizado | [DEVELOPER-GUIDE.md](../development/DEVELOPER-GUIDE.md) |
| Movido | CMS docs → [cms/](../cms/) |
| Archivado | Duplicados → [legacy/](../legacy/) |
| Eliminado | `PROJECT-CONSTITUTION.md` (reemplazado por Handbook) |

## Criterios de aceptación

- [x] No existen documentos duplicados en rutas activas
- [x] Toda la documentación tiene una única ubicación oficial
- [x] Enlaces internos actualizados
- [x] README actualizado
- [x] HANDBOOK creado y enlazado
- [x] CHANGELOG y RELEASES creados
- [x] Documentación legacy movida a `docs/legacy/`

## Restricciones

- No modificar comportamiento del portal
- No inventar contenido técnico; migrar o estructurar referencias

---

> Estructura conforme a [OT-STANDARD](../development/OT-STANDARD.md)
