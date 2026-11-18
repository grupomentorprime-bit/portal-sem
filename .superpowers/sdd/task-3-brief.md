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
