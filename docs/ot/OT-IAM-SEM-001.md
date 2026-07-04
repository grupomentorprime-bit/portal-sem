# OT-IAM-SEM-001 — Refactor de Roles y Permisos del Portal SEM

| Atributo | Valor |
| --- | --- |
| OT | OT-IAM-SEM-001 |
| Estado | Implementado |
| Alcance | Portal Institucional + CRM + Convocatorias |

## Objetivo

Simplificar el IAM del Portal SEM con 8 roles oficiales, jerarquía clara, protección del Super Admin y base reutilizable para futuros tenants AprendeHoy y el ERP Académico.

## Roles oficiales (tenant portal)

| Código | Nombre visible |
| --- | --- |
| `super_admin` | Super Admin |
| `institution_admin` | Administrador |
| `support` | Soporte |
| `admissions` | Admisiones |
| `student_affairs` | Asuntos Estudiantiles |
| `communications` | Comunicaciones |
| `reviewer` | Revisor |
| `guest` | Consulta |

## Roles ERP (deshabilitados en tenant portal)

| Código | Estado |
| --- | --- |
| `teacher` | Reservado — no sincronizado en portal |
| `finance` | Reservado — no sincronizado en portal |
| `student` | Reservado — no sincronizado en portal |

## Jerarquía

```text
Super Admin (soporte@mentorprime.cl)
        │
        ▼
Administrador
        │
        ▼
Soporte
        │
 ├── Admisiones
 ├── Asuntos Estudiantiles
 ├── Comunicaciones
 ├── Revisor
 └── Consulta
```

## Super Admin

- Usuario reservado: `soporte@mentorprime.cl`
- Identificación por rol (`super_admin`), no solo por email
- Invisible para otros roles en listado de usuarios
- Protegido en APIs: update, delete, change role, deactivate
- Bootstrap automático en login y script manual

## Archivos clave

| Archivo | Propósito |
| --- | --- |
| `src/core/identity/roles/codes.ts` | Códigos oficiales y mapeo legacy |
| `src/core/identity/roles/hierarchy.ts` | Visibilidad y asignación por jerarquía |
| `src/core/identity/roles/defaults.ts` | Plantillas PORTAL + ERP |
| `src/lib/identity/iam-guard.ts` | Protección Super Admin y asserts |
| `src/lib/admin/institutional.ts` | Etiquetas CMS y navegación con permisos |
| `src/lib/admin/nav-access.ts` | Filtrado de menú por permisos |

## Scripts de operación

```bash
# Sincronizar roles del portal en MongoDB
npx tsx --env-file=.env scripts/sync-tenant-roles.ts seminario-ipn

# Bootstrap Super Admin reservado
npx tsx --env-file=.env scripts/bootstrap-super-admin.ts seminario-ipn soporte@mentorprime.cl
```

## Navegación CMS

Cada ítem de `ADMIN_PRIMARY_NAV` declara `requiredAnyPermission` o `requiredPermissions`. Ningún menú es visible por defecto sin permiso explícito.

## Migración desde roles legacy

| Legacy | Nuevo código |
| --- | --- |
| Tenant Owner | `super_admin` |
| Institution Admin | `institution_admin` |
| Editor | `communications` |
| Guest | `guest` |
| Student Affairs | `student_affairs` |

La sincronización migra automáticamente roles existentes por nombre legacy.

## Ajustes post-auditoría (03 jul 2026)

| Observación | Estado |
| --- | --- |
| Eliminar magic strings — lógica por `ROLE_CODES` | ✅ `src/core/identity/roles/helpers.ts` |
| Comparaciones por código, no etiqueta | ✅ APIs, UI y guards |
| Protección transversal Super Admin | ✅ team, scope, invitaciones, student-affairs |
| `isSystemAccount` en usuarios reservados | ✅ `IdentityUser.isSystemAccount` |
| Auditoría de intentos denegados (`iam.denied`) | ✅ PATCH members, invitaciones, scope |
| Impersonación Super Admin | 📋 Roadmap (prioridad baja) |

### Eventos de auditoría denegados

Cuando un actor intenta modificar un usuario protegido, se registra:

```json
{
  "action": "iam.denied",
  "metadata": {
    "attemptedAction": "membership.roles.update",
    "actorRole": "institution_admin",
    "targetRole": "super_admin",
    "result": "DENIED",
    "reason": "protected_system_account"
  }
}
```

### Separación arquitectónica (recomendación permanente)

1. **Roles IAM** — acceso al Portal Administrativo (`super_admin`, `institution_admin`, …)
2. **Roles editoriales** — clasificación pública (Autoridad, Docente, …) sin permisos IAM
3. **Estados CRM** — ciclo de vida (Interesado, Postulante, …) sin permisos IAM
