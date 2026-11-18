# Avatar y foto de perfil — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En Mi cuenta se puede elegir un avatar listo o subir una foto; se ve en el círculo de la cuenta, la píldora de la barra y las listas de personas del escritorio; sin elección, iniciales.

**Architecture:** Espejo del fondo personal: catálogo fijo de presets en `public/desktop/avatars/`, foto propia en `data/desktop-avatars/`, campos en `identity_users`, API `/api/desktop/avatar`, resolución pura `resolveDesktopAvatar` y componente `DesktopAvatar`. Prioridad: foto → preset → iniciales.

**Tech Stack:** Next.js App Router, TypeScript, MongoDB (`identity_users`), sharp (recorte cuadrado WebP), node:test + assert (baseline), CSS del escritorio.

## Global Constraints

- JPG, PNG o WebP; hasta **2 MB**; lado mínimo **128 px**; salida cuadrada WebP máx. **512 px**.
- Prioridad: **foto propia → preset → iniciales**.
- Quitar foto no borra preset. «Usar iniciales» limpia ambos.
- Guardado inmediato (no depende de «Guardar perfil»).
- **8** presets. Sin cropper UI, sin Growth OS admin, sin media library del Espacio.
- Copy y errores en español.
- Worktree: `.worktrees/escritorio-mentor-prime` (puerto 3001).

## File map

| File | Responsibility |
| --- | --- |
| `src/lib/desktop/avatar-catalog.ts` | Presets + `resolveDesktopAvatar` + URL helper |
| `src/lib/desktop/avatar-upload.ts` | Reglas cliente (hint, file/dimension errors) |
| `src/lib/desktop/avatar-file.ts` | Lectura/escritura/borrado en disco + sharp |
| `src/lib/desktop/store.ts` | Persistencia `avatarPresetId` / `avatarPhoto*` |
| `src/types/identity.ts` | Campos nuevos en `IdentityUser` |
| `src/app/api/desktop/avatar/route.ts` | POST preset \| multipart, DELETE |
| `src/app/api/desktop/avatar/file/route.ts` | GET foto (self u otro con sesión) |
| `src/components/desktop/DesktopAvatar.tsx` | Círculo presentacional |
| `src/components/desktop/DesktopAccount.tsx` | UI Perfil: rejilla, subir, quitar, iniciales |
| `src/components/desktop/MentorDesktop.tsx` | Píldora + props avatar |
| `src/app/escritorio/page.tsx` | Pasa avatar del usuario de sesión |
| `src/components/desktop/DesktopAjustes.tsx` | Listas de personas con `DesktopAvatar` |
| `src/lib/platform/user-maintainer.ts` | Incluye campos avatar en el roster |
| `public/desktop/avatars/*.svg` | 8 presets |
| `tests/baseline/desktop-avatar.test.ts` | Resolución + reglas + archivo |
| `.gitignore` | `/data/desktop-avatars/` |

---

### Task 1: Catálogo y resolución

**Files:**
- Create: `src/lib/desktop/avatar-catalog.ts`
- Create: `public/desktop/avatars/aurora.svg` … (8 archivos)
- Test: `tests/baseline/desktop-avatar.test.ts`

**Interfaces:**
- Produces: `AVATAR_PRESETS`, `AvatarPresetId`, `parseAvatarPresetId(raw)`, `avatarPresetSrc(id)`, `customAvatarUrl(userId?, version?)`, `resolveDesktopAvatar(input)`, `desktopAvatarInitials(name, email)`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AVATAR_PRESETS,
  customAvatarUrl,
  parseAvatarPresetId,
  resolveDesktopAvatar,
} from "../../src/lib/desktop/avatar-catalog";

describe("avatar del escritorio", () => {
  it("resuelve foto, preset e iniciales en ese orden", () => {
    assert.equal(AVATAR_PRESETS.length, 8);
    assert.equal(parseAvatarPresetId("aurora"), "aurora");
    assert.equal(parseAvatarPresetId("nope"), null);

    const photo = resolveDesktopAvatar({
      displayName: "Ana Pérez",
      email: "ana@ex.com",
      avatarPhoto: true,
      avatarPhotoUpdatedAt: "2026-11-16T00:00:00.000Z",
      avatarPresetId: "aurora",
    });
    assert.equal(photo.kind, "photo");
    if (photo.kind === "photo") {
      assert.equal(photo.url, customAvatarUrl(undefined, "2026-11-16T00:00:00.000Z"));
    }

    const preset = resolveDesktopAvatar({
      displayName: "Ana Pérez",
      email: "ana@ex.com",
      avatarPresetId: "aurora",
    });
    assert.equal(preset.kind, "preset");
    if (preset.kind === "preset") assert.equal(preset.id, "aurora");

    const initials = resolveDesktopAvatar({
      displayName: "Ana Pérez",
      email: "ana@ex.com",
      avatarPresetId: "nope",
    });
    assert.deepEqual(initials, { kind: "initials", text: "AP" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/baseline/desktop-avatar.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement catalog + 8 SVG presets**

`src/lib/desktop/avatar-catalog.ts`:

```ts
export const AVATAR_PRESETS = [
  { id: "aurora", label: "Aurora" },
  { id: "bosque", label: "Bosque" },
  { id: "cobalto", label: "Cobalto" },
  { id: "coral", label: "Coral" },
  { id: "lima", label: "Lima" },
  { id: "noche", label: "Noche" },
  { id: "arena", label: "Arena" },
  { id: "violeta", label: "Violeta" },
] as const;

export type AvatarPresetId = (typeof AVATAR_PRESETS)[number]["id"];

export function parseAvatarPresetId(raw: unknown): AvatarPresetId | null {
  if (typeof raw !== "string") return null;
  return AVATAR_PRESETS.some((p) => p.id === raw) ? (raw as AvatarPresetId) : null;
}

export function avatarPresetSrc(id: AvatarPresetId): string {
  return `/desktop/avatars/${id}.svg`;
}

export function customAvatarUrl(userId?: string | null, version?: string | null): string {
  const stamp = version?.trim() || "1";
  const who = userId?.trim();
  const base = `/api/desktop/avatar/file?v=${encodeURIComponent(stamp)}`;
  return who ? `${base}&userId=${encodeURIComponent(who)}` : base;
}

export function desktopAvatarInitials(name: string, email: string): string {
  const parts = (name || email).trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return (parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "NZ").slice(0, 2);
}

export type DesktopAvatarView =
  | { kind: "photo"; url: string }
  | { kind: "preset"; id: AvatarPresetId; src: string }
  | { kind: "initials"; text: string };

export function resolveDesktopAvatar(input: {
  displayName: string;
  email: string;
  avatarPhoto?: boolean;
  avatarPhotoUpdatedAt?: string;
  avatarPresetId?: string | null;
  userId?: string | null;
}): DesktopAvatarView {
  if (input.avatarPhoto) {
    return {
      kind: "photo",
      url: customAvatarUrl(input.userId, input.avatarPhotoUpdatedAt),
    };
  }
  const preset = parseAvatarPresetId(input.avatarPresetId);
  if (preset) return { kind: "preset", id: preset, src: avatarPresetSrc(preset) };
  return {
    kind: "initials",
    text: desktopAvatarInitials(input.displayName, input.email),
  };
}
```

Cada SVG en `public/desktop/avatars/{id}.svg`: círculo 128×128 con color distinto (aurora `#5b8def`, bosque `#2f9e6b`, cobalto `#2f5bff`, coral `#e11d48`, lima `#84cc16`, noche `#0b1e5d`, arena `#d97706`, violeta `#7c3aed`). Ejemplo:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img">
  <circle cx="64" cy="64" r="64" fill="#5b8def"/>
  <circle cx="64" cy="52" r="22" fill="rgba(255,255,255,.92)"/>
  <ellipse cx="64" cy="98" rx="34" ry="26" fill="rgba(255,255,255,.92)"/>
</svg>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/baseline/desktop-avatar.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/desktop/avatar-catalog.ts public/desktop/avatars tests/baseline/desktop-avatar.test.ts
git commit -m "feat(desktop): catálogo y resolución de avatar"
```

---

### Task 2: Reglas de subida y archivo en disco

**Files:**
- Create: `src/lib/desktop/avatar-upload.ts`
- Create: `src/lib/desktop/avatar-file.ts`
- Modify: `.gitignore` (añadir `/data/desktop-avatars/`)
- Modify: `tests/baseline/desktop-avatar.test.ts`

**Interfaces:**
- Consumes: nada del Task 1 salvo paths de test
- Produces: `AVATAR_SIZE_HINT`, `avatarFileError`, `avatarDimensionError`, `storeAvatarPhoto`, `readAvatarPhoto`, `deleteAvatarPhoto`, `AvatarUploadError`

- [ ] **Step 1: Extend failing tests**

Añadir al mismo archivo de test:

```ts
it("valida tipo, peso y medida mínima de la foto", () => {
  const {
    AVATAR_SIZE_HINT,
    avatarFileError,
    avatarDimensionError,
  } = require("../../src/lib/desktop/avatar-upload");
  assert.match(AVATAR_SIZE_HINT, /2 MB/);
  assert.notEqual(avatarFileError({ type: "image/gif", size: 100 }), null);
  assert.equal(avatarFileError({ type: "image/jpeg", size: 100 }), null);
  assert.match(avatarDimensionError(64, 64) ?? "", /64 × 64/);
  assert.equal(avatarDimensionError(256, 256), null);
});

it("guarda foto cuadrada webp y rechaza una demasiado chica", async () => {
  require("../../scripts/_stub-server-only.cjs");
  const { storeAvatarPhoto, readAvatarPhoto, deleteAvatarPhoto, AvatarUploadError } =
    await import("../../src/lib/desktop/avatar-file");
  const userId = "avatar-upload-test-user";
  await deleteAvatarPhoto(userId);

  const ok = await sharp({
    create: { width: 400, height: 300, channels: 3, background: "#224466" },
  }).jpeg().toBuffer();
  const saved = await storeAvatarPhoto(userId, ok, "image/jpeg");
  assert.equal(saved.savedWidth, 400); // o el lado del cuadrado resultante ≤ 512
  assert.ok(saved.savedWidth <= 512);
  assert.ok(await readAvatarPhoto(userId));

  const tiny = await sharp({
    create: { width: 80, height: 80, channels: 3, background: "#224466" },
  }).jpeg().toBuffer();
  await assert.rejects(
    () => storeAvatarPhoto(userId, tiny, "image/jpeg"),
    (e: unknown) => e instanceof AvatarUploadError
  );

  await deleteAvatarPhoto(userId);
});
```

Importar `sharp` en el test. Ajustar aserción de `savedWidth`: tras crop cuadrado de 400×300 el lado es 300 (min edge) o el resultado de `cover` 300 — documentar en implementación: `resize({ width: 512, height: 512, fit: "cover" })` sobre el min-edge ≥ 128; para 400×300 cover a cuadrado usa el menor lado → 300×300.

- [ ] **Step 2: Run to verify fail**

Run: `node --import tsx --test tests/baseline/desktop-avatar.test.ts`  
Expected: FAIL missing modules

- [ ] **Step 3: Implement upload rules + file store**

`avatar-upload.ts`: constantes `AVATAR_MAX_BYTES = 2 * 1024 * 1024`, `AVATAR_MIN_EDGE = 128`, `AVATAR_MAX_EDGE = 512`, `AVATAR_TYPES`, hint y errores como wallpaper-upload.

`avatar-file.ts` (`server-only`): espejo de `wallpaper-file.ts` pero:

```ts
.resize({ width: AVATAR_MAX_EDGE, height: AVATAR_MAX_EDGE, fit: "cover" })
.webp({ quality: 82 })
```

Dir: `data/desktop-avatars`. Hash sha256 del `userId` → `{hash}.webp`.

Añadir `/data/desktop-avatars/` a `.gitignore`.

- [ ] **Step 4: Run tests**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/desktop/avatar-upload.ts src/lib/desktop/avatar-file.ts .gitignore tests/baseline/desktop-avatar.test.ts
git commit -m "feat(desktop): guardar y validar foto de avatar"
```

---

### Task 3: Persistencia en identity_users + API

**Files:**
- Modify: `src/types/identity.ts`
- Modify: `src/lib/desktop/store.ts`
- Create: `src/app/api/desktop/avatar/route.ts`
- Create: `src/app/api/desktop/avatar/file/route.ts`
- Modify: `tests/baseline/desktop-avatar.test.ts` (smoke de rutas por lectura de fuente)

**Interfaces:**
- Consumes: `parseAvatarPresetId`, `storeAvatarPhoto`, `deleteAvatarPhoto`, `readAvatarPhoto`, `customAvatarUrl`
- Produces: `setAvatarPreset(userId, presetId)`, `saveAvatarPhoto(userId, updatedAt)`, `clearAvatarPhoto(userId)`, `clearDesktopAvatar(userId)`

- [ ] **Step 1: Extend IdentityUser**

```ts
avatarPresetId?: string;
avatarPhoto?: boolean;
avatarPhotoUpdatedAt?: string;
```

- [ ] **Step 2: Store helpers** in `store.ts`

```ts
export async function setAvatarPreset(userId: string, presetId: string): Promise<void> { /* $set avatarPresetId */ }
export async function saveAvatarPhoto(userId: string, updatedAt: string): Promise<void> {
  /* $set avatarPhoto: true, avatarPhotoUpdatedAt, updatedAt */
}
export async function clearAvatarPhoto(userId: string): Promise<void> {
  /* $unset avatarPhoto, avatarPhotoUpdatedAt */
}
export async function clearDesktopAvatar(userId: string): Promise<void> {
  /* $unset avatarPresetId, avatarPhoto, avatarPhotoUpdatedAt */
}
```

- [ ] **Step 3: API route POST/DELETE**

Espejo de wallpaper:

- multipart → `storeAvatarPhoto` + `saveAvatarPhoto` → `{ ok, url, … }`
- JSON `{ presetId }` → `parseAvatarPresetId` o 400; `setAvatarPreset`
- DELETE body `{ clear?: "photo" | "all" }` default `"photo"`: borra archivo + clearPhoto; `"all"` también `clearDesktopAvatar` / unset preset

- [ ] **Step 4: GET file**

```ts
export async function GET(request: Request) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  const userId = new URL(request.url).searchParams.get("userId")?.trim() || ctx.user._id;
  // Cualquier sesión autenticada puede leer la foto de otro usuario de la casa
  // (listas del escritorio). Sin foto → 404.
  const file = await readAvatarPhoto(userId);
  if (!file) return NextResponse.json({ ok: false }, { status: 404 });
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
```

- [ ] **Step 5: Smoke asserts in test** (readFileSync de route.ts busca `multipart`, `clear`, `parseAvatarPresetId`)

- [ ] **Step 6: Commit**

```bash
git add src/types/identity.ts src/lib/desktop/store.ts src/app/api/desktop/avatar tests/baseline/desktop-avatar.test.ts
git commit -m "feat(desktop): API de avatar y campos en la cuenta"
```

---

### Task 4: Componente DesktopAvatar + UI en Mi cuenta

**Files:**
- Create: `src/components/desktop/DesktopAvatar.tsx`
- Modify: `src/components/desktop/DesktopAccount.tsx`
- Modify: `src/components/desktop/mentor-desktop.css`
- Modify: `tests/baseline/desktop-avatar.test.ts` (assert strings UI)

**Interfaces:**
- Consumes: `resolveDesktopAvatar`, `AVATAR_PRESETS`, `AVATAR_SIZE_HINT`, `avatarFileError`, `avatarDimensionError`
- Produces: `<DesktopAvatar view={…} className? />` o props `{ displayName, email, avatarPhoto?, avatarPhotoUpdatedAt?, avatarPresetId?, userId? }`

- [ ] **Step 1: DesktopAvatar**

```tsx
export function DesktopAvatar(props: {
  view: DesktopAvatarView;
  className?: string;
}) {
  if (props.view.kind === "photo") {
    return (
      <span className={cn("avatar has-image", props.className)} aria-hidden="true">
        <img src={props.view.url} alt="" />
      </span>
    );
  }
  if (props.view.kind === "preset") {
    return (
      <span className={cn("avatar has-image", props.className)} aria-hidden="true">
        <img src={props.view.src} alt="" />
      </span>
    );
  }
  return (
    <span className={cn("avatar", props.className)} aria-hidden="true">
      {props.view.text}
    </span>
  );
}
```

CSS: `.avatar.has-image { padding: 0; overflow: hidden; background: transparent; }` `.avatar.has-image img { width: 100%; height: 100%; object-fit: cover; display: block; }`  
Rejilla: `.avatar-choices` grid 4 columnas; botones circulares con borde `is-on`.

- [ ] **Step 2: Wire DesktopAccount**

Estado: `avatarPresetId`, `avatarPhoto`, `avatarPhotoUpdatedAt`, `avatarStatus`, `avatarAlert`, `avatarError`.

Cargar desde `/api/identity/me` (Task 5 serializa campos; hasta entonces leer opcionales).

Handlers inmediatos:

- `pickPreset(id)` → POST JSON → actualiza estado + `onAvatarChanged?.`
- `uploadPhoto(file)` → validación cliente + FormData POST
- `removePhoto()` → DELETE `{ clear: "photo" }`
- `useInitials()` → DELETE `{ clear: "all" }`

UI en Perfil: preview con `DesktopAvatar`, rejilla presets, botones Subir / Quitar / Usar iniciales, `AVATAR_SIZE_HINT`.

**Eliminar** el párrafo «El avatar usa tus iniciales. La foto personal aún no está disponible…» (reemplazar solo por el hint de tamaño si hace falta).

Prop opcional:

```ts
onAvatarChanged?: (next: {
  avatarPresetId: string | null;
  avatarPhoto: boolean;
  avatarPhotoUpdatedAt: string | null;
}) => void;
```

- [ ] **Step 3: Test UI strings**

```ts
const account = readFileSync(resolve(process.cwd(), "src/components/desktop/DesktopAccount.tsx"), "utf8");
assert.match(account, /Subir foto/);
assert.match(account, /Usar iniciales/);
assert.doesNotMatch(account, /aún no está disponible/);
```

- [ ] **Step 4: Commit**

```bash
git add src/components/desktop/DesktopAvatar.tsx src/components/desktop/DesktopAccount.tsx src/components/desktop/mentor-desktop.css tests/baseline/desktop-avatar.test.ts
git commit -m "feat(desktop): elegir avatar y subir foto en Mi cuenta"
```

---

### Task 5: Barra del escritorio + /api/identity/me

**Files:**
- Modify: `src/app/api/identity/me/route.ts` (`serializeUser`)
- Modify: `src/app/escritorio/page.tsx`
- Modify: `src/components/desktop/MentorDesktop.tsx`
- Modify: `src/components/desktop/DesktopAccount.tsx` (callback ya definido)

**Interfaces:**
- `serializeUser` incluye `avatarPresetId`, `avatarPhoto`, `avatarPhotoUpdatedAt`
- `MentorDesktopProps.user` + avatar fields; estado local para refrescar píldora

- [ ] **Step 1: serializeUser**

Añadir los tres campos al JSON de `GET/PATCH /api/identity/me`.

- [ ] **Step 2: page + MentorDesktop**

Pasar desde sesión:

```tsx
user={{
  displayName: session.user.displayName,
  email: session.user.email,
  avatarPresetId: session.user.avatarPresetId,
  avatarPhoto: session.user.avatarPhoto === true,
  avatarPhotoUpdatedAt: session.user.avatarPhotoUpdatedAt,
  id: session.user._id,
}}
```

En la píldora:

```tsx
<DesktopAvatar
  view={resolveDesktopAvatar({
    displayName,
    email: props.user.email,
    avatarPhoto,
    avatarPhotoUpdatedAt,
    avatarPresetId,
    userId: props.user.id,
  })}
/>
```

Estado local actualizable vía `onAvatarChanged` de `DesktopAccount`.

- [ ] **Step 3: Manual check** en `http://localhost:3001/escritorio`: abrir Mi cuenta, elegir preset → píldora cambia; subir foto → píldora muestra foto.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/identity/me/route.ts src/app/escritorio/page.tsx src/components/desktop/MentorDesktop.tsx
git commit -m "feat(desktop): avatar en la barra y en /me"
```

---

### Task 6: Listas de personas (Ajustes dueño)

**Files:**
- Modify: `src/lib/platform/user-maintainer.ts` (proyección + payload)
- Modify: `src/components/desktop/DesktopAjustes.tsx`
- Modify: `tests/baseline/desktop-avatar.test.ts` o `platform-users-load.test.ts` si existe assert de shape

**Interfaces:**
- Roster item incluye `avatarPresetId?`, `avatarPhoto?`, `avatarPhotoUpdatedAt?`
- Filas usan `<DesktopAvatar view={resolveDesktopAvatar({…, userId: user.id})} />`

- [ ] **Step 1: Extender listMaintainedUsers projection**

```ts
{ projection: {
  email: 1, displayName: 1, status: 1, platformRoles: 1, isSystemAccount: 1,
  avatarPresetId: 1, avatarPhoto: 1, avatarPhotoUpdatedAt: 1,
}}
```

Y en el return object, esos tres campos.

- [ ] **Step 2: DesktopAjustes**

Tipo local del user + reemplazar `<span className="avatar">…</span>` (lista y bloque «tú») por `DesktopAvatar`.

- [ ] **Step 3: Run relevant tests**

`node --import tsx --test tests/baseline/desktop-avatar.test.ts tests/baseline/platform-users-load.test.ts`  
Expected: PASS (ajustar asserts de shape si fallan)

- [ ] **Step 4: Commit**

```bash
git add src/lib/platform/user-maintainer.ts src/components/desktop/DesktopAjustes.tsx tests/baseline
git commit -m "feat(desktop): avatar en listas de personas"
```

---

### Task 7: Verificación final

- [ ] **Step 1: Run full avatar + phone baseline**

```bash
node --import tsx --test tests/baseline/desktop-avatar.test.ts tests/baseline/account-phone.test.ts
```

Expected: PASS

- [ ] **Step 2: Smoke UI** en `localhost:3001`

1. Sin avatar → iniciales en barra y Mi cuenta  
2. Elegir preset → se guarda y se ve en barra  
3. Subir foto → gana sobre preset  
4. Quitar foto → vuelve preset  
5. Usar iniciales → círculo con letras  
6. Lista en Ajustes (dueño) muestra foto/preset de otros si aplica  

- [ ] **Step 3: Final commit if stray fixes**

Solo si hubo ajustes de verificación.

---

## Spec coverage self-check

| Spec item | Task |
| --- | --- |
| Presets + foto + iniciales | 1, 4 |
| Prioridad foto → preset → iniciales | 1 |
| Quitar foto / Usar iniciales | 3, 4 |
| Guardado inmediato | 4 |
| Barra + Mi cuenta + listas | 4, 5, 6 |
| API espejo wallpaper | 3 |
| Validación 2 MB / 128 px / square 512 | 2 |
| Sin foto disponible text removed | 4 |
| Tests resolución / upload / DELETE | 1–3, 7 |
