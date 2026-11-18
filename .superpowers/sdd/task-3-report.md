# Task 3: API ensure-folio — Report

## Status
**Complete**

## Changes

| File | Action |
|------|--------|
| `src/app/api/congress/payments/[id]/ensure-folio/route.ts` | Created POST handler |
| `src/app/api/congress/payments/route.ts` | Added `folio` to `payment.record` audit metadata |

## Implementation

- **Guard:** `requireCongressPayments()` (same bar as creating payments / download use case).
- **Handler:** Calls `ensureCongressPaymentFolio({ tenantId, paymentId })`.
- **Responses:**
  - Success: `{ ok: true, payment }` (200)
  - `not_found` → 404
  - Other errors (e.g. `folio_sequence_failed`) → 500
  - Uncaught → 500 `{ ok: false, error: "Error interno." }`
- **Params:** `context.params` awaited as `Promise<{ id: string }>` (matches `void/route.ts`).

## Verification

- ESLint: no issues on touched files.
- `tsc --noEmit`: exit 0 (no errors on new/changed paths).

## Commits
None (per task instructions).

## Concerns / follow-ups

- No automated API test for this route yet; manual or integration test recommended before release.
- Clients must send auth/cookies expected by `requireCongressPayments`.

## Brief checklist

- [x] Step 1: Create route
- [x] Step 2: Confirm POST `/payments` returns full `payment` (unchanged contract; `payment.folio` included when set at record time)
- [x] Optional: `folio` in `payment.record` audit metadata