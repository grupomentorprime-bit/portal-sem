# Atención UI tres columnas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la app Atención del escritorio NELZURI a tres columnas (nav | bandeja por organización | hilo con casos), alineada a la maqueta, sin cambiar el backend.

**Architecture:** Reutilizar `PublicAttentionCase` y `filterAttentionCases`. Agrupar en cliente con `groupAttentionOrgs`. Panel: nav lateral + lista de orgs + panel de conversación con pestañas por caso. Cliente (un solo tenant): lista de casos + hilo, sin nav de áreas de plataforma.

**Tech Stack:** Next.js, TypeScript, CSS en `mentor-desktop.css`, tests `node:test` en `tests/baseline`.

## Global Constraints

- Rama: `feat/escritorio-mentor-prime` (worktree). Sin merge ni publish.
- No inventar disponibilidad ni mensajes.
- Atención no activa aplicaciones; Clientes sigue siendo la activación.
- No duplicar barra global ni dock.
- Reutilizar APIs `/api/desktop/attention` y modelos existentes.

---

### Task 1: Agrupar bandeja por organización

**Files:**
- Modify: `src/lib/desktop/attention.ts`
- Modify: `tests/baseline/desktop-attention.test.ts`

- [x] Añadir `groupAttentionOrgs(cases)` → filas `{ tenantId, company, openCount, unreadCount, lastAt, preview, cases }`.
- [x] Una org no se duplica; preview = área · asunto del caso más reciente.
- [x] Test: dos casos misma org → una fila; filtros previos dejan solo orgs con casos coincidentes.

### Task 2: UI panel tres columnas

**Files:**
- Modify: `src/components/desktop/DesktopAttention.tsx`
- Modify: `src/components/desktop/mentor-desktop.css`

- [x] Columna izq: vistas (Conversaciones, En vivo, Mis casos, Sin asignar, Pendientes, Resueltos) + áreas.
- [x] Columna centro: orgs filtradas, búsqueda, badges unread/open.
- [x] Columna der: cabecera org, estado del caso activo, tabs Conversación / Solicitudes / Información, mensajes, composer, asignación.
- [x] Responsive: apilar columnas en tablet/móvil.
- [x] Modo cliente: bandeja de casos de la empresa + hilo (sin nav de plataforma).

### Task 3: Verificar

- [x] `npx tsx --test tests/baseline/desktop-attention.test.ts`
- [x] Captura de composición: `docs/superpowers/specs/2026-11-17-atencion-ui-preview.png` (login requerido para datos reales en `/escritorio`).
