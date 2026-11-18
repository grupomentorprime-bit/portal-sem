# Congreso CLP Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inputs de monto del Congreso muestran pesos CLP con `$` y puntos (`$17.000`), no `17000`.

**Architecture:** Helpers puros `parseClpInput` / `formatClpInput` + componente `ClpAmountInput` controlado por `number | null`; cablear en ficha y aportes.

**Tech Stack:** TypeScript, React, `Intl` es-CL, `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-17-congreso-clp-input-design.md`

## Global Constraints

- Solo Congreso (ficha + aportes); no Growth ni formularios públicos.
- API sigue recibiendo entero CLP.
- Labels/resúmenes siguen con `formatClp`.
- Sin commit/PR salvo pedido explícito.

## File map

| Path | Responsibility |
|------|----------------|
| `src/components/admin/congress/labels.ts` | `parseClpInput`, `formatClpInput` |
| `tests/baseline/congress-clp-input.test.ts` | tests helpers |
| `src/components/admin/congress/ClpAmountInput.tsx` | input controlado |
| `src/components/admin/congress/participant/ParticipantSheet.tsx` | Monto individual |
| `src/components/admin/congress/CongressOpsPanel.tsx` | Monto grupal |

---

### Task 1: Helpers + tests

- [ ] Test `parseClpInput("$17.000") === 17000`, `formatClpInput(17000)` contiene `17.000` y `$`
- [ ] Implementar helpers en `labels.ts`
- [ ] Tests PASS

### Task 2: `ClpAmountInput` + cableado

- [ ] Crear componente (`value: number | null`, `onValueChange`)
- [ ] ParticipantSheet + CongressOpsPanel
- [ ] Smoke: placeholders/valores formateados
