# OT-GROWTH-TEAM-CLOSE-005 — Validación integral y cierre Equipo V1

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-TEAM-CLOSE-005 |
| Tipo | Validación / cierre (sin implementación) |
| Agente | AGENTE 2 — VALIDACIÓN / CIERRE |
| Fecha | 2026-09-14 |
| Entrada | [AUDIT-001](./OT-GROWTH-TEAM-AUDIT-001.md) · [CONTRACT-002](./OT-GROWTH-TEAM-CONTRACT-002.md) · [IMPLEMENT-003](./OT-GROWTH-TEAM-IMPLEMENT-003.md) · [UX-004](./OT-GROWTH-UX-TEAM-004.md) |
| Estado | **CERRADA · APTO** |
| Alcance | Validar D1–D4 + 6 operaciones + superficie/UX; declarar cierre de producto Equipo V1 |
| Fuera de alcance | Implementar · rediseñar · corregir deuda fuera de V1 · tocar datos/producción · abrir otra OT |

**Restricciones cumplidas:** solo revisión de fuentes, código, evidencia y pruebas; sin funciones nuevas; sin cambios de UX; sin aplicar migraciones en entornos; sin abrir OTs.

---

## Gate final

# EQUIPO V1 — CERRADA · APTO 🔒

Equipo V1 cumple el contrato congelado (AUDIT → CONTRACT → IMPLEMENT → UX). Identity existente es el único motor; Keycloak autentica sin pisar el rol del Espacio; `identity_memberships` es SSOT; las 6 operaciones V1 operan en `/admin/settings/team` con lenguaje humano; Platform Admin permanece separado. No hay defecto bloqueante de cierre.

Pendiente operativo no bloqueante: **migración 023** debe aplicarse por entorno durante despliegue.

---

## 1. Fuentes revisadas

| Fuente | Rol | Estado previo |
| --- | --- | --- |
| `OT-GROWTH-TEAM-AUDIT-001.md` | Diagnóstico real pre-V1 | CERRADA · APTO CON AJUSTES |
| `OT-GROWTH-TEAM-CONTRACT-002.md` | Contrato funcional congelado | CERRADA · APTO |
| `OT-GROWTH-TEAM-IMPLEMENT-003.md` | Endurecimiento D1–D4 + 6 ops | CERRADA · APTO |
| `OT-GROWTH-UX-TEAM-004.md` | Refinamiento visual | CERRADA · APTO VISUAL |
| `OT-GROWTH-UX-TEAM-004-evidence/` | 8 capturas + RESULT.json | APTO VISUAL |
| Código / tests baseline | Verificación puntual cierre | Reejecutado 2026-09-14 |

---

## 2. Resumen ejecutivo

Equipo V1 es una **superficie Growth sobre Identity existente**, no un segundo IAM:

- **Keycloak** autentica; **Mongo** (`identity_memberships.roleIds`) decide el rol por Espacio.
- **SSOT** de acceso/rol: `identity_memberships` (1 usuario + 1 Espacio ≤ 1 membership).
- **Permiso** `settings.team` (sin `growth.team.*`).
- **6 operaciones** sobre el Espacio activo: ver miembros, ver invitaciones, invitar, cancelar, cambiar rol, quitar acceso.
- **Quitar acceso** = membership de este `tenantId`; sin `user.status` / sin `block`.
- **Guarda** último Dueño/Administrador; Dueño `NON_ASSIGNABLE`.
- **Ruta canónica** `/admin/settings/team`; `/admin/settings/users` → redirect.

AGENTE 2 dejó D1–D4 y las 6 ops funcionales; AGENTE 1 dejó evidencia visual desktop + mobile. Esta OT confirma ambos y **cierra producto**.

---

## 3. Matriz final (criterios 1–18)

| # | Criterio | Resultado | Evidencia asociada |
| --- | --- | --- | --- |
| 1 | Identity existente es el único motor | **APTO** | Sin colecciones nuevas; reutiliza `identity_*`; test T + IMPLEMENT §2 |
| 2 | Keycloak autentica y no pisa rol del Espacio | **APTO** | `resolveKeycloakMembership` no llama overwrite de `roleIds` si existe membership; test D/E |
| 3 | `identity_memberships` SSOT acceso/rol por Espacio | **APTO** | D1/I1; APIs filtran `ctx.tenantId`; resolver Identity |
| 4 | 1 usuario + 1 Espacio = máx. 1 membership | **APTO** | `findMembershipAnyStatus` / `ensureActiveMembership`; migración 023; tests F/G/H + fixture |
| 5 | Quitar acceso afecta solo el Espacio actual | **APTO** | `remove-access` + `archiveMembershipAccess` + reconcile por tenant; fixture A/B; copy UX |
| 6 | No modifica `user.status` ni usa `block` | **APTO** | UI solo `remove-access`; `archiveMembershipAccess` sin `user.status`; `block` legacy aislado |
| 7 | Protege último Dueño/Administrador | **APTO** | `last-admin.ts` + assert en PATCH/DELETE; Soporte no cuenta; tests M–O |
| 8 | `settings.team` permiso de Equipo | **APTO** | APIs `requirePermission("settings.team")`; test R; nav Equipo |
| 9 | Dueño continúa NON_ASSIGNABLE | **APTO** | `NON_ASSIGNABLE_ROLE_CODES`; UI sin Dueño en asignables; nota en card; test P |
| 10 | Cross-tenant protegido | **APTO** | Mutaciones `membership.tenantId === ctx.tenantId`; fixture multi-tenant; tests A/B/C/Q |
| 11 | 6 operaciones V1 funcionan | **APTO** | IMPLEMENT §4 + UI + APIs + tests; capturas 01–05 |
| 12 | `/admin/settings/team` canónica | **APTO** | `team/page.tsx` monta Equipo; nav → team; test T |
| 13 | `/admin/settings/users` redirect compat | **APTO** | `users/page.tsx` → `redirect("/admin/settings/team")`; test T |
| 14 | UI lenguaje humano | **APTO** | Capturas UX-004; roles humanos; confirmaciones; sin códigos técnicos |
| 15 | Sin segundo IAM / CRM / roles paralelos | **APTO** | Sin `growth.team.*`; `TeamSettingsClient` no importado; Personas/Platform fuera |
| 16 | Platform Admin separado | **APTO** | Sin tocar `/platform`; Dueño ≠ Platform Admin; labels institucionales |
| 17 | Desktop y mobile validados | **APTO** | Capturas 01–06 desktop + 07–08 mobile; RESULT.json |
| 18 | Pruebas funcionales, UX y regresiones focalizadas | **APTO** | Reejecución cierre: 19/19 team+ux + shell 5/5 PASS |

---

## 4. Validación funcional (D1–D4 + 6 ops)

### 4.1 Identity / Keycloak / SSOT

| Invariante | Confirmación |
| --- | --- |
| Motor único Identity | Sí — colecciones y APIs existentes; sin segundo IAM |
| D1 Keycloak | Sí — membership existente (any status): no pisa `roleIds` con realm; realm solo primera membership |
| SSOT rol Espacio | Sí — `identity_memberships.roleIds` + resolver actual |
| D3 unicidad | Sí — lookup any-status + `ensureActiveMembership` + índice único en migración 023 |

### 4.2 Quitar acceso / último admin / Dueño

| Invariante | Confirmación |
| --- | --- |
| D2 scope | `DELETE ?action=remove-access` archiva membership del tenant de sesión |
| Sin `user.status` / sin `block` | `archiveMembershipAccess` solo status membership; UI sin Bloquear/Suspender |
| Sesiones | `reconcileSessionsAfterSpaceAccessRemoved` solo del tenant retirado |
| D4 | ≥1 active con nivel ≥ `institution_admin` (Dueño o Administrador); Soporte no cuenta |
| Dueño NON_ASSIGNABLE | No asignable en invitar/cambiar rol; card sin acciones de modificación |

### 4.3 Seis operaciones

| # | Operación | Confirmación |
| --- | --- | --- |
| 1 | Ver miembros | `GET /api/identity/team` + listado UX |
| 2 | Ver invitaciones pendientes | Mismo read-model + bloque/pestaña Invitar |
| 3 | Invitar persona | `POST /api/identity/invitations`; formulario un paso |
| 4 | Cancelar invitación | `DELETE` → revoked; CTA «Cancelar invitación» |
| 5 | Cambiar rol | `PATCH` + panel roles humanos; guarda D4 |
| 6 | Quitar acceso | `remove-access` + confirmación Espacio-scoped |

### 4.4 Superficie / permiso / separación

| Ítem | Confirmación |
| --- | --- |
| Canónica | `/admin/settings/team` título **Equipo** |
| Compat | `/admin/settings/users` redirect |
| Permiso | `settings.team` (legacy); sin catálogo `growth.team.*` |
| Platform Admin | Separado; no es superficie Equipo |
| Personas / content team | Fuera de V1; no mezclados |

---

## 5. Validación UX

Revisión de evidencia visual (tenant **seminario-ipn**, datos reales, sin inventar invitaciones):

| Captura | Resultado |
| --- | --- |
| `01-desktop-listado.png` | Listado · roles humanos · CTA Invitar persona · Dueño sin acciones |
| `02-desktop-invitar.png` | Nombre / Correo / Rol · Enviar invitación · Dueño no en asignables |
| `03-desktop-invitaciones.png` | Bloque pendientes (vacío real) |
| `04-desktop-cambiar-rol.png` | Panel Cambiar rol con labels humanos |
| `05-desktop-quitar-acceso.png` | Confirmación ¿Quitar acceso a …? + copy solo este Espacio |
| `06-estado-vacio.png` | Sin coincidencias de búsqueda |
| `07-mobile-listado.png` | Columna única; jerarquía nombre/rol/correo/acciones |
| `08-mobile-invitar.png` | Invitar usable en 390×844 |

Consistencia Growth OS / Shell intacto / copy humano: **OK** (UX-004). Sin defecto UX bloqueante. **No se modifica UX en esta OT.**

**Limitación de evidencia (no bloquea):** tenant de captura sin invitaciones pendientes reales → empty state validado; cancelar invitación cubierto en código + tests IMPLEMENT (S) + UI cableada.

---

## 6. Multi-tenant / seguridad

| Superficie | Aislamiento |
| --- | --- |
| Listado / invitaciones | `tenantId` Espacio activo |
| Invitar / cancelar / rol / quitar | Validación `membership.tenantId === ctx.tenantId` |
| Quitar acceso A | Conserva membership/sesión usable en B |
| Keycloak | Auth global; rol Espacio = Mongo |
| Hardcode SEM/ADL de producto | No en camino Equipo V1 |

Fuga cross-tenant en mutaciones Equipo: **no encontrada**.

Hallazgo de secreto: **ninguno**.

---

## 7. Pruebas / regresiones

### Reejecución cierre (2026-09-14)

```text
npx tsx --test \
  tests/baseline/growth-team-003.test.ts \
  tests/baseline/growth-ux-team-004.test.ts

→ 19 pass / 0 fail

npx tsx --test tests/baseline/growth-os-admin-shell-002.test.ts

→ 5 pass / 0 fail
```

| Suite | Resultado |
| --- | --- |
| `growth-team-003` (A–T + fixtures) | PASS |
| `growth-ux-team-004` | PASS |
| `growth-os-admin-shell-002` | PASS |

### Regresiones documentadas (IMPLEMENT-003)

`saas-multi-space`, `platform-enter-space`, `growth-os-admin-shell-002` — documentadas PASS en acta de implementación; shell reconfirmado en cierre.

---

## 8. Evidencia

| Origen | Contenido |
| --- | --- |
| `OT-GROWTH-TEAM-IMPLEMENT-003.md` | Acta D1–D4 + archivos + pruebas |
| `OT-GROWTH-UX-TEAM-004-evidence/` | RESULT.json · 01…08 PNG |
| Reejecución cierre | 19/19 + shell 5/5 PASS (sección 7) |
| Código | `keycloak-access`, `memberships`, `last-admin`, members/invitations routes, team/users pages, `UsuariosCmsClient` / `UserCmsCard`, migración 023 |

---

## 9. Pendientes operativos

| Ítem | Clasificación | Bloquea cierre? |
| --- | --- | --- |
| **Migración 023** (`023-growth-team-membership-unique`) debe aplicarse **por entorno** durante despliegue | **PENDIENTE DE DESPLIEGUE / OPERACIÓN** | **No** — implementación, tests y registro en `registry.ts` correctos; el índice único depende de ejecutar la migración en cada entorno |
| Evidencia visual con invitaciones pendientes reales | Limitación de dato en tenant de captura | **No** — empty + API/UI/tests cubren |
| Vacío absoluto (0 colaboradores) no capturado | Evidencia parcial (sí hay empty de búsqueda) | **No** — copy/CTA cubiertos |
| Acciones legacy `suspend`/`block`/`archive` siguen en API | Deuda fuera de V1 (aisladas de UI Equipo) | **No** — contrato §3.2 / IMPLEMENT §8 |
| Deuda S6–S13 (AUDIT) | Fuera de V1 | **No** |

**No ejecutar** la migración 023 sobre producción desde esta OT de cierre. Debe planificarse en el pipeline de despliegue por entorno.

---

## 10. Fuera de V1

Confirmado **no incorporado** (deliberado; no son pendientes de cierre):

- Bloquear / reactivar cuenta global  
- Transferir Dueño  
- Reenviar invitación · nuevo TTL · rediseño de correo  
- Roles personalizados · matriz avanzada en superficie Equipo  
- Grupos · organigrama · RR.HH.  
- SCIM · LDAP · nuevo SSO · nuevo selector de Espacio  
- Platform Admin · Personas Growth · `content_people` / equipo del sitio  
- `sync:tenant-roles` como feature de producto  
- Segundo IAM / `growth.team.*`  

---

## 11. Veredicto final

| Pregunta | Respuesta |
| --- | --- |
| ¿Cumple contrato congelado D1–D4 + 6 ops? | Sí |
| ¿Cumple pasada visual UX-004? | Sí |
| ¿Criterios 1–18 APTO? | Sí |
| ¿Existe defecto bloqueante? | No |
| ¿Solo quedan pendientes operativos / evidencia parcial no bloqueante? | Sí (migración 023 por entorno; invitaciones pendientes reales en captura) |

### EQUIPO V1 — CERRADA · APTO 🔒

No se abre otra OT automáticamente. No se implementa ni se toca producción desde esta validación.
