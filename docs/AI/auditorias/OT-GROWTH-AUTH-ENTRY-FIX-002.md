# OT-GROWTH-AUTH-ENTRY-FIX-002 — Entrada correcta según tipo de usuario

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-AUTH-ENTRY-FIX-002 |
| Tipo | Fix / operatividad |
| Fecha | 2026-09-15 |
| Entrada | [OT-GROWTH-AUTH-HARDENING-001](./OT-GROWTH-AUTH-HARDENING-001.md) · capacidad `platformRoles` (PROD-005) |
| Estado | **CERRADA · APTO** |
| Alcance | Destino post-auth único · prioridad operador → `/platform` · reutilizar picker / sin-espacio |
| Fuera de alcance | UI `/platform` · `nav-domains.ts` · IAM cerrado · CMS · Ventas/Personas/Mensajes · Meta · Cloudflare/DNS · arquitectura de sesión · cliente Keycloak |

**Restricciones cumplidas:** un solo resolver (`resolvePostAuthDestination`); operador solo vía `identity_users.platformRoles` / `hasPlatformOperatorCapability`; sin hardcode de email/Marco/tenant; membresías SEM/ADL intactas pero sin prioridad sobre el rol global.

---

## Gate final

# APTO

Tras autenticar, un operador de Growth OS aterriza en `/platform` aunque tenga membresía SEM/ADL. Los usuarios normales reutilizan el picker de Espacio activo y `/admin/sin-espacio`. Callback Keycloak, sesión embebida y login email comparten la misma función.

---

## 1. Causa

`resolvePostAuthDestination` solo enviaba a `/platform` cuando el operador **no** tenía Espacio. Con membresía SEM (caso real de `soporte@mentorprime.cl`: `platform_owner` + SEM + ADL) el flujo caía en `/admin` y entraba al tenant del cliente.

```text
Antes:  operador + hasSpace → /admin
Ahora:  operador (con o sin Espacio) → /platform
```

---

## 2. Regla congelada (única función)

`src/core/identity/platform/landing.ts` → `resolvePostAuthDestination`:

| Prioridad | Condición | Destino |
| --- | --- | --- |
| 1 | `next` bajo `/platform…` **y** operador | ese `next` |
| 1b | `next` bajo `/platform…` **sin** operador | `/admin` o `/admin/sin-espacio` |
| 2 | `isPlatformOperator` (`platformRoles`) | `/platform` |
| 3 | sin Espacio | `/admin/sin-espacio` |
| 4 | con Espacio + `next` profundo no-default | ese `next` |
| 5 | con Espacio | `/admin` |

Espacio activo (C–F): sin tocar; sigue `resolveActiveTenantForUser` + `pickActiveTenantId` (preferred válido → ese; si no → primer `joinedAt`; switcher UI existente).

Capacidad de operador: `hasPlatformOperatorCapability` — solo `platformRoles` + `status === active`. No email, no host, no rol SEM.

---

## 3. Puntos de entrada unificados

| Punto | Uso |
| --- | --- |
| `GET …/keycloak/callback` | `resolvePostAuthDestination` → redirect |
| `POST …/keycloak/session` | idem → `redirectTo` |
| `POST /api/identity/login` | idem → `redirectTo` (antes no devolvía destino) |

No se creó un segundo resolver.

---

## 4. Evidencia local — `soporte@mentorprime.cl`

| Campo | Valor |
| --- | --- |
| `platformRoles` | `["platform_owner"]` |
| Membresías activas | `seminario-ipn`, `adl` |
| Destino simulado post-auth | **`/platform`** |

Desde `/platform` puede entrar a SEM/ADL u otros Espacios (flujo Entrar al Espacio ya cerrado · APTO).

---

## 5. Pruebas A–J

| ID | Caso | Resultado |
| --- | --- | --- |
| A | Operador + membresía SEM → `/platform` | **PASS** (unit + simulación soporte) |
| B | Operador + varias membresías → `/platform` | **PASS** |
| C | Normal + solo SEM → `/admin`, SEM activo | **PASS** (destino + picker) |
| D | Normal + solo ADL → `/admin`, ADL activo | **PASS** |
| E | Varios + preferred válido → ese Espacio | **PASS** (`pickActiveTenantId`) |
| F | Varios sin preferred válido → primer joinedAt / switcher UI | **PASS** |
| G | Sin Espacio → `/admin/sin-espacio` | **PASS** |
| H | Falsificar `next=/platform` sin rol global | **PASS** (cae a `/admin` o sin-espacio; layout `/platform` sigue exigiendo capacidad) |
| I | Switch SEM ↔ ADL | **PASS** (regresión `saas-multi-space` + enter-space) |
| J | Auth Code/PKCE, IAM, Equipo, Shell, multi-tenant | **PASS** (suites citadas; sin cambios en esos frentes) |

### Suite automatizada

```text
npx tsx --test \
  tests/baseline/auth-entry-fix-002.test.ts \
  tests/baseline/platform-operator.test.ts \
  tests/baseline/saas-multi-space.test.ts \
  tests/baseline/growth-team-003.test.ts \
  tests/baseline/platform-enter-space.test.ts
→ PASS (auth-entry 12 + regresiones citadas)
```

Probe HTTP: `/platform` sin sesión → login con `next=/platform` (guard existente intacto).

---

## 6. Archivos

| Archivo | Cambio |
| --- | --- |
| `src/core/identity/platform/landing.ts` | Prioridad operador → `/platform` con membresía |
| `src/app/api/identity/login/route.ts` | Mismo resolver + `redirectTo` |
| `tests/baseline/auth-entry-fix-002.test.ts` | **Nuevo** — A–H + unicidad de resolver |
| `tests/baseline/platform-operator.test.ts` | Landing alineado a la regla |
| `docs/AI/auditorias/OT-GROWTH-AUTH-ENTRY-FIX-002.md` | Esta entrega |

**No tocados:** UI `/platform`, `nav-domains.ts`, IAM, CMS, Ventas/Personas/Mensajes, Meta, sesión opaca, cliente Keycloak, `capability.ts` (solo reutilizado).

---

## 7. Fuera de alcance / no hechos

- Sin abrir otra auditoría ni panel.
- Sin conceder/revocar `platformRoles` en esta OT (soporte ya era `platform_owner`).
- Sin cambiar el picker multi-Espacio ni el flujo Entrar al Espacio.
