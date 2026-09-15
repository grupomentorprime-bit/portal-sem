# OT-GROWTH-TEAM-IMPLEMENT-003 — Implementación mínima — Equipo V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-TEAM-IMPLEMENT-003 |
| Tipo | Implementación funcional mínima |
| Agente | AGENTE 2 — Operatividad / Funcionalidad |
| Fecha | 2026-09-14 |
| Entrada | [OT-GROWTH-TEAM-CONTRACT-002](./OT-GROWTH-TEAM-CONTRACT-002.md) · [OT-GROWTH-TEAM-AUDIT-001](./OT-GROWTH-TEAM-AUDIT-001.md) |
| Estado | **CERRADA · APTO** |
| Alcance | Solo lo congelado en TEAM-CONTRACT-002: D1–D4 + 6 operaciones Equipo V1 sobre Identity |
| Fuera de alcance | Rediseño visual (AGENTE 1) · nuevo IAM · Platform Admin · Personas Growth · SCIM/LDAP/SSO · `sync:tenant-roles` · declarar Equipo V1 cerrado de producto · abrir OT UX |

**Restricciones cumplidas:** sin segundo IAM; sin `growth.team.*`; sin ampliar Equipo V1; sin tocar Campaigns/Personas/Analytics/etc.

---

## Gate final

**CERRADA · APTO**

Equipo V1 queda operativo como superficie Growth sobre Identity existente. Condiciones 1–9 del contrato §6 cumplidas en código. **No** se declara Equipo V1 cerrado de producto (falta pasada visual AGENTE 1).

---

## 1. Archivos creados / modificados

### Creado

| Archivo | Rol |
| --- | --- |
| `src/core/identity/policies/last-admin.ts` | Reglas puras D4 (Dueño/Admin; Soporte no cuenta) |
| `src/lib/identity/last-admin.ts` | Assert async + listado de admins activos del Espacio |
| `src/core/migrations/023-growth-team-membership-unique.ts` | Dedup + índice único `(userId, tenantId)` |
| `tests/baseline/growth-team-003.test.ts` | Casos A–T + fixture Mongo |
| `docs/AI/auditorias/OT-GROWTH-TEAM-IMPLEMENT-003.md` | Esta acta |

### Modificado

| Archivo | Cambio |
| --- | --- |
| `src/lib/identity/keycloak-access.ts` | D1: no sobrescribe `roleIds` de membership existente; realm no eleva |
| `src/lib/identity/memberships.ts` | D3: `findMembershipAnyStatus`, `ensureActiveMembership`, conflicto 11000 |
| `src/lib/identity/sessions.ts` | `reconcileSessionsAfterSpaceAccessRemoved` (solo tenant retirado) |
| `src/lib/identity/roles.ts` | `ensureSuperAdminMembership` reutiliza membership any-status |
| `src/lib/identity/iam-guard.ts` | Copy «Dueño del Espacio» |
| `src/app/api/identity/members/[membershipId]/route.ts` | `remove-access` + guarda D4 en rol/quitar; legacy `block` aislado |
| `src/app/api/identity/invitations/route.ts` | Invite: 409 solo si membership **active**; reinvitar suspended/archived OK |
| `src/app/api/identity/invitations/[token]/accept/route.ts` | Accept vía `ensureActiveMembership` (sin duplicar) |
| `src/app/admin/settings/team/page.tsx` | Superficie canónica **Equipo** |
| `src/app/admin/settings/users/page.tsx` | Redirect → `/admin/settings/team` |
| `src/components/admin/UserCmsCard.tsx` | Solo «Quitar acceso»; sin Bloquear/Suspender/Permisos |
| `src/components/admin/UsuariosCmsClient.tsx` | Copy Equipo V1 + `remove-access` |
| `src/components/admin/AdminUserMenuPanel.tsx` | Menú → Equipo |
| `src/lib/admin/nav-domains.ts` | Nav Equipo canónica; Ajustes alinea a team |
| `src/lib/admin/institutional.ts` | Label Dueño del Espacio; breadcrumbs Equipo |
| `src/core/migrations/registry.ts` | Registra migración 023 |

### No tocado

Platform Admin (salvo labels ya existentes) · Personas Growth · Ventas · Mensajes · Actividad · Campañas · Automatizaciones · Analítica · Aprende Hoy · RR.HH. · SCIM/LDAP · nuevo SSO · nuevo selector de Espacio · `sync:tenant-roles` productivo · motor legacy `action=block` (sigue en API, no en UI Equipo).

---

## 2. Reutilización

| Pieza | Uso |
| --- | --- |
| Colecciones Identity | Sin colecciones nuevas |
| `GET /api/identity/team` | Ver miembros + invitaciones |
| `POST/DELETE /api/identity/invitations` | Invitar / cancelar |
| `POST .../accept` | Aceptar (endurecido D3) |
| `PATCH /api/identity/members/[id]` | Cambiar rol |
| `DELETE ?action=remove-access` | Quitar acceso de este Espacio |
| `settings.team` + jerarquía + `NON_ASSIGNABLE` | Autorización |
| `reconcileSessionActiveTenant` | Tras quitar acceso del Espacio activo |
| UI `UsuariosCmsClient` | Evolucionada a Equipo; sin módulo paralelo |

---

## 3. Resolución D1–D4

| Decisión | Implementación |
| --- | --- |
| **D1** Keycloak | `resolveKeycloakMembership`: si existe membership (any status), **no** llama `updateMembershipRoles` con realm roles. Realm roles solo provisionan **primera** membership. Invitación manda sobre realm al aceptar/reactivar. Permisos efectivos = resolver Identity. |
| **D2** Quitar acceso | `action=remove-access`: archiva membership del `tenantId` de sesión; **no** `user.status`; **no** `action=block`; reconcilia solo sesiones de ese tenant. Otras memberships intactas. |
| **D3** Unicidad | Lookup any-status; `createMembership` rechaza si existe; `ensureActiveMembership` reutiliza/reactiva; migración 023 índice único + dedup; accept/invite sin segundo documento. |
| **D4** Último admin | Antes de quitar acceso o degradar admin → debe quedar ≥1 active con nivel ≥ `institution_admin`. Soporte no cuenta. Error estable: `LAST_SPACE_ADMIN_ERROR`. Sin transferencia de Dueño. |

---

## 4. Comportamiento de las 6 operaciones

| # | Operación | Comportamiento |
| --- | --- | --- |
| 1 | Ver miembros | `GET /api/identity/team` filtrado por `ctx.tenantId` |
| 2 | Ver invitaciones pendientes | Mismo read-model + tab Invitar |
| 3 | Invitar persona | `POST /api/identity/invitations` con tenant activo; 409 si ya active |
| 4 | Cancelar invitación | `DELETE` → `revoked`; token deja de ser aceptable |
| 5 | Cambiar rol | `PATCH` membership del tenant; Dueño NON_ASSIGNABLE; guarda D4 |
| 6 | Quitar acceso | `DELETE ?action=remove-access`; solo este Espacio; guarda D4 |

---

## 5. Multi-tenant

- Todas las mutaciones validan `membership.tenantId === ctx.tenantId` (404 si no).
- Invitaciones siempre con `ctx.tenantId`.
- Quitar acceso en A conserva membership/sesión usable en B.
- Switcher / `reconcileSessionActiveTenant` reutilizados; sin selector nuevo.

---

## 6. Seguridad

| Hallazgo contrato | Estado en código |
| --- | --- |
| S1 Keycloak pisa roles | **Mitigado** (D1) |
| S2 `block` = cuenta global | **Aislado** de Equipo UI; API legacy no borrada |
| S5 expulsión global de sesiones | **Mitigado** en `remove-access` (reconcile por tenant) |
| S3 duplicados | **Mitigado** (D3 + índice) |
| S4 último admin | **Mitigado** (D4) |

Deuda S6–S13 no resuelta (fuera de alcance V1).

---

## 7. Pruebas

Archivo: `tests/baseline/growth-team-003.test.ts`

| Caso | Cobertura |
| --- | --- |
| A–C, Q | Tenant filter en APIs + fixture Mongo |
| D–E | Keycloak source contract (no overwrite) |
| F–H | ensure/accept/migración + fixture 11000 |
| I–L | `remove-access` sin block/user.status + fixture |
| M–O | last-admin puro + cableado API |
| P, R | NON_ASSIGNABLE + `settings.team` |
| S | Token solo pending no expirado |
| T | UI sin Bloquear/Suspender/Permisos; users→team |

**Ejecutado:** `npx tsx --test tests/baseline/growth-team-003.test.ts` → 14/14 pass.

**Regresiones:** `saas-multi-space`, `platform-enter-space`, `growth-os-admin-shell-002` (y ux-shell-identity si aplica).

---

## 8. Pendientes reales (no bloquean este gate)

1. Pasada visual AGENTE 1 (Equipo V1 de producto aún no cerrado).
2. Migración 023 debe aplicarse en cada entorno antes de depender del índice único en producción.
3. Deuda S6 (reactivar tras block global), S7 bearer invite, S10–S13.
4. Enlaces legacy residuales a `/admin/settings/users` (redirect OK; copy en help/dashboard menores).
5. Acciones legacy `suspend`/`block`/`archive` siguen en API para otras superficies — no son camino Equipo V1.

---

## Veredicto

**CERRADA · APTO**

Implementación mínima conforme al contrato. **No** se declara Equipo V1 cerrado. **No** se abre OT UX automáticamente.
