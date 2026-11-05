# Admin sidebar plano — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sidebar de 9 filas planas como la referencia; subnavegación de módulo en el chrome para grupos multi-página.

**Architecture:** `navGroupAsSidebarLink` + activo a nivel de grupo; `AdminModuleSubnav` en `AdminLayoutMaster` cuando el grupo activo tiene >1 ítem.

**Tech Stack:** Next.js App Router, React client components, `nav-domains` / `nav-access` existentes.

## Global Constraints

- No tocar IAM, rutas ni `/platform`.
- Conservar árbol de ítems; solo presentación + primario + subnav.
- Copy en español humano (sin jerga de ingeniería en UI).

---

## File map

| File | Responsibility |
| --- | --- |
| `src/lib/admin/nav-domains.ts` | `primaryItemId`, `navGroupAsSidebarLink`, `isNavGroupActive` |
| `src/components/admin/kit/navigation/AdminSidebar.tsx` | Lista plana sin acordeón |
| `src/components/admin/kit/navigation/AdminModuleSubnav.tsx` | Subnav horizontal (nuevo) |
| `src/components/admin/shell-v2/AdminLayoutMaster.tsx` | Montar subnav |
| `src/components/admin/shell-v2/AdminShellV2.tsx` | Pasar ctx al layout |
| `tests/baseline/admin-nav-conversion.test.ts` | Cubrir link plano + primarios |

---

### Task 1: API de navegación plana

**Files:**
- Modify: `src/lib/admin/nav-domains.ts`
- Modify: `tests/baseline/admin-nav-conversion.test.ts`

- [x] Añadir `primaryItemId?` a `AdminNavGroup` / def
- [x] Setear primarios: conversion, sitio-web, institucion, ajustes
- [x] Implementar `navGroupAsSidebarLink` e `isNavGroupActive`
- [x] Tests: multi-ítem usa label del grupo y href del primario; un ítem conserva label del ítem
- [x] Correr `npx tsx --test tests/baseline/admin-nav-conversion.test.ts`

### Task 2: Sidebar plano

**Files:**
- Modify: `src/components/admin/kit/navigation/AdminSidebar.tsx`

- [x] Renderizar siempre `navGroupAsSidebarLink` (sin acordeón expandido)
- [x] Activo vía `isNavGroupActive`
- [x] Colapsado: icono → primario (sin flyout de grupo)
- [x] Ocultar etiqueta de zona «Crecer» y borde tools (orden de zonas intacto)

### Task 3: Subnav de módulo

**Files:**
- Create: `src/components/admin/kit/navigation/AdminModuleSubnav.tsx`
- Modify: `src/components/admin/shell-v2/AdminLayoutMaster.tsx`
- Modify: `src/components/admin/shell-v2/AdminShellV2.tsx`
- Modify: `src/components/admin/kit/index.ts` (export si aplica)

- [x] Subnav: ítems del grupo activo si `items.length > 1`
- [x] Montar bajo breadcrumb en LayoutMaster
- [ ] Verificar visualmente CRM y Ajustes en `/admin`

### Task 4: Verificación

- [x] `npx tsx --test tests/baseline/admin-nav-conversion.test.ts tests/baseline/growth-os-admin-shell-002.test.ts`
- [ ] Smoke: `/admin`, `/admin/personas`, `/admin/settings/roles`
