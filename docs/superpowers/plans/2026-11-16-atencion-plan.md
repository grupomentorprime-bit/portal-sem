# Atención Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir Atención en el escritorio: una cola de pedidos de plan para el dueño y un hilo por organización donde el cliente responde.

**Architecture:** `space_app_requests` sigue siendo el pedido. Un hilo en `attention_threads` nace cuando el pedido es nuevo. La cola agrupa las filas abiertas por organización. Clientes no cambia: ahí se enciende el plan y la fila pasa a cumplida.

**Tech Stack:** Next.js, TypeScript, MongoDB, pruebas `node:test` en `tests/baseline`.

## Global Constraints

- Una fila abierta por Espacio y aplicación, índice `one_open_request`.
- Un hilo por `tenantId`.
- El rol del mensaje lo decide el servidor: `platform_owner` escribe como Nelzuri; el miembro, como Cliente.
- No se usa la campana, Ventas, Mensajes de Growth ni correo en este corte.
- Clientes sigue siendo configuración.

---

### Task 1: Hilo y cola

**Files:**
- Create: `src/lib/desktop/attention.ts`
- Test: `tests/baseline/desktop-attention.test.ts`

- [x] Pedido nuevo agrega `Pidió {aplicación}.` sin punto doble en RR.HH.
- [x] Chat vacío o de más de 2000 se rechaza.
- [x] La cola es una fila por organización conocida, con los módulos en orden de `MENTOR_APPS`.

### Task 2: Persistencia y pedido

**Files:**
- Create: `src/lib/desktop/attention-store.ts`
- Modify: `src/lib/desktop/requests.ts`
- Modify: `src/lib/desktop/store.ts`
- Modify: `src/app/api/desktop/requests/route.ts`

- [x] `listAllOpen` lista pedidos abiertos de todos los Espacios.
- [x] Un pedido nuevo (`already: false`) anota el hilo. Si esa nota falla, la respuesta del pedido sigue en ok.

### Task 3: API

**Files:**
- Create: `src/app/api/desktop/attention/route.ts`

- [x] El dueño sin `tenantId` recibe la cola.
- [x] Con `tenantId`, o un miembro, recibe el hilo y queda marcado leído.
- [x] POST rechaza vacío y texto largo, y no acepta el rol desde el cliente.

### Task 4: Escritorio

**Files:**
- Modify: `src/lib/desktop/catalog.ts`
- Modify: `src/components/desktop/MentorDesktop.tsx`
- Modify: `src/components/desktop/DesktopFinder.tsx`
- Modify: `src/components/desktop/mentor-desktop.css`
- Modify: `src/app/escritorio/page.tsx`
- Create: `src/components/desktop/DesktopAttention.tsx`
- Test: `tests/baseline/desktop-contract.test.ts`
- Test: `tests/baseline/desktop-search.test.ts`

- [x] Dock del dueño: Atención, Clientes, Ajustes. El conteo es de organizaciones con pedido.
- [x] Dock del cliente: las aplicaciones visibles y, al final, Atención. Un punto si Nelzuri escribió y aún no se abre.
- [x] La hoja de solicitud dice que la conversación sigue en Atención.
