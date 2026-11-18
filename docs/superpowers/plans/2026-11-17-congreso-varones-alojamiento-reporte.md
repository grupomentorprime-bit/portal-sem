# Congreso Varones — Reporte imprimible de alojamientos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir en Reportes una vista imprimible corporativa de alojamientos agrupada por hogar (N° automático, jefe, huéspedes con noche(s)), usando `window.print()`.

**Architecture:** Función pura `buildLodgingHomesReport` en core agrupa assignments activas + registrations + homes. UI en `ReportsView` / `LodgingPrintReport` con CSS `@media print`. Sin API nueva ni PDF server-side.

**Tech Stack:** TypeScript, Next.js App Router, React, `npx tsx --test`, admin kit existente (`Section`, `Button`, `EmptyState`).

**Spec:** `docs/superpowers/specs/2026-11-17-congreso-varones-alojamiento-reporte-design.md`

## Global Constraints

- Vista imprimible + `window.print()` únicamente (sin librería PDF / endpoint PDF).
- Número de hogar solo en el reporte (1…N por nombre); no persistir en BD.
- Jefe de hogar = `home.contactName`; vacío → `"Sin registrar"`.
- Incluir solo assignments con `status` ∈ {`assigned`, `confirmed`} (o `confirmed: true`); excluir `cancelled`.
- Una fila por persona por hogar; noches unidas (`2026-11-20` / `2026-11-21` / ambos).
- Hogares sin huéspedes activos: omitir.
- Sin RUT, email ni finanzas en el documento.
- Reutilizar `homes` / `assignments` / `registrations` del panel; sin API nueva.
- Conservar CSV de inscritos.
- Sin cambios al formulario público ni al flujo de asignación.
- **Sin commit/PR/despliegue** salvo que el usuario lo pida explícitamente (omitir pasos `git commit` / `git push`).

---

## File map

| Path | Responsibility |
|------|----------------|
| `src/core/congress/lodging-homes-report.ts` | `buildLodgingHomesReport` + tipos DTO + labels de noche |
| `tests/baseline/congress-lodging-homes-report.test.ts` | Tests del armado del reporte |
| `src/components/admin/congress/reports/ReportsView.tsx` | CSV + CTA + toggle vista imprimible |
| `src/components/admin/congress/reports/LodgingPrintReport.tsx` | Documento corporativo + print CSS + Imprimir |
| `src/components/admin/congress/CongressOpsPanel.tsx` | Cablear `ReportsView` en tab `reportes` |

---

### Task 1: Dominio — `buildLodgingHomesReport`

**Files:**
- Create: `src/core/congress/lodging-homes-report.ts`
- Create: `tests/baseline/congress-lodging-homes-report.test.ts`

**Interfaces:**
- Consumes: `CongressLodgingHome`, `CongressLodgingAssignment`, `CongressRegistration`, `CONGRESS_NIGHTS` (`"2026-11-20"` \| `"2026-11-21"`)
- Produces:
  - `LodgingHomesReportGuest` / `LodgingHomesReportHome` / `LodgingHomesReport`
  - `isActiveLodgingAssignment(a): boolean`
  - `labelLodgingNights(nights: CongressNight[]): string`
  - `formatZoneLabelForReport(zoneId: string): string` (misma regla que UI: `zona-2` → `Zona 02`) **o** importar lógica inline duplicada mínima en core para no acoplar a components
  - `buildLodgingHomesReport({ homes, assignments, registrations, generatedAtIso }): LodgingHomesReport`

Preferir **no** importar desde `components/`; duplicar la lógica corta de zona en el módulo core (o extraer a `src/core/congress/zone-label.ts` solo si ya existe algo similar — si no, inline en este archivo).

- [ ] **Step 1: Write the failing test**

Create `tests/baseline/congress-lodging-homes-report.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLodgingHomesReport,
  labelLodgingNights,
} from "../../src/core/congress/lodging-homes-report";
import type {
  CongressLodgingAssignment,
  CongressLodgingHome,
  CongressRegistration,
} from "../../src/core/congress/types";

function home(partial: Partial<CongressLodgingHome> & Pick<CongressLodgingHome, "_id" | "name">): CongressLodgingHome {
  return {
    tenantId: "t",
    eventId: "e",
    contactName: null,
    contactPhone: null,
    address: null,
    notes: null,
    capacityByNight: { "2026-11-20": 2, "2026-11-21": 2 },
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function reg(
  partial: Partial<CongressRegistration> & Pick<CongressRegistration, "_id"> & { fullName: string }
): CongressRegistration {
  const { fullName, ...rest } = partial;
  return {
    tenantId: "t",
    eventId: "e",
    source: "door",
    zoneId: "zona-2",
    churchName: "IPN LA VID",
    identity: {
      fullName,
      rut: null,
      email: null,
      phone: "+56911111111",
      status: "provisional",
    },
    attendance: { saturday: null, sunday: null },
    chargeAmountClp: null,
    allocatedPaidClp: 0,
    needsReview: false,
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...rest,
  };
}

function asg(
  partial: Partial<CongressLodgingAssignment> &
    Pick<CongressLodgingAssignment, "_id" | "homeId" | "registrationId" | "night" | "status">
): CongressLodgingAssignment {
  return {
    tenantId: "t",
    eventId: "e",
    confirmed: partial.status === "confirmed",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("labelLodgingNights", () => {
  it("etiqueta vie, sáb y ambos", () => {
    assert.equal(labelLodgingNights(["2026-11-20"]), "Viernes 20");
    assert.equal(labelLodgingNights(["2026-11-21"]), "Sábado 21");
    assert.equal(labelLodgingNights(["2026-11-20", "2026-11-21"]), "Ambos (vie 20 y sáb 21)");
  });
});

describe("buildLodgingHomesReport", () => {
  it("agrupa por hogar, numera por nombre, fusiona noches y excluye canceladas/vacíos", () => {
    const homes = [
      home({ _id: "h-b", name: "Casa Beta", contactName: "Juan Beta", address: "Calle 2" }),
      home({ _id: "h-a", name: "Casa Alfa", contactName: "Pedro Alfa", notes: "Sin 2° piso" }),
      home({ _id: "h-empty", name: "Casa Vacía", contactName: "Nadie" }),
    ];
    const registrations = [
      reg({ _id: "r1", fullName: "Ana Pérez" }),
      (() => {
        const r = reg({ _id: "r2", fullName: "Bruno Díaz" });
        return { ...r, identity: { ...r.identity, phone: null } };
      })(),
      reg({ _id: "r3", fullName: "Cancelado" }),
    ];
    const assignments = [
      asg({ _id: "a1", homeId: "h-a", registrationId: "r1", night: "2026-11-20", status: "assigned" }),
      asg({ _id: "a2", homeId: "h-a", registrationId: "r1", night: "2026-11-21", status: "confirmed" }),
      asg({ _id: "a3", homeId: "h-b", registrationId: "r2", night: "2026-11-21", status: "assigned" }),
      asg({ _id: "a4", homeId: "h-a", registrationId: "r3", night: "2026-11-20", status: "cancelled" }),
    ];

    const report = buildLodgingHomesReport({
      homes,
      assignments,
      registrations,
      generatedAtIso: "2026-11-17T15:00:00.000Z",
    });

    assert.equal(report.homes.length, 2);
    assert.equal(report.homes[0]?.homeNumber, 1);
    assert.equal(report.homes[0]?.name, "Casa Alfa");
    assert.equal(report.homes[0]?.hostName, "Pedro Alfa");
    assert.equal(report.homes[0]?.notes, "Sin 2° piso");
    assert.equal(report.homes[0]?.guests.length, 1);
    assert.equal(report.homes[0]?.guests[0]?.fullName, "Ana Pérez");
    assert.equal(report.homes[0]?.guests[0]?.nightsLabel, "Ambos (vie 20 y sáb 21)");
    assert.equal(report.homes[0]?.guestCount, 1);
    assert.equal(report.homes[0]?.bedsFriday, 1);
    assert.equal(report.homes[0]?.bedsSaturday, 1);

    assert.equal(report.homes[1]?.homeNumber, 2);
    assert.equal(report.homes[1]?.name, "Casa Beta");
    assert.equal(report.homes[1]?.guests[0]?.fullName, "Bruno Díaz");
    assert.equal(report.homes[1]?.guests[0]?.phone, "—");
    assert.equal(report.homes[1]?.guests[0]?.nightsLabel, "Sábado 21");
    assert.equal(report.homes[1]?.bedsFriday, 0);
    assert.equal(report.homes[1]?.bedsSaturday, 1);
  });

  it("usa Sin registrar si no hay contactName", () => {
    const report = buildLodgingHomesReport({
      homes: [home({ _id: "h1", name: "Hogar", contactName: null })],
      assignments: [
        asg({ _id: "a1", homeId: "h1", registrationId: "r1", night: "2026-11-20", status: "assigned" }),
      ],
      registrations: [reg({ _id: "r1", fullName: "Solo" })],
      generatedAtIso: "2026-11-17T15:00:00.000Z",
    });
    assert.equal(report.homes[0]?.hostName, "Sin registrar");
  });
});
```

**Nota de implementación del test:** si el helper `reg` con override de `identity` choca, construir `registrations` con objetos literales claros (sin pelear con el spread). Ajustar el fixture de Bruno para `phone: null` → report `"—"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/baseline/congress-lodging-homes-report.test.ts`  
Expected: FAIL — módulo / exports no existen.

- [ ] **Step 3: Implement `lodging-homes-report.ts`**

```ts
import { CONGRESS_NIGHTS, type CongressNight } from "@/core/congress/constants";
import type {
  CongressLodgingAssignment,
  CongressLodgingHome,
  CongressRegistration,
} from "@/core/congress/types";

export type LodgingHomesReportGuest = {
  registrationId: string;
  fullName: string;
  churchZoneLabel: string; // "IPN LA VID · Zona 02"
  phone: string; // phone or "—"
  nights: CongressNight[];
  nightsLabel: string;
};

export type LodgingHomesReportHome = {
  homeId: string;
  homeNumber: number;
  name: string;
  hostName: string;
  address: string | null;
  notes: string | null;
  guestCount: number;
  bedsFriday: number;
  bedsSaturday: number;
  guests: LodgingHomesReportGuest[];
};

export type LodgingHomesReport = {
  generatedAtIso: string;
  homes: LodgingHomesReportHome[];
};

export function isActiveLodgingAssignment(a: CongressLodgingAssignment): boolean {
  if (a.status === "cancelled") return false;
  return a.status === "assigned" || a.status === "confirmed" || Boolean(a.confirmed);
}

export function labelLodgingNights(nights: readonly CongressNight[]): string {
  const set = new Set(nights);
  const fri = set.has(CONGRESS_NIGHTS[0]);
  const sat = set.has(CONGRESS_NIGHTS[1]);
  if (fri && sat) return "Ambos (vie 20 y sáb 21)";
  if (fri) return "Viernes 20";
  if (sat) return "Sábado 21";
  return "—";
}

function formatZoneLabel(zoneId: string): string {
  const match = zoneId.trim().match(/^zona-(\d+)$/i);
  if (match) return `Zona ${String(Number(match[1])).padStart(2, "0")}`;
  return zoneId;
}

export function buildLodgingHomesReport(input: {
  homes: CongressLodgingHome[];
  assignments: CongressLodgingAssignment[];
  registrations: CongressRegistration[];
  generatedAtIso: string;
}): LodgingHomesReport {
  const regById = new Map(input.registrations.map((r) => [r._id, r]));
  const homeById = new Map(input.homes.map((h) => [h._id, h]));

  type Acc = {
    nights: Set<CongressNight>;
  };
  const byHome = new Map<string, Map<string, Acc>>();

  for (const a of input.assignments) {
    if (!isActiveLodgingAssignment(a)) continue;
    if (!homeById.has(a.homeId)) continue;
    if (!regById.has(a.registrationId)) continue;
    let people = byHome.get(a.homeId);
    if (!people) {
      people = new Map();
      byHome.set(a.homeId, people);
    }
    let acc = people.get(a.registrationId);
    if (!acc) {
      acc = { nights: new Set() };
      people.set(a.registrationId, acc);
    }
    acc.nights.add(a.night);
  }

  const homesOut: LodgingHomesReportHome[] = [];
  for (const [homeId, people] of byHome) {
    const h = homeById.get(homeId);
    if (!h || people.size === 0) continue;

    const guests: LodgingHomesReportGuest[] = [];
    let bedsFriday = 0;
    let bedsSaturday = 0;
    for (const [registrationId, acc] of people) {
      const r = regById.get(registrationId)!;
      const nights = CONGRESS_NIGHTS.filter((n) => acc.nights.has(n));
      if (acc.nights.has(CONGRESS_NIGHTS[0])) bedsFriday += 1;
      if (acc.nights.has(CONGRESS_NIGHTS[1])) bedsSaturday += 1;
      guests.push({
        registrationId,
        fullName: r.identity.fullName,
        churchZoneLabel: `${r.churchName} · ${formatZoneLabel(r.zoneId)}`,
        phone: r.identity.phone?.trim() ? r.identity.phone.trim() : "—",
        nights,
        nightsLabel: labelLodgingNights(nights),
      });
    }
    guests.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));

    homesOut.push({
      homeId,
      homeNumber: 0,
      name: h.name,
      hostName: h.contactName?.trim() ? h.contactName.trim() : "Sin registrar",
      address: h.address?.trim() ? h.address.trim() : null,
      notes: h.notes?.trim() ? h.notes.trim() : null,
      guestCount: guests.length,
      bedsFriday,
      bedsSaturday,
      guests,
    });
  }

  homesOut.sort((a, b) => a.name.localeCompare(b.name, "es"));
  homesOut.forEach((h, i) => {
    h.homeNumber = i + 1;
  });

  return { generatedAtIso: input.generatedAtIso, homes: homesOut };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/baseline/congress-lodging-homes-report.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit (omitir salvo pedido del usuario)**

```bash
# omitir por Global Constraints
```

---

### Task 2: UI — `LodgingPrintReport` + `ReportsView`

**Files:**
- Create: `src/components/admin/congress/reports/LodgingPrintReport.tsx`
- Create: `src/components/admin/congress/reports/ReportsView.tsx`
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx` (tab `reportes` + props)

**Interfaces:**
- Consumes: `buildLodgingHomesReport`, tipos del Task 1; `homes`, `assignments`, `registrations` del panel; `exportCsv` callback o lógica CSV movida a `ReportsView`
- Produces: `ReportsView` props:

```ts
type ReportsViewProps = {
  homes: CongressLodgingHome[];
  assignments: CongressLodgingAssignment[];
  registrations: CongressRegistration[];
};
```

- [ ] **Step 1: Implement `LodgingPrintReport.tsx`**

Documento con:
- Toolbar no imprimible: **Volver**, **Imprimir / Guardar PDF** (`window.print()`), deshabilitar imprimir si `report.homes.length === 0`
- Cabecera: título / subtítulo / “Generado: …” con `toLocaleString("es-CL", { timeZone: "America/Santiago" })`
- Por cada hogar: encabezado N° + nombre, jefe, dirección, notas, resumen `N personas · vie X / sáb Y`
- Tabla: # | Nombre | Iglesia / zona | Teléfono | Noche(s)
- Empty state si no hay hogares
- Clase raíz `lodging-print-report`
- `<style jsx global>` o `<style>` con:

```css
@media print {
  body * {
    visibility: hidden;
  }
  .lodging-print-report,
  .lodging-print-report * {
    visibility: visible;
  }
  .lodging-print-report {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    color: #111;
    background: #fff;
  }
  .lodging-print-no-print {
    display: none !important;
  }
  .lodging-print-home {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 1.5rem;
  }
}
```

Look tipográfico: tipografía del sistema del admin está bien para print; encabezados `font-semibold`, tablas con `border-collapse` y bordes suaves `#ddd`. Sin violeta decorativo en impresión.

- [ ] **Step 2: Implement `ReportsView.tsx`**

Estado local `mode: "exports" | "lodging-print"`.

- Modo `exports`: Section “Exportar” con CSV (mover la lógica actual de `exportCsv` aquí) + botón **Reporte de alojamientos** → `setMode("lodging-print")`
- Modo `lodging-print`: render `<LodgingPrintReport … onBack={() => setMode("exports")} />` pasando `buildLodgingHomesReport({…, generatedAtIso: new Date().toISOString() })` (recalcular al entrar / en render)

CSV: mismo contenido que hoy en `CongressOpsPanel` (`Nombre, Zona, …`); importar `formatZoneLabel` desde `../labels`.

- [ ] **Step 3: Wire in `CongressOpsPanel.tsx`**

Reemplazar el `TabsContent value="reportes"` actual por:

```tsx
<TabsContent value="reportes">
  <ReportsView
    homes={homes}
    assignments={assignments}
    registrations={registrations}
  />
</TabsContent>
```

Eliminar `exportCsv` local del panel si quedó sin usos.

Import:

```ts
import { ReportsView } from "@/components/admin/congress/reports/ReportsView";
```

- [ ] **Step 4: Smoke manual**

Con `npm run dev` abierto:
1. Ir a Reportes → ver CSV + nuevo CTA
2. Abrir reporte (con al menos un hogar asignado en datos locales)
3. Verificar N°, jefe, tabla, noches fusionadas
4. Imprimir → vista previa sin tabs/nav
5. Volver a exportaciones

- [ ] **Step 5: Re-run domain tests**

Run: `npx tsx --test tests/baseline/congress-lodging-homes-report.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit (omitir salvo pedido del usuario)**

---

## Self-review (plan vs spec)

| Spec | Task |
|------|------|
| Entrada Reportes + CSV + CTA + Volver | 2 |
| Cabecera documento + Santiago | 2 |
| Bloque hogar N° / jefe / dirección / notas / resumen | 1 (DTO) + 2 (UI) |
| Tabla huéspedes + noches fusionadas | 1 + 2 |
| assigned+confirmed; canceladas out; vacíos out | 1 |
| Sin API / sin PDF server / sin houseNumber BD | Global + ambos |
| Tests `buildLodgingHomesReport` | 1 |
| Print CSS sin chrome admin | 2 |
| Empty state | 2 |

Sin placeholders pendientes. Firmas alineadas entre Task 1 → Task 2.
