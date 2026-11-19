# Task 2 Report: Contrato de UI en fuente (copy y panel)

## Status

**DONE**

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

## Concerns

None. Failures align with known WIP UI; safe to proceed to Task 3.