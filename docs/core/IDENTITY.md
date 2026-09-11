# Identity & Access Management — AprendeHoy Learning OS

| Atributo | Valor |
| --- | --- |
| OT | OT-CORE-IDENTITY-001, [OT-IAM-SEM-001](../ot/OT-IAM-SEM-001.md), [OT-IAM-002](../ot/OT-IAM-002.md) |
| Versión | v1.8.0 |
| Tag Git | v1.7.0-identity-core |
| ADR | [ADR-004 — Identity Core](../architecture/ADR-004.md) |

## Principios

1. Un usuario puede pertenecer a **múltiples tenants** mediante membresías independientes.
2. Los permisos se evalúan por **membresía**, no por tenant activo en abstracto.
3. La autorización usa **políticas** (`can`, `authorize`, `authorizeOrThrow`).
4. Toda acción relevante genera **auditoría**.
5. El Core es agnóstico de instituciones concretas.

## Arquitectura

```text
src/core/identity/
├── auth/          # Login, registro, crypto, configuración
├── platform/      # Capacidad global Growth OS (OT-GROWTH-PROD-005)
├── permissions/   # Catálogo de permisos
├── roles/         # Plantillas de roles de Espacio
├── policies/      # Motor de autorización
├── middleware/    # requireAuth, requirePermission, requirePlatformOperator
└── index.ts

src/lib/identity/  # Persistencia MongoDB
```

## Colecciones MongoDB

| Colección | Propósito |
| --- | --- |
| `identity_users` | Personas únicas (`platformRoles` = capacidad global) |
| `identity_credentials` | Proveedores de autenticación (email, OAuth futuro) |
| `identity_memberships` | Usuario ↔ tenant + roles |
| `identity_roles` | Roles por tenant con permissionIds |
| `identity_sessions` | Sesiones activas |
| `identity_audit` | Registro de auditoría |
| `identity_invitations` | Invitaciones pendientes |

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/identity/login` | Iniciar sesión |
| POST | `/api/identity/logout` | Cerrar sesión |
| POST | `/api/identity/register` | Bootstrap primer admin (solo si no hay usuarios) |
| GET | `/api/identity/me` | Sesión, permisos y Espacios |
| GET | `/api/identity/spaces` | Espacios disponibles (membresías activas) |
| POST | `/api/identity/spaces/switch` | Cambiar Espacio activo (vuelve a Inicio) |
| GET | `/api/identity/team` | Miembros, invitaciones, auditoría |
| POST | `/api/identity/invitations` | Crear invitación |
| POST | `/api/identity/invitations/[token]/accept` | Aceptar invitación |
| GET | `/api/identity/roles` | Roles del tenant |

## Middleware

```ts
import { requireAuth, requirePermission, authorize } from "@/core/identity";

const ctx = await requirePermission("cms.pages.update");
if (ctx instanceof NextResponse) return ctx;
```

Helpers disponibles: `requireAuth`, `requireSpace`, `requirePermission`, `requireRole`, `requireOwner` (Owner del Espacio), `requirePlatformOperator` (operador de Growth OS; no usa el Espacio activo).

## Roles del Espacio (OT-IAM-SEM-001)

8 roles oficiales con códigos estables (`super_admin`, `institution_admin`, …). Ver [OT-IAM-SEM-001](../ot/OT-IAM-SEM-001.md).

`super_admin` significa **solo Owner del Espacio**. No otorga acceso a Platform Admin.

## Operador de Growth OS (OT-GROWTH-PROD-005)

Capacidad global en `identity_users.platformRoles`: `platform_owner` y/o `platform_operator`. Códigos distintos de los roles de Espacio. No hay Tenant `platform`. Los `PLATFORM_ROLES` legado (mismos códigos que Espacio) **no se activan**.

Autorización: `requirePlatformOperator` — sesión + `platformRoles`. No usa membresía, Espacio activo, email ni `isSystemAccount`. Un operador no recibe membresías de clientes por el hecho de serlo.

Superficie: `/platform` y `/api/platform/*` (separadas de `/admin`). Catálogo global: `GET /api/platform/spaces` y ficha `GET /api/platform/spaces/:tenantId`. Alta: `POST /api/platform/spaces`. Entrar: switch vía `POST /api/identity/spaces/switch` (membresía obligatoria); acceso acotado opcional `POST /api/platform/spaces/:tenantId/access` (rol Soporte, nunca Dueño). No usar `GET /api/identity/spaces` como catálogo global. Grant operativo: `scripts/grant-platform-role.ts` (`--user-id` o `--email` obligatorio; sin destinatario por defecto).

Acciones globales se registran en `identity_audit` con `scope: "platform"`.

## Permisos granulares (OT-IAM-002)

Roles como plantillas (`permissionMap`) + overrides por membresía (`permissionOverrides`). Catálogo en `src/core/identity/permissions/catalog.ts`. Resolución en `resolver.ts` con techo jerárquico y compatibilidad legacy.

UI: `/admin/settings/users` (overrides), `/admin/settings/roles` (plantillas).

## Identidad obligatoria

La identidad es **siempre obligatoria** en zonas privadas (OT-GROWTH-SEC-002). `IDENTITY_ENFORCE` ya no abre el backoffice ni las APIs privadas si falta o vale `false`.

`requireAuth`, `requirePermission` y el proxy de `/admin`, `/internal` y `/platform` exigen sesión real. Las rutas públicas del Portal, login, invitaciones y endpoints de render/submit público no cambian.

```env
SESSION_SECRET=generar-secreto-largo-aleatorio
```

## UI administrativa

- `/admin/login` — Ingreso
- `/admin` — administración del **Espacio** activo
- `/platform` — Platform Admin (operadores de Growth OS; catálogo, ficha, crear y entrar a Espacios)
- `/admin/settings/team` — Miembros, invitaciones, auditoría del Espacio

## Integración CMS

Los endpoints de escritura del CMS invocan `authorizeApiWrite()` con el permiso correspondiente y registran auditoría cuando enforcement está activo.

## Bootstrap

1. Configurar tenant en `cms_config`.
2. Visitar `/admin/login` — si no hay usuarios, permite crear el primer Super Admin.
3. Ejecutar `scripts/sync-tenant-roles.ts` y `scripts/bootstrap-super-admin.ts` para producción.
4. La identidad queda activa en zonas privadas sin depender de `IDENTITY_ENFORCE`.
