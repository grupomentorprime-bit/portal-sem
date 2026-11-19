Status: done (sin commit)
Commits: none
Test summary: see **Verificación** below.
Report path: `c:\Users\semip\Proyectos\portal-sem\.superpowers\sdd\task-4-report.md`

# Task 4 report — Título Atención · Plataforma

**Status:** DONE (sin commit)

## Alcance (plan 2026-11-18, Task 4)

En `DesktopAttention.tsx`, derivar el título de la ventana desde `channel` y `globalDesk`:

- `envivo` → `Chat en vivo`
- mesa plataforma (`globalDesk`) → `Atención · Plataforma`
- resto → `Atención`

Cabecera de empresa sin cambios: `Atención | {companyName}`.

## Cambios

- `src/components/desktop/DesktopAttention.tsx` (~línea 411):

```ts
const title =
  channel === "envivo"
    ? "Chat en vivo"
    : globalDesk
      ? "Atención · Plataforma"
      : "Atención";
```

`globalDesk` sigue siendo `channel === "mensajes" && serverDesk === "platform" && mode === "panel"`.

## Verificación

Comando: `npx tsx --test tests/baseline/desktop-attention-ui.test.ts`

- Pass: `Nuevo ticket usa Seleccionar empresa y no Elige una empresa`
- Pass: `la ventana de Plataforma se titula Atención · Plataforma`
- Pass: `Compose se remonta con composeSession`
- Fail (esperado hasta Task 5): `Filtros tiene Aplicar y Limpiar, y el panel es flotante en CSS`

**Resumen:** 3 pass / 1 fail.

## Notas

- No se hizo commit.
- Smoke en navegador: no realizado en esta tarea.