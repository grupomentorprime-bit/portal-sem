# Task 2 Report: Cargar horas de envío y enriquecer GET listado

## Status

**DONE**

## Commits

None (per task constraints).

## Smoke / verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | pass (exit 0) |
| `npx tsx --test tests/baseline/congress-form-submitted-at.test.ts` | 4/4 pass |
| ESLint on touched files | no issues |
| Manual `GET /api/congress/registrations` | not run — requires authenticated congress view session |

## Changes

### `src/lib/congress/form-submitted-at.ts` (new)

- `loadFormSubmittedAtBySubmissionIds(tenantId, submissionIds)`:
  - Dedupes/trims ids; parses valid `ObjectId`; queries `experience_form_submissions` with `{ tenant, _id: { $in } }`, projection `{ createdAt: 1 }`.
  - Maps hex `_id` back to original string key (preserves caller’s id formatting).
  - Skips invalid ObjectIds and rows without string `createdAt`.

### `src/app/api/congress/registrations/route.ts`

- Imports loader + `withFormSubmittedAt`.
- After filtered `items` and `filterOptions` build (unchanged): loads map from `items`’ `submissionId`s, enriches, returns `items` / `registrations` as `enriched`.
- `syncCongressFormSubmissions` still runs first; `filterOptions` logic untouched.

## Self-review

- Matches brief code verbatim for loader and route snippet.
- Enrichment applies only to filtered `items` (not full `all`) — correct for list response; `filterOptions` still derived from `all` + catalog as before.
- `all` used for churches/zones only — no accidental double enrichment or behavior change on filters.
- ObjectId ↔ string bridge via `idByHex` handles normalized hex lookup after Mongo round-trip.
- Server-only module; reuses `getDatabase` like other congress lib code.

## Concerns

- **Manual API check pending:** JSON `formSubmittedAt` on real data needs dev login + Mongo with submissions. Logic covered by Task 1 unit tests + compile; loader has no dedicated integration test in this task.

## Out of scope

- UI columns (ReceptionView / CongressOpsPanel).
- Persisting `formSubmittedAt` on registration documents.
- Commit / push.