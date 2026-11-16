# Umbral de entrada Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La puerta de `/login` reescribe una frase pública en la primera pieza real de quien entra, y el inicio solo asienta esa pieza.

**Architecture:** Las frases, el respiro y la señal de llegada son funciones puras. La puerta lee un conteo por host y la sesión arma la frase de cruce con el mismo panel comercial del inicio. El formulario sigue en la página de login; un componente de cliente, compuesto por el servidor, le inyecta el cruce por contexto. El inicio no se redibuja.

**Tech Stack:** TypeScript, Next.js App Router, `node:test` vía `npx tsx --test`, sesión Keycloak embebida, `readCommercialPanel`.

**Spec:** `docs/superpowers/specs/2026-11-11-umbral-entrada-design.md`

## Global Constraints

- Frase pública: `null` → `Entra a tu Espacio.`; `0` → `Este Espacio está al día.`; `1` → `Hay 1 oportunidad esperando.`; `n > 1` → `Hay {n} oportunidades esperando.` con `Intl.NumberFormat("es")`. Sin nombres.
- Orden de cruce, primera fila que coincide: `/platform` o debajo → `Entras a la plataforma.`; `/admin/sin-espacio` → `Todavía no tienes un Espacio.`; `/admin` + asuntos estudiantiles → `Entras a tu trabajo.`; `/admin` sin permiso de ventas → `Entras a tu Espacio.`; `/admin` con permiso y sin filas → `Nada pide atención ahora.`; `/admin` con permiso y primera fila → banda; cualquier otro path → `Entras a tu trabajo.`
- Bandas: `overdue` → `{nombre} está vencida.`; `unfollowed` → `{nombre} está sin seguimiento.`; `stale` → `{nombre} está estancada.`; otra → `{nombre} · {etiqueta}.` Nombre vacío → `Persona`.
- Permiso de ventas: `growth.sales.view`, `growth.sales.read` o `growth.sales.operate`. Alcance del panel: todo el Espacio si hay view o read; si no, lo suyo.
- `crossingMayResolveAccess` solo con path exactamente `/admin` y tenant. `crossingNeedsPanel` además exige permiso y que no sea shell de asuntos estudiantiles.
- Respiro 700 ms solo si la frase nueva es distinta y no hay `prefers-reduced-motion: reduce`.
- Señal `growth-os.threshold-arrival`: timestamp en ms, sin la frase. Válida si la edad es `>= 0` y `< 15000`. Leerla la borra.
- Si armar la frase lanza, la sesión responde `ok` con `redirectTo` y sin campos nuevos.
- `/login` conserva `loadSessionContext`, `resolvePostAuthDestination`, `hasPlatformOperatorCapability` y el texto `LoginForm`. No usa `redirect("/admin")` ni `/api/identity/auth/keycloak/login`.
- `LoginForm` conserva Usuario, Contraseña, `type="password"` y el POST a `/api/identity/auth/keycloak/session`.
- Sin endpoint público, sin passkeys, sin voz, sin rehacer el inicio, sin mover `resolvePostAuthDestination`.

## File structure

- Create: `src/lib/identity/threshold-line.ts` — frases, gates, respiro. Sin `server-only`.
- Create: `src/lib/identity/threshold-arrival.ts` — señal. Sin `server-only`.
- Create: `src/lib/identity/threshold-read.ts` — frase de cruce con permisos y panel. `server-only`.
- Create: `src/components/identity/ThresholdLogin.tsx` — frase, respiro, contexto. Cliente.
- Create: `src/components/identity/ThresholdArrival.tsx` — asentamiento del inicio. Cliente.
- Create: `tests/baseline/growth-threshold-line.test.ts` — frases, gates, respiro.
- Create: `tests/baseline/growth-threshold-arrival.test.ts` — señal.
- Modify: `src/lib/growth/commercial-read.ts` — `readSpaceAttentionCount`.
- Modify: `src/app/api/identity/auth/keycloak/session/route.ts` — campos aditivos.
- Modify: `src/components/identity/LoginForm.tsx` — callback por contexto.
- Modify: `src/app/login/page.tsx` — escena en vez de `ProductAuthFrame`.
- Modify: `src/components/admin/preview/growth-os-master/GrowthOsAdminHomeMaster.tsx` — envolver la atención.
- Modify: `src/styles/foundation/motion.css` — asentamiento y reduced motion.

---

### Task 1: Frases puras

**Files:**
- Create: `src/lib/identity/threshold-line.ts`
- Test: `tests/baseline/growth-threshold-line.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `publicThresholdLine(count: number | null): string`
  - `redirectPath(redirectTo: string): string`
  - `crossingMayResolveAccess(path: string, hasTenant: boolean): boolean`
  - `crossingNeedsPanel(path: string, flags: { hasTenant: boolean; studentAffairs: boolean; canSales: boolean }): boolean`
  - `ThresholdAttentionRow = { personaLabel: string; band: string | null; bandLabel: string }`
  - `crossingThresholdLine(input: { redirectTo: string; hasTenant: boolean; studentAffairs: boolean; canSales: boolean; attentionRows?: ThresholdAttentionRow[] }): { line: string; announceArrival: boolean }`
  - `THRESHOLD_BREATH_MS = 700`
  - `thresholdBreathMs(input: { nextLine: string | undefined; currentLine: string; reduceMotion: boolean }): number`

- [ ] **Step 1: Write the failing test**

Create `tests/baseline/growth-threshold-line.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  THRESHOLD_BREATH_MS,
  crossingMayResolveAccess,
  crossingNeedsPanel,
  crossingThresholdLine,
  publicThresholdLine,
  redirectPath,
  thresholdBreathMs,
} from "../../src/lib/identity/threshold-line";

describe("frase pública del umbral", () => {
  it("sin conteo pide entrar al Espacio", () => {
    assert.equal(publicThresholdLine(null), "Entra a tu Espacio.");
  });

  it("cero dice que el Espacio está al día", () => {
    assert.equal(publicThresholdLine(0), "Este Espacio está al día.");
  });

  it("una oportunidad queda en singular", () => {
    assert.equal(publicThresholdLine(1), "Hay 1 oportunidad esperando.");
  });

  it("varias usan el formato es", () => {
    const formatted = new Intl.NumberFormat("es").format(1200);
    assert.equal(
      publicThresholdLine(1200),
      `Hay ${formatted} oportunidades esperando.`
    );
  });
});

describe("gates del panel", () => {
  it("solo resuelve acceso en /admin con tenant", () => {
    assert.equal(crossingMayResolveAccess("/admin", true), true);
    assert.equal(crossingMayResolveAccess("/admin", false), false);
    assert.equal(crossingMayResolveAccess("/admin/ventas", true), false);
    assert.equal(crossingMayResolveAccess("/platform", true), false);
  });

  it("el panel exige permiso y no ser asuntos estudiantiles", () => {
    const base = { hasTenant: true, studentAffairs: false, canSales: true };
    assert.equal(crossingNeedsPanel("/admin", base), true);
    assert.equal(crossingNeedsPanel("/admin", { ...base, canSales: false }), false);
    assert.equal(
      crossingNeedsPanel("/admin", { ...base, studentAffairs: true }),
      false
    );
    assert.equal(crossingNeedsPanel("/admin", { ...base, hasTenant: false }), false);
  });
});

describe("frase de cruce", () => {
  const row = {
    personaLabel: "Ana Ruiz",
    band: "overdue",
    bandLabel: "Vencida",
  };

  it("separa el path de la query", () => {
    assert.equal(redirectPath("/admin?empty=1"), "/admin");
  });

  it("plataforma, sin Espacio y otro path no anuncian llegada", () => {
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/platform/spaces/adl",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [row],
      }),
      { line: "Entras a la plataforma.", announceArrival: false }
    );
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/admin/sin-espacio",
        hasTenant: false,
        studentAffairs: false,
        canSales: false,
      }),
      { line: "Todavía no tienes un Espacio.", announceArrival: false }
    );
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/admin/ventas",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [row],
      }),
      { line: "Entras a tu trabajo.", announceArrival: false }
    );
  });

  it("asuntos estudiantiles gana al permiso de ventas", () => {
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: true,
        canSales: true,
        attentionRows: [row],
      }),
      { line: "Entras a tu trabajo.", announceArrival: false }
    );
  });

  it("sin permiso no lee una fila aunque se la pasen", () => {
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: false,
        canSales: false,
        attentionRows: [row],
      }),
      { line: "Entras a tu Espacio.", announceArrival: false }
    );
  });

  it("sin filas anuncia el vacío", () => {
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/admin?preset=last_30d",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [],
      }),
      { line: "Nada pide atención ahora.", announceArrival: true }
    );
  });

  it("formatea las tres bandas, una desconocida y un nombre vacío", () => {
    assert.equal(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [row],
      }).line,
      "Ana Ruiz está vencida."
    );
    assert.equal(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [{ personaLabel: "Ana Ruiz", band: "unfollowed", bandLabel: "Sin seguimiento" }],
      }).line,
      "Ana Ruiz está sin seguimiento."
    );
    assert.equal(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [{ personaLabel: "Ana Ruiz", band: "stale", bandLabel: "Estancada" }],
      }).line,
      "Ana Ruiz está estancada."
    );
    assert.equal(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [{ personaLabel: "Ana Ruiz", band: "current", bandLabel: "Al día" }],
      }).line,
      "Ana Ruiz · Al día."
    );
    assert.equal(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [{ personaLabel: "  ", band: "overdue", bandLabel: "Vencida" }],
      }).line,
      "Persona está vencida."
    );
  });

  it("sin filas entregadas no anuncia llegada", () => {
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/admin",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
      }),
      { line: "Entras a tu Espacio.", announceArrival: false }
    );
  });
});

describe("respiro", () => {
  it("espera 700 ms solo cuando la frase cambia y hay movimiento", () => {
    assert.equal(THRESHOLD_BREATH_MS, 700);
    assert.equal(
      thresholdBreathMs({
        nextLine: "Ana Ruiz está vencida.",
        currentLine: "Entra a tu Espacio.",
        reduceMotion: false,
      }),
      700
    );
    assert.equal(
      thresholdBreathMs({
        nextLine: "Entra a tu Espacio.",
        currentLine: "Entra a tu Espacio.",
        reduceMotion: false,
      }),
      0
    );
    assert.equal(
      thresholdBreathMs({
        nextLine: undefined,
        currentLine: "Entra a tu Espacio.",
        reduceMotion: false,
      }),
      0
    );
    assert.equal(
      thresholdBreathMs({
        nextLine: "Ana Ruiz está vencida.",
        currentLine: "Entra a tu Espacio.",
        reduceMotion: true,
      }),
      0
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/growth-threshold-line.test.ts`

Expected: FAIL. No se encuentra `../../src/lib/identity/threshold-line`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/identity/threshold-line.ts`:

```ts
/**
 * Frases del umbral. Sin IO.
 * La pública es un conteo. La de cruce describe la pantalla en la que la persona se queda.
 */

export const THRESHOLD_BREATH_MS = 700;

const ENTER_SPACE = "Entra a tu Espacio.";
const ENTER_SPACE_NOW = "Entras a tu Espacio.";
const SPACE_CLEAR = "Este Espacio está al día.";
const ENTER_PLATFORM = "Entras a la plataforma.";
const NO_SPACE = "Todavía no tienes un Espacio.";
const ENTER_WORK = "Entras a tu trabajo.";
const NOTHING = "Nada pide atención ahora.";

export function publicThresholdLine(count: number | null): string {
  if (count == null || count < 0) return ENTER_SPACE;
  if (count === 0) return SPACE_CLEAR;
  if (count === 1) return "Hay 1 oportunidad esperando.";
  const formatted = new Intl.NumberFormat("es").format(count);
  return `Hay ${formatted} oportunidades esperando.`;
}

export function redirectPath(redirectTo: string): string {
  return redirectTo.split("?")[0] ?? "";
}

export function crossingMayResolveAccess(path: string, hasTenant: boolean): boolean {
  return path === "/admin" && hasTenant;
}

export function crossingNeedsPanel(
  path: string,
  flags: { hasTenant: boolean; studentAffairs: boolean; canSales: boolean }
): boolean {
  return (
    crossingMayResolveAccess(path, flags.hasTenant) &&
    !flags.studentAffairs &&
    flags.canSales
  );
}

export interface ThresholdAttentionRow {
  personaLabel: string;
  band: string | null;
  bandLabel: string;
}

function bandLine(row: ThresholdAttentionRow): string {
  const name = row.personaLabel.trim() || "Persona";
  if (row.band === "overdue") return `${name} está vencida.`;
  if (row.band === "unfollowed") return `${name} está sin seguimiento.`;
  if (row.band === "stale") return `${name} está estancada.`;
  const label = row.bandLabel.trim() || "Atención";
  return `${name} · ${label}.`;
}

export function crossingThresholdLine(input: {
  redirectTo: string;
  hasTenant: boolean;
  studentAffairs: boolean;
  canSales: boolean;
  attentionRows?: ThresholdAttentionRow[];
}): { line: string; announceArrival: boolean } {
  const path = redirectPath(input.redirectTo);
  if (path === "/platform" || path.startsWith("/platform/")) {
    return { line: ENTER_PLATFORM, announceArrival: false };
  }
  if (path === "/admin/sin-espacio") {
    return { line: NO_SPACE, announceArrival: false };
  }
  if (path === "/admin" && input.studentAffairs) {
    return { line: ENTER_WORK, announceArrival: false };
  }
  if (path === "/admin" && !input.canSales) {
    return { line: ENTER_SPACE_NOW, announceArrival: false };
  }
  if (path === "/admin" && input.canSales) {
    if (!input.attentionRows) {
      return { line: ENTER_SPACE_NOW, announceArrival: false };
    }
    const first = input.attentionRows[0];
    if (!first) return { line: NOTHING, announceArrival: true };
    return { line: bandLine(first), announceArrival: true };
  }
  return { line: ENTER_WORK, announceArrival: false };
}

export function thresholdBreathMs(input: {
  nextLine: string | undefined;
  currentLine: string;
  reduceMotion: boolean;
}): number {
  const next = input.nextLine?.trim() ?? "";
  if (!next || next === input.currentLine || input.reduceMotion) return 0;
  return THRESHOLD_BREATH_MS;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/growth-threshold-line.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/baseline/growth-threshold-line.test.ts src/lib/identity/threshold-line.ts
git commit -m "feat(identity): frases puras del umbral de entrada"
```

---

### Task 2: Señal de llegada

**Files:**
- Create: `src/lib/identity/threshold-arrival.ts`
- Test: `tests/baseline/growth-threshold-arrival.test.ts`

**Interfaces:**
- Consumes: nada de Task 1.
- Produces:
  - `THRESHOLD_ARRIVAL_KEY = "growth-os.threshold-arrival"`
  - `THRESHOLD_ARRIVAL_WINDOW_MS = 15000`
  - `shouldPlayArrival(storedAt: number, now: number): boolean`
  - `ThresholdArrivalStorage = { get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void }`
  - `markThresholdArrival(storage: ThresholdArrivalStorage, now: number): void`
  - `consumeThresholdArrival(storage: ThresholdArrivalStorage, now: number): boolean`
  - `browserArrivalStorage(): ThresholdArrivalStorage | null`

- [ ] **Step 1: Write the failing test**

Create `tests/baseline/growth-threshold-arrival.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  THRESHOLD_ARRIVAL_KEY,
  THRESHOLD_ARRIVAL_WINDOW_MS,
  consumeThresholdArrival,
  markThresholdArrival,
  shouldPlayArrival,
  type ThresholdArrivalStorage,
} from "../../src/lib/identity/threshold-arrival";

function memoryStorage(): ThresholdArrivalStorage & { dump(): Map<string, string> } {
  const data = new Map<string, string>();
  return {
    dump: () => data,
    get: (key) => data.get(key) ?? null,
    set: (key, value) => {
      data.set(key, value);
    },
    remove: (key) => {
      data.delete(key);
    },
  };
}

describe("señal de llegada del umbral", () => {
  it("reproduce dentro de 15 s y no en el límite", () => {
    assert.equal(THRESHOLD_ARRIVAL_WINDOW_MS, 15_000);
    const now = 1_700_000_000_000;
    assert.equal(shouldPlayArrival(now - 14_999, now), true);
    assert.equal(shouldPlayArrival(now, now), true);
    assert.equal(shouldPlayArrival(now - 15_000, now), false);
    assert.equal(shouldPlayArrival(now + 1, now), false);
    assert.equal(shouldPlayArrival(Number.NaN, now), false);
  });

  it("guarda solo el timestamp y la segunda lectura no reproduce", () => {
    const storage = memoryStorage();
    const now = 1_700_000_000_000;
    markThresholdArrival(storage, now);
    assert.equal(storage.dump().get(THRESHOLD_ARRIVAL_KEY), String(now));
    assert.equal(storage.dump().size, 1);
    assert.equal(consumeThresholdArrival(storage, now + 1000), true);
    assert.equal(storage.dump().has(THRESHOLD_ARRIVAL_KEY), false);
    assert.equal(consumeThresholdArrival(storage, now + 1000), false);
  });

  it("borra una señal vieja o inválida sin reproducir", () => {
    const storage = memoryStorage();
    const now = 1_700_000_000_000;
    storage.set(THRESHOLD_ARRIVAL_KEY, "no-es-numero");
    assert.equal(consumeThresholdArrival(storage, now), false);
    assert.equal(storage.dump().has(THRESHOLD_ARRIVAL_KEY), false);

    storage.set(THRESHOLD_ARRIVAL_KEY, String(now - 15_000));
    assert.equal(consumeThresholdArrival(storage, now), false);
    assert.equal(storage.dump().has(THRESHOLD_ARRIVAL_KEY), false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/growth-threshold-arrival.test.ts`

Expected: FAIL. No se encuentra el módulo.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/identity/threshold-arrival.ts`:

```ts
/**
 * Señal de «acaba de cruzar». No guarda la frase.
 * El inicio la consume una vez para asentar la primera pieza.
 */

export const THRESHOLD_ARRIVAL_KEY = "growth-os.threshold-arrival";
export const THRESHOLD_ARRIVAL_WINDOW_MS = 15_000;

export function shouldPlayArrival(storedAt: number, now: number): boolean {
  if (!Number.isFinite(storedAt) || !Number.isFinite(now)) return false;
  const age = now - storedAt;
  return age >= 0 && age < THRESHOLD_ARRIVAL_WINDOW_MS;
}

export interface ThresholdArrivalStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export function markThresholdArrival(storage: ThresholdArrivalStorage, now: number): void {
  storage.set(THRESHOLD_ARRIVAL_KEY, String(now));
}

export function consumeThresholdArrival(
  storage: ThresholdArrivalStorage,
  now: number
): boolean {
  const raw = storage.get(THRESHOLD_ARRIVAL_KEY);
  storage.remove(THRESHOLD_ARRIVAL_KEY);
  if (raw == null) return false;
  return shouldPlayArrival(Number(raw), now);
}

export function browserArrivalStorage(): ThresholdArrivalStorage | null {
  if (typeof sessionStorage === "undefined") return null;
  return {
    get: (key) => sessionStorage.getItem(key),
    set: (key, value) => sessionStorage.setItem(key, value),
    remove: (key) => sessionStorage.removeItem(key),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/growth-threshold-arrival.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/baseline/growth-threshold-arrival.test.ts src/lib/identity/threshold-arrival.ts
git commit -m "feat(identity): señal de llegada del umbral"
```

---

### Task 3: Conteo público y frase de cruce en el servidor

**Files:**
- Modify: `src/lib/growth/commercial-read.ts` (después de `readCommercialPanel`)
- Create: `src/lib/identity/threshold-read.ts`
- Modify: `src/app/api/identity/auth/keycloak/session/route.ts`
- Test: `tests/baseline/growth-threshold-read.test.ts`

**Interfaces:**
- Consumes: `crossingMayResolveAccess`, `crossingNeedsPanel`, `crossingThresholdLine`, `redirectPath` de Task 1. `readCommercialPanel` y `loadOpen` ya existentes. `findMembership(userId, tenantId)`. `findRolesByIds`, `getRoleCode`. `resolvePermissionsForMembership`. `usesStudentAffairsFocusedShell`.
- Produces:
  - `readSpaceAttentionCount(tenantId: string): Promise<number>`
  - `readCrossingThresholdLine(input: { userId: string; tenantId: string | null; redirectTo: string }): Promise<{ line: string; announceArrival: boolean }>`

- [ ] **Step 1: Write the failing test**

Create `tests/baseline/growth-threshold-read.test.ts`. Lee el fuente, como `auth-hardening-001`, porque estos módulos son `server-only`.

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("lectura del umbral", () => {
  it("el conteo público suma las tres bandas y no mapea filas", () => {
    const src = readSrc("src/lib/growth/commercial-read.ts");
    assert.match(src, /export async function readSpaceAttentionCount\(tenantId: string\)/);
    assert.match(src, /countGrowthBands\(loaded\.opportunities, loaded\.now, loaded\.staleAfterDays\)/);
    assert.match(src, /counts\.overdue \+ counts\.unfollowed \+ counts\.stale/);
    const body = src.slice(src.indexOf("export async function readSpaceAttentionCount"));
    const nextExport = body.indexOf("\nexport ", 10);
    const fn = nextExport === -1 ? body : body.slice(0, nextExport);
    assert.doesNotMatch(fn, /personaLabel/);
    assert.doesNotMatch(fn, /toRow/);
  });

  it("la frase de cruce no toca el panel si el gate es falso", () => {
    const src = readSrc("src/lib/identity/threshold-read.ts");
    assert.match(src, /import "server-only"/);
    assert.match(src, /crossingMayResolveAccess\(path, hasTenant\)/);
    assert.match(src, /crossingNeedsPanel\(/);
    assert.match(src, /findMembership\(input\.userId, tenantId\)/);
    assert.match(src, /usesStudentAffairsFocusedShell\(permissions, false, roleCodes\)/);
    assert.match(src, /readCommercialPanel\(tenantId, input\.userId, spaceWide\)/);
    const panelAt = src.indexOf("readCommercialPanel(tenantId, input.userId, spaceWide)");
    const needsAt = src.indexOf("crossingNeedsPanel(");
    assert.ok(needsAt > 0 && panelAt > needsAt);
  });

  it("la sesión suma la frase y sigue devolviendo redirectTo si el helper falla", () => {
    const src = readSrc("src/app/api/identity/auth/keycloak/session/route.ts");
    assert.match(src, /resolvePostAuthDestination/);
    assert.match(src, /await\s+loginWithKeycloakPassword/);
    assert.match(src, /redirectTo/);
    assert.match(src, /readCrossingThresholdLine/);
    assert.match(src, /thresholdLine: threshold\.line/);
    assert.match(src, /thresholdArrival: threshold\.announceArrival/);
    assert.match(src, /catch/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/growth-threshold-read.test.ts`

Expected: FAIL. Faltan `readSpaceAttentionCount`, `threshold-read.ts` y los campos en la ruta.

- [ ] **Step 3: Write minimal implementation**

Al final de `readCommercialPanel` en `src/lib/growth/commercial-read.ts`, antes de `readMyWork`, agregar:

```ts
/** Vencidas + sin seguimiento + estancadas del Espacio. Sin nombres. */
export async function readSpaceAttentionCount(tenantId: string): Promise<number> {
  const loaded = await loadOpen(tenantId);
  const counts = countGrowthBands(
    loaded.opportunities,
    loaded.now,
    loaded.staleAfterDays
  );
  return counts.overdue + counts.unfollowed + counts.stale;
}
```

Create `src/lib/identity/threshold-read.ts`:

```ts
import "server-only";

import { usesStudentAffairsFocusedShell } from "@/lib/admin/nav-access";
import { readCommercialPanel } from "@/lib/growth/commercial-read";
import { findMembership } from "@/lib/identity/memberships";
import { resolvePermissionsForMembership } from "@/lib/identity/permission-resolver";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import {
  crossingMayResolveAccess,
  crossingNeedsPanel,
  crossingThresholdLine,
  redirectPath,
  type ThresholdAttentionRow,
} from "@/lib/identity/threshold-line";

export async function readCrossingThresholdLine(input: {
  userId: string;
  tenantId: string | null;
  redirectTo: string;
}): Promise<{ line: string; announceArrival: boolean }> {
  const path = redirectPath(input.redirectTo);
  const tenantId = input.tenantId?.trim() ?? "";
  const hasTenant = tenantId.length > 0;
  if (!crossingMayResolveAccess(path, hasTenant)) {
    return crossingThresholdLine({
      redirectTo: input.redirectTo,
      hasTenant,
      studentAffairs: false,
      canSales: false,
    });
  }

  const membership = await findMembership(input.userId, tenantId);
  const roles = membership
    ? await findRolesByIds(tenantId, membership.roleIds)
    : [];
  const roleCodes = roles
    .map((role) => getRoleCode(role))
    .filter((code): code is NonNullable<typeof code> => Boolean(code));
  const permissions = membership
    ? await resolvePermissionsForMembership(tenantId, membership)
    : [];
  const studentAffairs = usesStudentAffairsFocusedShell(permissions, false, roleCodes);
  const salesView = permissions.includes("growth.sales.view");
  const salesRead = permissions.includes("growth.sales.read");
  const salesOperate = permissions.includes("growth.sales.operate");
  const canSales = salesView || salesRead || salesOperate;
  const flags = { hasTenant: true, studentAffairs, canSales };
  if (!crossingNeedsPanel(path, flags)) {
    return crossingThresholdLine({
      redirectTo: input.redirectTo,
      hasTenant: true,
      studentAffairs,
      canSales,
    });
  }

  const spaceWide = salesView || salesRead;
  const panel = await readCommercialPanel(tenantId, input.userId, spaceWide);
  const attentionRows: ThresholdAttentionRow[] = panel.rows.map((row) => ({
    personaLabel: row.personaLabel,
    band: row.band,
    bandLabel: row.bandLabel,
  }));
  return crossingThresholdLine({
    redirectTo: input.redirectTo,
    hasTenant: true,
    studentAffairs,
    canSales,
    attentionRows,
  });
}
```

En `src/app/api/identity/auth/keycloak/session/route.ts`, agregar el import:

```ts
import { readCrossingThresholdLine } from "@/lib/identity/threshold-read";
```

Reemplazar el `return NextResponse.json` exitoso (el que incluye `redirectTo`) por:

```ts
    let threshold: { line: string; announceArrival: boolean } | null = null;
    try {
      threshold = await readCrossingThresholdLine({
        userId: user._id,
        tenantId: activeTenantId,
        redirectTo,
      });
    } catch {
      threshold = null;
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
      activeTenantId,
      hasSpace: Boolean(activeTenantId),
      isPlatformOperator,
      redirectTo,
      ...(threshold
        ? {
            thresholdLine: threshold.line,
            thresholdArrival: threshold.announceArrival,
          }
        : {}),
    });
```

`activeTenantId` puede ser `string | null`. Pasarlo tal cual.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/growth-threshold-read.test.ts tests/baseline/auth-hardening-001.test.ts tests/baseline/auth-entry-fix-002.test.ts`

Expected: PASS. La ruta sigue teniendo `loginWithKeycloakPassword` y `resolvePostAuthDestination`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/growth/commercial-read.ts src/lib/identity/threshold-read.ts src/app/api/identity/auth/keycloak/session/route.ts tests/baseline/growth-threshold-read.test.ts
git commit -m "feat(identity): frase de cruce en la sesión"
```

---

### Task 4: La puerta

**Files:**
- Create: `src/components/identity/ThresholdLogin.tsx`
- Modify: `src/components/identity/LoginForm.tsx`
- Modify: `src/app/login/page.tsx`

**Interfaces:**
- Consumes: `thresholdBreathMs` de Task 1. `browserArrivalStorage`, `markThresholdArrival` de Task 2. `publicThresholdLine` de Task 1. `readSpaceAttentionCount` de Task 3.
- Produces: `ThresholdLogin` pinta la frase y provee el callback. `LoginForm` lo usa si está dentro del provider. Fuera, navega como hoy.

La página de servidor no puede pasar funciones a un cliente. Compone los dos componentes de cliente y el contexto viaja por el árbol. `page.tsx` sigue conteniendo el identificador `LoginForm`.

- [ ] **Step 1: Write the failing test**

Agregar al final de `tests/baseline/growth-threshold-read.test.ts`, dentro de un `describe` nuevo:

```ts
describe("puerta del umbral", () => {
  it("login conserva el contrato de entrada y no usa ProductAuthFrame", () => {
    const page = readSrc("src/app/login/page.tsx");
    assert.match(page, /loadSessionContext/);
    assert.match(page, /resolvePostAuthDestination/);
    assert.match(page, /hasPlatformOperatorCapability/);
    assert.match(page, /LoginForm/);
    assert.match(page, /ThresholdLogin/);
    assert.match(page, /readSpaceAttentionCount/);
    assert.match(page, /publicThresholdLine/);
    assert.doesNotMatch(page, /ProductAuthFrame/);
    assert.doesNotMatch(page, /redirect\("\/admin"\)/);
    assert.doesNotMatch(page, /\/api\/identity\/auth\/keycloak\/login/);
  });

  it("el formulario espera el callback y si no hay provider navega solo", () => {
    const form = readSrc("src/components/identity/LoginForm.tsx");
    assert.match(form, /Usuario/);
    assert.match(form, /Contraseña/);
    assert.match(form, /type="password"/);
    assert.match(form, /\/api\/identity\/auth\/keycloak\/session/);
    assert.match(form, /useThresholdOnAuthenticated/);
    assert.match(form, /await onAuthenticated/);
    assert.match(form, /window\.location\.assign\(destination\)/);
    assert.doesNotMatch(form, /href=\{loginHref\}/);
  });

  it("el respiro usa la función pura y escribe la señal antes de abrir", () => {
    const scene = readSrc("src/components/identity/ThresholdLogin.tsx");
    assert.match(scene, /thresholdBreathMs/);
    assert.match(scene, /markThresholdArrival/);
    assert.match(scene, /prefers-reduced-motion: reduce/);
    assert.match(scene, /aria-live="polite"/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/growth-threshold-read.test.ts`

Expected: FAIL. La página todavía usa `ProductAuthFrame` y no `ThresholdLogin`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/identity/ThresholdLogin.tsx`:

```tsx
"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { thresholdBreathMs } from "@/lib/identity/threshold-line";
import {
  browserArrivalStorage,
  markThresholdArrival,
} from "@/lib/identity/threshold-arrival";

export interface ThresholdAuthResult {
  redirectTo: string;
  thresholdLine?: string;
  thresholdArrival?: boolean;
}

const ThresholdAuthContext = createContext<
  ((result: ThresholdAuthResult) => Promise<void>) | null
>(null);

export function useThresholdOnAuthenticated() {
  return useContext(ThresholdAuthContext);
}

export function ThresholdLogin({
  line,
  children,
}: {
  line: string;
  children: ReactNode;
}) {
  const [phrase, setPhrase] = useState(line);
  const phraseRef = useRef(line);
  phraseRef.current = phrase;

  async function onAuthenticated(result: ThresholdAuthResult) {
    const wait = thresholdBreathMs({
      nextLine: result.thresholdLine,
      currentLine: phraseRef.current,
      reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
    const nextLine = result.thresholdLine?.trim();
    if (nextLine && nextLine !== phraseRef.current) setPhrase(nextLine);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    if (result.thresholdArrival) {
      const storage = browserArrivalStorage();
      if (storage) markThresholdArrival(storage, Date.now());
    }
    window.location.assign(result.redirectTo);
  }

  return (
    <ThresholdAuthContext.Provider value={onAuthenticated}>
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-10 px-5 py-16">
        <h1
          aria-live="polite"
          className="text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--growth-os-primary)]"
        >
          {phrase}
        </h1>
        {children}
      </main>
    </ThresholdAuthContext.Provider>
  );
}
```

En `LoginForm.tsx`, agregar el import y usar el hook. Reemplazar el tipo del JSON y el éxito del submit:

```ts
import { useThresholdOnAuthenticated } from "@/components/identity/ThresholdLogin";
```

Dentro del componente, junto a los `useState`:

```ts
  const onAuthenticated = useThresholdOnAuthenticated();
```

Ampliar el tipo de `data`:

```ts
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
        thresholdLine?: string;
        thresholdArrival?: boolean;
      };
```

Reemplazar el bloque que hoy hace `window.location.assign(destination)` por:

```ts
      const destination =
        data.redirectTo && data.redirectTo.startsWith("/") && !data.redirectTo.startsWith("//")
          ? data.redirectTo
          : "/admin";
      if (onAuthenticated) {
        await onAuthenticated({
          redirectTo: destination,
          thresholdLine: data.thresholdLine,
          thresholdArrival: data.thresholdArrival,
        });
        return;
      }
      window.location.assign(destination);
```

El `catch` existente cubre un rechazo del callback: muestra «No se pudo conectar con el servidor.» y no abre otro destino. El `finally` suelta `loading` después del `await`, así que el botón sigue en «Ingresando…» durante el respiro.

Reemplazar `src/app/login/page.tsx` por este archivo. Conserva metadata, `safeNext` y el redirect de quien ya tiene sesión.

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/identity/LoginForm";
import { ThresholdLogin } from "@/components/identity/ThresholdLogin";
import { loginErrorMessage } from "@/components/identity/login-errors";
import { PlatformNeutralTheme } from "@/components/product";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding";
import { isKeycloakEnabled } from "@/core/identity/auth/keycloak";
import { hasPlatformOperatorCapability } from "@/core/identity/platform/capability";
import { resolvePostAuthDestination } from "@/core/identity/platform/landing";
import { resolveActiveTenantIdFromRequest } from "@/core/tenant/context";
import { readSpaceAttentionCount } from "@/lib/growth/commercial-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { publicThresholdLine } from "@/lib/identity/threshold-line";

export const dynamic = "force-dynamic";

/** Superficie de plataforma: no hereda SEO/CMS del Espacio resuelto por Host. */
export const metadata: Metadata = {
  title: `Ingresar | ${PLATFORM_DISPLAY_NAME}`,
  description: `Acceso a ${PLATFORM_DISPLAY_NAME}`,
  robots: { index: false, follow: false },
};

function safeNext(value: string | undefined): string | null {
  const next = value?.trim() ?? "";
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  if (next === "/login" || next === "/admin/login" || next === "/ingresar") return null;
  return next;
}

export default async function GrowthLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const session = await loadSessionContext();
  if (session) {
    redirect(
      resolvePostAuthDestination({
        hasSpace: Boolean(session.membership && session.session.tenantId?.trim()),
        isPlatformOperator: hasPlatformOperatorCapability(session.user),
        next,
      })
    );
  }

  let line = publicThresholdLine(null);
  try {
    const tenantId = await resolveActiveTenantIdFromRequest();
    if (tenantId) {
      line = publicThresholdLine(await readSpaceAttentionCount(tenantId));
    }
  } catch {
    line = publicThresholdLine(null);
  }

  return (
    <PlatformNeutralTheme>
      <ThresholdLogin line={line}>
        <LoginForm
          next={next}
          authReady={isKeycloakEnabled()}
          errorMessage={loginErrorMessage(params.error)}
        />
      </ThresholdLogin>
    </PlatformNeutralTheme>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/growth-threshold-read.test.ts tests/baseline/auth-hardening-001.test.ts tests/baseline/auth-entry-fix-002.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/identity/ThresholdLogin.tsx src/components/identity/LoginForm.tsx src/app/login/page.tsx tests/baseline/growth-threshold-read.test.ts
git commit -m "feat(identity): puerta del umbral en el login"
```

---

### Task 5: Asentamiento en el inicio

**Files:**
- Create: `src/components/identity/ThresholdArrival.tsx`
- Modify: `src/components/admin/preview/growth-os-master/GrowthOsAdminHomeMaster.tsx` (el bloque «Qué necesita atención», líneas del ternario `home.attention.length`)
- Modify: `src/styles/foundation/motion.css`
- Test: el mismo `tests/baseline/growth-threshold-read.test.ts`

**Interfaces:**
- Consumes: `browserArrivalStorage`, `consumeThresholdArrival` de Task 2.
- Produces: `ThresholdArrival` marca `data-threshold-arrival="true"` una vez. El CSS asienta la primera fila, o el vacío si no hay lista.

- [ ] **Step 1: Write the failing test**

Agregar dentro del `describe("puerta del umbral")` de `tests/baseline/growth-threshold-read.test.ts`:

```ts
  it("el inicio envuelve la atención y el movimiento se apaga si la persona lo pide", () => {
    const home = readSrc(
      "src/components/admin/preview/growth-os-master/GrowthOsAdminHomeMaster.tsx"
    );
    const arrival = readSrc("src/components/identity/ThresholdArrival.tsx");
    const motion = readSrc("src/styles/foundation/motion.css");
    assert.match(home, /ThresholdArrival/);
    assert.match(home, /Qué necesita atención/);
    assert.match(arrival, /consumeThresholdArrival/);
    assert.match(arrival, /prefers-reduced-motion: reduce/);
    assert.match(motion, /threshold-arrival\[data-threshold-arrival="true"\] > ul > li:first-child/);
    assert.match(motion, /\.threshold-arrival\[data-threshold-arrival="true"\] > :not\(ul\)/);
    const reduceAt = motion.indexOf("@media (prefers-reduced-motion: reduce)");
    const ruleAt = motion.indexOf(".threshold-arrival[data-threshold-arrival=\"true\"]", reduceAt);
    assert.ok(reduceAt > 0 && ruleAt > reduceAt);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/growth-threshold-read.test.ts`

Expected: FAIL. No existe `ThresholdArrival` y el inicio no lo usa.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/identity/ThresholdArrival.tsx`:

```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  browserArrivalStorage,
  consumeThresholdArrival,
} from "@/lib/identity/threshold-arrival";

export function ThresholdArrival({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storage = browserArrivalStorage();
    if (!storage) return;
    const play = consumeThresholdArrival(storage, Date.now());
    if (!play) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.setAttribute("data-threshold-arrival", "true");
  }, []);

  return (
    <div ref={ref} className="threshold-arrival mt-4 flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  );
}
```

En `GrowthOsAdminHomeMaster.tsx`, importar `ThresholdArrival` desde `@/components/identity/ThresholdArrival`.

Envolver solo el ternario de la atención. Quitar `mt-4` del `EmptyState` y del `ul` de esa lista, porque el wrapper ya lo tiene. No tocar el bloque «Origen de los prospectos».

Abrir así, en el lugar del ternario actual:

```tsx
          <ThresholdArrival>
            {home.attention.length === 0 ? (
              <EmptyState
                title="Nada pide atención ahora"
                description="Cuando una oportunidad esté vencida, sin seguimiento o estancada, aparecerá aquí."
                icon={<UserRound className="h-8 w-8" strokeWidth={1.5} />}
                className="flex-1 border-dashed bg-[var(--gray-50)] py-8 shadow-none"
              />
            ) : (
              <ul className="flex min-h-0 flex-1 flex-col divide-y divide-[var(--admin-home-divider)]">
```

El cuerpo del `.map` queda igual. Cerrar el `ul`, el ternario y el wrapper antes de `</section>`:

```tsx
              </ul>
            )}
          </ThresholdArrival>
        </section>
```

En `src/styles/foundation/motion.css`, antes de `@media (prefers-reduced-motion: reduce)`, agregar:

```css
.threshold-arrival[data-threshold-arrival="true"] > ul > li:first-child,
.threshold-arrival[data-threshold-arrival="true"] > :not(ul) {
  animation: f-slide-up var(--motion-duration-normal) var(--motion-ease-enter) both;
}
```

Dentro de ese `@media`, en la lista de selectores que ponen `animation: none !important`, agregar estas dos líneas:

```css
  .threshold-arrival[data-threshold-arrival="true"] > ul > li:first-child,
  .threshold-arrival[data-threshold-arrival="true"] > :not(ul),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/growth-threshold-line.test.ts tests/baseline/growth-threshold-arrival.test.ts tests/baseline/growth-threshold-read.test.ts tests/baseline/auth-hardening-001.test.ts tests/baseline/auth-entry-fix-002.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/identity/ThresholdArrival.tsx src/components/admin/preview/growth-os-master/GrowthOsAdminHomeMaster.tsx src/styles/foundation/motion.css tests/baseline/growth-threshold-read.test.ts
git commit -m "feat(identity): asentar la primera pieza al llegar al inicio"
```
