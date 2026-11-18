# Operador Congreso — control total + acceso/clave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar al Operador Congreso Varones control financiero completo y un flujo self-service de crear/recuperar clave desde el login, con invitación que indique claramente `/login`.

**Architecture:** Ampliar la plantilla del rol `congress_operator`; mejorar el copy de `renderInvitationEmail`; añadir un servicio público `requestAccessLink` que reutiliza invitación pendiente / `resendMemberAccessEmail`, expuesto por `POST /api/identity/access/request-link` y cableado en `LoginForm`.

**Tech Stack:** TypeScript, Next.js App Router, MongoDB (identity_*), Resend via `sendInvitationEmail`, tests `node:test` (`npm run test:baseline`).

**Spec:** `docs/superpowers/specs/2026-11-17-operador-congreso-acceso-clave-design.md`

## Global Constraints

- Sin despliegue; **sin commit/PR de git** salvo pedido explícito del usuario (omitir pasos `git commit` / `git push`).
- No se reenvía la misma clave en claro: siempre enlace nuevo (`/invite/{token}`).
- Respuesta pública anti-enumeración: mismo mensaje OK si el correo no existe o es ambiguo.
- Reutilizar `resendMemberAccessEmail` / `renewInvitationToken` / `sendInvitationEmail`; no UI nativa de reset Keycloak.
- Login oficial: `GROWTH_LOGIN_PATH` = `/login`.
- Shell del operador sigue acotado al congreso (sin AE / Growth / Equipo).

## File map

| Path | Responsibility |
|------|----------------|
| `src/core/identity/permissions/role-templates.ts` | `congress.finance.correct: true` en operador |
| `src/core/identity/roles/defaults.ts` | `permissionIds` del rol incluye `congress.finance.correct` |
| `tests/baseline/congress-access.test.ts` | Expectativa `finance.correct === true` |
| `src/lib/notifications/email.ts` | Copy invitación + URL absoluta de `/login` |
| `tests/baseline/invitation-email-login.test.ts` | Assert HTML contiene CTA invite + login |
| `src/lib/identity/invitations.ts` | `findPendingInvitationsByEmail` (sin tenant) |
| `src/lib/identity/access-request-rate-limit.ts` | Rate limit memoria IP/email |
| `src/lib/identity/request-access-link.ts` | Orquestación pública request-link |
| `tests/baseline/request-access-link.test.ts` | Resolución + anti-enumeración + rate limit |
| `src/app/api/identity/access/request-link/route.ts` | `POST` público |
| `src/components/identity/LoginForm.tsx` | UI “¿No tienes o perdiste tu clave?” |

---

### Task 1: Permisos — Operador con `congress.finance.correct`

**Files:**
- Modify: `src/core/identity/permissions/role-templates.ts`
- Modify: `src/core/identity/roles/defaults.ts`
- Modify: `tests/baseline/congress-access.test.ts`

**Interfaces:**
- Produces: plantilla `CONGRESS_OPERATOR` con `congress.finance.correct === true`
- Consumes: `ROLE_CODES.CONGRESS_OPERATOR`, catálogo existente (sin nuevos códigos)

- [ ] **Step 1: Actualizar el test de acceso**

En `tests/baseline/congress-access.test.ts`, reemplazar el primer `it` por:

```ts
it("el operador tiene control completo del congreso incluyendo finanzas", () => {
  const map = ROLE_PERMISSION_TEMPLATES[ROLE_CODES.CONGRESS_OPERATOR];
  assert.equal(map["congress.view"], true);
  assert.equal(map["congress.operate"], true);
  assert.equal(map["congress.payments"], true);
  assert.equal(map["congress.import"], true);
  assert.equal(map["congress.finance.correct"], true);
  assert.equal(map["student_affairs.panel.view"], false);
  assert.equal(map["growth.sales.view"], false);
});
```

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `npx tsx --test tests/baseline/congress-access.test.ts`  
Expected: FAIL en `congress.finance.correct` (sigue `false` o `undefined`)

- [ ] **Step 3: Actualizar plantilla y defaults**

En `role-templates.ts`, bloque `[ROLE_CODES.CONGRESS_OPERATOR]`:

```ts
[ROLE_CODES.CONGRESS_OPERATOR]: fromEntries([
  ["congress.view", true],
  ["congress.operate", true],
  ["congress.payments", true],
  ["congress.import", true],
  ["congress.finance.correct", true],
]),
```

En `defaults.ts`, `permissionIds` del rol:

```ts
permissionIds: [
  "congress.view",
  "congress.operate",
  "congress.payments",
  "congress.import",
  "congress.finance.correct",
],
```

- [ ] **Step 4: Correr el test y confirmar que pasa**

Run: `npx tsx --test tests/baseline/congress-access.test.ts`  
Expected: PASS

- [ ] **Step 5: Nota operativa (no automatizar aquí)**

Roles ya materializados en Mongo pueden requerir `npm run sync:tenant-roles` en el entorno local/prod para que el operador existente herede `congress.finance.correct`. Documentar en el resumen de implementación; no bloquear el resto del plan.

---

### Task 2: Correo de invitación — login explícito

**Files:**
- Modify: `src/lib/notifications/email.ts` (`renderInvitationEmail`)
- Create: `tests/baseline/invitation-email-login.test.ts`

**Interfaces:**
- Consumes: `GROWTH_LOGIN_PATH`, `emailAbsoluteUrl`, `renderInvitationEmail`
- Produces: HTML de invitación con CTA `/invite/{token}` y URL absoluta de `/login`

- [ ] **Step 1: Escribir test que falla**

Crear `tests/baseline/invitation-email-login.test.ts`:

```ts
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import type { EmailIdentity } from "../../src/lib/notifications/identity";
import { GROWTH_LOGIN_PATH } from "../../src/lib/identity/login-route";

const require = createRequire(import.meta.url);
require("../../scripts/_stub-server-only.cjs");

const identity: EmailIdentity = {
  tenantId: "seminario-ipn",
  siteId: "seminario-ipn",
  displayName: "Seminario IPN",
  origin: "https://seminario-ipn.example",
};

describe("invitation email login copy", () => {
  it("incluye CTA de crear clave y URL absoluta de login", async () => {
    const { renderInvitationEmail } = await import("../../src/lib/notifications/email");
    const { html } = renderInvitationEmail({
      identity,
      displayName: "María González",
      token: "tok-test-123",
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    });
    assert.match(html, /\/invite\/tok-test-123/);
    assert.match(html, /Crear mi contraseña/);
    assert.match(html, new RegExp(`${identity.origin}${GROWTH_LOGIN_PATH}`));
    assert.match(html, /Entra en/i);
  });
});
```

- [ ] **Step 2: Correr test — debe fallar**

Run: `npx tsx --test tests/baseline/invitation-email-login.test.ts`  
Expected: FAIL (HTML actual no incluye URL absoluta de `/login`)

- [ ] **Step 3: Actualizar `renderInvitationEmail`**

En `src/lib/notifications/email.ts`, dentro de `renderInvitationEmail`:

1. Calcular `loginUrl = emailAbsoluteUrl(input.identity, GROWTH_LOGIN_PATH)` (ya importado `GROWTH_LOGIN_PATH`).
2. Reemplazar el párrafo + steps por algo equivalente a:

```ts
const bodyHtml = `
  <p style="margin:0 0 16px;">
    ${escapeHtml(voice.lead).replace(
      escapeHtml(voice.label),
      `<strong>${escapeHtml(voice.label)}</strong>`
    )}
  </p>
  <p style="margin:0 0 16px;">
    Crea tu contraseña con el enlace siguiente. ${validityNote}
  </p>
  ${renderSteps([
    "Abre el enlace de invitación.",
    "Define tu contraseña de acceso.",
    `Entra en ${loginUrl} con tu correo y la contraseña que creaste.`,
  ])}
  <p style="margin:16px 0 0;">
    Acceso al sistema (login):
    <a href="${escapeHtml(loginUrl)}" style="color:inherit;font-weight:600;">${escapeHtml(loginUrl)}</a>
  </p>
`;
```

Mantener `ctaLabel: "Crear mi contraseña"` y `ctaUrl: inviteUrl`.

- [ ] **Step 4: Correr test — debe pasar**

Run: `npx tsx --test tests/baseline/invitation-email-login.test.ts`  
Expected: PASS

---

### Task 3: Dominio — rate limit + `requestAccessLink`

**Files:**
- Modify: `src/lib/identity/invitations.ts` — añadir `findPendingInvitationsByEmail`
- Create: `src/lib/identity/access-request-rate-limit.ts`
- Create: `src/lib/identity/request-access-link.ts`
- Create: `tests/baseline/request-access-link.test.ts`

**Interfaces:**
- Produces:
  - `findPendingInvitationsByEmail(email: string): Promise<IdentityInvitation[]>`
  - `assertAccessRequestAllowed(key: string): { ok: true } | { ok: false; retryAfterSec: number }`
  - `requestAccessLink(input: { email: string; clientKey: string }): Promise<{ ok: true; message: string } | { ok: false; error: string; status: number }>`
- Consumes: `normalizeEmail`, `isValidEmail`, `renewInvitationToken`, `sendInvitationEmail` (vía helpers de `resend-access`), `resendMemberAccessEmail`, `findUserByEmail`, `listMembershipsByUser`

**Regla de resolución de tenant (explícita):**

1. Rate limit primero (si falla → 429 con mensaje genérico de reintento).
2. Buscar invitaciones `pending` no expiradas con ese email (cualquier tenant).
   - Si **exactamente 1** → renovar token + `sendInvitationEmail` → mensaje genérico de éxito.
3. Si no: `findUserByEmail` + `listMembershipsByUser` (solo `active`).
   - Si **exactamente 1** membership → `resendMemberAccessEmail` con `tenantId`, `roleIds`, `invitedBy: membership.invitedBy ?? membership.userId`, `unitIds` si aplica.
4. 0 matches, >1 invitations, >1 memberships, o fallo de envío no diferenciable → **siempre** `{ ok: true, message: GENERIC }` salvo rate limit / email inválido.
5. Mensaje genérico fijo:  
   `"Si el correo está registrado, enviamos un enlace para crear o renovar tu clave."`

- [ ] **Step 1: Tests de rate limit y mensaje genérico (puros / con stub)**

Crear `tests/baseline/request-access-link.test.ts` con al menos:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertAccessRequestAllowed,
  __resetAccessRequestRateLimitForTests,
} from "../../src/lib/identity/access-request-rate-limit";

describe("access request rate limit", () => {
  it("bloquea el segundo intento inmediato con la misma key", () => {
    __resetAccessRequestRateLimitForTests();
    assert.equal(assertAccessRequestAllowed("ip:1|a@b.cl").ok, true);
    const second = assertAccessRequestAllowed("ip:1|a@b.cl");
    assert.equal(second.ok, false);
    if (!second.ok) assert.ok(second.retryAfterSec >= 1);
  });
});

describe("requestAccessLink contract", () => {
  it("exporta mensaje genérico estable", async () => {
    const { ACCESS_LINK_GENERIC_MESSAGE } = await import(
      "../../src/lib/identity/request-access-link"
    );
    assert.match(ACCESS_LINK_GENERIC_MESSAGE, /Si el correo está registrado/);
  });
});
```

(Ajustar imports si el stub `server-only` es necesario al importar `request-access-link`.)

- [ ] **Step 2: Correr tests — deben fallar (módulos ausentes)**

Run: `npx tsx --test tests/baseline/request-access-link.test.ts`  
Expected: FAIL (módulo no encontrado)

- [ ] **Step 3: Implementar rate limit**

Crear `src/lib/identity/access-request-rate-limit.ts`:

```ts
const WINDOW_MS = 60_000;
const hits = new Map<string, number>();

export function __resetAccessRequestRateLimitForTests(): void {
  hits.clear();
}

export function assertAccessRequestAllowed(
  key: string
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const prev = hits.get(key) ?? 0;
  if (prev && now - prev < WINDOW_MS) {
    return { ok: false, retryAfterSec: Math.ceil((WINDOW_MS - (now - prev)) / 1000) };
  }
  hits.set(key, now);
  return { ok: true };
}
```

- [ ] **Step 4: Extender invitations + implementar `requestAccessLink`**

En `invitations.ts` añadir:

```ts
export async function findPendingInvitationsByEmail(
  email: string
): Promise<IdentityInvitation[]> {
  const db = await getDatabase();
  return db
    .collection<IdentityInvitation>("identity_invitations")
    .find({
      email: normalizeEmail(email),
      status: "pending",
      expiresAt: { $gt: new Date().toISOString() },
    })
    .toArray();
}
```

Crear `src/lib/identity/request-access-link.ts` (server-only) con:

- `export const ACCESS_LINK_GENERIC_MESSAGE = "Si el correo está registrado, enviamos un enlace para crear o renovar tu clave.";`
- `requestAccessLink({ email, clientKey })`:
  - validar email con `isValidEmail` / `normalizeEmail` → si inválido `{ ok:false, error:"Ingresa un correo electrónico válido.", status:400 }`
  - `assertAccessRequestAllowed(clientKey)` → si no ok `{ ok:false, error:"Espera un momento antes de solicitar otro enlace.", status:429 }`
  - try/catch alrededor del envío; en cualquier resultado de envío (ok/fail/0 matches/ambiguo) devolver `{ ok:true, message: ACCESS_LINK_GENERIC_MESSAGE }` excepto validación/rate limit
  - rama pending única: `renewInvitationToken` + `sendInvitationEmail` (mismo patrón que `deliverInvitationEmail` en `resend-access.ts`)
  - rama membership única: `resendMemberAccessEmail({...})` ignorando `result.ok` para el body público (log interno si falla)

- [ ] **Step 5: Correr tests — deben pasar**

Run: `npx tsx --test tests/baseline/request-access-link.test.ts`  
Expected: PASS

---

### Task 4: API pública `POST /api/identity/access/request-link`

**Files:**
- Create: `src/app/api/identity/access/request-link/route.ts`

**Interfaces:**
- Consumes: `requestAccessLink`
- Produces: JSON `{ ok: true, message }` o `{ ok: false, error }` con status 400/429/500
- Sin `requirePermission` / sin sesión

- [ ] **Step 1: Crear la ruta**

```ts
import { NextResponse } from "next/server";
import { requestAccessLink } from "@/lib/identity/request-access-link";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientKey = `${forwarded || "unknown"}|${(body.email ?? "").trim().toLowerCase()}`;
    const result = await requestAccessLink({
      email: body.email ?? "",
      clientKey,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status }
      );
    }
    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "No se pudo procesar la solicitud." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Smoke manual (dev)**

Con `npm run dev` corriendo:

```bash
curl -s -X POST http://localhost:3000/api/identity/access/request-link -H "Content-Type: application/json" -d "{\"email\":\"nadie-xyz@example.com\"}"
```

Expected: `{"ok":true,"message":"Si el correo está registrado,..."}`  
Segundo curl inmediato con el mismo email: status 429 o error de espera.

---

### Task 5: UI Login — solicitar enlace

**Files:**
- Modify: `src/components/identity/LoginForm.tsx`

**Interfaces:**
- Consumes: `POST /api/identity/access/request-link`
- Produces: toggle UI + feedback genérico

- [ ] **Step 1: Extender estado del formulario**

Añadir estado:

```ts
const [showAccessHelp, setShowAccessHelp] = useState(false);
const [recoverEmail, setRecoverEmail] = useState("");
const [recoverMessage, setRecoverMessage] = useState("");
const [recoverError, setRecoverError] = useState("");
const [recoverLoading, setRecoverLoading] = useState(false);
```

- [ ] **Step 2: Handler de envío**

```ts
async function onRequestAccessLink(event: React.FormEvent) {
  event.preventDefault();
  setRecoverError("");
  setRecoverMessage("");
  setRecoverLoading(true);
  try {
    const res = await fetch("/api/identity/access/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: recoverEmail.trim() }),
    });
    const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
    if (!res.ok || !data.ok) {
      setRecoverError(data.error ?? "No se pudo enviar el enlace.");
      return;
    }
    setRecoverMessage(
      data.message ??
        "Si el correo está registrado, enviamos un enlace para crear o renovar tu clave."
    );
  } catch {
    setRecoverError("No se pudo conectar con el servidor.");
  } finally {
    setRecoverLoading(false);
  }
}
```

- [ ] **Step 3: Render debajo de `login-actions`**

Antes del cierre de `</form>` (o un bloque hermano debajo del form de login, sin anidar forms): preferir **fuera** del form de login un segundo form pequeño:

```tsx
<div className="space-y-2 pt-2">
  <button
    type="button"
    className="login-back"
    onClick={() => setShowAccessHelp((v) => !v)}
  >
    ¿No tienes o perdiste tu clave?
  </button>
  {showAccessHelp ? (
    <form onSubmit={onRequestAccessLink} className="space-y-3">
      <Input
        label="Correo"
        name="recover-email"
        type="email"
        autoComplete="email"
        value={recoverEmail}
        onChange={(e) => setRecoverEmail(e.target.value)}
        required
      />
      <Button type="submit" loading={recoverLoading} disabled={recoverLoading}>
        Enviar enlace
      </Button>
      {recoverMessage ? <p className="text-sm text-white/80">{recoverMessage}</p> : null}
      {recoverError ? <p className="login-error">{recoverError}</p> : null}
    </form>
  ) : null}
</div>
```

Prefill opcional: al abrir ayuda, si `username` parece email, copiar a `recoverEmail`.

- [ ] **Step 4: Smoke manual en navegador**

1. Abrir `/login`.
2. Clic en “¿No tienes o perdiste tu clave?”.
3. Enviar un correo inexistente → mensaje genérico OK.
4. Con una invitación pendiente real (si hay en Equipo), solicitar de nuevo → llega correo con enlace; el anterior deja de servir.
5. Tras crear clave, entrar en `/login`.

---

### Task 6: Verificación integrada

**Files:** ninguno nuevo (checklist)

- [ ] **Step 1: Suite baseline relacionada**

Run:

```bash
npx tsx --test tests/baseline/congress-access.test.ts tests/baseline/invitation-email-login.test.ts tests/baseline/request-access-link.test.ts
```

Expected: PASS en los tres.

- [ ] **Step 2: Checklist funcional vs spec**

- [ ] Operador tiene `congress.finance.correct` en plantilla.
- [ ] Invitación muestra CTA crear clave + URL `/login`.
- [ ] Login ofrece solicitar enlace; respuesta genérica.
- [ ] Rate limit evita spam inmediato.
- [ ] No depende de Soporte para recuperar acceso.

---

## Self-review (plan vs spec)

| Spec | Task |
|------|------|
| §1 `finance.correct` | Task 1 |
| §2 correo + login URL | Task 2 |
| §3 UI login | Task 5 |
| §3 API + resolución C | Tasks 3–4 |
| Anti-enumeración + rate limit | Tasks 3–4 |
| Verificación | Task 6 |
| Fuera de alcance Keycloak UI / panel recepción | respetado |

Sin placeholders pendientes: resolución multi-tenant documentada (exactamente 1 match).
