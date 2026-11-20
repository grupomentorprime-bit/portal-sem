# Task 3 report: La ficha usa la etapa

Status: DONE

## Changes

`src/components/admin/congress/participant/ParticipantSheet.tsx`
- Imported `deriveReceptionProgress`, `receptionPrimaryAction`, `ReceptionStepId`, `ReceptionStageHeader`.
- Removed the `SheetTab` type, the `tab`/`setTab` state, the `tabs` array and the tab button row.
- Removed the now-unused `cn` import (it was only used in the tab row).
- Added the `journeyDay: CongressAttendanceDay` prop (next to `operate`).
- Added the `progress` useMemo, after `relatedPayments`.
- Added `viewStep` / `viewForId` state. The render-time reset runs only when the registration id changes.
- Removed `setTab("asistencia")` from the `[open, registration?._id, registration?.updatedAt]` effect. It would have reset the step on every `updatedAt` change, which the brief rules out.
- The "Editar" button now calls `setViewStep("asistencia")` where it called `setTab("asistencia")`, so editing shows the identity fields.
- Rendered `ReceptionStageHeader` outside `div.max-h-[min(60vh,32rem)]`, before the content. It sits after the form banner and the duplicates warning. The brief says "before the form banner", but the banner is rendered earlier, so I put the header where the old tab row was.
- Replaced `tab ===` with `viewStep ===` in the three places.

`src/components/admin/congress/CongressOpsPanel.tsx`
- Passed `journeyDay={journeyDay}` to `<ParticipantSheet>`.

Other uncommitted edits in both files are untouched. I did not commit or `git add`.

## Typecheck

Command: `npx tsc --noEmit --pretty false --incremental false`

Output, all errors:
- `CongressOpsPanel.tsx(1743,9)` TS2322: `deleteRegistration` returns `Promise<boolean>`, but the prop expects `Promise<void>`. Pre-existing and unrelated.
- `src/lib/congress/repository.ts(259,28)` TS2322. Pre-existing, not touched.

`ParticipantSheet.tsx` is not named by tsc. There is no missing-`journeyDay` error.

## Self-review
- Only the two allowed files were edited, and only the navigation wiring was changed.
- I did not reorder asistencia fields, remove the expected-days Select, lock group payment or add lodging buttons.
- `onClose` is still the only effect of the Dialog X. Nothing writes a stage on close.
- Hook order is unchanged: the new useMemo and useState calls are unconditional and run before the early returns and the JSX.
- Not tested in a browser. Only the typecheck was run.

## Fix: header position (review finding)

- Moved the existing `<ReceptionStageHeader />` block, with unchanged props and viewStep logic, to be the first child of the dialog body (`div.space-y-4`) for a selected registration. It now sits above the "Formulario OK" banner and above the duplicate warning, and stays outside `div.max-h-[min(60vh,32rem)]`.
- Only ParticipantSheet.tsx was edited. No commit.
- Typecheck: `npx tsc --noEmit --pretty false --incremental false`. ParticipantSheet.tsx is NOT named. Remaining errors: CongressOpsPanel.tsx(1748) deleteRegistration Promise<boolean> vs Promise<void> (pre-existing), repository.ts(259) (pre-existing), reception/ReceptionView.tsx(409,419) "Cannot find name 'ArrivalConfirm'" (a file I did not touch; from other work).
