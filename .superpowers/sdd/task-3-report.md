# Task 3 - Report

## Status

DONE

## Scope implemented

- Added avatar persistence fields to `IdentityUser`: `avatarPresetId`, `avatarPhoto`, `avatarPhotoUpdatedAt`.
- Added desktop store helpers in `src/lib/desktop/store.ts`: `setAvatarPreset`, `saveAvatarPhoto`, `clearAvatarPhoto`, `clearDesktopAvatar`.
- Added avatar API routes mirroring wallpaper:
  - `POST` / `DELETE` in `src/app/api/desktop/avatar/route.ts`
  - `GET` file reader in `src/app/api/desktop/avatar/file/route.ts`
- Extended `tests/baseline/desktop-avatar.test.ts` with source-smoke asserts for multipart upload, preset parsing, clear mode, and file reads.

## RED evidence

Command run after adding the new smoke test, before creating the routes:

`npx tsx --test tests/baseline/desktop-avatar.test.ts`

Result: exit `1`.

Failure matched the brief:

- `desktop-avatar.test.ts` failed with `ENOENT` because `src/app/api/desktop/avatar/route.ts` did not exist yet.

## GREEN evidence

Command re-run after the production edits:

`npx tsx --test tests/baseline/desktop-avatar.test.ts`

Result: exit `0`.

Summary:

- tests: `5`
- pass: `5`
- fail: `0`

Also checked IDE diagnostics on the edited files: no linter errors found.

## Self-review

- Verified multipart avatar upload persists file metadata and returns `customAvatarUrl(...)`.
- Verified preset selection validates through `parseAvatarPresetId` and rejects invalid JSON bodies with `400`.
- Verified `DELETE` supports `clear: "photo"` and `clear: "all"` and removes the stored file in both cases.
- Verified the file route reads `userId` from the query string and falls back to the authenticated user.

## Commit

`cd07e78 feat(desktop): API de avatar y campos en la cuenta`.

## Concerns

- `src/types/identity.ts` and `src/lib/desktop/store.ts` already had unrelated branch changes before this task, so the requested commit will include the current state of those target files as instructed by the brief.


## Follow-up fix

- Hardened `GET /api/desktop/avatar/file` so a viewer can only read another user's avatar when they are the same user, a platform operator/owner, or share at least one tenant through `listMembershipsByUser`.
- Added a smoke assertion in `tests/baseline/desktop-avatar.test.ts` that the file route mentions `listMembershipsByUser`.
- Verified with `node --import tsx --test tests/baseline/desktop-avatar.test.ts` and IDE diagnostics on the edited files.
