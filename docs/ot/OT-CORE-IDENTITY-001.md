# OT-CORE-IDENTITY-001 — Identity & Access Management

| Atributo | Valor |
| --- | --- |
| OT | OT-CORE-IDENTITY-001 |
| Versión objetivo | v1.7.0 |
| Tag Git | v1.7.0-identity-core |
| Estado | Implementado |

## Objetivo

Sistema central de identidad, autenticación, membresías, roles y permisos multi-tenant para AprendeHoy Learning OS.

## Documentación

- [IDENTITY.md](../core/IDENTITY.md)
- [ADR-004](../architecture/ADR-004.md)

## Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| Usuarios con múltiples tenants (membresías) | ✅ |
| Roles independientes por tenant | ✅ |
| Permisos evaluados por políticas | ✅ |
| Auditoría registrada | ✅ |
| Middleware reutilizable | ✅ |
| APIs CMS con authorize() en escritura | ✅ |
| UI /admin/settings/team | ✅ |
| Modo compatibilidad | ✅ |
| Build + lint | ✅ |
