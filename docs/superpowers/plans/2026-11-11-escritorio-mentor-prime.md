# Escritorio Mentor Prime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Al entrar con un Espacio, la persona cae en `/escritorio`: fondo, barra y dock, y solo abre las aplicaciones que ese Espacio contrató.

**Architecture:** Las reglas del dock, el contrato y la frase del umbral son funciones puras. La página lee el Espacio y pinta la mesa. Las solicitudes y el contrato se guardan en Mongo; el operador los ve en la ficha del Espacio. Growth OS y Cumple vuelven a la mesa con un control; Aprende Hoy sale del origen.

**Tech Stack:** TypeScript, Next.js App Router, `node:test` vía `npx tsx --test`, Mongo por `getDatabase`, sesión existente.

**Spec:** `docs/superpowers/specs/2026-11-11-escritorio-mentor-prime-design.md`

## Global Constraints

- La mesa es `/escritorio`. `/admin` sigue siendo el inicio de Growth OS.
- Catálogo fijo, en orden: `growth-os`, `cumple`, `aprende-hoy`, `rrhh`.
- El contrato es del Espacio. El candado no mira el rol. Dentro de Growth OS los permisos siguen como hoy.
- Campo ausente → `["growth-os"]`. El Espacio `cumple` suma `cumple`. Campo presente, aunque vacío, es la verdad.
- `aprendeHoyEntryUrl` solo cuenta si empieza por `https://`.
- Candado solo si no está contratado. Contratado sin pantalla no ofrece «Solicitar acceso».
- Frases: Growth OS «Captación y conversión del Espacio.»; Cumple «Cumplimiento de la empresa: obligaciones, brechas y evidencia.»; Aprende Hoy «Vida académica: admisión, clases, evaluación y campus.»; RR.HH. «Personas empleadas, contratos y jornada.»
- Fondos `mar`, `valle`, `noche`, en `public/desktop/mar.jpg`, `valle.jpg`, `noche.jpg`. Ausente o desconocido → `mar`. Fallback `#102033`.
- Una solicitud `open` por Espacio y app. La segunda no inserta. Contratar el app la pasa a `fulfilled`.
- Destino por defecto del miembro con Espacio: `/escritorio`. Operador → `/platform`. Sin Espacio → `/admin/sin-espacio`. `next` profundo se conserva. `next` igual a `/admin`, `/escritorio`, `/admin/config` o `/admin/sin-espacio` cae en `/escritorio` si hay Espacio.
- Umbral de `/escritorio`: «Entras a tu escritorio.» Sin panel de atención.
- Asuntos estudiantiles no ve la mesa: `/admin/portal/asuntos-estudiantiles`.
- Este corte no une personas, no redibuja interiores, no cobra, no construye RR.HH. y no abre Cumple en un Espacio que no es `cumple`.

---

## File structure

- Create: `src/lib/desktop/catalog.ts` — ids, frases, fondos, aterrizaje al cambiar de Espacio.
- Create: `src/lib/desktop/contract.ts` — contrato, clic, redirección de la mesa, parche del operador.
- Create: `src/lib/desktop/requests.ts` — solicitud sobre un almacén, más el almacén en memoria.
- Create: `src/lib/desktop/store.ts` — Mongo. `server-only`.
- Create: `src/app/escritorio/page.tsx` — puerta de servidor.
- Create: `src/components/desktop/MentorDesktop.tsx` — mesa.
- Create: `src/components/desktop/mentor-desktop.css` — la mesa de la maqueta, sin la pregunta.
- Create: `src/components/desktop/EscritorioReturn.tsx` — control para Cumple con sesión.
- Create: `src/components/platform/SpaceAppsPanel.tsx` — contrato en la ficha.
- Create: `src/app/api/desktop/requests/route.ts`
- Create: `src/app/api/desktop/wallpaper/route.ts`
- Create: `src/app/api/platform/spaces/[tenantId]/apps/route.ts`
- Create: `public/desktop/mar.jpg`, `valle.jpg`, `noche.jpg`
- Create: `tests/baseline/desktop-contract.test.ts`
- Create: `tests/baseline/desktop-requests.test.ts`
- Modify: `src/core/identity/platform/landing.ts`
- Modify: `src/lib/identity/threshold-line.ts`
- Modify: `src/proxy.ts`
- Modify: `src/core/tenant/types.ts`
- Modify: `src/types/identity.ts`
- Modify: `src/lib/platform/spaces.ts`
- Modify: `src/components/platform/PlatformSpaceDetailView.tsx`
- Modify: `src/components/admin/kit/navigation/AdminTopBar.tsx`
- Modify: `src/components/admin/AdminUserMenuPanel.tsx`
- Modify: `src/components/sites/cumple/CumpleShell.tsx`
- Modify: `tests/baseline/auth-entry-fix-002.test.ts`
- Modify: `tests/baseline/platform-operator.test.ts`
- Modify: `tests/baseline/growth-threshold-line.test.ts`
- Modify: `tests/baseline/proxy-admin-gate.test.ts`

---

### Task 1: Reglas puras del dock

**Files:**
- Create: `src/lib/desktop/catalog.ts`
- Create: `src/lib/desktop/contract.ts`
- Test: `tests/baseline/desktop-contract.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `MentorAppId = "growth-os" | "cumple" | "aprende-hoy" | "rrhh"`
  - `MENTOR_APPS: readonly MentorAppId[]`
  - `CUMPLE_SPACE_ID = "cumple"`
  - `DesktopWallpaper = "mar" | "valle" | "noche"`
  - `DESKTOP_FALLBACK = "#102033"`
  - `mentorAppLabel(appId: MentorAppId): string`
  - `mentorAppBlurb(appId: MentorAppId): string`
  - `parseWallpaper(value: unknown): DesktopWallpaper`
  - `nextWallpaper(current: DesktopWallpaper): DesktopWallpaper`
  - `wallpaperSrc(id: DesktopWallpaper): string`
  - `spaceSwitchLanding(pathname: string): "/escritorio" | "/admin"`
  - `isMentorAppId(value: string): value is MentorAppId`
  - `resolveContractedApps(input: { tenantId: string; contractedApps?: readonly string[] | null }): MentorAppId[]`
  - `isHttpsEntry(url: string | null | undefined): url is string`
  - `DesktopClick = { kind: "open"; href: string } | { kind: "request" } | { kind: "later" } | { kind: "disconnected" }`
  - `desktopClick(input: { appId: MentorAppId; tenantId: string; contracted: readonly MentorAppId[]; aprendeHoyEntryUrl?: string | null; cumpleOrigin?: string | null }): DesktopClick`
  - `escritorioRedirect(input: { hasSpace: boolean; studentAffairs: boolean; isPlatformOperator: boolean; hasMembership: boolean }): "/admin/sin-espacio" | "/admin/portal/asuntos-estudiantiles" | "/platform" | null`
  - `parseContractPatch(input: { contractedApps: unknown; aprendeHoyEntryUrl: unknown }): { ok: true; contractedApps: MentorAppId[]; aprendeHoyEntryUrl: string | null } | { ok: false }`
  - `newlyContracted(before: readonly MentorAppId[], after: readonly MentorAppId[]): MentorAppId[]`

- [ ] **Step 1: Write the failing test**

Create `tests/baseline/desktop-contract.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CUMPLE_TENANT_ID } from "../../src/sites/cumple/site";
import {
  CUMPLE_SPACE_ID,
  DESKTOP_FALLBACK,
  mentorAppBlurb,
  nextWallpaper,
  parseWallpaper,
  spaceSwitchLanding,
} from "../../src/lib/desktop/catalog";
import {
  desktopClick,
  escritorioRedirect,
  isHttpsEntry,
  newlyContracted,
  parseContractPatch,
  resolveContractedApps,
} from "../../src/lib/desktop/contract";

describe("contrato del escritorio", () => {
  it("el id de Cumple es el del sitio", () => {
    assert.equal(CUMPLE_SPACE_ID, CUMPLE_TENANT_ID);
  });

  it("sin campo, Growth OS; Cumple suma su app; la lista explícita reemplaza", () => {
    assert.deepEqual(resolveContractedApps({ tenantId: "seminario-ipn" }), ["growth-os"]);
    assert.deepEqual(resolveContractedApps({ tenantId: "cumple" }), ["growth-os", "cumple"]);
    assert.deepEqual(
      resolveContractedApps({ tenantId: "cumple", contractedApps: [] }),
      []
    );
    assert.deepEqual(
      resolveContractedApps({ tenantId: "otro", contractedApps: ["rrhh", "no-existe", "growth-os"] }),
      ["growth-os", "rrhh"]
    );
  });

  it("el clic sigue la tabla de la mesa", () => {
    const base = { tenantId: "seminario-ipn", contracted: ["growth-os"] as const, aprendeHoyEntryUrl: null, cumpleOrigin: null };
    assert.deepEqual(desktopClick({ ...base, appId: "growth-os" }), { kind: "open", href: "/admin" });
    assert.deepEqual(desktopClick({ ...base, appId: "cumple" }), { kind: "request" });
    assert.deepEqual(desktopClick({ ...base, appId: "rrhh", contracted: ["rrhh"] }), { kind: "later" });
    assert.deepEqual(
      desktopClick({ ...base, appId: "aprende-hoy", contracted: ["aprende-hoy"], aprendeHoyEntryUrl: "http://aprende.example" }),
      { kind: "disconnected" }
    );
    assert.deepEqual(
      desktopClick({ ...base, appId: "aprende-hoy", contracted: ["aprende-hoy"], aprendeHoyEntryUrl: "https://aprende.example/aula" }),
      { kind: "open", href: "https://aprende.example/aula" }
    );
    assert.deepEqual(
      desktopClick({ ...base, tenantId: "cumple", appId: "cumple", contracted: ["cumple"], cumpleOrigin: "https://cumple.mentorprime.cl" }),
      { kind: "open", href: "https://cumple.mentorprime.cl" }
    );
    assert.deepEqual(
      desktopClick({ ...base, tenantId: "otro", appId: "cumple", contracted: ["cumple"], cumpleOrigin: "https://otro.example" }),
      { kind: "disconnected" }
    );
  });

  it("solo https es entrada", () => {
    assert.equal(isHttpsEntry("https://aprende.example"), true);
    assert.equal(isHttpsEntry("http://aprende.example"), false);
    assert.equal(isHttpsEntry("  "), false);
    assert.equal(isHttpsEntry(null), false);
  });

  it("la mesa redirige antes de pintar", () => {
    assert.equal(
      escritorioRedirect({ hasSpace: false, studentAffairs: false, isPlatformOperator: true, hasMembership: false }),
      "/admin/sin-espacio"
    );
    assert.equal(
      escritorioRedirect({ hasSpace: true, studentAffairs: true, isPlatformOperator: false, hasMembership: true }),
      "/admin/portal/asuntos-estudiantiles"
    );
    assert.equal(
      escritorioRedirect({ hasSpace: true, studentAffairs: false, isPlatformOperator: true, hasMembership: false }),
      "/platform"
    );
    assert.equal(
      escritorioRedirect({ hasSpace: true, studentAffairs: false, isPlatformOperator: false, hasMembership: true }),
      null
    );
  });

  it("el parche del operador rechaza basura y vacía la url", () => {
    assert.deepEqual(
      parseContractPatch({ contractedApps: ["cumple", "cumple"], aprendeHoyEntryUrl: "" }),
      { ok: true, contractedApps: ["cumple"], aprendeHoyEntryUrl: null }
    );
    assert.deepEqual(parseContractPatch({ contractedApps: ["no"], aprendeHoyEntryUrl: null }), { ok: false });
    assert.deepEqual(
      parseContractPatch({ contractedApps: ["aprende-hoy"], aprendeHoyEntryUrl: "http://x" }),
      { ok: false }
    );
  });

  it("contratar calcula solo las nuevas", () => {
    assert.deepEqual(newlyContracted(["growth-os"], ["growth-os", "cumple"]), ["cumple"]);
  });

  it("el fondo cicla y el cambio de Espacio vuelve a la mesa solo desde la mesa", () => {
    assert.equal(parseWallpaper(undefined), "mar");
    assert.equal(parseWallpaper("noche"), "noche");
    assert.equal(parseWallpaper("otro"), "mar");
    assert.equal(nextWallpaper("mar"), "valle");
    assert.equal(nextWallpaper("noche"), "mar");
    assert.equal(DESKTOP_FALLBACK, "#102033");
    assert.equal(spaceSwitchLanding("/escritorio"), "/escritorio");
    assert.equal(spaceSwitchLanding("/admin/ventas"), "/admin");
    assert.equal(mentorAppBlurb("rrhh"), "Personas empleadas, contratos y jornada.");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/desktop-contract.test.ts`

Expected: FAIL, cannot find module `../../src/lib/desktop/catalog`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/desktop/catalog.ts`:

```ts
export const MENTOR_APPS = ["growth-os", "cumple", "aprende-hoy", "rrhh"] as const;
export type MentorAppId = (typeof MENTOR_APPS)[number];

export const CUMPLE_SPACE_ID = "cumple";

export const WALLPAPERS = ["mar", "valle", "noche"] as const;
export type DesktopWallpaper = (typeof WALLPAPERS)[number];

export const DESKTOP_FALLBACK = "#102033";

const LABELS: Record<MentorAppId, string> = {
  "growth-os": "Growth OS",
  cumple: "Cumple",
  "aprende-hoy": "Aprende Hoy",
  rrhh: "RR.HH.",
};

const BLURBS: Record<MentorAppId, string> = {
  "growth-os": "Captación y conversión del Espacio.",
  cumple: "Cumplimiento de la empresa: obligaciones, brechas y evidencia.",
  "aprende-hoy": "Vida académica: admisión, clases, evaluación y campus.",
  rrhh: "Personas empleadas, contratos y jornada.",
};

export function isMentorAppId(value: string): value is MentorAppId {
  return (MENTOR_APPS as readonly string[]).includes(value);
}

export function mentorAppLabel(appId: MentorAppId): string {
  return LABELS[appId];
}

export function mentorAppBlurb(appId: MentorAppId): string {
  return BLURBS[appId];
}

export function parseWallpaper(value: unknown): DesktopWallpaper {
  if (value === "mar" || value === "valle" || value === "noche") return value;
  return "mar";
}

export function nextWallpaper(current: DesktopWallpaper): DesktopWallpaper {
  const index = WALLPAPERS.indexOf(current);
  return WALLPAPERS[(index + 1) % WALLPAPERS.length] ?? "mar";
}

export function wallpaperSrc(id: DesktopWallpaper): string {
  return `/desktop/${id}.jpg`;
}

export function spaceSwitchLanding(pathname: string): "/escritorio" | "/admin" {
  return pathname === "/escritorio" ? "/escritorio" : "/admin";
}
```

Create `src/lib/desktop/contract.ts`:

```ts
import {
  CUMPLE_SPACE_ID,
  MENTOR_APPS,
  isMentorAppId,
  type MentorAppId,
} from "@/lib/desktop/catalog";

export function resolveContractedApps(input: {
  tenantId: string;
  contractedApps?: readonly string[] | null;
}): MentorAppId[] {
  if (Array.isArray(input.contractedApps)) {
    return MENTOR_APPS.filter((id) => input.contractedApps!.includes(id));
  }
  const defaults: MentorAppId[] = ["growth-os"];
  if (input.tenantId === CUMPLE_SPACE_ID) defaults.push("cumple");
  return defaults;
}

export function isHttpsEntry(url: string | null | undefined): url is string {
  const value = url?.trim() ?? "";
  return value.startsWith("https://");
}

export type DesktopClick =
  | { kind: "open"; href: string }
  | { kind: "request" }
  | { kind: "later" }
  | { kind: "disconnected" };

export function desktopClick(input: {
  appId: MentorAppId;
  tenantId: string;
  contracted: readonly MentorAppId[];
  aprendeHoyEntryUrl?: string | null;
  cumpleOrigin?: string | null;
}): DesktopClick {
  if (!input.contracted.includes(input.appId)) return { kind: "request" };
  if (input.appId === "growth-os") return { kind: "open", href: "/admin" };
  if (input.appId === "rrhh") return { kind: "later" };
  if (input.appId === "aprende-hoy") {
    return isHttpsEntry(input.aprendeHoyEntryUrl)
      ? { kind: "open", href: input.aprendeHoyEntryUrl.trim() }
      : { kind: "disconnected" };
  }
  if (input.tenantId === CUMPLE_SPACE_ID && isHttpsEntry(input.cumpleOrigin)) {
    return { kind: "open", href: input.cumpleOrigin.trim() };
  }
  return { kind: "disconnected" };
}

export function escritorioRedirect(input: {
  hasSpace: boolean;
  studentAffairs: boolean;
  isPlatformOperator: boolean;
  hasMembership: boolean;
}): "/admin/sin-espacio" | "/admin/portal/asuntos-estudiantiles" | "/platform" | null {
  if (!input.hasSpace) return "/admin/sin-espacio";
  if (input.studentAffairs) return "/admin/portal/asuntos-estudiantiles";
  if (input.isPlatformOperator && !input.hasMembership) return "/platform";
  return null;
}

export function parseContractPatch(input: {
  contractedApps: unknown;
  aprendeHoyEntryUrl: unknown;
}): { ok: true; contractedApps: MentorAppId[]; aprendeHoyEntryUrl: string | null } | { ok: false } {
  if (!Array.isArray(input.contractedApps)) return { ok: false };
  const ids: MentorAppId[] = [];
  for (const item of input.contractedApps) {
    if (typeof item !== "string" || !isMentorAppId(item)) return { ok: false };
    if (!ids.includes(item)) ids.push(item);
  }
  const raw = input.aprendeHoyEntryUrl;
  if (raw == null || (typeof raw === "string" && raw.trim() === "")) {
    return { ok: true, contractedApps: MENTOR_APPS.filter((id) => ids.includes(id)), aprendeHoyEntryUrl: null };
  }
  if (typeof raw !== "string" || !isHttpsEntry(raw)) return { ok: false };
  return {
    ok: true,
    contractedApps: MENTOR_APPS.filter((id) => ids.includes(id)),
    aprendeHoyEntryUrl: raw.trim(),
  };
}

export function newlyContracted(
  before: readonly MentorAppId[],
  after: readonly MentorAppId[]
): MentorAppId[] {
  return after.filter((id) => !before.includes(id));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/desktop-contract.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/desktop/catalog.ts src/lib/desktop/contract.ts tests/baseline/desktop-contract.test.ts
git commit -m "$(cat <<'EOF'
feat(desktop): reglas puras del dock y del contrato

EOF
)"
```

---

### Task 2: Solicitudes en memoria

**Files:**
- Create: `src/lib/desktop/requests.ts`
- Test: `tests/baseline/desktop-requests.test.ts`

**Interfaces:**
- Consumes: `isMentorAppId`, `MentorAppId` de `src/lib/desktop/catalog.ts`.
- Produces:
  - `AppRequest = { tenantId: string; appId: MentorAppId; requestedBy: string; createdAt: string; status: "open" | "fulfilled" }`
  - `AppRequestStore = { findOpen(tenantId: string, appId: MentorAppId): Promise<AppRequest | null>; insertOpen(row: AppRequest): Promise<void>; fulfillOpen(tenantId: string, appId: MentorAppId): Promise<void>; listOpen(tenantId: string): Promise<AppRequest[]> }`
  - `createMemoryAppRequestStore(): AppRequestStore`
  - `recordAppRequest(store: AppRequestStore, input: { tenantId: string; appId: string; requestedBy: string; contracted: readonly string[]; now?: string }): Promise<{ ok: true; already: boolean } | { ok: false; reason: "unknown" | "contracted" }>`

- [ ] **Step 1: Write the failing test**

Create `tests/baseline/desktop-requests.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryAppRequestStore, recordAppRequest } from "../../src/lib/desktop/requests";

describe("solicitudes del escritorio", () => {
  it("la segunda abierta no inserta, y contratar cierra la abierta", async () => {
    const store = createMemoryAppRequestStore();
    const first = await recordAppRequest(store, {
      tenantId: "seminario-ipn",
      appId: "cumple",
      requestedBy: "user-1",
      contracted: ["growth-os"],
      now: "2026-11-11T12:00:00.000Z",
    });
    const second = await recordAppRequest(store, {
      tenantId: "seminario-ipn",
      appId: "cumple",
      requestedBy: "user-2",
      contracted: ["growth-os"],
      now: "2026-11-11T12:05:00.000Z",
    });
    assert.deepEqual(first, { ok: true, already: false });
    assert.deepEqual(second, { ok: true, already: true });
    assert.equal((await store.listOpen("seminario-ipn")).length, 1);

    await store.fulfillOpen("seminario-ipn", "cumple");
    assert.equal((await store.listOpen("seminario-ipn")).length, 0);
  });

  it("rechaza un id desconocido y una app ya contratada", async () => {
    const store = createMemoryAppRequestStore();
    assert.deepEqual(
      await recordAppRequest(store, {
        tenantId: "seminario-ipn",
        appId: "no",
        requestedBy: "user-1",
        contracted: [],
      }),
      { ok: false, reason: "unknown" }
    );
    assert.deepEqual(
      await recordAppRequest(store, {
        tenantId: "seminario-ipn",
        appId: "growth-os",
        requestedBy: "user-1",
        contracted: ["growth-os"],
      }),
      { ok: false, reason: "contracted" }
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/desktop-requests.test.ts`

Expected: FAIL, cannot find module `../../src/lib/desktop/requests`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/desktop/requests.ts`:

```ts
import { isMentorAppId, type MentorAppId } from "@/lib/desktop/catalog";

export interface AppRequest {
  tenantId: string;
  appId: MentorAppId;
  requestedBy: string;
  createdAt: string;
  status: "open" | "fulfilled";
}

export interface AppRequestStore {
  findOpen(tenantId: string, appId: MentorAppId): Promise<AppRequest | null>;
  insertOpen(row: AppRequest): Promise<void>;
  fulfillOpen(tenantId: string, appId: MentorAppId): Promise<void>;
  listOpen(tenantId: string): Promise<AppRequest[]>;
}

export function createMemoryAppRequestStore(): AppRequestStore {
  const rows: AppRequest[] = [];
  return {
    async findOpen(tenantId, appId) {
      return rows.find((row) => row.tenantId === tenantId && row.appId === appId && row.status === "open") ?? null;
    },
    async insertOpen(row) {
      rows.push(row);
    },
    async fulfillOpen(tenantId, appId) {
      for (const row of rows) {
        if (row.tenantId === tenantId && row.appId === appId && row.status === "open") {
          row.status = "fulfilled";
        }
      }
    },
    async listOpen(tenantId) {
      return rows.filter((row) => row.tenantId === tenantId && row.status === "open");
    },
  };
}

export async function recordAppRequest(
  store: AppRequestStore,
  input: {
    tenantId: string;
    appId: string;
    requestedBy: string;
    contracted: readonly string[];
    now?: string;
  }
): Promise<{ ok: true; already: boolean } | { ok: false; reason: "unknown" | "contracted" }> {
  if (!isMentorAppId(input.appId)) return { ok: false, reason: "unknown" };
  if (input.contracted.includes(input.appId)) return { ok: false, reason: "contracted" };
  const existing = await store.findOpen(input.tenantId, input.appId);
  if (existing) return { ok: true, already: true };
  await store.insertOpen({
    tenantId: input.tenantId,
    appId: input.appId,
    requestedBy: input.requestedBy,
    createdAt: input.now ?? new Date().toISOString(),
    status: "open",
  });
  return { ok: true, already: false };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/desktop-requests.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/desktop/requests.ts tests/baseline/desktop-requests.test.ts
git commit -m "$(cat <<'EOF'
feat(desktop): una solicitud abierta por Espacio y app

EOF
)"
```

---

### Task 3: La puerta de entrada cae en la mesa

**Files:**
- Modify: `src/core/identity/platform/landing.ts`
- Modify: `src/lib/identity/threshold-line.ts`
- Modify: `tests/baseline/auth-entry-fix-002.test.ts`
- Modify: `tests/baseline/platform-operator.test.ts`
- Modify: `tests/baseline/growth-threshold-line.test.ts`
- Test: those three files

**Interfaces:**
- Consumes: nada de desktop. Cambia el string de destino.
- Produces: `resolvePostAuthDestination` devuelve `/escritorio` como casa del miembro. `crossingThresholdLine` para path `/escritorio` devuelve `{ line: "Entras a tu escritorio.", announceArrival: false }`.

- [ ] **Step 1: Write the failing test**

In `tests/baseline/auth-entry-fix-002.test.ts`, change the expected default home from `"/admin"` to `"/escritorio"` in the cases C, D, E and in «no se obtiene /platform» cuando `hasSpace: true`. Dejar `"/admin/personas"` y `"/admin/sin-espacio"` como están. Renombrar el título de C a `usuario normal + solo SEM → /escritorio`.

In `tests/baseline/platform-operator.test.ts`, the assertion with `hasSpace: true`, `isPlatformOperator: false`, `next: "/platform"` expects `"/escritorio"` instead of `"/admin"`.

In `tests/baseline/growth-threshold-line.test.ts`, inside `describe("frase de cruce")` (the `row` at the top of that describe is in scope), add:

```ts
  it("el escritorio no lee el panel", () => {
    assert.deepEqual(
      crossingThresholdLine({
        redirectTo: "/escritorio?from=login",
        hasTenant: true,
        studentAffairs: false,
        canSales: true,
        attentionRows: [row],
      }),
      { line: "Entras a tu escritorio.", announceArrival: false }
    );
    assert.equal(crossingNeedsPanel("/escritorio", { hasTenant: true, studentAffairs: false, canSales: true }), false);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/auth-entry-fix-002.test.ts tests/baseline/platform-operator.test.ts tests/baseline/growth-threshold-line.test.ts`

Expected: FAIL. The landing tests still get `"/admin"`. The threshold test does not say «Entras a tu escritorio.»

- [ ] **Step 3: Write minimal implementation**

In `src/core/identity/platform/landing.ts`, keep `SPACE_HOME` as `"/admin"` so a deep path under admin is unchanged. Add `const DESKTOP_HOME = "/escritorio"`. Change `isDefaultSpaceLanding` so these paths are default: `"/admin"`, `DESKTOP_HOME`, `"/admin/config"`, `NO_SPACE_PATH`. Where the function returns `SPACE_HOME` for a member who is not an operator (`next` de plataforma, y el `return` final), return `DESKTOP_HOME`. Do not change the operator branch or the no-space branch.

In `src/lib/identity/threshold-line.ts`, add `const ENTER_DESKTOP = "Entras a tu escritorio."`. Inside `crossingThresholdLine`, after the `/admin/sin-espacio` branch and before the student-affairs branch:

```ts
  if (path === "/escritorio") {
    return { line: ENTER_DESKTOP, announceArrival: false };
  }
```

`crossingNeedsPanel` already requires path `=== "/admin"`. Leave it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/auth-entry-fix-002.test.ts tests/baseline/platform-operator.test.ts tests/baseline/growth-threshold-line.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/identity/platform/landing.ts src/lib/identity/threshold-line.ts tests/baseline/auth-entry-fix-002.test.ts tests/baseline/platform-operator.test.ts tests/baseline/growth-threshold-line.test.ts
git commit -m "$(cat <<'EOF'
feat(desktop): el miembro entra al escritorio

EOF
)"
```

---

### Task 4: El proxy deja pasar y protege `/escritorio`

**Files:**
- Modify: `src/proxy.ts`
- Modify: `tests/baseline/proxy-admin-gate.test.ts`
- Test: `tests/baseline/proxy-admin-gate.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `/escritorio` está en `isPlatformProductPath` y en `isProtected`.

- [ ] **Step 1: Write the failing test**

Add to the first describe in `tests/baseline/proxy-admin-gate.test.ts`:

```ts
  it("redirige /escritorio a /login cuando no hay cookie", () => {
    const res = proxy(makeRequest("/escritorio"));
    assert.equal(res.status, 307);
    assert.equal(new URL(res.headers.get("location")!).pathname, "/login");
    assert.equal(new URL(res.headers.get("location")!).searchParams.get("next"), "/escritorio");
  });

  it("permite /escritorio con cookie de sesión", () => {
    const res = proxy(makeRequest("/escritorio", `${SESSION_COOKIE}=sess-test`));
    assert.equal(res.status, 200);
  });
```

Add inside `withPlatformEnv` of «el origen de plataforma sirve la portada», after the `/programas` assertion:

```ts
      const desk = proxy(makeRequest("/escritorio", `${SESSION_COOKIE}=sess-test`, platformOrigin));
      assert.equal(desk.status, 200);
```

`SESSION_COOKIE` is already imported in that file.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/proxy-admin-gate.test.ts`

Expected: FAIL. `/escritorio` on localhost is 200 without cookie, because it is not protected. On the platform host it redirects to `/`.

- [ ] **Step 3: Write minimal implementation**

In `src/proxy.ts`, add `pathname === "/escritorio"` to `isPlatformProductPath` and `pathname === "/escritorio"` to the `isProtected` expression, beside `/admin`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/proxy-admin-gate.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/proxy.ts tests/baseline/proxy-admin-gate.test.ts
git commit -m "$(cat <<'EOF'
feat(desktop): el proxy protege el escritorio

EOF
)"
```

---

### Task 5: Persistencia y rutas

**Files:**
- Create: `src/lib/desktop/store.ts`
- Create: `src/app/api/desktop/requests/route.ts`
- Create: `src/app/api/desktop/wallpaper/route.ts`
- Create: `src/app/api/platform/spaces/[tenantId]/apps/route.ts`
- Modify: `src/core/tenant/types.ts`
- Modify: `src/types/identity.ts`
- Modify: `src/lib/platform/spaces.ts`
- Test: `tests/baseline/desktop-contract.test.ts` already covers the pure patch. This task adds a source assertion file `tests/baseline/desktop-routes.test.ts`.

**Interfaces:**
- Consumes: `resolveContractedApps`, `parseContractPatch`, `newlyContracted`, `recordAppRequest`, `AppRequestStore`, `parseWallpaper`, `isMentorAppId`.
- Produces:
  - `mongoAppRequestStore(): AppRequestStore`
  - `readSpaceContract(tenantId: string): Promise<{ contracted: MentorAppId[]; aprendeHoyEntryUrl: string | null }>`
  - `writeSpaceContract(tenantId: string, patch: { contractedApps: MentorAppId[]; aprendeHoyEntryUrl: string | null }): Promise<void>`
  - `setDesktopWallpaper(userId: string, wallpaper: DesktopWallpaper): Promise<void>`
  - `PlatformSpaceDetail.contractedApps`, `.aprendeHoyEntryUrl`, `.openAppRequests: { appId: MentorAppId; requestedBy: string; createdAt: string }[]`

- [ ] **Step 1: Write the failing test**

Create `tests/baseline/desktop-routes.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

describe("rutas del escritorio", () => {
  it("la solicitud usa el contrato del Espacio y no inserta si ya está contratada", () => {
    const src = read("src/app/api/desktop/requests/route.ts");
    assert.match(src, /recordAppRequest/);
    assert.match(src, /readSpaceContract/);
    assert.match(src, /requireAuth/);
  });

  it("el fondo solo acepta el parser", () => {
    const src = read("src/app/api/desktop/wallpaper/route.ts");
    assert.match(src, /parseWallpaper/);
    assert.match(src, /setDesktopWallpaper/);
  });

  it("el operador escribe el contrato y cierra las solicitudes nuevas", () => {
    const src = read("src/app/api/platform/spaces/[tenantId]/apps/route.ts");
    assert.match(src, /requirePlatformOperator/);
    assert.match(src, /parseContractPatch/);
    assert.match(src, /newlyContracted/);
    assert.match(src, /fulfillOpen/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/desktop-routes.test.ts`

Expected: FAIL, the route files do not exist.

- [ ] **Step 3: Write minimal implementation**

On `TenantDocument` in `src/core/tenant/types.ts`, add optional fields:

```ts
  contractedApps?: Array<"growth-os" | "cumple" | "aprende-hoy" | "rrhh">;
  aprendeHoyEntryUrl?: string | null;
```

On `IdentityUser` in `src/types/identity.ts`, add:

```ts
  desktopWallpaper?: "mar" | "valle" | "noche";
```

Create `src/lib/desktop/store.ts`:

```ts
import "server-only";

import { findTenantById } from "@/core/tenant";
import { TENANTS_COLLECTION } from "@/core/tenant/constants";
import type { MentorAppId, DesktopWallpaper } from "@/lib/desktop/catalog";
import { resolveContractedApps } from "@/lib/desktop/contract";
import type { AppRequest, AppRequestStore } from "@/lib/desktop/requests";
import { getDatabase } from "@/lib/mongodb";

const REQUESTS = "space_app_requests";

export function mongoAppRequestStore(): AppRequestStore {
  return {
    async findOpen(tenantId, appId) {
      const db = await getDatabase();
      return db.collection<AppRequest>(REQUESTS).findOne({ tenantId, appId, status: "open" });
    },
    async insertOpen(row) {
      const db = await getDatabase();
      await db.collection(REQUESTS).createIndex(
        { tenantId: 1, appId: 1 },
        { unique: true, partialFilterExpression: { status: "open" }, name: "one_open_request" }
      );
      await db.collection<AppRequest>(REQUESTS).insertOne(row);
    },
    async fulfillOpen(tenantId, appId) {
      const db = await getDatabase();
      await db.collection<AppRequest>(REQUESTS).updateMany(
        { tenantId, appId, status: "open" },
        { $set: { status: "fulfilled" } }
      );
    },
    async listOpen(tenantId) {
      const db = await getDatabase();
      return db.collection<AppRequest>(REQUESTS).find({ tenantId, status: "open" }).toArray();
    },
  };
}

export async function readSpaceContract(tenantId: string): Promise<{
  contracted: MentorAppId[];
  aprendeHoyEntryUrl: string | null;
}> {
  const db = await getDatabase();
  const tenant = await findTenantById(db, tenantId);
  return {
    contracted: resolveContractedApps({
      tenantId,
      contractedApps: tenant?.contractedApps,
    }),
    aprendeHoyEntryUrl: tenant?.aprendeHoyEntryUrl ?? null,
  };
}

export async function writeSpaceContract(
  tenantId: string,
  patch: { contractedApps: MentorAppId[]; aprendeHoyEntryUrl: string | null }
): Promise<void> {
  const db = await getDatabase();
  await db.collection(TENANTS_COLLECTION).updateOne(
    { $or: [{ _id: tenantId }, { tenantId }] },
    {
      $set: {
        contractedApps: patch.contractedApps,
        aprendeHoyEntryUrl: patch.aprendeHoyEntryUrl,
        updatedAt: new Date().toISOString(),
      },
    }
  );
}

export async function setDesktopWallpaper(userId: string, wallpaper: DesktopWallpaper): Promise<void> {
  const db = await getDatabase();
  await db.collection("identity_users").updateOne(
    { _id: userId },
    { $set: { desktopWallpaper: wallpaper, updatedAt: new Date().toISOString() } }
  );
}
```

`findTenantById` takes `(db, tenantId)`. Confirm the signature in `src/core/tenant/repositories.ts` before calling it. `AppRequest` documents need an `_id` if the collection type requires it. Insert a string `_id` of `` `${tenantId}:${appId}:${createdAt}` `` on the row inside `recordAppRequest` only if `insertOne` complains. Prefer leaving `_id` to Mongo. If `AppRequest` is inserted without `_id`, Mongo assigns one. Do not add `_id` to the interface.

Create `src/app/api/desktop/requests/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { recordAppRequest } from "@/lib/desktop/requests";
import { mongoAppRequestStore, readSpaceContract } from "@/lib/desktop/store";

export async function POST(request: Request) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  const tenantId = ctx.tenantId?.trim() ?? "";
  if (!tenantId || !ctx.membership) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as { appId?: unknown } | null;
  const appId = typeof body?.appId === "string" ? body.appId : "";
  const contract = await readSpaceContract(tenantId);
  const result = await recordAppRequest(mongoAppRequestStore(), {
    tenantId,
    appId,
    requestedBy: ctx.user._id,
    contracted: contract.contracted,
  });
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
```

`requireAuth` resolves to `AuthContext`. The user id is `ctx.user._id`. `ctx.tenantId` and `ctx.membership` are the Espacio activo.

Create `src/app/api/desktop/wallpaper/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { parseWallpaper } from "@/lib/desktop/catalog";
import { setDesktopWallpaper } from "@/lib/desktop/store";

export async function POST(request: Request) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  const body = (await request.json().catch(() => null)) as { wallpaper?: unknown } | null;
  const wallpaper = parseWallpaper(body?.wallpaper);
  if (body?.wallpaper !== wallpaper) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await setDesktopWallpaper(ctx.user._id, wallpaper);
  return NextResponse.json({ ok: true, wallpaper });
}
```

`parseWallpaper("otro")` returns `"mar"`, so a bad value must be rejected by comparing the raw string to the parsed one. `"mar"` equals the parse. `undefined` parses to `"mar"` but is not the string `"mar"`, so it is rejected. Good.

Create `src/app/api/platform/spaces/[tenantId]/apps/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requirePlatformOperator } from "@/core/identity/middleware/guards";
import { newlyContracted, parseContractPatch, resolveContractedApps } from "@/lib/desktop/contract";
import { mongoAppRequestStore, readSpaceContract, writeSpaceContract } from "@/lib/desktop/store";

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const ctx = await requirePlatformOperator();
  if (ctx instanceof NextResponse) return ctx;
  const { tenantId } = await params;
  const decoded = decodeURIComponent(tenantId);
  const body = (await request.json().catch(() => null)) as {
    contractedApps?: unknown;
    aprendeHoyEntryUrl?: unknown;
  } | null;
  const patch = parseContractPatch({
    contractedApps: body?.contractedApps,
    aprendeHoyEntryUrl: body?.aprendeHoyEntryUrl,
  });
  if (!patch.ok) return NextResponse.json({ ok: false }, { status: 400 });
  const before = await readSpaceContract(decoded);
  await writeSpaceContract(decoded, patch);
  const store = mongoAppRequestStore();
  for (const appId of newlyContracted(before.contracted, patch.contractedApps)) {
    await store.fulfillOpen(decoded, appId);
  }
  return NextResponse.json({ ok: true, contractedApps: resolveContractedApps({ tenantId: decoded, contractedApps: patch.contractedApps }) });
}
```

In `getPlatformSpaceDetail` (`src/lib/platform/spaces.ts`), extend the returned object with:

```ts
    contractedApps: resolveContractedApps({
      tenantId: tenant.tenantId,
      contractedApps: tenant.contractedApps,
    }),
    aprendeHoyEntryUrl: tenant.aprendeHoyEntryUrl ?? null,
    openAppRequests: [],
```

Then replace the empty array with a read. Import `mongoAppRequestStore` and `resolveContractedApps`. After `const tenant = ...` is in scope (it already is inside the function), before the `return`:

```ts
  const openAppRequests = (await mongoAppRequestStore().listOpen(tenant.tenantId)).map((row) => ({
    appId: row.appId,
    requestedBy: row.requestedBy,
    createdAt: row.createdAt,
  }));
```

Add the three fields to `PlatformSpaceDetail`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/desktop-routes.test.ts tests/baseline/desktop-contract.test.ts`

Expected: PASS. `server-only` in `store.ts` must not be imported by the pure tests. The route test only reads source.

- [ ] **Step 5: Commit**

```bash
git add src/lib/desktop/store.ts src/app/api/desktop/requests/route.ts src/app/api/desktop/wallpaper/route.ts "src/app/api/platform/spaces/[tenantId]/apps/route.ts" src/core/tenant/types.ts src/types/identity.ts src/lib/platform/spaces.ts tests/baseline/desktop-routes.test.ts
git commit -m "$(cat <<'EOF'
feat(desktop): guardar contrato, fondo y solicitudes

EOF
)"
```

---

### Task 6: La mesa

**Files:**
- Create: `public/desktop/mar.jpg`
- Create: `public/desktop/valle.jpg`
- Create: `public/desktop/noche.jpg`
- Create: `src/components/desktop/mentor-desktop.css`
- Create: `src/components/desktop/MentorDesktop.tsx`
- Create: `src/app/escritorio/page.tsx`
- Modify: `src/components/admin/AdminUserMenuPanel.tsx`
- Test: `tests/baseline/desktop-contract.test.ts` (the switch landing is already tested). Add a source test at the bottom of `tests/baseline/desktop-routes.test.ts`.

**Interfaces:**
- Consumes: `desktopClick`, `escritorioRedirect`, `MENTOR_APPS`, `mentorAppLabel`, `mentorAppBlurb`, `nextWallpaper`, `parseWallpaper`, `wallpaperSrc`, `spaceSwitchLanding`, `readSpaceContract`, `listOpen` via the page.
- Produces: the route `/escritorio` and the client `MentorDesktop`.

- [ ] **Step 1: Write the failing test**

Append to `tests/baseline/desktop-routes.test.ts`:

```ts
  it("la página redirige con escritorioRedirect y pinta MentorDesktop", () => {
    const src = read("src/app/escritorio/page.tsx");
    assert.match(src, /escritorioRedirect/);
    assert.match(src, /MentorDesktop/);
    assert.match(src, /readSpaceContract/);
    const menu = read("src/components/admin/AdminUserMenuPanel.tsx");
    assert.match(menu, /spaceSwitchLanding/);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/desktop-routes.test.ts`

Expected: FAIL, `src/app/escritorio/page.tsx` is missing.

- [ ] **Step 3: Write minimal implementation**

Download the three scenes. From the repo root:

```bash
mkdir -p public/desktop
curl.exe -L --fail -o public/desktop/mar.jpg "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2400&q=80"
curl.exe -L --fail -o public/desktop/valle.jpg "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2400&q=80"
curl.exe -L --fail -o public/desktop/noche.jpg "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2400&q=80"
```

Each file must be larger than 10 KB. `mar` is the coast, `valle` the sun through the mountains, `noche` the night ridge. Those are the three scenes of the approved mock.

Create `src/components/desktop/mentor-desktop.css`:

```css
.desk { position: relative; min-height: 100vh; color: #fff; background: linear-gradient(180deg, rgba(12,18,32,.18), rgba(8,16,28,.28)), var(--wall) center/cover no-repeat, #102033; }
.bar { position: absolute; top: 16px; left: 12px; right: 12px; height: 36px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border-radius: 12px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.22); backdrop-filter: blur(22px) saturate(1.4); }
.brand, .meta { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.mark { width: 18px; height: 18px; border-radius: 6px; background: conic-gradient(from 210deg, #7dd3fc, #2563eb, #1e3a8a, #7dd3fc); }
.fondo { border: 0; background: rgba(255,255,255,.16); color: #fff; border-radius: 999px; padding: 4px 10px; font: inherit; font-size: 12px; cursor: pointer; }
.who { display: flex; align-items: center; gap: 8px; }
.avatar { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: #0f172a; font-size: 11px; }
.dock-wrap { position: absolute; left: 0; right: 0; bottom: 22px; display: flex; justify-content: center; }
.dock { display: flex; gap: 6px; padding: 10px 12px 8px; border-radius: 26px; background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.32); backdrop-filter: blur(28px) saturate(1.5); }
.app { width: 78px; border: 0; background: transparent; color: #fff; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px; font: inherit; }
.glyph { position: relative; width: 58px; height: 58px; border-radius: 16px; display: grid; place-items: center; }
.glyph svg { width: 30px; height: 30px; }
.app small { font-size: 11px; }
.lock { position: absolute; right: -4px; bottom: -4px; width: 20px; height: 20px; border-radius: 50%; background: rgba(15,18,24,.88); display: grid; place-items: center; }
.lock svg { width: 11px; height: 11px; }
.g-growth { background: linear-gradient(160deg, #38bdf8, #1d4ed8 55%, #0f172a); }
.g-cumple { background: linear-gradient(160deg, #6ee7b7, #047857 60%, #022c22); }
.g-aprende { background: linear-gradient(160deg, #e9d5ff, #7c3aed 45%, #1e1b4b); }
.g-rrhh { background: linear-gradient(160deg, #fde68a, #d97706 55%, #7c2d12); }
.sheet-back { position: absolute; inset: 0; display: none; place-items: center; background: rgba(8,12,20,.38); }
.sheet-back.show { display: grid; }
.sheet { width: min(420px, calc(100% - 32px)); background: #f7f5f1; color: #1c1917; border-radius: 22px; padding: 26px; }
.sheet .kicker { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #78716c; }
.sheet h2 { font-size: 28px; margin: 6px 0 8px; }
.sheet .row { display: flex; gap: 8px; margin-top: 20px; }
.sheet button { border: 0; border-radius: 999px; padding: 10px 16px; font: inherit; cursor: pointer; }
.sheet .primary { background: #1c1917; color: #fff; }
.sheet .primary:disabled { background: #d6d3d1; color: #57534e; }
.sheet .ghost { background: transparent; color: #44403c; }
.sent { margin-top: 12px; font-size: 13px; color: #047857; }
.space-list { position: absolute; top: 58px; right: 16px; background: #fff; color: #1c1917; border-radius: 12px; padding: 8px; display: grid; gap: 4px; }
.space-list button { border: 0; background: transparent; text-align: left; font: inherit; cursor: pointer; padding: 6px 8px; }
```

Create `src/components/desktop/MentorDesktop.tsx` as a client component. Props:

```ts
export interface MentorDesktopProps {
  spaceName: string;
  spaces: { tenantId: string; name: string }[];
  activeTenantId: string;
  user: { displayName: string; email: string };
  contracted: MentorAppId[];
  aprendeHoyEntryUrl: string | null;
  cumpleOrigin: string | null;
  wallpaper: DesktopWallpaper;
  requested: MentorAppId[];
}
```

Behavior:

- Clock: `toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })`, updated every 15 seconds.
- Fondo calls `nextWallpaper`, sets `--wall` to `url("${wallpaperSrc(id)}")`, then `POST /api/desktop/wallpaper` with `{ wallpaper }`. If the response is not ok, leave the scene until reload; the server still has the previous value. On image `error`, set the desk background to `DESKTOP_FALLBACK` and drop the image.
- Each dock button calls `desktopClick`. `open` assigns `window.location`. `request` opens the sheet with kicker «No está en el plan», the blurb, «Solicitar acceso» and «Cerrar». If `requested` includes the app, the button starts as «Solicitud enviada» and the line «Queda registrada para este Espacio.» is visible. Solicitar `POST /api/desktop/requests` with `{ appId }`. On `{ ok: true }`, switch the button. On failure, leave the button enabled. `later` uses kicker «Llega después» and only «Cerrar». `disconnected` uses kicker «Entrada no conectada» and only «Cerrar».
- If `spaces.length > 1`, the space name is a button that lists the other spaces and `POST /api/identity/spaces/switch` with `{ tenantId }`, then `window.location.assign("/escritorio")`. One space shows the name as text.
- The person pill links to `/admin/settings/profile` (the same «Mi perfil» of `AdminUserMenuPanel`). Beside it, a button `POST /api/identity/logout` and then `window.location.assign("/login")`.
- Glyphs use these SVGs, stroke `#fff`, in catalog order. The lock badge is a 11px lock, only when `desktopClick` is `request`.

```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M4 16l5-5 3 3 8-8"/><path d="M14 6h6v6"/></svg>
<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M8.5 12l2.2 2.2 4.8-5"/></svg>
<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/></svg>
<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><circle cx="9" cy="9" r="3"/><circle cx="16" cy="10" r="2.4"/><path d="M4 19c.6-2.6 2.6-4 5-4s4.4 1.4 5 4"/><path d="M14 15.2c1.2-.5 2.5-.6 3.6-.2 1.2.8 1.8 2 2 3.8"/></svg>
```

Create `src/app/escritorio/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { MentorDesktop } from "@/components/desktop/MentorDesktop";
import { hasPlatformOperatorCapability } from "@/core/identity/platform/capability";
import { usesStudentAffairsFocusedShell } from "@/lib/admin/nav-access";
import { escritorioRedirect } from "@/lib/desktop/contract";
import { parseWallpaper } from "@/lib/desktop/catalog";
import { mongoAppRequestStore, readSpaceContract } from "@/lib/desktop/store";
import { listAvailableSpacesForUser } from "@/lib/identity/active-space";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import { loadSessionContext } from "@/lib/identity/sessions";
import { resolvePublicOriginForTenant } from "@/lib/portal/public-origin";
import { CUMPLE_SPACE_ID } from "@/lib/desktop/catalog";

export const dynamic = "force-dynamic";

export default async function EscritorioPage() {
  const session = await loadSessionContext();
  if (!session) redirect("/login?next=/escritorio");

  const tenantId = session.session.tenantId?.trim() ?? "";
  const hasMembership = Boolean(session.membership);
  const hasSpace = Boolean(hasMembership && tenantId);
  let studentAffairs = false;
  if (session.membership && tenantId) {
    const roles = await findRolesByIds(tenantId, session.membership.roleIds);
    const roleCodes = roles.map((role) => getRoleCode(role)).filter(Boolean) as string[];
    const { resolvePermissionsForMembership } = await import("@/lib/identity/permission-resolver");
    const permissions = await resolvePermissionsForMembership(tenantId, session.membership);
    studentAffairs = usesStudentAffairsFocusedShell(permissions, false, roleCodes);
  }
  const destination = escritorioRedirect({
    hasSpace,
    studentAffairs,
    isPlatformOperator: hasPlatformOperatorCapability(session.user),
    hasMembership,
  });
  if (destination) redirect(destination);

  const [spaces, contract, openRequests] = await Promise.all([
    listAvailableSpacesForUser(session.user._id),
    readSpaceContract(tenantId),
    mongoAppRequestStore().listOpen(tenantId),
  ]);
  const active = spaces.find((space) => space.tenantId === tenantId);
  const cumpleOrigin =
    tenantId === CUMPLE_SPACE_ID
      ? await resolvePublicOriginForTenant(tenantId).catch(() => null)
      : null;

  return (
    <MentorDesktop
      spaceName={active?.name?.trim() || "Espacio"}
      spaces={spaces.map((space) => ({ tenantId: space.tenantId, name: space.name }))}
      activeTenantId={tenantId}
      user={{ displayName: session.user.displayName, email: session.user.email }}
      contracted={contract.contracted}
      aprendeHoyEntryUrl={contract.aprendeHoyEntryUrl}
      cumpleOrigin={cumpleOrigin}
      wallpaper={parseWallpaper(session.user.desktopWallpaper)}
      requested={openRequests.map((row) => row.appId)}
    />
  );
}
```

In `AdminUserMenuPanel.switchSpace`, replace `window.location.assign("/admin")` with `window.location.assign(spaceSwitchLanding(window.location.pathname))`. Import `spaceSwitchLanding` from `@/lib/desktop/catalog`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/desktop-routes.test.ts tests/baseline/desktop-contract.test.ts`

Expected: PASS.

Open `http://localhost:3000/escritorio` while `npm run dev` is running, signed in as a member of a space that has no `contractedApps` field. Growth OS opens `/admin`. The other three show the lock sheet. Fondo cycles three photos. A failed image paints `#102033`.

- [ ] **Step 5: Commit**

```bash
git add public/desktop src/components/desktop src/app/escritorio/page.tsx src/components/admin/AdminUserMenuPanel.tsx tests/baseline/desktop-routes.test.ts
git commit -m "$(cat <<'EOF'
feat(desktop): mesa de Mentor Prime al entrar

EOF
)"
```

---

### Task 7: Volver a la mesa

**Files:**
- Modify: `src/components/admin/kit/navigation/AdminTopBar.tsx`
- Create: `src/components/desktop/EscritorioReturn.tsx`
- Modify: `src/components/sites/cumple/CumpleShell.tsx`
- Modify: `tests/baseline/desktop-routes.test.ts`

**Interfaces:**
- Consumes: the route `/escritorio`.
- Produces: a control labeled `Escritorio` in the Growth OS top bar and, only with sesión, on Cumple.

- [ ] **Step 1: Write the failing test**

Append:

```ts
  it("Growth OS y Cumple ofrecen volver al escritorio", () => {
    const top = read("src/components/admin/kit/navigation/AdminTopBar.tsx");
    assert.match(top, /href="\/escritorio"/);
    assert.match(top, /Escritorio/);
    const shell = read("src/components/sites/cumple/CumpleShell.tsx");
    assert.match(shell, /EscritorioReturn/);
    const back = read("src/components/desktop/EscritorioReturn.tsx");
    assert.match(back, /\/api\/identity\/me/);
    assert.match(back, /href="\/escritorio"/);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/desktop-routes.test.ts`

Expected: FAIL. The top bar has no `/escritorio` link.

- [ ] **Step 3: Write minimal implementation**

In `AdminTopBar`, import `Link` from `next/link`. Before the search form, add:

```tsx
        <Link
          href="/escritorio"
          className="hidden shrink-0 text-[13px] font-medium text-[var(--gray-700)] hover:text-[var(--gray-900)] sm:inline"
        >
          Escritorio
        </Link>
```

Create `src/components/desktop/EscritorioReturn.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function EscritorioReturn() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let gone = false;
    fetch("/api/identity/me")
      .then((res) => {
        if (!gone && res.ok) setShow(true);
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, []);

  if (!show) return null;
  return (
    <Link
      href="/escritorio"
      className="fixed left-3 top-3 z-40 rounded-full bg-white/90 px-3 py-1 text-[13px] font-medium text-stone-900 shadow"
    >
      Escritorio
    </Link>
  );
}
```

Render `<EscritorioReturn />` as the first child inside the root div of `CumpleShell`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/desktop-routes.test.ts`

Expected: PASS.

With a session, open `/admin` and confirm «Escritorio» returns to the desk. Open the Cumple site without a session and confirm the control is absent. With a session on that site, the control is present.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/kit/navigation/AdminTopBar.tsx src/components/desktop/EscritorioReturn.tsx src/components/sites/cumple/CumpleShell.tsx tests/baseline/desktop-routes.test.ts
git commit -m "$(cat <<'EOF'
feat(desktop): volver a la mesa desde Growth OS y Cumple

EOF
)"
```

---

### Task 8: El operador activa el contrato

**Files:**
- Create: `src/components/platform/SpaceAppsPanel.tsx`
- Modify: `src/components/platform/PlatformSpaceDetailView.tsx`
- Modify: `tests/baseline/desktop-routes.test.ts`

**Interfaces:**
- Consumes: `PlatformSpaceDetail.contractedApps`, `aprendeHoyEntryUrl`, `openAppRequests`, `MENTOR_APPS`, `mentorAppLabel`, `POST /api/platform/spaces/[tenantId]/apps`.
- Produces: a section «Aplicaciones» on the space detail page.

- [ ] **Step 1: Write the failing test**

Append:

```ts
  it("la ficha del Espacio muestra las aplicaciones y guarda el contrato", () => {
    const view = read("src/components/platform/PlatformSpaceDetailView.tsx");
    assert.match(view, /SpaceAppsPanel/);
    const panel = read("src/components/platform/SpaceAppsPanel.tsx");
    assert.match(panel, /\/api\/platform\/spaces\//);
    assert.match(panel, /contractedApps/);
    assert.match(panel, /Solicitud abierta/);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/desktop-routes.test.ts`

Expected: FAIL, `SpaceAppsPanel` is missing.

- [ ] **Step 3: Write minimal implementation**

Create a client `SpaceAppsPanel` with props `tenantId`, `contractedApps`, `aprendeHoyEntryUrl`, `openAppRequests`. Render four rows, catalog order. Each row has a checkbox bound to local state, the label, and, if that app has an open request, the text «Solicitud abierta». Aprende Hoy has a text input for the URL. A button «Guardar» `POST`s JSON `{ contractedApps, aprendeHoyEntryUrl }` to `/api/platform/spaces/${encodeURIComponent(tenantId)}/apps`. On `{ ok: true }`, `router.refresh()`. On failure, show «No se guardó.» and keep the form.

Render `<SpaceAppsPanel ... />` inside `PlatformSpaceDetailView`, after the header, passing `space.tenantId` and the three new fields.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/desktop-routes.test.ts tests/baseline/desktop-contract.test.ts tests/baseline/desktop-requests.test.ts tests/baseline/auth-entry-fix-002.test.ts tests/baseline/platform-operator.test.ts tests/baseline/growth-threshold-line.test.ts tests/baseline/proxy-admin-gate.test.ts`

Expected: PASS.

As a platform operator, open `/platform/spaces/<tenantId>`, mark Cumple, save, and reload `/escritorio` as a member of that space. Cumple no longer shows the request sheet. If the space is not `cumple`, the sheet says «Entrada no conectada».

- [ ] **Step 5: Commit**

```bash
git add src/components/platform/SpaceAppsPanel.tsx src/components/platform/PlatformSpaceDetailView.tsx tests/baseline/desktop-routes.test.ts
git commit -m "$(cat <<'EOF'
feat(desktop): el operador activa las aplicaciones del Espacio

EOF
)"
```
