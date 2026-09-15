# OT-GROWTH-TEAM-AUDIT-001 — Auditoría funcional — Equipo Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-TEAM-AUDIT-001 |
| Tipo | Auditoría / diagnóstico (sin implementación) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-13 |
| Entrada | Pregunta central Equipo V1; [ADR-004](../../architecture/ADR-004.md); [IDENTITY.md](../../core/IDENTITY.md); [OT-IAM-SEM-001](../../ot/OT-IAM-SEM-001.md); [OT-IAM-002](../../ot/OT-IAM-002.md) |
| Estado | **CERRADA · APTO CON AJUSTES** |
| Alcance | Estado REAL de usuarios, membresías, invitaciones, roles, permisos, Keycloak y administración de miembros **antes** de definir Equipo V1 |
| Fuera de alcance | Implementación · rediseño · migración · producción · `sync:tenant-roles` · segundo IAM · SSO/SCIM/LDAP · roles personalizados avanzados · RR.HH. · abrir OT de contrato |

**Restricciones cumplidas:** solo lectura y diagnóstico; sin código de producto; sin tocar `/platform`; sin ejecutar `sync:tenant-roles`; sin segundo sistema de usuarios/roles/permisos; Personas Growth no se mezcla con Equipo.

---

## Gate final

**APTO CON AJUSTES · RECOMENDACIÓN B**

Growth OS **ya tiene** las piezas de Identity para responder, en el Espacio activo:

> ¿Quién trabaja aquí? ¿Qué puede hacer? ¿A quién puedo invitar? ¿Cómo cambio su acceso? ¿Cómo saco a alguien?

El núcleo no está vacío: hay membresía por tenant, 8 roles de Espacio, catálogo de permisos, invitaciones con correo, jerarquía IAM y una UI real (hoy titulada «Usuarios»). **No hace falta un segundo motor de identidad.**

Lo que **no** está listo para congelar Equipo V1 sin ajustes:

1. La superficie se llama Equipo en el menú y **redirige** a Usuarios/CMS.
2. Faltan operaciones humanas simples (reenviar invitación, quitar acceso de **este** Espacio, reactivar tras suspender).
3. Hay hallazgos de seguridad que **bloquean** tratar «cambiar rol» y «bloquear» como verdades de producto hasta decidir cómo resolverlos (ver §15).

| Opción | Veredicto |
| --- | --- |
| **A** | Casi: el motor existe, pero faltan operaciones y hay deuda de frontera Keycloak |
| **B** | **Elegida** — evolucionar lo existente; no inventar otro IAM |
| **C** | No — la base (usuario global + membership por Espacio + permisos) es la correcta |

---

## 1. Resumen ejecutivo

Equipo **no parte de cero**. El producto real ya vive en Identity Core:

| Capa | Qué es hoy | Superficie |
| --- | --- | --- |
| **A. Usuario / identidad** | Persona que inicia sesión (`identity_users`) | Keycloak (realm único `seminario` en ejemplo) o email local |
| **B. Miembro del Espacio** | Relación usuario ↔ tenant (`identity_memberships`) | `/admin/settings/users` (destino real de Equipo) |
| **C. Rol** | Plantilla por tenant (`identity_roles`, códigos `ROLE_CODES`) | Asignación en Equipo; edición de plantilla en `/admin/settings/roles` |
| **D. Permiso** | Capacidad concreta (catálogo granular + legacy) | Resolución efectiva por membresía + overrides |
| **E. Persona Growth** | Contacto comercial (`growth_personas`) | `/admin/personas` — **distinto** |

La pregunta central **sí tiene respuesta técnica**. La respuesta de producto está **parcial**: el listado e invitar existen; cambiar acceso existe para rol; sacar a alguien existe como archivar/eliminar membresía, pero «Bloquear» golpea la **cuenta global**, y Keycloak puede **pisar el rol del Espacio** en cada login.

**No se propone un IAM nuevo.** Equipo V1 debe ser una superficie Growth sobre este motor, con lenguaje humano y con las operaciones peligrosas fuera de alcance hasta decidir el arreglo.

---

## 2. Veredicto

| Pregunta | Respuesta real |
| --- | --- |
| ¿Quién trabaja en este Espacio? | **Sí** — membresías del `tenantId` activo (`GET /api/identity/team`) |
| ¿Qué puede hacer? | **Sí (técnico)** — rol + `permissionMap` + overrides; UI de Equipo muestra el **rol**, no «puede ver / puede gestionar» |
| ¿A quién puedo invitar? | **Sí** — wizard correo + nombre + rol asignable; correo vía evento `InvitationCreated` |
| ¿Cómo cambio su acceso? | **Parcial** — cambiar rol sí; permisos por miembro sí (matriz avanzada); suspender/bloquear **no** son equivalentes a «cambiar acceso de este Espacio» |
| ¿Cómo saco a alguien? | **Parcial** — archivar membresía y luego eliminar; no hay «quitar acceso» de un paso; no hay transferencia de Dueño |

**Persona Growth ≠ usuario del sistema.** `growth_personas.identityUserId` es un vínculo opcional técnico. Equipo no debe listar Personas. `/admin/content/people` y `/admin/content/team` son **autoridades editoriales** del portal, no el equipo de trabajo.

---

## 3. Arquitectura actual

```text
Keycloak (1 realm de plataforma, env KEYCLOAK_REALM)
   │  identidad global (email, password, sub OIDC)
   ▼
identity_users          ← la persona (status, lastLoginAt, platformRoles)
   │
   ├── identity_credentials   (email | oidc)
   ├── identity_sessions      (activeTenantId = session.tenantId)
   └── identity_memberships   ← un documento por Espacio (roleIds, status, overrides)
            │
            ▼
      identity_roles (por tenantId) → permissionMap / permissionIds
            │
            ▼
      resolver: rol → overrides → techo jerárquico → permisos efectivos

identity_invitations    ← pendiente de aceptar (token, tenantId, roleIds)
identity_audit          ← acciones de Espacio o scope: "platform"
```

**Colecciones reales** (`docs/core/IDENTITY.md` + `src/types/identity.ts`):

| Colección | Propósito |
| --- | --- |
| `identity_users` | Usuario único de plataforma |
| `identity_credentials` | Login email / OIDC Keycloak |
| `identity_memberships` | Usuario ↔ Espacio + roles + overrides |
| `identity_roles` | Roles **por tenant** (system templates) |
| `identity_sessions` | Sesión + Espacio activo |
| `identity_invitations` | Invitaciones |
| `identity_audit` | Auditoría |

**Código:**

| Capa | Ruta |
| --- | --- |
| Core | `src/core/identity/` (auth, roles, permissions, policies, platform, middleware) |
| Persistencia | `src/lib/identity/` |
| API | `src/app/api/identity/*` |
| UI Equipo (real) | `src/components/admin/UsuariosCmsClient.tsx` |
| UI Equipo (muerta) | `src/components/identity/TeamSettingsClient.tsx` — **no está importada** |

Principios vigentes (no cambiar): un usuario, 1..N Espacios; permisos por **membresía**; Dueño de Espacio ≠ operador de Platform Admin.

---

## 4. Rutas / UI existentes

### 4.1 Superficie Equipo (la que importa)

| Aspecto | Valor real |
| --- | --- |
| Ítem nav Growth OS | «Equipo» · `nav-domains.ts` zona `equipo` |
| `href` del menú | `/admin/settings/team` |
| Página de esa ruta | **redirect** → `/admin/settings/users` (`src/app/admin/settings/team/page.tsx`) |
| Página real | `/admin/settings/users` · título **«Usuarios»** · `UsuariosCmsClient` |
| Duplicado en Ajustes | «Usuarios» → el mismo `/admin/settings/users` |
| Menú de cuenta | «Administrar usuarios» → `/admin/settings/users` |
| Permiso nav Equipo | `settings.team` |
| Auth de la page | Sesión de `/admin` layout; **sin** `requirePermission` en la page (el API sí lo exige) |

Pestañas reales de la UI: **Equipo** (listado) · **Invitar** (copy interno: «Crear usuario») · **Actividad**.

### 4.2 Rutas hermanas (no son Equipo V1, pero tocan IAM)

| Ruta | Qué es |
| --- | --- |
| `/admin/settings/roles` | Matriz de permisos **por plantilla de rol** (`identity.roles.manage`) |
| `/admin/settings/activity` | Auditoría del Espacio |
| `/admin/settings/security` | Seguridad |
| `/admin/settings/profile` | Perfil de la cuenta |
| `/invite/[token]` | Aceptar invitación (público) |
| `/admin/sin-espacio` | Cuenta autenticada **sin** membresía activa |
| `/admin/portal/asuntos-estudiantiles/equipo` | Alcance de formularios del rol Asuntos Estudiantiles — **no** Equipo Growth OS |
| `/admin/content/people`, `/admin/content/team` | Autoridades / equipo editorial del **sitio** |
| `/admin/personas` | Personas Growth (contactos) |
| `/platform` | Platform Admin — **congelado**; no es Equipo |

### 4.3 APIs reales

| Método | Ruta | Permiso | Función |
| --- | --- | --- | --- |
| GET | `/api/identity/team` | `settings.team` | Miembros, invitaciones, auditoría, roles asignables |
| GET/POST/DELETE | `/api/identity/invitations` | `settings.team` | Listar / crear / cancelar |
| GET | `/api/identity/invitations/[token]` | público | Datos de invitación (sin token en respuesta de listado interno) |
| POST | `/api/identity/invitations/[token]/accept` | público | Aceptar |
| PATCH/DELETE | `/api/identity/members/[membershipId]` | `settings.team` | Cambiar rol / suspender / bloquear / archivar / restaurar / eliminar |
| GET/PATCH/DELETE | `/api/identity/members/[membershipId]/permissions` | `settings.team` + override | Overrides por miembro |
| GET | `/api/identity/members/[membershipId]/audit` | (team) | Historial del miembro |
| GET | `/api/identity/roles` | sesión | Lista roles del tenant (incluye `permissionIds`) |
| GET/PATCH | `/api/identity/roles/[roleId]/permissions` | `identity.roles.manage` | Plantilla granular |
| GET | `/api/identity/me` | sesión | Sesión, permisos, Espacios |
| GET | `/api/identity/spaces` | sesión | Espacios de **esta** cuenta |
| POST | `/api/identity/spaces/switch` | sesión | Cambiar Espacio activo (exige membresía `active`) |
| POST | `/api/identity/login` · `/logout` · Keycloak | — | Identidad |

---

## 5. Modelo usuario / membership / tenant

### 5.1 Usuario (`IdentityUser`)

Campos reales: `_id`, `email`, `emailVerified`, `displayName`, `photoMediaId?`, `jobTitle?`, `phone?`, `timezone?`, `locale?`, `status` (`active` \| `suspended` \| `pending`), `isSystemAccount?`, `platformRoles?` (`platform_owner` \| `platform_operator`), `lastLoginAt?`, `createdAt`, `updatedAt`.

El usuario es **global**. No tiene `tenantId`.

### 5.2 Membresía (`IdentityMembership`)

Campos reales: `_id`, `tenantId`, `userId`, `roleIds[]`, `status` (`active` \| `invited` \| `suspended` \| `archived`), `studentAffairsScope?`, `permissionOverrides?`, `joinedAt`, `invitedBy?`, `createdAt`, `updatedAt`.

`findMembership` **solo** devuelve `status: "active"`. Listado de Equipo incluye `active`, `suspended`, `archived` (no `invited` en membership; lo pendiente vive en `identity_invitations`).

No hay índice único documentado `(userId, tenantId)`. `createMembership` inserta siempre. Riesgo de duplicado: ver §15.

### 5.3 Tenant activo

- Se guarda en `identity_sessions.tenantId` (ADR-008 `activeTenantId`).
- Se elige con `pickActiveTenantId`: preferred si sigue válido, si no la membresía más antigua (`joinedAt` ASC).
- Cambio explícito: `POST /api/identity/spaces/switch` + UI en menú de cuenta. Tras el switch, vuelve a `/admin`.
- Si pierde la membresía activa del Espacio actual, `reconcileSessionActiveTenant` elige otro o deja la sesión **sin Espacio** (`/admin/sin-espacio`).
- Un usuario puede tener **distinto rol por Espacio** (`roleIds` por membership). Eso ya existe. No cambiarlo.

---

## 6. Keycloak + Identity

Frontera real (código, no deseo):

| Pregunta | Respuesta |
| --- | --- |
| ¿Qué guarda Keycloak? | Identidad global: usuario, email, password, `sub`, roles de **realm** (`realm_access.roles`). Un realm por env: `KEYCLOAK_REALM` (ejemplo `.env.example`: `seminario`). No guarda memberships de Espacio. |
| ¿Qué guarda la plataforma? | Usuario Mongo, credencial OIDC, membresías, roles por tenant, invitaciones, sesiones, auditoría, `platformRoles`. |
| ¿Quién decide los permisos efectivos? | El **resolver de la plataforma** (`resolveMembershipPermissions`) sobre roles Mongo + overrides + techo. `authorize()` usa los legacy derivados. |
| ¿Dónde se asignan los roles de Espacio? | En Mongo (`roleIds` de la membresía) vía invitación, PATCH de miembro, bootstrap, provision de tenant, grant de Platform Admin (Soporte). |
| ¿Dónde se sincronizan? | Tensión real: `resolveKeycloakMembership` **reescribe** `roleIds` si el access token trae realm roles mapeables. Comentario del propio archivo: «Keycloak = identidad global. Membresías viven en Mongo» — el código de login **no siempre respeta** esa frontera. |
| ¿Realm único de plataforma? | **Sí, un realm por despliegue** (`KEYCLOAK_URL` + `KEYCLOAK_REALM`). No hay un realm por Espacio. |

`AUTH_BACKEND=keycloak` (ejemplo de entorno) desactiva login/registro local. Invitación entonces: provisiona shell en Keycloak (`provisionKeycloakUserForInvite`), el invitado define password, o si ya tiene password se le pide ir a login.

Mapeo realm → código CMS (`src/lib/identity/keycloak-profile.ts`): `owner` / `tenant-owner` / `super_admin` / `director-general` → `super_admin`; `admin` / `institution-admin` → `institution_admin`; etc.

**Esto no es arquitectura paralela a crear.** Es la frontera que Equipo V1 debe **respetar y, en contrato posterior, decidir** (ver hallazgo S1). Hasta esa decisión, **no se puede afirmar** que «cambiar rol en Equipo» es la fuente de verdad si Keycloak está activo.

Login Keycloak **no** comprueba `user.status` antes de emitir cookie; `loadSessionContext` sí exige `status: "active"`, así que un usuario bloqueado queda con cookie inútil. Email local sí rechaza `status !== "active"`.

---

## 7. Miembros

Qué representa hoy a «alguien que pertenece a un Espacio»: una fila de `identity_memberships` + datos de `identity_users`.

| Campo de producto | Estado | Dónde |
| --- | --- | --- |
| Nombre | **EXISTE** | `identity_users.displayName` |
| Correo | **EXISTE** | `identity_users.email` |
| Estado | **EXISTE** | `membership.status` (`active` / `suspended` / `archived`). `user.status` es **otra** capa (cuenta global) |
| Rol | **EXISTE** | `membership.roleIds` → `identity_roles` (código + label institucional) |
| Tenant / Espacio | **EXISTE** | `membership.tenantId` (no mostrar en UI) |
| Fecha incorporación | **EXISTE** | `membership.joinedAt` (API lo envía; la tarjeta de UI **no lo muestra**) |
| Último acceso | **EXISTE PARCIAL** | `identity_users.lastLoginAt` — último login de la **cuenta**, no del Espacio |
| Invitación | **EXISTE** | documento aparte; no es un estado de membership `invited` en el listado real |
| Activación / desactivación | **EXISTE PARCIAL** | suspender/archivar membresía sí; reactivar desde `suspended` **no**; bloquear escribe `user.status` |

IDs internos en API de Equipo: `membershipId`, `userId`. Necesarios para mutar; no son dato humano.

---

## 8. Invitaciones

Flujo real:

```text
Actor con settings.team
  → POST /api/identity/invitations { email, displayName, roleCode }
  → identity_invitations (pending, token 24 bytes, TTL 30 min, tenantId del Espacio activo)
  → evento InvitationCreated → sendInvitationEmail (Resend) → /invite/{token}
  → GET público del token → POST accept
  → createMembership + acceptInvitation (acceptedAt / acceptedBy)
```

| Pieza | Estado |
| --- | --- |
| API crear | **EXISTE** — `settings.team`; rol por defecto `communications` si no se envía |
| Token | **EXISTE** — `generateToken(24)` hex; lookup global por token + pending + no expirado |
| Expiración | **EXISTE** — 30 min (`INVITATION_TTL_MINUTES`); techo 30. Email no-Keycloak dice **15 min** (copy desalineado) |
| Estado pendiente | **EXISTE** — listado solo `pending` y no expiradas |
| Correo | **EXISTE** — handler `notifications.invitationEmail`; URL del dominio del Espacio |
| Actor que invita | **EXISTE** — `invitedBy` = `ctx.user._id` |
| Tenant | **EXISTE** — siempre el Espacio de la sesión del actor (no elige otro tenant) |
| Aceptar | **EXISTE** — local: crea usuario o adhiere membership; Keycloak: password o `redirectLogin` |
| Cancelar | **EXISTE** — DELETE → `revoked` |
| Reenviar | **NO EXISTE** — ni API ni UI. TTL 30 min hace este hueco **operativo** |
| Email distinto al invitado | **EXISTE PARCIAL** — el formulario pone el correo en solo lectura; accept **no** vuelve a pedir el email ni exige sesión de ese usuario. Quien tenga el enlace actúa como ese correo |
| Usuario ya miembro activo | **EXISTE** — 409 «Este usuario ya tiene acceso al CMS.» |
| Usuario suspendido/archivado | **NO CUBIERTO** — `findMembership` ignora no-activos; se puede invitar de nuevo y **crear otra membresía** |

Keycloak: si el provision falla, la invitación Mongo **igual se crea** (solo `console.error`). El invitado puede no existir en el IdP.

No construirlo ahora; V1 debe decidir TTL + reenvío **sobre este flujo**, no otro.

---

## 9. Roles

Inventario **real** (`ROLE_CODES` + `PORTAL_TENANT_ROLES`). Códigos estables en inglés; labels humanos ya existen en dos diccionarios distintos (CMS vs Platform Admin).

| Código técnico | Nombre en plantilla | Label CMS (`INSTITUTIONAL_ROLE_LABELS`) | Label Platform (`labelSpaceRole`) | Uso actual | Ámbito | ¿UI? | ¿Asignable? | ¿Exponer al usuario final? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `super_admin` | Super Admin | Super Admin | **Dueño del Espacio** | Control total del Espacio; invisible para no-owners; cuenta sistema `soporte@mentorprime.cl` | **Tenant** (mal llamado «super») | Solo visible para otro `super_admin` | **No** (`NON_ASSIGNABLE`) | No como `super_admin`. Si se muestra: Dueño |
| `institution_admin` | Institution Admin | Administrador | Administrador | Admin normal del Espacio: equipo, settings, Growth | Tenant | Sí | Sí (owner y admin) | Sí, como Administrador |
| `support` | Support | Soporte | Soporte | Operación; puede gestionar equipo **salvo** admins; grant de Platform Admin al «entrar» | Tenant | Sí | Sí | Sí, con cuidado: no es Platform Admin |
| `admissions` | Admissions | Admisiones | Admisiones | Growth (Personas/Ventas/Campañas/…) + lectura CMS/forms | Tenant | Sí | Sí | Sí |
| `student_affairs` | Student Affairs | Asuntos Estudiantiles | Asuntos Estudiantiles | Convocatorias / check-in; **sin** `settings.team` | Tenant | Sí | Sí | Sí |
| `communications` | Communications | Comunicaciones | Comunicaciones | Editorial / portal | Tenant | Sí | Sí | Sí |
| `reviewer` | Reviewer | Revisor | Revisor | Lectura/gestión de contenido limitada | Tenant | Sí | Sí | Sí |
| `guest` | Guest | Consulta | Consulta | Solo lectura portal/media | Tenant | Sí | Sí | Sí (Consulta, no Guest) |
| `teacher` / `finance` / `student` | ERP | — | — | **No sincronizados** en tenant portal | Reservado | No Equipo | No | No |

**`PLATFORM_ROLES` en `defaults.ts`:** legado, **no se activa**. Colisiona códigos con Espacio. Autorización global real: `platform_owner` / `platform_operator` en el usuario.

Permisos principales (plantilla `PORTAL_TENANT_ROLES` / `ROLE_PERMISSION_TEMPLATES`):

- **Dueño (`super_admin`)**: todo el catálogo.
- **Administrador**: CMS salvo delete de páginas; settings.team; members.manage; Growth view/manage; **sin** `identity.roles.manage`.
- **Soporte**: similar a admin en Growth/CMS; `settings.team` + members.manage; **no** ve ni gestiona Dueño ni Administrador.
- **Admisiones**: Growth people/sales/campaigns/automations/analytics; no equipo.
- **Comunicaciones / Revisor / Consulta / Asuntos Estudiantiles**: sin Growth people ni `settings.team`.

Jerarquía (`hierarchy.ts`): Dueño 100 → Admin 80 → Soporte 70 → operativos 40 → Revisor 30 → Consulta 10.

Los nombres técnicos **no** deben llegar a UI. Platform Admin ya humaniza Dueño; la UI de Usuarios todavía dice «Super Admin».

---

## 10. Permisos

Sistema real (OT-IAM-002), ya usado por Personas/Ventas/Campañas/Analítica:

| Pieza | Archivo | Rol |
| --- | --- | --- |
| Registry legacy | `src/core/identity/permissions/registry.ts` | IDs que consume `authorize()` (`settings.team`, `growth.people.view`, …) |
| Catálogo granular | `src/core/identity/permissions/catalog.ts` | Códigos UI (`settings.team.manage` implica `settings.team`) |
| Role templates | `src/core/identity/permissions/role-templates.ts` | `permissionMap` por `ROLE_CODES` + techo |
| Defaults legacy | `src/core/identity/roles/defaults.ts` | `permissionIds` al sincronizar |
| Overrides | `membership.permissionOverrides` | por miembro; sanitizados al techo del rol |
| Resolución | `src/core/identity/permissions/resolver.ts` + `src/lib/identity/permission-resolver.ts` | rol → override → ceiling → legacy |
| Sync | `ensureTenantRoles` (runtime) y `scripts/sync-tenant-roles.ts` | ver §11 |
| Scopes | `permissions/scopes.ts` | **preparado, no aplicado** |

Equipo / APIs de miembros autorizan con **`settings.team`** (legacy), no con `settings.team.manage` ni `identity.members.manage` (estos existen en catálogo/plantillas pero no son el guard de las rutas de Equipo).

**¿Equipo V1 puede reutilizar este motor sin crear otro?**

**REUTILIZAR** el motor (catálogo + templates + resolver + jerarquía).

**EVOLUCIONAR** la superficie: Equipo V1 no debe abrir la matriz granular ni inventar permisos `growth.team.*` si `settings.team` ya abre la puerta. Como mucho, alinear nav/copy y, en un contrato posterior, unificar el guard (`settings.team` vs `settings.team.manage`).

**NO APTO** sería un segundo catálogo o roles «Equipo» paralelos. No aplica.

---

## 11. `sync:tenant-roles`

**No ejecutado en esta OT.**

| Pregunta | Respuesta |
| --- | --- |
| Qué es | `npm run sync:tenant-roles` → `npx tsx scripts/sync-tenant-roles.ts [tenantId]` |
| Default si no hay arg | **`seminario-ipn`** — un tenant, no «todos» |
| Cuándo se necesita | Tenants **ya** sincronizados cuyo `identity_roles` no tiene permisos nuevos de código (Personas V1: `growth.people.*`; igual Campañas/Analítica/Automatizaciones) |
| Qué modifica | Documentos `identity_roles` de **ese** `tenantId`: crea roles portal faltantes; si `system`, actualiza `code`/`name`/`description`; pisa `permissionIds` si difieren de la plantilla; **siembra** `permissionMap` solo si está vacío |
| Qué NO modifica | Membresías, usuarios, invitaciones, `platformRoles`, tenants, `permissionOverrides`. **No** recorre todos los Espacios |
| ¿Pisa personalizaciones? | **Parcial.** `permissionMap` ya poblado (incluye ediciones de `/admin/settings/roles`) **se conserva**. `permissionIds` de roles `system` **sí se realinean**. Resolver usa `permissionMap` si existe → las plantillas editadas en UI suelen sobrevivir; el vector legacy puede quedar desfasado |
| ¿Idempotente? | Sí en la práctica: reejecutar sin cambios de plantilla no inserta de nuevo; loguea actualizados solo si hay diff |
| ¿Afecta a todos los tenants? | **No.** Hay que pasar cada `tenantId` |
| Relación con altas de Equipo | `ensureTenantRoles` en mutaciones de invitación/rol hace un sync **más suave** (no pisa `permissionMap` existente; sí puede actualizar `permissionIds` system). Altas nuevas de tenant usan plantillas actuales. Equipo V1 **no** debe disparar el script de ops |
| Riesgos | Correr sin arg sobre `seminario-ipn` en el entorno equivocado; asumir que hereda People/Campaigns en **todos** los Espacios; desalinear `permissionIds` vs `permissionMap` |

Pendiente operativo heredado de Personas/Campañas/Analítica: ejecutar el script **por tenant** en despliegue, no desde Equipo V1.

---

## 12. Administradores

| Pregunta | Respuesta |
| --- | --- |
| ¿Existe owner? | **Sí, como rol** `super_admin` del Espacio. Platform Admin lo etiqueta «Dueño del Espacio» (`owners[]`, `owner` = el más antiguo). No hay campo `ownerUserId` aparte |
| ¿Existe admin? | **Sí** — `institution_admin` = administrador normal del Espacio |
| ¿`SUPER_ADMIN` es plataforma o Espacio? | **Espacio.** No abre `/platform`. Operador de plataforma = `platformRoles` |
| ¿`INSTITUTION_ADMIN` es el admin normal? | **Sí** |
| ¿Puede haber más de un admin? | **Sí.** La jerarquía permite a Dueño y a Administrador asignar `institution_admin`. Dueño **no** se asigna por Equipo |
| ¿Puede haber más de un Dueño? | **Posible** por bootstrap, provision de tenant, o mapeo Keycloak `owner`/`super_admin`. Equipo no ofrece «hacer Dueño» |
| ¿Quién puede administrar Equipo hoy? | Quien tenga `settings.team` en el Espacio activo: Dueño, Administrador y **Soporte**. Admisiones/Comunicaciones/etc. no. Soporte no ve ni toca Dueño ni Administrador |

`requireOwner()` existe (exige `super_admin`); las APIs de Equipo **no** lo usan — usan permiso `settings.team` + jerarquía `iam-guard`.

No hay transferencia de administración.

---

## 13. Platform Admin boundary

`/platform` está **cerrado y congelado**. Solo se audita la relación.

| Responsabilidad | Dueño |
| --- | --- |
| Crear / listar / fichar Espacios (tenants) | **Platform Admin** |
| Entrar a un Espacio de cliente | Switch con **membresía obligatoria**; grant opcional `POST /api/platform/spaces/:tenantId/access` → membership **Soporte**, nunca Dueño (`grantOperatorSpaceAccess`) |
| Operadores globales | `identity_users.platformRoles` — no viven en `identity_roles` ni en un tenant `platform` |
| Quién trabaja **dentro** del Espacio, invitaciones, roles de colaboradores | **Equipo (Growth OS /admin)** |
| Ver Dueños/Admins de un Espacio (ficha) | Platform Admin **lee** memberships (catálogo); no es la UI de Equipo |

Un operador de Growth OS **no** recibe membresías de clientes por ser operador. Si entra, queda como Soporte de ese Espacio — y entonces **sí** puede usar Equipo de ese Espacio dentro de la jerarquía Soporte (no gestiona Administradores).

Equipo V1 no debe absorber alta de tenants, catálogo global, ni grant de acceso de operadores.

---

## 14. Operaciones existentes

| Operación | Estado | Motor real |
| --- | --- | --- |
| Ver miembros | **EXISTE** | `GET /api/identity/team` + tarjetas `UserCmsCard` |
| Invitar | **EXISTE** | `POST /api/identity/invitations` + wizard + email |
| Reenviar invitación | **NO EXISTE** | — |
| Cancelar invitación | **EXISTE** | `DELETE /api/identity/invitations` `{ invitationId }` |
| Cambiar rol | **EXISTE** | `PATCH /api/identity/members/:id` `{ roleCode }` · un rol (reemplaza `roleIds`) |
| Desactivar acceso (este Espacio) | **PARCIAL** | `DELETE ?action=suspend` → membership `suspended` + **cierra todas las sesiones de la cuenta** |
| Bloquear cuenta | **EXISTE** (peligroso) | `?action=block` → `user.status=suspended` **global** + membership suspended + sesiones |
| Reactivar | **PARCIAL** | `?action=restore` **solo** si `archived`; no hay unsuspend ni unblock; restore **no** limpia `user.status` |
| Eliminar membership | **EXISTE** | Archivar primero, luego `?action=remove` |
| Transferir administración / Dueño | **NO EXISTE** | — |
| Overrides de permisos | **EXISTE** (fuera de Equipo V1 recomendado) | `/permissions` + drawer «Permisos» |
| Editar plantilla de rol | **EXISTE** (otra pantalla) | `/admin/settings/roles` |
| Cambiar de Espacio | **EXISTE** | menú cuenta + `spaces/switch` |

Auto-protección: no puedes `DELETE` tu propia membership. No hay guarda de «último administrador».

---

## 15. Seguridad

Hallazgos **solo documentados**. Sin fixes. Cualquier propuesta de Equipo V1 que **dependa** de un comportamiento marcado CRÍTICO/ALTO queda **detenida** hasta decisión.

| ID | Hallazgo | Severidad | Dependencia detenida |
| --- | --- | --- | --- |
| **S1** | En login Keycloak, si el token trae realm roles mapeables, `updateMembershipRoles` **pisa** los `roleIds` del Espacio. `admin` → Administrador; `owner`/`super_admin` → Dueño. Equipo deja de ser fuente de verdad. También puede **crear** membership **sin** invitación si hay realm roles | **CRÍTICO** | Tratar «cambiar rol» / «invitar con rol X» como persistente mientras `AUTH_BACKEND=keycloak` |
| **S2** | `action=block` suspende `identity_users.status` (cuenta global). Un admin del Espacio A puede dejar al usuario sin login en el Espacio B | **ALTO** | Usar «Bloquear» como «quitar acceso de este Espacio» |
| **S3** | Invitar a un email con membership `suspended`/`archived` no 409: `findMembership` solo mira `active`. Accept hace `createMembership` sin unique `(userId, tenantId)` → **doble membresía** y bypass de la baja | **ALTO** | Reinvitar / «reactivar por invitación» sobre el flujo actual |
| **S4** | No hay guarda de último Dueño/Administrador. Se puede archivar/eliminar al último admin visible (el Dueño sistema puede quedar oculto) | **MEDIO** | «Quitar acceso» como operación feliz de V1 sin regla |
| **S5** | `suspend` y `block` llaman `deleteUserSessions(userId)` **global** — echan al usuario de todos los Espacios | **MEDIO** | «Suspender» = solo este Espacio |
| **S6** | No hay unsuspend; `restore` no reactiva `user.status`. Un bloqueo puede ser **irreversible desde Equipo** | **MEDIO** | Prometer «Reactivar» sobre las acciones actuales |
| **S7** | Token de invitación es bearer: quien lo tenga acepta. Correo del form es read-only pero el accept no revalida identidad distinta. TTL 30 min mitiga. Reutilización: token queda `accepted` / `revoked` / expirado — **no** se reutiliza en pending | **BAJO** (reuso) / **MEDIO** (enlace = capacidad) | — |
| **S8** | Asignar `super_admin` por Equipo está denegado. Editar Dueño denegado. Cuentas `isSystemAccount` / email bootstrap ocultas. Escalamiento **dentro de Mongo** está acotado por jerarquía. El agujero es S1 (Keycloak), no la API PATCH | — (control OK en API Equipo) | — |
| **S9** | Cross-tenant en mutaciones: `membership.tenantId !== ctx.tenantId` → 404. Switch exige membresía active. Queries de team filtran `ctx.tenantId`. Aislamiento de Equipo **correcto** si el tenant de sesión es el correcto | — | — |
| **S10** | `GET /api/identity/roles` solo exige sesión: cualquier miembro ve `permissionIds` de todos los roles del Espacio | **BAJO** | — |
| **S11** | Page `/admin/settings/users` no hace `requirePermission`; un rol sin `settings.team` puede abrir la URL y ver error de API. Enumeración de miembros queda detrás de `settings.team` | **BAJO** | — |
| **S12** | IDs `membershipId` / `userId` / `invitation.id` expuestos a quien ya gestiona Equipo. Esperable para admin. No enumeración pública de usuarios | **BAJO** | — |
| **S13** | Primer usuario Keycloak de un tenant **sin** memberships recibe Dueño. Bootstrap email recibe Dueño al login. Correcto para provision; peligroso si el host preferred apunta a un Espacio vacío ajeno | **MEDIO** (ops / host) | — |

**S1 y S2 detienen** cualquier copy de Equipo V1 del tipo «el rol que eliges aquí es el que tiene» o «bloquear = sacarlo de tu Espacio» hasta que el contrato decida: (a) Keycloak no escribe `roleIds` de Espacio, (b) Equipo no ofrece bloqueo de cuenta global.

---

## 16. Multi-tenant / multi-Espacio

Arquitectura vigente — **no cambiar**:

```text
Usuario (identity_users)
   └── 1..N identity_memberships (un rol set por Espacio)
         └── session.tenantId = Espacio activo
```

| Caso | Comportamiento real |
| --- | --- |
| Un solo Espacio | Switcher puede mostrar uno; entra directo a ese tenant |
| Varios Espacios | Menú de cuenta lista `spaces`; switch POST; permisos se recargan de la membership del destino |
| Pierde acceso al activo | Reconciliación a otro activo o `/admin/sin-espacio` |
| Distinto rol por Espacio | Sí, por diseño |
| Evitar acceso cruzado | Guards `requireSpace` / `requireTenant` / filtro `tenantId` en APIs de miembros |
| Platform Admin | No usa `GET /api/identity/spaces` como catálogo global; catálogo propio `/api/platform/spaces` |

Selector de Espacio: **ya existe**. Equipo V1 no debe construir otro.

---

## 17. UX actual (sin rediseñar)

Deuda para **AGENTE 1**, no para implementar ahora.

| Aspecto | Qué ve el usuario |
| --- | --- |
| Ruta | Menú «Equipo» → redirect silencioso a `/admin/settings/users` titulado **Usuarios** |
| Listado | Tarjetas: nombre, correo, badge de rol (label humano), estado, último acceso relativo |
| Acciones | Editar rol, Permisos (matriz), Historial, Suspender / Bloquear / Eliminar (archivar) |
| Lenguaje | Mezcla CMS («Crear usuario», «acceso al CMS», «colaborador») + Equipo + Super Admin |
| Roles técnicos | API envía `code`; UI muestra `label`. Dueño sigue diciéndose Super Admin en CMS |
| Invitación | Wizard 4 pasos; aviso TTL 30 min; pendientes con Cancelar; **sin** reenviar |
| Errores | Banner rojo con `data.error` del API |
| Empty | «No hay usuarios en este filtro.» / «No hay invitaciones pendientes.» |
| Filtros | Rol (grupos CMS), estado, búsqueda, orden nombre / último acceso |
| Mobile | Controles apilables; no auditado visualmente en esta OT |
| Claridad | Operaciones de baja son poco humanas (archivar luego eliminar; bloquear vs suspender opaco) |
| Código muerto | `TeamSettingsClient` (formulario más crudo, no cableado) |

Claridad de producto: el usuario **puede** ver quién está y invitar; **no** tiene un verbo único «Quitar acceso de este Espacio».

---

## 18. Qué reutilizar

- Colecciones y tipos Identity (`IdentityUser` / `Membership` / `Invitation` / `Role`).
- `GET /api/identity/team` como read-model de Equipo.
- Invitaciones + email + `/invite/[token]`.
- Jerarquía `iam-guard` / `hierarchy.ts` (no asignar Dueño; ocultar Dueño a no-owners).
- Motor de permisos OT-IAM-002 (sin segundo catálogo).
- Switcher de Espacio y `sin-espacio`.
- Labels humanos ya existentes (`getInstitutionalRoleLabel`, `labelSpaceRole`) — unificar en contrato UX, no inventar códigos.
- Auditoría `identity_audit` (`user.invite`, `membership.*`).
- Distinción `platformRoles` vs roles de Espacio.

---

## 19. Qué falta

Para que Equipo sea la respuesta simple (producto), **sin** nuevo IAM:

1. Superficie canónica (una ruta, un nombre: Equipo) — hoy Equipo ≠ Usuarios ≠ CMS.
2. Reenviar invitación + política de TTL razonable.
3. «Quitar acceso» = membership de **este** Espacio, sin `user.status` global (S2/S5).
4. Reactivar simétrico (unsuspend / no duplicar membership — S3/S6).
5. Guarda de último administrador (S4).
6. Decisión de frontera Keycloak: membresía Mongo como SSOT de rol de Espacio (S1).
7. Copy humano (Invitar persona, Rol, Acceso, Invitación pendiente) — AGENTE 1.
8. `joinedAt` visible si se quiere «fecha de incorporación».
9. Último acceso **por Espacio** (hoy es login global).
10. Page-level `requirePermission` alineado al API.

No es obligatorio para un V1 mínimo: matriz de overrides, edición de plantillas, grupos, organigrama.

---

## 20. Qué NO construir

- Nuevo IAM / Identity / Keycloak realm por Espacio.
- Segundo sistema de roles o permisos (`growth.team.*` paralelo).
- Nuevo selector de Espacio.
- SSO adicional, SCIM, LDAP.
- Roles personalizados avanzados / matriz granular como corazón de Equipo V1 (ya existe en Ajustes; no es el producto Equipo).
- Grupos, organigramas, RR.HH., control horario, contratos, remuneraciones.
- Mezclar Personas Growth, Autoridades (`content_people`) o «equipo» del sitio público.
- Módulo Platform Admin dentro de Equipo.
- Transferencia de Dueño en V1 (no existe; no improvisar).
- Ejecutar `sync:tenant-roles` como feature de producto.

Equipo Growth OS ≠ módulo de RR.HH.

---

## 21. Recomendación A / B / C

**RECOMENDACIÓN B — EVOLUCIONAR LO EXISTENTE.**

La base es la correcta (usuario global + membership por Espacio + roles plantilla + invitaciones). Faltan operaciones de producto y hay que **cerrar frontera de seguridad** (S1, S2, S3) antes de vender Equipo como control de acceso simple.

No es A: no basta «ordenar copy»; el bloqueo global y el overwrite Keycloak no son cosmética.

No es C: no hay que replantear Identity. Replantear sería el error.

---

## 22. Propuesta de alcance para Equipo V1

**Solo recomendación para la siguiente OT de contrato. No congela Equipo V1. No abre CONTRACT-002.**

### Pregunta que V1 debería responder

En **este** Espacio: ver miembros, invitar a una persona con un rol, cambiar su rol, cancelar una invitación pendiente, quitarle el acceso **a este Espacio**.

### Dentro (recomendado)

- Reutilizar Identity tal cual (colecciones, APIs, jerarquía).
- Una superficie Equipo (canónica sobre `/admin/settings/users` o `/admin/settings/team`, sin segundo módulo).
- Listado: nombre, correo, rol humano, estado de **membresía**, invitación pendiente.
- Invitar + cancelar (flujo actual).
- Cambiar rol entre los asignables **si y solo si** el contrato cierra S1 (Keycloak no pisa `roleIds`) o declara V1 solo válido con membership Mongo como SSOT.
- Quitar acceso = archivar/suspender **membership** de este tenant, con guarda de último admin — **no** `block` global.
- Empty/error en lenguaje de Equipo, no de CMS.
- Permiso de entrada: el existente `settings.team`.

### Fuera de V1

- Reenviar / TTL nuevo (salvo que contrato lo meta como ajuste mínimo del flujo actual).
- Matriz de permisos por persona y por rol (se queda en Ajustes).
- Transferir Dueño.
- Reactivar/bloquear cuenta global.
- Custom roles, grupos, RR.HH., SCIM.
- `sync:tenant-roles` como botón.
- Cualquier operación que dependa de S1/S2/S3 **sin** decisión explícita.

### Lenguaje futuro (no copy congelado)

Evitar en UI: `super_admin`, `institution_admin`, `settings.team`, CMS, membership, tenantId.

Tender a: Equipo, Miembros, Invitar persona, Rol, Acceso, Puede ver / Puede gestionar, Invitación pendiente, Quitar acceso.

Dueño del Espacio ≠ Super Admin ≠ Platform Admin.

### Gate de la siguiente OT

El contrato no debe asumir que «Bloquear» o el rol de Keycloak son el modelo de Equipo. Si no se decide S1, V1 solo puede **mostrar** miembros e invitar, y debe marcar «cambiar rol» como no garantizado bajo Keycloak.

---

## Anexo — Archivos de referencia

| Área | Archivos |
| --- | --- |
| Tipos | `src/types/identity.ts` |
| Docs | `docs/core/IDENTITY.md`, `docs/architecture/ADR-004.md`, `docs/ot/OT-IAM-SEM-001.md`, `docs/ot/OT-IAM-002.md` |
| Roles | `src/core/identity/roles/codes.ts`, `defaults.ts`, `hierarchy.ts`, `helpers.ts` |
| Permisos | `permissions/catalog.ts`, `registry.ts`, `role-templates.ts`, `resolver.ts` |
| Guards | `src/core/identity/middleware/guards.ts`, `src/lib/identity/iam-guard.ts` |
| Persistencia | `src/lib/identity/{memberships,invitations,users,roles,sessions,active-space,keycloak-access}.ts` |
| Sync | `scripts/sync-tenant-roles.ts` |
| UI | `src/components/admin/{UsuariosCmsClient,InviteUserWizard,UserCmsCard,UserMemberDrawer}.tsx` |
| Platform | `src/core/identity/platform/{codes,grant-space-access,capability}.ts`, `src/lib/platform/{spaces,space-labels}.ts` |
| No confundir | `src/lib/content/team-groups.ts`, `src/app/(site)/equipo/page.tsx`, `growth_personas` |
