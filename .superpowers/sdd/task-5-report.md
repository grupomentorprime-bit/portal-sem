# Task 5 report: Alimentación pagada por el líder

Status: DONE

## Changes (only `ParticipantSheet.tsx`, bloque `viewStep === "alimentacion"`)
- When `progress?.foodLock === "leader"`, the "Imputado …" line is replaced by the brief's banner (`role="status"`, "Pagado por el líder" + "Imputado {formatClp(allocatedPaidClp)}").
- Payment/exempt/partial-waive block (`canPay && operate && chargeAmountClp != null`) is not rendered for leader.
- "Restaurar aporte" button also hidden for leader (it is the exempt/partial-adjust counterpart).
- `contributionLabel`, receipt download, comprobantes list and charge history remain visible.
- `exempt` / `paid` / null: UI unchanged (including the "Imputado" line).

## Typecheck
`npx tsc --noEmit --pretty false --incremental false`: 2 errors, both pre-existing and outside this file (CongressOpsPanel.tsx:1748, repository.ts:259). ReceptionView not named. ParticipantSheet.tsx not named.

## Self-review
- No lodging buttons, no commits, no other files edited; stage header and asistencia reorder untouched.
- Concern (minor): the banner shows "Imputado $0" if the leader paid but allocatedPaidClp is 0, as the brief specifies verbatim.

﻿Status: done
Commits: none
Test summary: `npx tsx --test tests/baseline/desktop-attention-filters.test.ts tests/baseline/desktop-attention-ui.test.ts tests/baseline/attention-context.test.ts tests/baseline/desktop-attention.test.ts tests/baseline/help-desk.test.ts` passed (37 tests, 0 failures).
Concerns: none.
Report path: `C:\Users\semip\Proyectos\portal-sem\.superpowers\sdd\task-5-report.md`
