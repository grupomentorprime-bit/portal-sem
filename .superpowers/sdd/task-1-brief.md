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
