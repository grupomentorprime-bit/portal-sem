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
