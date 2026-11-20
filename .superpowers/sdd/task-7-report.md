# Task 7 report: Distintivo en la fila

Status: DONE (no commit)

## Changes (only `src/components/admin/congress/reception/ReceptionView.tsx`)
- Import `deriveReceptionProgress` next to `arrivalMarksImmediately`.
- Added memoized `stageLabelById` (verbatim from brief, `payments: []`, deps `[registrations, assignments, journeyDay]`), placed after `duplicateIds`.
- Desktop name cell: `<p className="text-xs font-extrabold text-primary">` directly under `registrationDisplayName(reg)`, before the duplicate warning and the phone line.
- Mobile card: same `<p>` directly under the name, before the duplicate warning and the form notice.
- ArrivalConfirm, duplicate warnings and other uncommitted edits untouched.

## Verification
1. `npx tsc --noEmit --pretty false --incremental false`
   - Only the two known pre-existing errors: `CongressOpsPanel.tsx(1748,9)` TS2322 and `src/lib/congress/repository.ts(259,28)` TS2322.
   - `ReceptionView.tsx` is NOT named by tsc.
2. `npx tsx --test tests/baseline/congress-reception-stage.test.ts`
   - tests 20, pass 20, fail 0.

## Self-review
- Label placed above the duplicate warning (directly under the name). The brief says "under the name, before the phone/form notice"; the duplicate warning sits between in both views, so the label goes first. Easy to swap if the warning should come first.
- `stageLabelById.get(reg._id)` may be undefined only for ids not in `registrations`; not possible for rows rendered from `filtered`.

## Concerns
None.
