# OT-GROWTH-TEAM-CONTRACT-002 — Contrato mínimo — Equipo V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-TEAM-CONTRACT-002 |
| Tipo | Contrato funcional mínimo (sin implementación) |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-14 |
| Entrada | [OT-GROWTH-TEAM-AUDIT-001](./OT-GROWTH-TEAM-AUDIT-001.md) · [ADR-004](../../architecture/ADR-004.md) · [IDENTITY.md](../../core/IDENTITY.md) |
| Estado | **CERRADA · APTO** |
| Alcance | Congelar SOLO las decisiones necesarias para implementar Equipo V1 de forma segura |
| Fuera de alcance | Código de producto · rediseño · nuevo IAM · Platform Admin · Personas Growth · SCIM/LDAP/SSO · `sync:tenant-roles` · abrir OT de implementación |

**Restricciones cumplidas:** sin implementar; sin ampliar alcance; sin rediseñar; sin crear otro IAM; sin abrir otra OT automáticamente.

---

## Gate final

**CERRADA · APTO**

Equipo V1 queda congelado como **superficie Growth sobre Identity existente**: ver miembros e invitaciones, invitar, cancelar, cambiar rol y quitar acceso **de este Espacio**. No hay segundo motor de identidad. S1, S2/S5, S3 y S4 quedan cerrados en el alcance mínimo necesario para implementar con seguridad.

---

## 1. Decisiones congeladas

### D1 — Fuente de verdad (cierra S1)

| Capa | Responsabilidad |
| --- | --- |
| **Keycloak** | Identidad global / autenticación (email, password, `sub`, realm roles) |
| **Growth OS Identity** | Acceso y rol **por Espacio** |

Reglas no negociables:

1. Keycloak **NO** debe sobrescribir `roleIds` de una membership existente.
2. Un realm role **NO** eleva automáticamente el rol dentro de un Espacio que ya tiene membership.
3. `identity_memberships` es **SSOT** de pertenencia y rol dentro de cada Espacio.
4. `identity_roles` + el resolver actual siguen siendo el motor de permisos.
5. **No** crear sincronización paralela de roles Espacio ↔ realm.

Login Keycloak puede autenticar y localizar/crear el `identity_users`. El rol efectivo del Espacio lo decide Mongo (`membership.roleIds`), no el token.

### D2 — «Quitar acceso» (cierra S2 / S5)

En Equipo, **Quitar acceso** significa:

> Quitar o desactivar la membership del **Espacio ACTUAL**.

**No** significa:

- bloquear `identity_users`;
- suspender la cuenta global;
- quitar acceso a otros Espacios;
- usar `action=block`.

Ejemplo congelado: pertenece a Empresa A y Empresa B; Empresa A le quita acceso → pierde A, **conserva** B.

La operación V1 actúa solo sobre `identity_memberships` del `tenantId` de sesión. No escribe `user.status`. No debe expulsar sesiones de **otros** Espacios como efecto colateral de esta acción (S5).

### D3 — Una membresía por Espacio (cierra S3)

Invariante:

> **1 usuario + 1 Espacio = máximo 1 membership.**

- Reinvitar **no** crea otra membership.
- Si existe membership **active** → informar que ya tiene acceso (idempotente / 409 de producto).
- Si existe **suspended** / **archived** → **no** crear otra; resolver sobre la membership existente (reactivar / actualizar rol según flujo de invitación o aceptación).
- Protección técnica obligatoria en implementación: unicidad `(userId, tenantId)` + lookup previo a `createMembership` / accept que contemple **cualquier** status, no solo `active`.

### D4 — Último administrador (cierra S4 en alcance V1)

Growth OS **no** permite quitar acceso (ni rebajar rol fuera de capacidad administrativa) si eso deja al Espacio sin una persona capaz de administrarlo.

**Regla mínima** (jerarquía existente, sin campo `ownerUserId` nuevo):

Tras la operación debe quedar **al menos una** membership `active` cuyo rol tenga nivel jerárquico ≥ `institution_admin` (**Dueño** `super_admin` **o** **Administrador** `institution_admin`).

- **Soporte** (`support`, nivel 70) **no** cuenta como garante de administración del Espacio para esta invariante.
- Auto-quitarse el propio acceso sigue denegado (ya existe).
- **No** hay transferencia de Dueño en V1.

### D5 — Superficie y permiso

| Decisión | Valor congelado |
| --- | --- |
| Nombre de producto | **Equipo** |
| Motor | Identity actual (colecciones, APIs, jerarquía) |
| Permiso de entrada | `settings.team` (legacy existente) |
| Catálogo nuevo | **Prohibido** (`growth.team.*`, nuevo resolver, nuevo IAM) |
| Ruta canónica | Superficie Equipo; reutilizar la existente (`/admin/settings/users` vía redirect de team). La implementación elige la ruta canónica más limpia **sin** módulo paralelo |

### D6 — Roles en producto

Reutilizar `ROLE_CODES` / plantillas actuales. En UI: **nombres humanos**, nunca códigos técnicos.

| Código | Nombre humano |
| --- | --- |
| `super_admin` | Dueño del Espacio |
| `institution_admin` | Administrador |
| `support` | Soporte |
| `admissions` | Admisiones |
| `communications` | Comunicaciones |
| `student_affairs` | Asuntos Estudiantiles |
| `reviewer` | Revisor |
| `guest` | Consulta |

- Dueño del Espacio **≠** Platform Admin.
- Equipo V1 **no** asigna Dueño mientras sea `NON_ASSIGNABLE` (estado actual).

### D7 — Invitaciones

V1 mantiene el flujo existente: **Invitar** + **Cancelar**.

- No bloquear V1 por: reenviar, nuevo TTL, mejoras avanzadas de correo.
- La **aceptación** no puede generar membership duplicada (D3 / S3).

---

## 2. Invariantes

| ID | Invariante |
| --- | --- |
| I1 | Keycloak autentica; Mongo (`identity_memberships.roleIds`) es SSOT del rol por Espacio |
| I2 | 1 usuario + 1 Espacio ≤ 1 membership (cualquier status) |
| I3 | Quitar acceso = membership de este `tenantId`; nunca `user.status` global ni `action=block` |
| I4 | Tras quitar acceso / democión, queda ≥1 admin efectivo (Dueño o Administrador activo) |
| I5 | Equipo V1 no crea segundo IAM, catálogo ni selector de Espacio |
| I6 | Persona Growth / autoridades editoriales / Platform Admin no son Equipo |
| I7 | Permisos efectivos = resolver Identity actual + techo jerárquico |

---

## 3. Equipo V1 — dentro / fuera

### 3.1 Dentro (solo esto)

1. Ver miembros del Espacio activo.
2. Ver invitaciones pendientes.
3. Invitar una persona (flujo actual).
4. Cancelar una invitación.
5. Cambiar el rol de un miembro (entre asignables; sin Dueño si `NON_ASSIGNABLE`).
6. Quitar acceso a **este** Espacio (D2 + D4).

Todo reutilizando Identity actual y permiso `settings.team`.

### 3.2 Fuera de V1

- Bloquear / reactivar cuenta global  
- Transferir Dueño  
- Reenviar invitación · nuevo TTL · rediseño de correo  
- Roles personalizados · matriz avanzada de permisos por miembro/plantilla (sigue en Ajustes, no es Equipo V1)  
- Grupos · organigrama · RR.HH.  
- SCIM · LDAP · nuevo SSO · nuevo selector de Espacio  
- Platform Admin · Personas Growth · `content_people` / equipo del sitio  
- `sync:tenant-roles` como feature de producto  
- Deuda S6–S13 no necesaria para las 6 operaciones de V1  

---

## 4. Resolución de seguridad (mínimo V1)

| Hallazgo | Resolución en este contrato | Estado |
| --- | --- | --- |
| **S1** Keycloak pisa `roleIds` | D1: login no sobrescribe roles de membership existente; realm role no eleva rol de Espacio | **CERRADO** |
| **S2** `block` = cuenta global | D2: Equipo V1 no ofrece ni usa `action=block` | **CERRADO** |
| **S5** suspend/block borran sesiones globales | D2: quitar acceso es membership de este Espacio; sin efecto de expulsión global de otros Espacios | **CERRADO** |
| **S3** memberships duplicadas | D3: unicidad + accept/invitar idempotente sobre membership existente | **CERRADO** |
| **S4** último administrador | D4: guarda ≥1 Dueño o Administrador activo; sin transferencia de Dueño | **CERRADO** |

Deuda restante (S6 reactivar global, S7 token bearer, S10–S13, etc.) **no** bloquea el gate de Equipo V1 y **no** se resuelve en esta OT.

---

## 5. Componentes existentes a reutilizar

| Pieza | Uso en V1 |
| --- | --- |
| `identity_users` / `identity_memberships` / `identity_roles` / `identity_invitations` / `identity_sessions` / `identity_audit` | Modelo actual; sin colecciones nuevas |
| `GET /api/identity/team` | Read-model de miembros + invitaciones + roles asignables |
| `POST/DELETE /api/identity/invitations` | Invitar / cancelar |
| `POST /api/identity/invitations/[token]/accept` | Aceptar (endurecer contra duplicados — D3) |
| `PATCH /api/identity/members/[membershipId]` | Cambiar rol |
| Operación de baja de membership (suspend/archive/remove **sin** `block`) | Base de «Quitar acceso»; ajustar semántica a D2/D4/S5 |
| `hierarchy.ts` / `iam-guard` / `NON_ASSIGNABLE` | Visibilidad, asignación, Dueño no asignable, guarda S4 |
| Permisos OT-IAM-002 + `settings.team` | Autorización; sin `growth.team.*` |
| Labels institucionales / Platform (`Dueño del Espacio`, etc.) | Nombres humanos en UI |
| UI existente (`UsuariosCmsClient` / ruta settings users·team) | Evolucionar a superficie Equipo; no módulo paralelo |
| Switcher de Espacio + `/admin/sin-espacio` | Ya existen; no reconstruir |
| `resolveKeycloakMembership` | Ajustar frontera a D1 (auth sí; overwrite de `roleIds` no) |

**No reutilizar como modelo de Equipo V1:** `action=block`, overwrite Keycloak de roles, matriz de overrides, `TeamSettingsClient` muerto, Personas Growth, Platform Admin.

---

## 6. Gate para implementación

La OT de implementación posterior solo puede declararse apta si:

| # | Condición |
| --- | --- |
| 1 | Implementa **únicamente** las 6 operaciones de §3.1 |
| 2 | Cumple D1: Keycloak no pisa `roleIds` de membership existente |
| 3 | «Quitar acceso» = membership de este Espacio; **sin** `block` / sin `user.status` |
| 4 | Unicidad 1 usuario + 1 Espacio + accept/invitar sin duplicar (D3) |
| 5 | Guarda de último Dueño/Administrador activo (D4) |
| 6 | Reutiliza `settings.team` + Identity; **sin** nuevo IAM ni `growth.team.*` |
| 7 | Roles en UI con nombres humanos; Dueño no asignable desde Equipo |
| 8 | Superficie canónica **Equipo** sobre Identity existente; sin módulo paralelo a Usuarios |
| 9 | No incorpora ítems de §3.2 |

Si alguna condición de S1–S4 no se cumple en código, la implementación **no** es apta aunque la UI diga «Equipo».

---

## Veredicto

**CERRADA · APTO**

Contrato mínimo congelado. Listo para una OT de implementación posterior **sin** abrirla desde aquí.
