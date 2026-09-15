# OT-GROWTH-SECURITY-BASELINE-001 — Revisión de seguridad Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SECURITY-BASELINE-001 |
| Tipo | Auditoría de seguridad (sin implementación) |
| Fecha | 2026-09-15 |
| Referencia | Reporte externo AprendeHoy (11-sep-2026 + revalidación pasiva 15-sep-2026) |
| Alcance | Auth Keycloak · sesión · aislamiento Espacios · IAM server-side · proxy/APIs · caché · Next.js · secretos · separación SEM/AprendeHoy · acceso cruzado |
| Estado | **CERRADA · PILOTO CONDICIONADO** |
| Fuera de alcance | Cambios de código · Keycloak/Cloudflare/producción · nuevo motor de auth/permisos · copiar remediaciones AprendeHoy sin prueba |

**Restricciones cumplidas:** solo lectura; cada punto evaluado contra la implementación real de Growth OS; no se atribuyen fallas de AprendeHoy sin evidencia local.

---

## Gate final

# PILOTO CONDICIONADO — sin críticos de aislamiento/sesión JWT como en AprendeHoy

Growth OS **no** replica el diseño de sesión JWT HS256 autocontenida ni el contrato `switch-tenant {targetSlug, targetRol}` de AprendeHoy. El aislamiento admin y las APIs Growth revisadas atan `tenantId` a sesión + membresía y filtran por `tenantId` en datos.

**Bloqueo de producto abierto (Alto):** el login UI actual es ROPC (`grant_type=password`); la contraseña llega a la app. Authorization Code existe pero no está cableado al formulario y va sin PKCE.

**Antes de piloto cerrado:** evidencia de cliente Keycloak dedicado (`growth-os-web` o equivalente), redirect URIs exactas, Brute Force Detection, y que el borde fije Host/`X-Forwarded-Host`.  
**Antes de producción pública amplia:** Auth Code (+ PKCE) como camino principal, `poweredByHeader: false`, `Cache-Control: no-store` en login/admin/APIs privadas, y evidencia HSTS/origen Cloudflare.

---

## 1. Método y referencia

Se usó el reporte AprendeHoy como **checklist de superficie**, no como lista de bugs a portar. Clasificación por punto:

| Etiqueta | Significado |
| --- | --- |
| **APTO** | Controles en código suficientes para el riesgo, con evidencia |
| **REQUIERE AJUSTE** | Gap real en Growth OS |
| **NO APLICA** | El problema de AprendeHoy no existe en este diseño |
| **REQUIERE EVIDENCIA DE INFRAESTRUCTURA** | Solo se cierra con panel/ops (Keycloak, Cloudflare, secretos productivos) |

---

## 2. Matriz por punto de alcance

| # | Punto | Clasificación | Resumen |
| --- | --- | --- | --- |
| 1 | Keycloak + cliente `growth-os-web` | **REQUIERE AJUSTE** + **REQUIERE EVIDENCIA DE INFRAESTRUCTURA** | Runtime lee `KEYCLOAK_CLIENT_ID` (sin hardcode). Defaults de plantilla/script: `admin-cli` / `seminario-ipn-web`. **`growth-os-web` no aparece en el repo.** Cliente real en Keycloak = evidencia de infra. |
| 2 | Authorization Code y flujo de login | **REQUIERE AJUSTE** | Auth Code + `state` existe (`/keycloak/login` → callback). **UI actual** (`LoginForm`) solo hace ROPC vía `POST /api/identity/auth/keycloak/session`. Sin PKCE en Auth Code. |
| 3 | Sesión / JWT / expiración / revocación | **APTO** (con notas Medio) | **No hay JWT de app.** Cookie `ah_session` = ID opaco en `identity_sessions`. TTL 30 días. Logout borra fila Mongo. Hipótesis JWT HS256 / alg confusion / jti denylist de AprendeHoy → **NO APLICA** al diseño de sesión. |
| 4 | Aislamiento Espacios/tenants | **APTO** + caveat infra | Admin: `session.tenantId` + membresía. Público: Host → Domain → Tenant. Host desconocido no cae a otro Espacio. Compat SEM solo loopback. Caveat: confianza en `X-Forwarded-Host`. |
| 5 | Roles, permisos, authz server-side | **APTO** | `requirePermission` / `requireSpace` + `authorize`. Permisos por membresía del Espacio activo. APIs Growth revisadas usan `ctx.tenantId`. |
| 6 | Middleware / proxy y APIs | **APTO** (nota Medio) | `src/proxy.ts` solo comprueba cookie en `/admin|/internal|/platform`. **APIs no dependen del proxy:** re-autorizan en handler. Next `16.2.9` (fuera del umbral CVE-2025-29927 citado en el reporte). |
| 7 | Caché login / privadas / APIs | **REQUIERE AJUSTE** | `force-dynamic` en admin/login mitiga SSG/ISR tipo AprendeHoy A.7, pero **no** hay `Cache-Control: private, no-store` explícito en login/admin/APIs Growth. |
| 8 | Next.js CSP / x-powered-by / imágenes | **REQUIERE AJUSTE** (CSP, poweredBy) · **APTO** (remotePatterns si `S3_PUBLIC_URL`) | Sin CSP ni `poweredByHeader: false`. `images.remotePatterns` = hostname exacto de `S3_PUBLIC_URL` + `/media/**` (no wildcard abierto). |
| 9 | Secretos y variables sensibles | **APTO** (patrón código) + **REQUIERE EVIDENCIA DE INFRAESTRUCTURA** | Sin `NEXT_PUBLIC_` para secretos en plantilla; `redact.ts`; WhatsApp cifrado por Espacio. Valores productivos / rotación / gestor = infra. |
| 10 | Separación Growth OS ↔ SEM / AprendeHoy | **APTO** | SEM/ADL son Espacios. Growth sin ramas por tenant. AprendeHoy = adapter opt-in (`ADMISSION_ADAPTER`). Handoff documentado. Residuo naming: cookie `ah_session`. |
| 11 | Acceso cruzado entre dos Espacios | **APTO** (hallazgos Medio) | Switch valida membresía; no acepta rol del cliente. IDOR Growth por id sin `tenantId` no encontrado en stores revisados. Restan: operador de plataforma (intencional) y spoof Host si el borde falla. |

---

## 3. Contraste con hallazgos críticos del reporte AprendeHoy

| Ref. AprendeHoy | ¿Mismo problema en Growth OS? | Evidencia |
| --- | --- | --- |
| B.1 switch-tenant confía `targetRol` | **No** | `POST /api/identity/spaces/switch` solo `tenantId` + `assertActiveMembership`; permisos se re-resuelven del rol en Mongo |
| A.10 / B.2 sesión JWT HS256 con claims | **No** | Cookie opaca; authz no viaja en JWT de app |
| B.4 ROPC vs Auth Code + PKCE | **Sí (confirmado)** | `LoginForm` → password grant; Auth Code sin cablear al UI y sin PKCE |
| B.5 Google login | **NO APLICA** | No hay superficie Google en Growth OS |
| B.7 middleware único gate + CVE Next | **Parcialmente mitigado** | Next 16.2.9; handlers re-autorizan; proxy solo presence-check (debilidad de borde, no único control) |
| B.8 remotePatterns amplio | **No (si env correcto)** | Solo host de `S3_PUBLIC_URL` |
| A.5 `x-powered-by` | **Sí (probable)** | `next.config.ts` no fija `poweredByHeader: false` |
| A.7 caché agresiva `/login` | **No igual; gap residual** | `force-dynamic` en login; falta `no-store` explícito |
| A.4 CSP débil | **Gap distinto** | En Growth **no hay CSP** en app config (ni siquiera esqueleto) |
| A.3 HSTS | **Infra** | No se cierra en código de app |

---

## 4. Ajustes realmente necesarios (por severidad)

### Crítico

*Ninguno con evidencia en código Growth OS para el alcance de esta OT.*

No hay prueba de escalada vertical vía switch de Espacio ni de forja de claims de sesión JWT (diseño distinto).

### Alto

| ID | Ajuste | Archivo / componente | Notas |
| --- | --- | --- | --- |
| A1 | Convertir el **login UI primario** a Authorization Code (redirigir a Keycloak); dejar de enviar contraseña a la app en el camino por defecto | `src/components/identity/LoginForm.tsx`, `src/app/api/identity/auth/keycloak/session/route.ts`, `src/core/identity/auth/keycloak.ts` | Misma clase que AprendeHoy B.4, **confirmada aquí**. No inventar motor nuevo: usar el Auth Code ya existente. |
| A2 | Añadir **PKCE** al Auth Code (`code_challenge` / `code_verifier`) | `src/core/identity/auth/keycloak.ts`, `login/route.ts`, `callback/route.ts` | El flujo redirect actual no lo implementa. |
| A3 | Provisionar y documentar cliente Keycloak dedicado de plataforma (**`growth-os-web`** o nombre oficial), redirect URIs exactas, sin reutilizar defaults SEM/`admin-cli` en piloto | Infra Keycloak + `.env.example` + `scripts/setup-keycloak-client.ts` (default hoy `seminario-ipn-web`) | Código no crea `growth-os-web`; es gap de defaults + evidencia de realm. |

### Medio

| ID | Ajuste | Archivo / componente | Notas |
| --- | --- | --- | --- |
| M1 | `poweredByHeader: false` | `next.config.ts` | Equivalente A.5 AprendeHoy; higiene inmediata. |
| M2 | `Cache-Control: private, no-store` (o equivalente) en login, shell admin y APIs privadas Growth/identity | `src/app/admin/login/page.tsx`, `src/app/admin/layout.tsx`, handlers `/api/growth/**`, `/api/identity/**` | `force-dynamic` no sustituye cabecera explícita frente a CDN. |
| M3 | Cabeceras de seguridad mínimas (CSP Report-Only → enforce; alinear con borde) | `next.config.ts` y/o Cloudflare | Hoy **ausentes** en app; no copiar CSP “decorativa” de AprendeHoy. |
| M4 | Rate-limit / Brute Force por cuenta en login ROPC (mientras exista) | Keycloak BFD (infra) + eventual límite app en `keycloak/session` | En código **no hay** rate-limit de login. |
| M5 | Logout: invalidar también sesión IdP (`end_session`) si se guarda `id_token` | Flujo logout identity | Hoy solo borra sesión Mongo/cookie. |
| M6 | Confirmar borde: solo proxy de confianza setea `X-Forwarded-Host`; Full (strict) / Origin Pulls | Cloudflare / firewall origen | Caveat del aislamiento público Host→Tenant. |
| M7 | TTL de sesión 30 días: valorar acortar para piloto o idle timeout real | `src/lib/identity/sessions.ts`, `src/core/identity/auth/config.ts` | `lastActivity` no extiende `expiresAt`. |
| M8 | IDs de sesión con más entropía (`generateToken` / ≥16 bytes random; no `Date.now()`+4 bytes) | `src/core/identity/auth/crypto.ts` (`generateId`), `src/lib/identity/sessions.ts` | Cookie = `_id`; adivinar/forzar ID es más barato de lo deseable. |
| M9 | En setup Keycloak, acotar `webOrigins` (evitar `"+"`) a orígenes exactos del piloto | `scripts/setup-keycloak-client.ts` | CORS Keycloak demasiado permisivo si se usa el script tal cual. |

### Bajo

| ID | Ajuste | Archivo / componente | Notas |
| --- | --- | --- | --- |
| B1 | Renombrar cookie `ah_session` → cookie de producto Growth (evitar acoplamiento semántico con AprendeHoy) | `src/core/identity/auth/config.ts` | Host-only hoy (sin `Domain`); riesgo bajo si no comparten dominio padre. |
| B2 | Alinear defaults `.env.example` / `setup-keycloak-client.ts` al client ID oficial de plataforma | `.env.example`, `scripts/setup-keycloak-client.ts` | Evitar `admin-cli` / `seminario-ipn-web` como defaults de Growth OS. |
| B3 | `/.well-known/security.txt` | Estático o route | Higiene A.6 del reporte; no bloquea piloto. |
| B4 | Gobernanza operadores de plataforma (`platformRoles`) | Proceso + auditoría existente | Privilegio cross-Espacio **intencional**; no es bug de aislamiento de membresía. |

---

## 5. Evidencia clave (código)

### Login actual = ROPC

```63:67:src/components/identity/LoginForm.tsx
      const res = await fetch("/api/identity/auth/keycloak/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
```

`loginWithKeycloakPassword` usa `grant_type: "password"` (`src/core/identity/auth/keycloak.ts`).

### Auth Code existe (sin PKCE; no es el UI)

`buildKeycloakAuthorizeUrl`: `response_type=code`, `state`, **sin** `code_challenge`.

### Sesión opaca (no JWT de app)

`createSession` inserta en `identity_sessions`; cookie = `_id` (`src/lib/identity/sessions.ts`).  
`SESSION_SECRET` **no** firma la cookie de sesión.  
`_id` de sesión usa `generateId` → `Date.now()` + 4 bytes random (ver M8).

### Switch de Espacio (robusto frente a B.1)

`spaces/switch`: membresía obligatoria; no hay `targetRol` ni claims de rol en cookie.

### Proxy vs APIs

`src/proxy.ts`: gate por presencia de cookie en rutas de página.  
APIs Growth: `requirePermission(...)` + `ctx.tenantId` (ej. `src/app/api/growth/campaigns/[id]/route.ts`).  
Stores: `findOne({ tenantId, _id })` (ej. campañas).

### next.config

Sin CSP / sin `poweredByHeader: false`.  
`remotePatterns` derivado solo de `S3_PUBLIC_URL`.

---

## 6. Criterio de cierre — ¿piloto o bloqueo?

| Pregunta | Respuesta |
| --- | --- |
| ¿Hay críticos de aislamiento o forja de sesión JWT como en AprendeHoy? | **No** (diseño distinto y controles server-side presentes) |
| ¿Puede continuar a **piloto cerrado**? | **Sí, condicionado** a A3 (cliente Keycloak dedicado + BFD + redirect URIs) y evidencia de borde Host (M6) |
| ¿Qué debe resolverse **antes de despliegue/producción pública**? | A1–A2 (Auth Code + PKCE como primario), M1–M3 (poweredBy, no-store, CSP mínima), M6 (origen detrás de Cloudflare/HSTS) |
| ¿Copiar remediaciones JWT/jti/denylist de AprendeHoy? | **No** — no aplican al modelo de sesión actual |
| ¿Crear nuevo motor de auth/permisos? | **No** — reforzar Keycloak + guards existentes |

**Frase defendible para piloto:**  
«Para el alcance Growth OS revisado en código el 2026-09-15, no hay críticos abiertos de aislamiento entre Espacios ni de sesión JWT autocontenida; el piloto cerrado puede seguir si el cliente Keycloak de plataforma y el borde están evidenciados. Queda abierto como Alto el login ROPC del UI, a cerrar antes de exposición pública amplia.»

---

## 7. Fuera de alcance / no hechos

- Sin cambios de código, Keycloak, Cloudflare, datos ni producción.
- Sin pentest autenticado (equivalente registro C del reporte AprendeHoy).
- Sin afirmar “seguridad robusta por todos lados”.
