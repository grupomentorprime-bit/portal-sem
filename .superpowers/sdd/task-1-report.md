# Task 1 Report: Helpers de filtros de mesa

## Status

**DONE**

## Scope

Implemented pure helpers for desk filter draft/applied counting in `help-origins.ts`, with baseline tests. Only files named in the brief were modified.

| File | Action |
|------|--------|
| `tests/baseline/desktop-attention-filters.test.ts` | Created |
| `src/lib/desktop/help-origins.ts` | Modified (after `filterDeskCases`) |

## TDD Evidence

### RED (Step 2)

Command:

```text
npx tsx --test tests/baseline/desktop-attention-filters.test.ts
```

Exit code: **1**

Result: 3 failing tests — `emptyDeskFilters` and `countAppliedDeskFilters` not exported (missing implementation).

Key errors:

```text
TypeError: (0 , import_help_origins.emptyDeskFilters) is not a function
TypeError: (0 , import_help_origins.countAppliedDeskFilters) is not a function
ℹ pass 0 / ℹ fail 3
```

### GREEN (Step 4)

Same command after implementation.

Exit code: **0**

```text
✔ vacío cuenta 0
✔ cuenta solo campos con valor
✔ emptyDeskFilters deja todos los campos en cadena vacía
ℹ pass 3 / ℹ fail 0
```

## Implementation Summary

Exports added immediately after `filterDeskCases`:

- `DeskFilterFields` — five string fields: `tenantId`, `originId`, `status`, `priority`, `assigneeUserId`
- `emptyDeskFilters()` — returns all fields as `""`
- `countAppliedDeskFilters(fields)` — counts truthy values via `[...fields].filter(Boolean).length`

## Self-Review

- Matches brief verbatim (types, field names, placement).
- No UI or unrelated Atención WIP touched.
- `countAppliedDeskFilters` is consistent with how `filterDeskCases` treats optional string filters (non-empty means applied).
- No new dependencies; follows existing baseline test pattern (`node:test` + `node:assert/strict`).

## Commits

None (project constraint).

## Concerns

None.