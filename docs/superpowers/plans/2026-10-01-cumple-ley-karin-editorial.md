# Cumple Ley Karin editorial — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or subagent-driven-development.

**Goal:** Piloto editorial en `/materias/ley-karin` con `concepts` + `checklist` opcionales y UI atractiva en tokens Cumple.

**Architecture:** Extender `MateriaContent`; Karin llena opcionales; `MateriaPage` renderiza si existen.

**Tech Stack:** TypeScript, React, Cumple site, `tsx --test`.

**Spec:** `docs/superpowers/specs/2026-10-01-cumple-ley-karin-editorial-design.md`

## Global Constraints

- Solo Karin recibe concepts/checklist en este corte.
- Hechos anclados a BCN / `norma.ts`; sin multas inventadas.
- Sin hero oscuro, glow-btn, orbs, clon DT.

### Task 1: Tipos, contenido Karin, plantilla y tests

**Files:** types.ts, materias.ts, MateriaPage.tsx, cumple-pages.test.ts

- [ ] Tests para concepts/checklist en Karin y render en MateriaPage
- [ ] Implementar tipos + copy Karin + UI
- [ ] `npx tsx --test tests/baseline/cumple-pages.test.ts` PASS
- [ ] Commit
