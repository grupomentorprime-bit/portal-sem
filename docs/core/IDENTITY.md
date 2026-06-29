# Identity & Access Management — AprendeHoy Learning OS

| Atributo | Valor |
| --- | --- |
| OT | OT-CORE-IDENTITY-001 |
| Versión | v1.7.0 |
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
├── permissions/   # Catálogo de permisos
├── roles/         # Plantillas de roles del sistema
├── policies/      # Motor de autorización
├── middleware/    # requireAuth, requirePermission, etc.
└── index.ts

src/lib/identity/  # Persistencia MongoDB
```

## Colecciones MongoDB

| Colección | Propósito |
| --- | --- |
| `identity_users` | Personas únicas |
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
| GET | `/api/identity/me` | Sesión y permisos actuales |
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

Helpers disponibles: `requireAuth`, `requireTenant`, `requirePermission`, `requireRole`, `requireOwner`.

## Modo compatibilidad

Por defecto `IDENTITY_ENFORCE` no está activo: las APIs de escritura siguen funcionando sin sesión (contexto compat con todos los permisos).

Para activar enforcement en producción:

```env
IDENTITY_ENFORCE=true
SESSION_SECRET=generar-secreto-largo-aleatorio
```

## UI administrativa

- `/admin/login` — Ingreso / bootstrap primer administrador
- `/admin/settings/team` — Miembros, invitaciones, auditoría

## Integración CMS

Los endpoints de escritura del CMS invocan `authorizeApiWrite()` con el permiso correspondiente y registran auditoría cuando enforcement está activo.

## Bootstrap

1. Configurar tenant en `cms_config`.
2. Visitar `/admin/login` — si no hay usuarios, permite crear el primer Tenant Owner.
3. Activar `IDENTITY_ENFORCE=true` cuando el equipo esté listo.
