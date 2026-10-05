# Cumple SST editorial — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or subagent-driven-development.

**Goal:** Aplicar el patrón editorial de Ley Karin a `/materias/seguridad-salud-trabajo` (batón, panel, conceptos, checklist, implica, pasos).

**Architecture:** Reutilizar tipos y bloques de `MateriaPage`; solo rellenar opcionales en el contenido SST y ajustar tests que hoy reservan esos campos a Karin.

**Tech Stack:** TypeScript, React, Cumple site, `tsx --test`.

**Spec:** `docs/superpowers/specs/2026-10-02-cumple-sst-editorial-design.md`

## Global Constraints

- H1 = `Seguridad y salud en el trabajo` (menú sigue “DS 44 / SST”).
- Hechos anclados a BCN / `norma.ts` (16.744 + DS 44); sin cotizaciones ni multas.
- Vigencia en panel: publicación 27 jul 2024 + remisión al art. 1° transitorio; sin inventar día de entrada en vigor.
- Sin hero oscuro, glow-btn, orbs, clon portal estatal.
- Las otras cuatro materias siguen sin opcionales editoriales.

### Task 1: Tests SST editorial + contenido + íconos si hace falta

**Files:** `tests/baseline/cumple-pages.test.ts`, `src/sites/cumple/pages/materias.ts`, `src/components/sites/cumple/icons.tsx` (solo si faltan trazos)

- [x] Actualizar tests: SST tiene baton/heroAside/concepts/checklist/implicaPoints/processSteps; Karin intacta; las otras 4 sin opcionales
- [x] Rellenar contenido SST según spec
- [x] `npx tsx --test tests/baseline/cumple-pages.test.ts` PASS
