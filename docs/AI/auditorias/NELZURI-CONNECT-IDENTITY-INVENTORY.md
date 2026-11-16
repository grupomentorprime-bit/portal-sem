# NELZURI Connect — Inventario técnico de identidad y acceso

**Rama / worktree:** `feat/escritorio-mentor-prime`  
**Alcance:** solo lectura del código; sin diseño ni implementación de SSO.  
**Fecha:** 2026-11-16

---

## Resumen ejecutivo

- Hay **un solo IdP productivo** (Keycloak, clientes `growth-os-web` / `growth-os-dev`) y **una sesión de aplicación opaca** en cookie `ah_session` → documento `identity_sessions` en Mongo.
- El token OAuth de Keycloak **no se persiste en el navegador**; solo sirve en el login para userinfo y aprovisionamiento; luego manda la sesión opaca.
- **Espacio activo** = `session.tenantId`, elegido por membresías (`pickActiveTenantId`) y cambiable con `POST /api/identity/spaces/switch`; no se confía en `?tenant=` del cliente.
- **Autorización en cuatro capas:** operador de plataforma (`user.platformRoles`), membresía/Espacio, **llave de app** (`tenants.contractedApps` ∩ `membership.authorizedApps`), permisos granulares (`requirePermission` + `authorize`).
- **Growth OS (`/admin`)** y **NELZURI escritorio (`/escritorio`)** comparten cookie en el **host de plataforma** (`APP_URL`); portales públicos van por **host de Espacio** y no comparten esa cookie.
- Apps **externas** (`aprende-hoy`, `cumple`) son **navegación a URL HTTPS** sin handoff de identidad; `rrhh` aún no abre destino.
- Gates: edge `src/proxy.ts` (cookie en rutas protegidas), layouts RSC (`admin`, `platform`, `escritorio`), guards en APIs (`src/core/identity/middleware/guards.ts`).
- Post-login unificado en `resolvePostAuthDestination`: operador → `/escritorio`; con Espacio → escritorio o `next` profundo; sin Espacio → `/admin/sin-espacio`.
- **No existe** token cross-app ni SSO entre orígenes; Connect deberá asumir límites de cookie por host y ausencia de federation hacia satélites.

---

## Superficies / apps y puerta de entrada

| Superficie | Rutas | Puerta de auth | Notas |
|------------|-------|----------------|-------|
| **Login Growth OS** | `/login`, alias `/ingresar` → `toGrowthLoginPath` | Público; si ya hay sesión → `resolvePostAuthDestination` | UI: `LoginForm` → `POST /api/identity/auth/keycloak/session` (embebido). Alternativa: `GET /api/identity/auth/keycloak/login` (redirect PKCE). |
| **NELZURI escritorio** | `/escritorio` | Cookie `ah_session`; `proxy` + `escritorio/page.tsx` | Mesa de apps; switch de Espacio; iconos según contrato + llaves. |
| **Growth OS (Espacio)** | `/admin`, `/admin/*` | Cookie + `admin/layout.tsx` | Exige membresía activa y llave `growth-os`; sin llave → redirect `/escritorio`. |
| **Consola plataforma** | `/platform`, `/platform/*` | Cookie + `platform/layout.tsx` | Solo `platform_owner` / `platform_operator` en `identity_users.platformRoles`. |
| **Sin Espacio** | `/admin/sin-espacio` | Sesión sin `tenantId` válido | Estado dedicado para cuentas sin membresía activa. |
| **Portal público** | `src/app/(site)/*` (p. ej. `/programas`, `/formularios`) | Sin sesión productiva | Tenant por **Host → Domain → Site** (`getTenantContext`). Enlace “Ingresar” suele ir a `/ingresar` del **mismo host de Espacio** (menú CMS). |
| **APIs privadas** | `/api/identity/*`, `/api/growth/*`, `/api/admin/*`, `/api/platform/*`, … | Guards `requireAuth` / `requirePermission` / `requirePlatformOperator` | APIs de identity/growth no pasan por gate de cookie del proxy salvo que compartan prefijos protegidos en layout. |
| **Interno** | `/internal/*` | Sesión en `internal/layout.tsx` | Solo autenticación, sin rol de plataforma. |
| **Apps satélite (catálogo)** | `growth-os`, `cumple`, `aprende-hoy`, `rrhh` | Ver `desktopClick` | `growth-os` → `/admin` mismo origen; `cumple` / `aprende-hoy` → URL externa; `rrhh` → `later`. |

**Host de plataforma vs Espacio:** `isPlatformOriginHost` (`src/core/tenant/hosts.ts`) identifica el origen canónico de la app (`APP_URL`). En ese host, rutas que no son “producto” (portal CMS) redirigen a `/` (`src/proxy.ts`). Los portales viven en hosts de Espacio (`{slug}.localhost` o dominio publicado).

---

## Identidad compartida (qué sí es común hoy)

| Pieza | Dónde | Compartido entre |
|-------|--------|------------------|
| **Usuario global** | `identity_users` | Todos los Espacios y plataforma; email único; `platformRoles` globales. |
| **Credencial OIDC** | `identity_credentials` (provider Keycloak, `sub`) | Un login Keycloak alimenta todos los Espacios donde haya membresía. |
| **Membresías** | `identity_memberships` (`tenantId`, `roleIds`, `authorizedApps`, overrides) | Por Espacio; SSOT de rol espacial (Keycloak realm **no** pisa `roleIds` existentes — `resolveKeycloakMembership`). |
| **Sesión** | `identity_sessions` + cookie `ah_session` (30 días, `httpOnly`, `sameSite=lax`) | Misma cookie en rutas del **origen de plataforma** que emitió el login. |
| **Espacio activo en sesión** | `IdentitySession.tenantId` | Alinea APIs `requireSpace`, branding admin y escritorio tras switch. |
| **Keycloak** | `src/core/identity/auth/keycloak.ts` | Un realm/cliente productivo por entorno; callback `/api/identity/auth/keycloak/callback`. |
| **Destino post-auth** | `resolvePostAuthDestination` | Login página, callback OAuth y login embebido. |

**No compartido hoy:**

- Cookie de sesión entre **dominio de plataforma** y **dominio publicado del Espacio** (cookies por host).
- Token de acceso Keycloak hacia el front o hacia apps externas.
- Estado de “app activa” más allá de convenciones de ruta (`/admin` vs `/escritorio`) y cookie auxiliar `mp_desk_client` (solo dueño de plataforma elige cliente en mesa).

---

## Autorización por capa

### 1. Plataforma (global)

- Campo: `identity_users.platformRoles`: `platform_owner` | `platform_operator` (`src/core/identity/platform/codes.ts`).
- Evaluación: `hasPlatformOperatorCapability`, `requirePlatformOperator` — **ignora** Espacio activo y membresía de cliente.
- UI: `/platform/*`; APIs bajo `/api/platform/**`.
- Post-auth: operador cae en `/escritorio` salvo `next` que empiece por `/platform` y pase la comprobación.

### 2. Espacio (tenant)

- Membresía `active` en `tenantId` = `session.tenantId`.
- Resolución al login: `resolveActiveTenantForUser` + `pickActiveTenantId` (preferencia por host en bootstrap, luego primera membresía por `joinedAt`).
- Cambio explícito: `POST /api/identity/spaces/switch` con `{ tenantId }` — `requireSession`, valida membresía, actualiza sesión, respuesta `redirectedTo: "/escritorio"`.
- APIs: `requireSpace` exige membresía; `requireTenant` anti cross-tenant.

### 3. App (MentorAppId)

- **Techo del Espacio:** `tenants.contractedApps` (+ defaults en `resolveContractedApps`).
- **Llave por miembro:** `identity_memberships.authorizedApps` (`growth-os` | `cumple` | `aprende-hoy` | `rrhh`).
- **Efectivo:** intersección en `resolveAuthorizedApps` / `hasAppKey` (`src/lib/desktop/app-access.ts`).
- Legado: `authorizedApps` ausente ⇒ se asume todo el techo contratado.
- Gestión: `PATCH /api/identity/members/[membershipId]/apps` (`settings.team`).
- Plataforma ajusta techo: `/api/platform/spaces/[tenantId]/apps`.

### 4. Permiso (RBAC granular)

- Roles por Espacio: `identity_roles` + plantillas (`src/core/identity/permissions/role-templates.ts`).
- Efectivo: `resolveMembershipPermissions` → lista legacy + mapa granular (`src/core/identity/permissions/resolver.ts`).
- Overrides: `membership.permissionOverrides`.
- API: `requirePermission(id)` → `requireSpace` + `authorize` (`policies/engine.ts`).
- **Regla Growth:** permisos `growth.*` además exigen llave `growth-os` en el Espacio activo (`guards.ts`).

---

## Flujos actuales entre apps

### Login

```text
Usuario → /login?next=…
  ├─ (prod típico) POST /api/identity/auth/keycloak/session
  │     → ROPC servidor + finishKeycloakLogin
  │     → createSession + setSessionCookie(ah_session)
  │     → JSON { redirectTo } vía resolvePostAuthDestination
  └─ (alternativa) GET /api/identity/auth/keycloak/login?next=…
        → cookies kc_oauth_state | kc_oauth_pkce | kc_oauth_next
        → redirect Keycloak authorize (PKCE S256)
        → GET /api/identity/auth/keycloak/callback?code&state
        → exchangeKeycloakCode + finishKeycloakLogin + sesión
        → redirect resolvePostAuthDestination
```

- Email/password local: `POST /api/identity/login` solo si `AUTH_BACKEND` ≠ keycloak (`isEmailAuthEnabled`).
- Logout: `POST /api/identity/logout` borra sesión Mongo y cookie.

### Escritorio → Growth OS

- Icono `growth-os` con llave: `desktopClick` → `{ kind: "open", href: "/admin" }` (`src/lib/desktop/contract.ts`).
- Misma cookie; `admin/layout` revalida llave `growth-os`.
- En admin: `EscritorioReturn` muestra enlace `/escritorio` si `GET /api/identity/me` responde 200.

### Escritorio → apps externas

- `aprende-hoy`: `tenant.aprendeHoyEntryUrl` (HTTPS) — navegación completa, sin parámetros de sesión.
- `cumple`: origen publicado del Espacio (`resolvePublicOriginForTenant`) si `tenantId === CUMPLE_SPACE_ID`.
- `rrhh`: sin `href` (`later`).

### Cambio de Espacio (multi-membresía)

- UI escritorio / menús admin-plataforma: `POST /api/identity/spaces/switch` → recarga hacia `/escritorio` (comentario histórico en route menciona `/admin`; respuesta actual dice `/escritorio`).
- Permisos y `authorizedApps` se recalculan para el nuevo `tenantId`.

### Operador entra a Espacio de cliente

- `platform/layout` + `PlatformEnterSpacePanel` usan el mismo `spaces/switch`.
- Dueño plataforma en escritorio: cookie `mp_desk_client` (`DESK_ENTERED_COOKIE`) para “entrar” a mesa de un cliente sin confundir con su membresía personal.

### Portal público → producto

- Menú: `/ingresar` en host del Espacio → redirect a `/login` en **origen público resuelto** (`publicRedirectUrl`, `toGrowthLoginPath`).
- En host de Espacio, rutas `/admin` no son el CMS; el proxy en host plataforma redirige CMS fuera de rutas producto.

### Deep links `next`

- `proxy` guarda `next` al redirigir a `/login` desde `/admin`, `/platform`, `/escritorio`, `/internal`.
- `resolvePostAuthDestination` respeta `next` si no es landing default; `/platform…` solo si operador.

---

## Huecos para NELZURI Connect (priorizado, sin propuesta SSO)

1. **Sesión ligada al host de plataforma** — cookie `ah_session` no viaja al dominio publicado del Espacio ni a `aprendeHoyEntryUrl` / origen Cumple.
2. **Sin credencial delegable al cliente** — no hay JWT/opaque token en API para que otra app consuma identidad; solo cookie httpOnly en mismo sitio.
3. **Satélites HTTP(S) ciegos** — `desktopClick` abre URL sin `state`, `sub`, ni ticket; usuario puede necesitar login aparte en el otro producto.
4. **`rrhh` sin superficie** — catálogo y llaves existen; no hay ruta ni URL de entrada unificada.
5. **Dos “homes” cognitivos** — `/escritorio` (hub) vs `/admin` (app); post-auth empuja a escritorio; deep links a `/admin` funcionan pero el hub no centraliza estado de “app abierta”.
6. **Espacio activo único por sesión** — cambiar Espacio invalida contexto admin hasta switch; no hay sesión multi-espacio paralela en el cliente.
7. **Keycloak token descartado** — no hay refresh compartido ni backchannel logout hacia apps hijas.
8. **Portal `/ingresar` en host Espacio** — el flujo de login puede ejecutarse con preferencia `resolveActiveTenantIdFromRequest` (host); confusión posible si el usuario esperaba cuenta global vs bootstrap de ese Espacio.
9. **`authorizedApps` legado** — membresías sin campo siguen con techo completo; Connect debe tratar “sin llave explícita” distinto de “lista vacía”.
10. **APIs sin gate uniforme en edge** — `proxy` no exige cookie para `/api/*`; dependencia total de guards por ruta (riesgo si alguna ruta olvida guard).

---

## Archivos ancla

| Tema | Ruta |
|------|------|
| Cookie / TTL / enforce | `src/core/identity/auth/config.ts` |
| Keycloak PKCE / clientes | `src/core/identity/auth/keycloak.ts` |
| OAuth cookies temporales | `src/core/identity/auth/oauth-cookies.ts` |
| Origen público OAuth | `src/core/identity/auth/public-origin.ts` |
| Login embebido + callback | `src/app/api/identity/auth/keycloak/session/route.ts`, `callback/route.ts`, `login/route.ts` |
| Página login | `src/app/login/page.tsx` |
| Post-auth | `src/core/identity/platform/landing.ts` |
| Sesiones Mongo + cookie | `src/lib/identity/sessions.ts` |
| Fin login Keycloak | `src/lib/identity/keycloak-access.ts` |
| Espacio activo / switch | `src/lib/identity/active-space.ts`, `src/app/api/identity/spaces/switch/route.ts`, `src/core/identity/spaces/pick-active-tenant.ts` |
| Guards | `src/core/identity/middleware/guards.ts` |
| Capacidad plataforma | `src/core/identity/platform/capability.ts` |
| Permisos | `src/core/identity/permissions/resolver.ts`, `src/lib/identity/permission-resolver.ts`, `src/core/identity/policies/engine.ts` |
| Llaves app | `src/lib/desktop/app-access.ts`, `src/types/identity.ts` (membership) |
| Contrato / clicks escritorio | `src/lib/desktop/contract.ts`, `src/lib/desktop/store.ts` |
| Layouts | `src/app/admin/layout.tsx`, `src/app/platform/layout.tsx`, `src/app/escritorio/page.tsx` |
| Edge gate | `src/proxy.ts` (middleware Next en este repo) |
| Host plataforma vs Espacio | `src/core/tenant/hosts.ts`, `src/core/tenant/context.ts` |
| Modelo auth context | `src/types/identity.ts` |
| UI mesa | `src/components/desktop/MentorDesktop.tsx` |
| Colecciones IAM | `docs/AI/auditorias/OT-PORTAL-SAAS-000-evidence/03-colecciones.md` |

---

## Siguiente paso técnico recomendado (uno, previo a SSO)

**Construir una matriz “origen × mecanismo de confianza”** (plataforma, cada Espacio publicado, `aprendeHoyEntryUrl`, cumple, futuro RRHH): columnas = cookie `ah_session`, host de login Keycloak, llave `MentorAppId`, y si el código hoy asume same-site o full navigation — validada con requests reales en dev (`{slug}.localhost` vs `localhost:3000`). Esa matriz es el contrato de entrada para diseñar Connect sin tocar auth todavía.