# OT-GROWTH-SECURITY-HARDENING-002 — Hardening web final para piloto

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-SECURITY-HARDENING-002 |
| Tipo | Hardening web (headers · caché privada · CSP · clasificación HSTS) |
| Fecha | 2026-09-15 |
| Entrada | [OT-GROWTH-SECURITY-BASELINE-001](./OT-GROWTH-SECURITY-BASELINE-001.md) (M1–M3, M6) · [OT-GROWTH-AUTH-HARDENING-001](./OT-GROWTH-AUTH-HARDENING-001.md) |
| Estado | **CERRADA · APTO CON AJUSTES** |
| Alcance | `poweredByHeader` · CSP mínima · nosniff · Referrer-Policy · Permissions-Policy · `Cache-Control: no-store` selectivo · clasificación HTTPS/HSTS |
| Fuera de alcance | Flujo Auth Code/PKCE · ROPC · Shell · IAM · `/platform` visual · Meta/WhatsApp · CMS funcional · DNS/Cloudflare/Dokploy · WAF propio |

**Restricciones cumplidas:** se evolucionó `next.config.ts` + `src/proxy.ts` existentes; sin segundo proxy/WAF/CSP engine; sin tocar login Auth Code + PKCE ni sesión opaca; HSTS no duplicado en app.

---

## Gate final

# APTO CON AJUSTES

Controles Medium de aplicación (M1–M3) cerrados en código: sin `X-Powered-By`, CSP mínima compatible, nosniff / Referrer / Permissions, y `Cache-Control: no-store` reutilizable en zonas privadas y APIs de identidad/Espacio/plataforma/Growth.

**PENDIENTE OPS (no abre otra OT):**

1. **HSTS en Cloudflare** — `growthos.mentorprime.cl` ya sirve HTTPS detrás de Cloudflare, pero las respuestas HTTPS **no** envían `Strict-Transport-Security`. No se añadió HSTS en la app para no crear una segunda política cuando el edge lo active.
2. **Rotación verificable de secretos** — valores expuestos en incidentes previos se consideran rotados operativamente; sin evidencia de rotación en esta OT, queda como seguimiento OPS (sin imprimir valores).

---

## 1. Qué se implementó

| ID | Control | Resultado |
| --- | --- | --- |
| M1 | `poweredByHeader: false` | `next.config.ts` |
| M2 | `Cache-Control: no-store` selectivo | Helper reutilizable + `next.config` sources + `src/proxy.ts` |
| M3 | CSP + nosniff + Referrer + Permissions | `src/core/security/http-headers.ts` → `headers()` en Next |
| M6 | HTTPS / HSTS | HTTPS = edge; HSTS = **PENDIENTE OPS** (evidencia sin header) |

### Archivos

| Archivo | Cambio |
| --- | --- |
| `src/core/security/http-headers.ts` | **Nuevo** — CSP builder, security headers, `shouldApplyPrivateNoStore`, `PRIVATE_CACHE_CONTROL` |
| `src/core/security/index.ts` | Reexport del módulo |
| `next.config.ts` | `poweredByHeader: false` + `headers()` seguridad + no-store en `/admin|/platform|/internal|/api/{identity,platform,growth,admin}` |
| `src/proxy.ts` | Adjunta `no-store` en respuestas/redirects de rutas privadas (incl. CMS/experience con excepciones públicas) |
| `tests/baseline/security-hardening-002.test.ts` | **Nuevo** |
| `docs/AI/auditorias/OT-GROWTH-SECURITY-HARDENING-002.md` | Esta entrega |

---

## 2. CSP — política mínima (recursos reales)

Construida desde uso real de Growth OS (sin `unsafe-eval` en producción; sin `https:` / `*.` abiertos):

| Directiva | Valor |
| --- | --- |
| `default-src` | `'self'` |
| `base-uri` | `'self'` |
| `object-src` | `'none'` |
| `frame-ancestors` | `'none'` |
| `form-action` | `'self'` + origen `KEYCLOAK_URL` si existe |
| `script-src` | `'self' 'unsafe-inline'` (+ `'unsafe-eval'` **solo** `NODE_ENV=development` para HMR) |
| `style-src` | `'self' 'unsafe-inline'` (Tailwind / estilos inline de Next) |
| `img-src` / `media-src` | `'self' data: blob:` + origen `S3_PUBLIC_URL` si existe |
| `font-src` | `'self' data:` (`next/font` self-hosted) |
| `connect-src` | `'self'` + origen Keycloak (+ `ws:`/`wss:` en dev) |
| `frame-src` | `'self'` + YouTube / Vimeo / Google Maps / OpenStreetMap (embeds de Sitio) |
| `worker-src` | `'self' blob:` (PDF/export) |

`'unsafe-inline'` en scripts es el mínimo compatible con Next App Router **sin** inventar un sistema de nonces. No se usó `unsafe-eval` en producción.

---

## 3. Caché privada (no-store)

Constante reutilizable: `PRIVATE_CACHE_CONTROL = "no-store"`.

| Zona | Mecanismo |
| --- | --- |
| `/admin`, `/platform`, `/internal` | `next.config` + proxy |
| `/api/identity/**` (login/callback/logout/me/…) | `next.config` + proxy |
| `/api/platform/**`, `/api/growth/**`, `/api/admin/**` | `next.config` + proxy |
| `/api/cms/**`, `/api/experience/**`, workflows/events/student-affairs | proxy + helper (selectivo) |

**Excepciones (siguen cacheables / públicas):**

- `/api/cms/media/stream` (ya declara `public, max-age=31536000, immutable`)
- `/api/webhooks/**`, `/api/admission/**`
- `/api/experience/forms/:id/public` y `…/submit`
- Sitio público y `/_next/static` (sin no-store)

Nota: en `next dev`, respuestas HTML de App Router pueden mostrar `Cache-Control: no-cache, must-revalidate` (Next sobrescribe). En producción, páginas `force-dynamic` de admin ya emiten `no-store` (evidencia previa en `growthos.mentorprime.cl`). Redirects del proxy y APIs privadas confirman `no-store` en local.

---

## 4. HTTPS / HSTS — clasificación app vs edge

| Control | Capa | Evidencia 2026-09-15 | Clasificación |
| --- | --- | --- | --- |
| HTTPS | Cloudflare | `http://growthos.mentorprime.cl/…` → **308** `Location: https://…`; `Server: cloudflare` | **Cubierto por infraestructura** |
| HSTS | Cloudflare (esperado) | Respuesta HTTPS de `/admin/login` **sin** `Strict-Transport-Security` | **PENDIENTE OPS** — no se emitió HSTS desde Next para evitar doble política |

No se tocó Cloudflare, DNS ni Dokploy.

---

## 5. Login / secretos (sin regresión)

| Tema | Estado |
| --- | --- |
| Auth Code + PKCE S256 | **Sin cambios** — probe local: authorize con `code_challenge_method=S256` |
| Sesión opaca / post-auth | **Sin cambios** |
| ROPC | **No reactivado** por esta OT |
| Secretos en HTML login | **PASS** — ausentes `KEYCLOAK_CLIENT_SECRET`, `SESSION_SECRET`, `MONGODB_URI`, `RESEND_API_KEY`, `client_secret` |
| Secretos en acta | No se imprimen valores |

---

## 6. Validación A–N

| ID | Criterio | Resultado |
| --- | --- | --- |
| A | `X-Powered-By` ausente | **PASS** (local post-cambio) |
| B | CSP presente y app funcional | **PASS** — login 200, providers 200, authorize 307 PKCE |
| C | nosniff | **PASS** |
| D | Referrer-Policy | **PASS** (`strict-origin-when-cross-origin`) |
| E | Permissions-Policy | **PASS** (camera/mic/geo/payment/usb/topics denegados) |
| F | `/admin` privado → no-store | **PASS** — proxy redirect + config; HTML prod vía `force-dynamic` |
| G | `/platform` privado → no-store | **PASS** — igual |
| H | APIs privadas → no-store | **PASS** (`/api/identity/me`, `/api/growth/campaigns`, logout, providers) |
| I | Públicos mantienen caché | **PASS** — sitio sin no-store forzado; stream exceptuado; estáticos CF `HIT` en prod |
| J | HTTPS/HSTS clasificado | **PASS** — HTTPS edge; HSTS **PENDIENTE OPS** |
| K | Auth Code + PKCE | **PASS** — sin regresión |
| L | IAM + multi-tenant + Equipo + Shell | **PASS** — suite regresión |
| M | SEM/ADL aislados | **PASS** — `saas-multi-space` sin cambios de aislamiento |
| N | Sin secretos en cliente/respuestas/logs de prueba | **PASS** (muestra HTML/login); rotación histórica → OPS |

### Suite automatizada

```text
npx tsx --test tests/baseline/security-hardening-002.test.ts \
  tests/baseline/proxy-admin-gate.test.ts \
  tests/baseline/auth-hardening-001.test.ts \
  tests/baseline/saas-multi-space.test.ts \
  tests/baseline/ux-shell-identity.test.ts \
  tests/baseline/growth-team-003.test.ts
→ 51/51 PASS
```

---

## 7. Operación recomendada (piloto)

1. Desplegar este cambio (Dokploy) y revalidar A–E en `https://growthos.mentorprime.cl`.
2. **OPS:** habilitar HSTS en Cloudflare (p. ej. `max-age` ≥ 15552000; valorar `includeSubDomains` solo si todos los subdominios son HTTPS).
3. **OPS:** confirmar rotación de cualquier secreto previamente expuesto (sin pegar valores en tickets).
4. Smoke post-deploy: `/admin/login`, `/platform`, Sitio, Mensajes, authorize PKCE.

---

## 8. Fuera de alcance / no hechos

- Sin modificar Cloudflare/DNS/Dokploy.
- Sin HSTS en `next.config` (evitar política duplicada).
- Sin nonces CSP / Report-Only pipeline (mínimo enforce compatible).
- Sin cambios de Shell, IAM, Meta, CMS funcional ni flujo de login.
- Sin abrir otra OT.
