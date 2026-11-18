# Task 2 Report: Reglas de subida y archivo en disco

## Status

DONE

## Commits

- `0b2d56b` — feat(desktop): guardar y validar foto de avatar

## Test summary

`node --import tsx --test tests/baseline/desktop-avatar.test.ts` — 4 passed, 0 failed (GREEN).

## RED evidence

Initial run failed as expected because the new avatar modules did not exist yet:

```text
Error: Cannot find module '../../src/lib/desktop/avatar-upload'
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/lib/desktop/avatar-file'
```

## GREEN evidence

The focused test file now passes:

```text
✔ resuelve foto, preset e iniciales en ese orden
✔ usa el email para iniciales si el nombre solo tiene espacios
✔ valida tipo, peso y medida mínima de la foto
✔ guarda foto cuadrada webp y rechaza una demasiado chica
```

## Files changed

- `src/lib/desktop/avatar-upload.ts`
- `src/lib/desktop/avatar-file.ts`
- `tests/baseline/desktop-avatar.test.ts`
- `.gitignore`

## Concerns

None. Lint diagnostics for the touched files were clean.

## Review fix: temp único (Important)

**Change:** `storeAvatarPhoto` now writes to `${target}.${process.pid}.${Date.now()}.tmp` instead of a fixed `${target}.tmp`, avoiding collisions on concurrent saves. On failure after `writeFile`, the temp file is unlinked before rethrowing.

**Commit:** `cee6f68` — fix(desktop): temp único al guardar foto de avatar

**Tests:** `node --import tsx --test tests/baseline/desktop-avatar.test.ts` — 4 passed, 0 failed (GREEN).

## Re-fix: temp UUID (same-ms collision)

**Change:** Temp path now uses `randomUUID()` from `node:crypto` instead of `Date.now()`, so concurrent saves in the same millisecond cannot collide on the temp filename.

**Commit:** `0210913` — fix(desktop): temp UUID al guardar avatar

**Tests:** `node --import tsx --test tests/baseline/desktop-avatar.test.ts` — 4 passed, 0 failed (GREEN).