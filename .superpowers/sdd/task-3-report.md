Status: done (post Task 3 review fix; sin commit)
Commits: none
Test summary: see **Verificación** and **Fix** below.
Report path: `c:\Users\semip\Proyectos\portal-sem\.superpowers\sdd\task-3-report.md`

# Task 3 report — Compose placeholder, disable y remount

**Status:** DONE (sin commit)

## Alcance (plan 2026-11-18, Task 3)

En `DesktopAttention.tsx`:

- Estado `composeSession` (contador); `openComposer` lo incrementa para forzar remount del formulario de **nuevo ticket**.
- `key={composeSession}` en los mounts de `Compose` de **mesa plataforma** (frame) y **CompanySpace** (variant company), no en chat en vivo.
- Placeholder del select de empresa en mesa plataforma: `Seleccionar empresa` (sin `Elige una empresa`).
- Envío deshabilitado con `companyReady` sin cambiar la lógica existente.

## Cambios

- `src/components/desktop/DesktopAttention.tsx`:
  - `const [composeSession, setComposeSession] = useState(0)`.
  - `openComposer` ejecuta `setComposeSession((n) => n + 1)` antes de `setComposing(true)`.
  - `CompanySpace` recibe `composeSession` como prop; su `Compose` usa `key={composeSession}`.
  - En el frame de plataforma, `Compose` al componer en canal mensajes usa `key={composeSession}`.
  - Select de empresa (Compose desk): `<option value="">Seleccionar empresa</option>`.

## Verificación (entrega Task 3)

Comando: `npx tsx --test tests/baseline/desktop-attention-ui.test.ts`

- Pass: `Nuevo ticket usa Seleccionar empresa y no Elige una empresa`
- Pass: `Compose se remonta con composeSession`
- Fail (esperado hasta Task 4–5): `la ventana de Plataforma se titula Atención · Plataforma`
- Fail (esperado hasta Task 4–5): `Filtros tiene Aplicar y Limpiar, y el panel es flotante en CSS`

## Fix — review crítico TS2304 (`composeSession` en `LiveClient`)

**Problema:** `LiveClient` tenía `key={composeSession}` en un `Compose` de chat en vivo (`originId="escritorio.chat-en-vivo"`), pero `composeSession` no está en el ámbito de `LiveClient` → error TS2304.

**Solución (opción 2):** Se quitó `key={composeSession}` solo en ese `Compose` dentro de `LiveClient`. Task 3 exige remount en los composes de **ticket** (frame + CompanySpace); el formulario de chat en vivo queda fuera de alcance.

**Evidencia:**

- `grep` en `DesktopAttention.tsx`: `key={composeSession}` solo en el `Compose` del frame (~línea 686) y en `CompanySpace` (~línea 869); ninguna referencia a `composeSession` dentro de `LiveClient`.
- `npx tsx --test tests/baseline/desktop-attention-ui.test.ts` (tras el fix):
  - Pass: `Nuevo ticket usa Seleccionar empresa y no Elige una empresa`
  - Pass: `Compose se remonta con composeSession`
  - Fail: título Plataforma (Task 4)
  - Fail: Filtros Aplicar/Limpiar y panel flotante (Task 5)

## Notas

- No se hizo commit.
- Smoke en navegador: no realizado en esta tarea.