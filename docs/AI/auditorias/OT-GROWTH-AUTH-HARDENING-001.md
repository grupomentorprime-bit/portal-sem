# OT-GROWTH-AUTH-HARDENING-001 — Login seguro para Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-AUTH-HARDENING-001 |
| Tipo | Hardening de autenticación |
| Fecha | 2026-09-15 |
| Entrada | [OT-GROWTH-SECURITY-BASELINE-001](./OT-GROWTH-SECURITY-BASELINE-001.md) (A1–A3) |
| Estado | **CERRADA · APTO CON AJUSTES** |
| Alcance | Authorization Code + PKCE · cliente `growth-os-web` · retiro ROPC del login UI · sesión opaca preservada |
| Fuera de alcance | IAM/nav-domains · Meta/WhatsApp · CMS · Ventas/Personas · producción/Cloudflare/DNS · cliente `seminario-ipn-web` · sesión JWT |

**Restricciones cumplidas:** sin segundo motor de auth; callback `/api/identity/auth/keycloak/callback` reutilizado; sin secretos en logs/HTML; controles JWT de AprendeHoy → **NO APLICA · JUSTIFICADO** (sesión opaca `ah_session`).

---

## Gate final

# APTO CON AJUSTES

A1–A3 cerrados en código: el login interactivo de Growth OS inicia Authorization Code + PKCE S256 hacia Keycloak; ROPC ya no es camino UI; producción rechaza `admin-cli` / `seminario-ipn-web` y exige secret confidential.

**Ajuste operativo pendiente (no bloquea el diseño):** el `.env` local de desarrollo aún apunta a `KEYCLOAK_CLIENT_ID=seminario-ipn-web`. Antes de piloto/exposición pública, fijar `growth-os-web` + `KEYCLOAK_CLIENT_SECRET` del cliente ya provisionado (sin regenerar). Login interactivo completo (credenciales humanas en IdP) no se automatizó en esta OT.

---

## 1. Qué se implementó

| ID | Control | Resultado |
| --- | --- | --- |
| A1 | Login UI → Auth Code (redirect Keycloak) | `LoginForm` deja de POST password; CTA → `/api/identity/auth/keycloak/login` |
| A2 | PKCE S256 | `code_verifier` en cookie httpOnly temporal; `code_challenge` en authorize; validación en callback |
| A3 | Cliente dedicado `growth-os-web` | Constante + defaults `.env.example` / setup; gate prod sin fallback legacy |

### Controles NO APLICA · JUSTIFICADO (Protocolo Maestro)

| Control AprendeHoy / JWT | Clasificación | Motivo |
| --- | --- | --- |
| Rotación/denylist `jti` de JWT de app | **NO APLICA · JUSTIFICADO** | Cookie opaca en `identity_sessions`; no hay JWT de sesión de producto |
| Firmas HS256 / alg confusion de sesión | **NO APLICA · JUSTIFICADO** | Misma arquitectura opaca; no se convierte a JWT |
| Copiar CSP/poweredBy de AprendeHoy | Fuera de esta OT | Baseline M1–M3; no pedido aquí |

---

## 2. Flujo resultante

```text
/admin/login
  → CTA «Continuar con acceso institucional»
  → GET /api/identity/auth/keycloak/login
       (state + code_verifier httpOnly; authorize + code_challenge S256)
  → Keycloak (realm seminario-ipn · client growth-os-web en prod)
  → GET /api/identity/auth/keycloak/callback
       (valida state · exige verifier · intercambia code · crea sesión opaca)
  → /admin | /platform | /admin/sin-espacio
```

`POST /api/identity/auth/keycloak/session` responde **410** `auth_code_required` (ROPC interactivo cerrado).

### ROPC residual (documentado, no UI)

| Ubicación | Estado |
| --- | --- |
| `loginWithKeycloakPassword` en `keycloak.ts` | Conservada como utilidad residual (DAG OFF en `growth-os-web` ⇒ falla si se llama) |
| Aceptación de invitación Keycloak | **Ya no usa ROPC**: provisiona password vía Admin API, asegura membresía y `redirectLogin: true` → Auth Code |
| `scripts/check-keycloak.ts` | Deja de exigir Direct Access Grants; sonda Auth Code |
| `admin-cli` en setup script | Solo para token admin de Keycloak (realm master), no como cliente de Growth OS |

---

## 3. Seguridad obligatoria

| Requisito | Evidencia |
| --- | --- |
| `state` validado | Callback compara cookie `kc_oauth_state`; mismatch → `?error=oauth_state` |
| PKCE S256 | Authorize incluye `code_challenge_method=S256`; token envía `code_verifier` |
| Callback solo con flujo iniciado | Sin cookies de login → rechazo |
| Códigos OAuth de un solo uso | Cookies OAuth borradas al callback; Keycloak rechaza code inválido/reusado |
| Sin secretos en frontend/logs | HTML login sin password/secret; errores de token sin body de secret |
| Sesión opaca | `createSession` + cookie `ah_session` sin cambio de arquitectura |
| Logout | `POST /api/identity/logout` → 200 `{"ok":true}` (probe) |
| Aislamiento Espacio | Sin cambios; regresiones `saas-multi-space` + team PASS |

### Fail-safe producción

`getKeycloakConfig()` en `NODE_ENV=production`:

- exige `KEYCLOAK_URL` / `REALM` / `CLIENT_ID` / `CLIENT_SECRET`
- retorna `null` (login 503) si `CLIENT_ID ∈ {admin-cli, seminario-ipn-web}`
- **no** cae silenciosamente a otro cliente

---

## 4. Evidencia de pruebas

### Suite automatizada

```text
npx tsx --test tests/baseline/auth-hardening-001.test.ts \
  tests/baseline/iam-sync-system-role.test.ts \
  tests/baseline/growth-team-003.test.ts \
  tests/baseline/ux-shell-identity.test.ts \
  tests/baseline/saas-multi-space.test.ts
→ 43/43 PASS
```

### Probe HTTP local (2026-09-15, `localhost:3000`)

| Prueba | Resultado |
| --- | --- |
| A · login → Keycloak | **PASS** — 307 OIDC + `code_challenge` S256 + `state` |
| B · login correcto → sesión | **PENDIENTE OPS** — requiere IdP interactivo + `.env` con `growth-os-web` |
| C · state incorrecto | **PASS** — `?error=oauth_state` |
| D · verifier ausente | **PASS** — `?error=oauth_pkce` |
| D · verifier incorrecto | **PASS** — exchange falla → `?error=keycloak` |
| E · reuso sin cookies de flujo | **PASS** — `?error=oauth_state` (flujo consumido) |
| F · client_id en authorize | **AJUSTE** — local aún emite `seminario-ipn-web` (ver gate) |
| G · sin fallback legacy en prod | **PASS** — unit test `getKeycloakConfig` |
| H · logout | **PASS** — 200 `ok:true` |
| I/J · Espacio / switch IAM | **PASS** por regresión baseline (sin cambios de aislamiento) |
| K · secretos no en HTML | **PASS** — sin `password` field / sin `CLIENT_SECRET` |
| L · IAM + Shell + Equipo + sesión | **PASS** — suite citada |

ROPC UI: `POST .../session` → **410** `auth_code_required`.

---

## 5. Archivos modificados / nuevos

| Archivo | Cambio |
| --- | --- |
| `src/core/identity/auth/keycloak.ts` | PKCE, Auth Code con verifier, gate prod, docs ROPC residual |
| `src/core/identity/auth/oauth-cookies.ts` | **Nuevo** — nombres cookies OAuth |
| `src/app/api/identity/auth/keycloak/login/route.ts` | Emite state + PKCE cookies |
| `src/app/api/identity/auth/keycloak/callback/route.ts` | Valida state/PKCE; exchange con verifier |
| `src/app/api/identity/auth/keycloak/session/route.ts` | ROPC interactivo → 410 |
| `src/components/identity/LoginForm.tsx` | CTA institucional (sin password) |
| `src/app/admin/login/page.tsx` | Copy alineado a Auth Code |
| `src/app/api/identity/invitations/[token]/accept/route.ts` | Sin ROPC; `redirectLogin` tras password |
| `src/components/identity/AcceptInviteForm.tsx` | Redirect a `/admin/login` |
| `src/core/identity/index.ts` | Reexport PKCE / client id |
| `.env.example` | Defaults `growth-os-web` |
| `scripts/setup-keycloak-client.ts` | Default `growth-os-web`; no regenera secret existente |
| `scripts/check-keycloak.ts` | Diagnóstico Auth Code (sin exigir DAG) |
| `tests/baseline/auth-hardening-001.test.ts` | **Nuevo** |
| `tests/smoke/smoke-e2e.test.ts` | Assert PKCE + 410 session |
| `docs/AI/auditorias/OT-GROWTH-AUTH-HARDENING-001.md` | Esta entrega |

---

## 6. Operación recomendada (piloto)

1. En entorno piloto/prod: `KEYCLOAK_CLIENT_ID=growth-os-web`, realm `seminario-ipn`, secret del cliente ya creado (**no regenerar**).
2. `KEYCLOAK_REDIRECT_URI=https://growthos.mentorprime.cl/api/identity/auth/keycloak/callback`
3. Verificar redirect URI y Web Origin en Keycloak (ya configurados manualmente).
4. Smoke: `/admin/login` → Keycloak → callback → cookie `ah_session`.
5. Confirmar que `NODE_ENV=production` con `admin-cli` / `seminario-ipn-web` deja el login en 503 (fail-safe).

---

## 7. Fuera de alcance / no hechos

- Sin tocar producción, Cloudflare, DNS ni el cliente Keycloak `growth-os-web` (no recreado).
- Sin cambios IAM/`nav-domains`/Meta/CMS/Ventas.
- Sin conversión de sesión a JWT.
- Sin abrir otra OT.
