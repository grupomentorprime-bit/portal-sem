# OT-IAM-002 — Motor de Permisos Granulares

| Atributo | Valor |
| --- | --- |
| OT | OT-IAM-002 |
| Épica | Identity Core |
| Dependencia | OT-IAM-SEM-001 (Implementada) |
| Prioridad | Alta |
| Estado | Implementado |

## Contexto

Segunda fase del Identity Core. Se implementa **sobre** OT-IAM-SEM-001 sin rediseñar el IAM. Reutiliza `ROLE_CODES`, jerarquía, `helpers.ts`, `isSystemAccount`, auditoría `iam.denied` y protección del Super Admin.

## Restricciones respetadas

- Jerarquía OT-IAM-SEM-001 sin cambios
- 8 roles oficiales — sin roles nuevos
- APIs legacy intactas (`permissionIds` derivados automáticamente)
- Permisos solo desde catálogo centralizado
- Scopes preparados, no implementados

## Arquitectura

```text
Rol (permissionMap — plantilla)
        ↓
Overrides (permissionOverrides — por membresía)
        ↓
Techo jerárquico (ROLE_PERMISSION_TEMPLATES por ROLE_CODE)
        ↓
Permisos legacy (compatibilidad APIs existentes)
        ↓
[Futuro] Scopes (scopes.ts)
```

## Fases implementadas

| Fase | Entregable |
| --- | --- |
| 1 — Roles como plantillas | `ROLE_PERMISSION_TEMPLATES` + `permissionMap` en `identity_roles` |
| 2 — Catálogo centralizado | `src/core/identity/permissions/catalog.ts` |
| 3 — Editor de roles | `/admin/settings/roles` + API `GET/PATCH .../roles/[id]/permissions` |
| 4 — Permisos personalizados | `UserPermissionsPanel` en `/admin/settings/users` |
| 5 — Origen del permiso | Matriz Rol / Personalizado / Activo |
| 6 — Restablecer | `DELETE .../members/[id]/permissions` |
| 7 — Seguridad jerárquica | `sanitizePermissionOverrides` + techo por rol |
| 8 — Cuentas sistema | `isSystemAccount` + `assertCanManageMember` |
| 9 — Modelo de datos | `permissionMap` + `permissionOverrides` |
| 10 — Scopes | `scopes.ts` (hook vacío) |

## Catálogo de permisos (módulos)

| Módulo | Ejemplos de código |
| --- | --- |
| Convocatorias | `convocations.view`, `.create`, `.update`, `.publish`, `.close`, `.delete` |
| Participantes | `participants.view`, `.update`, `.checkin`, `.export` |
| Portal | `portal.pages.*`, `portal.media.*`, `portal.menus.*` |
| Contenido | `content.programs.manage`, `content.news.manage`, `content.events.manage` |
| Asuntos estudiantiles | `student_affairs.panel.view`, `student_affairs.scope.manage` |
| Configuración | `settings.institution.update`, `settings.integrations.manage`, `settings.team.manage` |
| Identidad | `identity.roles.manage`, `identity.members.manage`, `identity.permissions.override`, `identity.audit.read` |
| Workflows / Eventos / Académico | `workflow.*`, `events.*`, `academic.*` |

Cada permiso incluye: código, etiqueta, descripción, módulo y mapeo `impliesLegacy`.

## Resolución efectiva

Orden (`resolver.ts`):

1. Permisos del rol (`permissionMap` o migración desde `permissionIds`)
2. Overrides del usuario (`permissionOverrides`)
3. Restricciones de jerarquía (techo del `ROLE_CODE`)
4. Derivación de permisos legacy para `can()` / `requirePermission()`

## Modelo de datos

| Campo | Colección | Equivalente conceptual |
| --- | --- | --- |
| `permissionMap` | `identity_roles` | `role_permissions` |
| `permissionOverrides` | `identity_memberships` | `user_permissions` |
| `permissionIds` | `identity_roles` | Compat legacy (auto-sync) |

## APIs

| Método | Ruta | Permiso requerido |
| --- | --- | --- |
| GET | `/api/identity/permissions/catalog` | Autenticado |
| GET/PATCH/DELETE | `/api/identity/members/[id]/permissions` | `settings.team` + `identity.permissions.override` |
| GET/PATCH | `/api/identity/roles/[id]/permissions` | `identity.roles.manage` |

## UI

| Ruta | Función |
| --- | --- |
| `/admin/settings/users` | Overrides por usuario + restablecer |
| `/admin/settings/roles` | Editor de plantillas por rol |

## Seguridad

| Actor | Puede |
| --- | --- |
| Super Admin | Todo (roles, overrides, plantillas) |
| Administrador | Roles institucionales, overrides institucionales |
| Soporte | Overrides si tiene `identity.permissions.override`; no edita plantillas de rol |
| Cuentas `isSystemAccount` | Protegidas — sin overrides ni edición |

## Auditoría

| Acción | Evento |
| --- | --- |
| Cambio overrides | `membership.permissions.override` |
| Restablecer | `membership.permissions.reset` |
| Cambio plantilla rol | `role.permissions.update` |
| Intento denegado | `iam.denied` |

## Archivos clave

```text
src/core/identity/permissions/
├── catalog.ts          # Catálogo único
├── role-templates.ts   # Plantillas por ROLE_CODE
├── resolver.ts         # Resolución + techo jerárquico
└── scopes.ts           # Preparación futura

src/lib/identity/
└── permission-resolver.ts  # Integración MongoDB

src/components/admin/permissions/
├── PermissionMatrixEditor.tsx
├── UserPermissionsPanel.tsx
└── RolesPermissionsClient.tsx
```

## Migración / despliegue

```bash
npx tsx --env-file=.env scripts/sync-tenant-roles.ts seminario-ipn
```

Siembra `permissionMap` en roles de sistema que aún no lo tengan y sincroniza `permissionIds` legacy.

## Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| Roles como plantillas | ✅ |
| Herencia automática al crear usuario | ✅ |
| Overrides individuales por usuario autorizado | ✅ |
| Overrides prevalecen sobre rol | ✅ |
| Restablecer configuración del rol | ✅ |
| Catálogo único centralizado | ✅ |
| Overrides respetan jerarquía | ✅ |
| Preparado para Scopes | ✅ |
| Reutilizable multi-tenant | ✅ |

## Resultado

Identity Core de segunda generación: **Roles + Permisos + Overrides**, preparado para **+ Scopes** sin rediseñar el núcleo.
