# Task 1 Report: Catálogo y resolución

## Status

DONE

## TDD Evidence

### RED (Step 2)

Command:

```
node --import tsx --test tests/baseline/desktop-avatar.test.ts
```

Result: exit code 1

```
Error: Cannot find module '../../src/lib/desktop/avatar-catalog'
  code: 'MODULE_NOT_FOUND'
```

### GREEN (Step 4)

Command:

```
node --import tsx --test tests/baseline/desktop-avatar.test.ts
```

Result: exit code 0

```
▶ avatar del escritorio
  ✔ resuelve foto, preset e iniciales en ese orden (2.1695ms)
✔ avatar del escritorio (2.8199ms)
ℹ tests 1 | pass 1 | fail 0
```

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/desktop/avatar-catalog.ts` | Catalog, parsers, URL builders, resolver, initials |
| `tests/baseline/desktop-avatar.test.ts` | Baseline test for photo → preset → initials priority |
| `public/desktop/avatars/aurora.svg` | Preset (#5b8def) |
| `public/desktop/avatars/bosque.svg` | Preset (#2f9e6b) |
| `public/desktop/avatars/cobalto.svg` | Preset (#2f5bff) |
| `public/desktop/avatars/coral.svg` | Preset (#e11d48) |
| `public/desktop/avatars/lima.svg` | Preset (#84cc16) |
| `public/desktop/avatars/noche.svg` | Preset (#0b1e5d) |
| `public/desktop/avatars/arena.svg` | Preset (#d97706) |
| `public/desktop/avatars/violeta.svg` | Preset (#7c3aed) |

## Public API (`avatar-catalog.ts`)

- `AVATAR_PRESETS` — 8 entries with `id` + Spanish `label`
- `AvatarPresetId` — union type from preset ids
- `parseAvatarPresetId(raw)` — validates string against catalog
- `avatarPresetSrc(id)` — `/desktop/avatars/{id}.svg`
- `customAvatarUrl(userId?, version?)` — `/api/desktop/avatar/file?v=…` (+ optional `userId`)
- `desktopAvatarInitials(name, email)` — up to 2 initials, fallback `NZ`
- `DesktopAvatarView` — discriminated union `photo` | `preset` | `initials`
- `resolveDesktopAvatar(input)` — priority: photo → preset → initials

## Commit

- **SHA:** `499ec72`
- **Subject:** `feat(desktop): catálogo y resolución de avatar`
- **Branch:** `feat/escritorio-mentor-prime`

## Self-Review

1. **Brief compliance:** Implementation matches the brief verbatim (catalog order, resolver logic, URL encoding, initials algorithm).
2. **Resolution order:** Test confirms `avatarPhoto` wins over valid `avatarPresetId`, and unknown preset falls through to initials (`AP` for "Ana Pérez").
3. **Scope:** No API routes, UI, or upload logic — only pure module + static SVG assets as specified.
4. **SVG assets:** Not exercised by the baseline test; each file follows the brief template with the specified fill color. Paths align with `avatarPresetSrc`.
5. **Concerns:** None. Baseline does not assert `src` on preset results or file existence; acceptable for Task 1 scope.

## Out of Scope (future tasks)

- Avatar file API endpoint
- UI for preset/photo selection
- Upload pipeline

## Review fix — whitespace `displayName` initials

**Finding:** `(name || email).trim()` treated whitespace-only `displayName` as truthy, then trim yielded empty source → fallback `NZ` instead of email.

**Change:** `desktopAvatarInitials` uses `name.trim() || email.trim()` before splitting; baseline test asserts `"   "` + `ana@ex.com` → `A`.

**Commit:** `3a0d906` — `fix(desktop): iniciales usan email si el nombre está vacío`

### Test output (`node --import tsx --test tests/baseline/desktop-avatar.test.ts`)

```
▶ avatar del escritorio
  ✔ resuelve foto, preset e iniciales en ese orden (1.9228ms)
  ✔ usa el email para iniciales si el nombre solo tiene espacios (0.1109ms)
✔ avatar del escritorio (2.6668ms)
ℹ tests 2
ℹ suites 1
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 294.6077
```