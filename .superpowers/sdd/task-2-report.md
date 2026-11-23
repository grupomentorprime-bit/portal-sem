# Task 2: Distintivo — Report

# Task 2 Report: Contrato de UI en fuente (copy y panel)

## Status

DONE

## What was implemented

Created `ReceptionStageHeader`, a client component that renders the reception workflow header for a congress participant:

- **Stage badge** (`role="status"`): shows `progress.stageLabel`; when `progress.stage === "listo"` uses success-tinted styling, otherwise primary background.
- **Three-step grid**: Asistencia, Alimentación, Alojamiento — each shows step name and state label (`Ahora`, `Pendiente`, `Listo`, `Bloqueado`).
- **Step selection**: steps with state `pendiente` are disabled and non-clickable; others call `onViewStep(step)`; active step uses `border-primary`.
- **Primary action**: when `operate` is true, shows `Button` with label/enabled state from `receptionPrimaryAction(viewStep, progress.steps)`; disabled when `busy` or `!action.enabled`; `onClick` invokes `onPrimary`.

Imports from `@/core/congress/reception-stage`: `receptionPrimaryAction`, `ReceptionProgress`, `ReceptionStepId` (no reimplementation).

## Typecheck

**Command:** `npx tsc --noEmit --pretty false --incremental false`

**Result:** Exit code 2 (pre-existing errors elsewhere).

**`ReceptionStageHeader.tsx`:** No TypeScript errors. Output did not mention this file.

Unrelated failures (unchanged by this task):

- `src/components/admin/congress/CongressOpsPanel.tsx(1709,9)`
- `src/lib/congress/repository.ts(259,28)`

**IDE lints:** None on the new file.

## Files changed

| Action | Path |
|--------|------|
| Created | `src/components/admin/congress/participant/ReceptionStageHeader.tsx` |

No other files were modified (per task constraints).

## Self-review

- [x] Implementation matches task brief verbatim (structure, labels, class names, props).
- [x] Only the specified file was created; no other edits.
- [x] Uses existing `Button` from `@/components/ui/button` without invalid `variant` (no `"default"`).
- [x] `receptionPrimaryAction` consumed from Task 1 module, not duplicated.
- [x] `operate` gates primary button; `busy` and action `enabled` gate disabled state.
- [x] `openable` guard matches brief (`pendiente` steps disabled + early return on click).
- [x] `"use client"` present (interactive handlers).
- [x] Types align with `ReceptionProgress` / `ReceptionStepId` from core module.

## Scope

Adds the source-contract baseline that locks Atención Plataforma copy, filter actions, floating CSS, and compose remount behavior. **No production UI changes** in this task — Tasks 3–4 will implement what the contract requires.

| File | Action |
|------|--------|
| `tests/baseline/desktop-attention-ui.test.ts` | Created (verbatim from brief) |
| `src/components/desktop/DesktopAttention.tsx` | Not modified |
| `src/components/desktop/mentor-desktop.css` | Not modified |

## TDD Evidence

### RED (Step 2 — expected)

Command:

```text
npx tsx --test tests/baseline/desktop-attention-ui.test.ts
```

Exit code: **1**

Result: 4 failing tests — current source still uses legacy copy/markup and lacks `composeSession` / `.attn-filter-float`.

```text
▶ Atención UI — Plataforma
  ✖ Nuevo ticket usa Seleccionar empresa y no Elige una empresa
  ✖ la ventana de Plataforma se titula Atención · Plataforma
  ✖ Filtros tiene Aplicar y Limpiar, y el panel es flotante en CSS
  ✖ Compose se remonta con composeSession
ℹ pass 0 / ℹ fail 4 / ℹ duration_ms ~299
```

Per-test assertions (first failure in each case):

| Test | Expected pattern | Outcome |
|------|------------------|---------|
| Nuevo ticket copy | `/Seleccionar empresa/` in TSX | Missing; TSX still has `Elige una empresa` |
| Ventana título | `/Atención · Plataforma/` | Missing |
| Filtros + CSS | `>Aplicar</`, `>Limpiar</`, `.attn-filter-float`, `position: absolute` | Missing `>Aplicar</` in TSX (and downstream CSS class) |
| Compose remount | `composeSession`, `key={composeSession}` | Missing |

### GREEN

Not in scope for Task 2. Implement in Tasks 3–5; re-run the same command for exit code **0** and `pass 4`.

## Self-Review

- Test file matches `task-2-brief.md` exactly.
- Confirms red net: guards against regressing to «Elige una empresa» and non-floating filter UI.
- Follows existing baseline pattern (`node:test` + `readFileSync` source contract).

## Commits

None (project constraint).

## Commits

None (per instructions).

## Test summary

Full-project `tsc` run: new component introduces no errors; only unrelated existing failures remain.

## Review fix: read-only steps when `operate` is false

**Finding:** With `operate === false`, the primary button was already hidden, but step cells were still interactive `<button>` elements calling `onViewStep`. Non-operators should only see the distintivo and each step’s state, with no navigation actions.

**Change:** When `operate` is false, each step renders as a non-interactive `<div>` with the same labels and styling (name, state, border highlight for `viewStep`, opacity for `pendiente`). No `onViewStep` handler. When `operate` is true, behavior unchanged: `<button>` with `pendiente` disabled; `listo`, `bloqueado`, and `ahora` open via `onViewStep`.

## Typecheck (after review fix)

**Command:** `npx tsc --noEmit --pretty false --incremental false`

**Result:** Exit code 2 (same pre-existing errors).

**`ReceptionStageHeader.tsx`:** Not named in output.

Errors remain only in `CongressOpsPanel.tsx` and `repository.ts`.

None. Failures align with known WIP UI; safe to proceed to Task 3.
