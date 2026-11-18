# Congreso Varones — Nómina precarga + reclamo en formulario

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Precargar la nómina Excel como fichas `source=import` reclamables (zona/ILEU/días), exponer catálogo de iglesias, y hacer que el formulario público busque el nombre (directo + fuzzy) para completar la ficha o registrarse nuevo.

**Architecture:** Desbloquear `import/commit` para escribir stubs + upsert de iglesias (sin lodging del Excel). Dominio puro para claimability/búsqueda/claim. API pública de lookup reutiliza `person-search`. Submit del form congreso acepta `registrationId` y actualiza la misma ficha. UI pública tipo convocatoria (`PortalCongressExperienceForm`).

**Tech Stack:** TypeScript, Next.js App Router, MongoDB, `person-search`, `npx tsx --test`.

**Spec:** `docs/superpowers/specs/2026-11-17-congreso-varones-nomina-precarga-design.md`

## Global Constraints

- **Sin commit/PR de git** y sin despliegue salvo que el usuario lo pida (omitir pasos `git commit` / `git push`).
- **Sin alojamiento desde Excel:** no crear `churchLodgingRequests` ni setear `lodgingNeed=requested` en el commit.
- Una sola fuente de verdad: `congress_registrations` (no colección roster aparte).
- Lookup público: solo fichas **reclamables**; payload sin RUT/tel/correo.
- Homónimos: el usuario elige fila (nombre + iglesia + zona).
- Reenvío si ya completó: 409 “ya estás inscrito”.
- Prefill zona/ILEU/días **editables** al reclamar.
- Búsqueda: `matchesPersonSearch` + `collectPersonSearchSuggestions` (tildes + typos).
- Reutilizar permisos `requireCongressImport` / guards congress existentes.
- Default `lodgingNeed` en stubs: `unknown`.

## File map

| Path | Responsibility |
|------|----------------|
| `src/core/congress/claim.ts` | `isCongressRegistrationClaimable`, `searchClaimableCongressRegistrations`, `applyCongressFormClaim` |
| `src/core/congress/types.ts` | `CongressChurch` (+ collection id) |
| `src/core/congress/constants.ts` | `churches` en `CONGRESS_COLLECTIONS` |
| `src/core/congress/import-preview.ts` | Emitir `churches` vistas en hojas (aunque sin nominados) |
| `src/core/congress/import-commit.ts` | Extender plan con `churchesToUpsert`; writer puro `buildImportCommitWrites` |
| `src/lib/congress/import-commit-write.ts` | Ejecutar writes Mongo (stubs + churches + batch + audit) |
| `src/lib/congress/churches.ts` | list/upsert churches |
| `src/lib/congress/sync-form.ts` | No duplicar si submit ya reclamó |
| `src/app/api/congress/import/commit/route.ts` | Desbloquear commit real |
| `src/app/api/congress/churches/route.ts` | GET catálogo (admin/form interno según auth) |
| `src/app/api/experience/forms/congress/roster/search/route.ts` | Lookup público |
| `src/app/api/experience/forms/[id]/submit/route.ts` | Claim por `registrationId` |
| `src/components/admin/congress/CongressOpsPanel.tsx` | UI confirmar importación |
| `src/components/portal/experience/forms/PortalCongressExperienceForm.tsx` | Buscar → reclamar / alta nueva |
| `src/app/(site)/formularios/[id]/page.tsx` | Montar form congress |
| `tests/baseline/congress-nomina-claim.test.ts` | Dominio claim + search |
| `tests/baseline/congress-import-commit-write.test.ts` | Plan churches + writes shape |
| `tests/baseline/congress-critical-flows.test.ts` | Extender reimport / sin lodging |

---

### Task 1: Dominio — reclamable + búsqueda (directa + fuzzy)

**Files:**
- Create: `src/core/congress/claim.ts`
- Create: `tests/baseline/congress-nomina-claim.test.ts`

**Interfaces:**
- Produces:
  - `isCongressRegistrationClaimable(reg): boolean`
  - `toPublicCongressRosterHit(reg): { registrationId; fullName; churchName; zoneId }`
  - `searchClaimableCongressRegistrations(regs, query, limit?): { matches; suggestions; hasMore; suggestionsHasMore }`

- [ ] **Step 1: Test fallido — claimable y búsqueda**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isCongressRegistrationClaimable,
  searchClaimableCongressRegistrations,
} from "../../src/core/congress/claim";
import type { CongressRegistration } from "../../src/core/congress/types";

function stub(
  partial: Partial<CongressRegistration> & { _id: string; fullName: string }
): CongressRegistration {
  const { fullName, identity, ...rest } = partial;
  return {
    tenantId: "t1",
    eventId: "ipn-congreso-varones-2026",
    source: "import",
    submissionId: null,
    importRowId: null,
    zoneId: "zona-1",
    churchName: "Quilicura",
    expectedDays: { saturday: true, sunday: true },
    lodgingNeed: "unknown",
    attendance: { saturday: null, sunday: null },
    chargeAmountClp: 17000,
    allocatedPaidClp: 0,
    needsReview: true,
    version: 1,
    createdAt: "2026-11-17T00:00:00.000Z",
    updatedAt: "2026-11-17T00:00:00.000Z",
    ...rest,
    _id: partial._id,
    identity: {
      fullName,
      rut: identity?.rut ?? null,
      email: identity?.email ?? null,
      phone: identity?.phone ?? null,
      status: identity?.status ?? "provisional",
    },
  };
}

describe("congress nomina claim search", () => {
  it("solo stubs import sin submissionId son reclamables", () => {
    assert.equal(
      isCongressRegistrationClaimable(
        stub({ _id: "a", fullName: "Hno David Orellana", source: "import", submissionId: null })
      ),
      true
    );
    assert.equal(
      isCongressRegistrationClaimable(
        stub({
          _id: "b",
          fullName: "Hno David Orellana",
          source: "import",
          submissionId: "sub1",
        })
      ),
      false
    );
    assert.equal(
      isCongressRegistrationClaimable(
        stub({ _id: "c", fullName: "Nuevo", source: "form", submissionId: null })
      ),
      false
    );
  });

  it("match directo ignora tildes y sugiere con typo", () => {
    const regs = [
      stub({ _id: "1", fullName: "Hno Patricio Ravello", churchName: "Quilicura", zoneId: "zona-1" }),
      stub({ _id: "2", fullName: "Hno Pedro González", churchName: "Quilicura", zoneId: "zona-1" }),
    ];
    const accent = searchClaimableCongressRegistrations(regs, "patricio ravello");
    assert.equal(accent.matches.length, 1);
    assert.equal(accent.matches[0]._id, "1");

    const typo = searchClaimableCongressRegistrations(regs, "patricio ravelo");
    const hitIds = [...typo.matches, ...typo.suggestions].map((r) => r._id);
    assert.ok(hitIds.includes("1"));
  });
});
```

- [ ] **Step 2: Correr test (debe fallar)**

Run: `npx tsx --test tests/baseline/congress-nomina-claim.test.ts`  
Expected: FAIL (módulo / exports ausentes)

- [ ] **Step 3: Implementar `claim.ts`**

```ts
import {
  collectPersonSearchSuggestions,
  matchesPersonSearch,
} from "@/lib/experience/forms/person-search";
import type { CongressRegistration } from "@/core/congress/types";

export function isCongressRegistrationClaimable(reg: CongressRegistration): boolean {
  return reg.source === "import" && !reg.submissionId;
}

export function toPublicCongressRosterHit(reg: CongressRegistration) {
  return {
    registrationId: reg._id,
    fullName: reg.identity.fullName,
    churchName: reg.churchName,
    zoneId: reg.zoneId,
  };
}

export function searchClaimableCongressRegistrations(
  registrations: CongressRegistration[],
  query: string,
  limit = 40
) {
  const claimable = registrations.filter(isCongressRegistrationClaimable);
  const fields = (r: CongressRegistration) => [r.identity.fullName, r.churchName];
  const matches = claimable.filter((r) => matchesPersonSearch(query, fields(r)));
  const matchIds = new Set(matches.map((r) => r._id));
  const suggestions = collectPersonSearchSuggestions(
    query,
    claimable.filter((r) => !matchIds.has(r._id)),
    fields,
    8
  );
  return {
    matches: matches.slice(0, limit),
    suggestions: suggestions.items,
    hasMore: matches.length > limit,
    suggestionsHasMore: suggestions.hasMore,
  };
}
```

- [ ] **Step 4: Correr test (debe pasar)**

Run: `npx tsx --test tests/baseline/congress-nomina-claim.test.ts`  
Expected: PASS

- [ ] **Step 5: Sin git commit** — marcar task hecha.

---

### Task 2: Dominio — `applyCongressFormClaim`

**Files:**
- Modify: `src/core/congress/claim.ts`
- Modify: `tests/baseline/congress-nomina-claim.test.ts`

**Interfaces:**
- Consumes: `isCongressRegistrationClaimable`
- Produces:
  - `applyCongressFormClaim(input): { ok: true; registration } | { ok: false; error: "not_claimable" | "rut_conflict" }`

- [ ] **Step 1: Test fallido — claim actualiza identidad y marca submission**

```ts
import { applyCongressFormClaim } from "../../src/core/congress/claim";

it("aplica claim sobre stub import", () => {
  const base = stub({ _id: "1", fullName: "Hno David Orellana" });
  const result = applyCongressFormClaim({
    registration: base,
    submissionId: "sub-1",
    fullName: "David Orellana",
    rut: "12.345.678-5",
    email: "a@b.cl",
    phone: "+56911111111",
    zoneId: "zona-1",
    churchName: "Quilicura Centro",
    expectedDays: { saturday: true, sunday: false },
    nowIso: "2026-11-18T12:00:00.000Z",
    conflictingRutRegistrationId: null,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.registration.submissionId, "sub-1");
  assert.equal(result.registration.identity.fullName, "David Orellana");
  assert.equal(result.registration.churchName, "Quilicura Centro");
  assert.equal(result.registration.expectedDays?.sunday, false);
  assert.equal(result.registration.identity.status, "verified");
  assert.equal(result.registration.needsReview, false);
});

it("rechaza claim si ya tiene submissionId", () => {
  const base = stub({ _id: "1", fullName: "X", submissionId: "sub-0" });
  const result = applyCongressFormClaim({
    registration: base,
    submissionId: "sub-1",
    fullName: "X",
    rut: null,
    email: null,
    phone: null,
    zoneId: "zona-1",
    churchName: "Q",
    expectedDays: { saturday: null, sunday: null },
    nowIso: "2026-11-18T12:00:00.000Z",
    conflictingRutRegistrationId: null,
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error, "not_claimable");
});
```

- [ ] **Step 2: Correr test (debe fallar)**

Run: `npx tsx --test tests/baseline/congress-nomina-claim.test.ts`  
Expected: FAIL (`applyCongressFormClaim` ausente)

- [ ] **Step 3: Implementar `applyCongressFormClaim`**

```ts
import { normalizeChileRut } from "@/lib/experience/forms/rut-chile";
import type { CongressAttendanceDays, CongressRegistration } from "@/core/congress/types";

export function applyCongressFormClaim(input: {
  registration: CongressRegistration;
  submissionId: string;
  fullName: string;
  rut: string | null;
  email: string | null;
  phone: string | null;
  zoneId: string;
  churchName: string;
  expectedDays: CongressAttendanceDays;
  nowIso: string;
  conflictingRutRegistrationId: string | null;
}):
  | { ok: true; registration: CongressRegistration }
  | { ok: false; error: "not_claimable" | "rut_conflict" } {
  if (!isCongressRegistrationClaimable(input.registration)) {
    return { ok: false, error: "not_claimable" };
  }
  if (
    input.conflictingRutRegistrationId &&
    input.conflictingRutRegistrationId !== input.registration._id
  ) {
    return { ok: false, error: "rut_conflict" };
  }
  const rut = input.rut ? normalizeChileRut(input.rut) ?? input.rut : null;
  const fullName = input.fullName.trim() || input.registration.identity.fullName;
  return {
    ok: true,
    registration: {
      ...input.registration,
      submissionId: input.submissionId,
      zoneId: input.zoneId.trim() || input.registration.zoneId,
      churchName: input.churchName.trim() || input.registration.churchName,
      expectedDays: input.expectedDays,
      identity: {
        ...input.registration.identity,
        fullName,
        rut,
        email: input.email,
        phone: input.phone,
        status: rut ? "verified" : "provisional",
      },
      needsReview: !rut,
      updatedAt: input.nowIso,
      version: input.registration.version + 1,
    },
  };
}
```

- [ ] **Step 4: Correr test (debe pasar)**

Run: `npx tsx --test tests/baseline/congress-nomina-claim.test.ts`  
Expected: PASS

- [ ] **Step 5: Sin git commit**

---

### Task 3: Parser de iglesias + writes de import commit (sin lodging)

**Files:**
- Modify: `src/core/congress/import-preview.ts` — devolver `churches` vistas por hoja
- Modify: `src/core/congress/import-commit.ts` — `churchesToUpsert` en el plan; helper `buildImportStubDrafts`
- Modify: `src/core/congress/types.ts` — `CongressChurch`
- Modify: `src/core/congress/constants.ts` — `churches: "congress_churches"`
- Create: `src/lib/congress/import-commit-write.ts`
- Create: `tests/baseline/congress-import-commit-write.test.ts`
- Modify: `tests/baseline/congress-critical-flows.test.ts` si hace falta

**Interfaces:**
- Produces:
  - `parseZoneSheetGrid(...).churches: Array<{ zoneId; churchName }>`
  - `planCongressImportCommit(...).churchesToUpsert`
  - `executeCongressImportCommit(...)` (en lib) escribe stubs + churches; **ignora** `churchLodgingRequests`

- [ ] **Step 1: Test — iglesias sin nominados entran al plan; lodging no se escribe**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseZoneSheetGrid, buildCongressImportPreview } from "../../src/core/congress/import-preview";
import { planCongressImportCommit } from "../../src/core/congress/import-commit";

it("parseZoneSheetGrid lista iglesias aunque no haya hermanos", () => {
  const parsed = parseZoneSheetGrid("zona-4", "ZONA 4", [
    ["IGLESIAS", "HERMANOS", "DIA ASISTIR"],
    [],
    ["GRANEROS", null, null],
    ["RANCAGUA IRENE FREI", null, null],
  ]);
  const names = parsed.churches.map((c) => c.churchName).sort();
  assert.deepEqual(names, ["GRANEROS", "RANCAGUA IRENE FREI"]);
});

it("plan incluye churchesToUpsert y toCreate sin lodging", () => {
  const preview = buildCongressImportPreview({
    peopleRows: [
      {
        zoneId: "zona-1",
        zoneLabel: "Z1",
        churchName: "Quilicura",
        fullName: "Hno David Orellana",
        expectedDayLabel: "SÁBADO Y DOMINGO",
        sheetRow: 3,
      },
    ],
    lodgingRequests: [
      { zoneId: "zona-7", churchName: "HUAMBALI", requestedBeds: 10, note: "10 alojamientos" },
    ],
  });
  // Si buildCongressImportPreview aún no acepta churches explícitas, el plan
  // debe unionar namedPeople + quantityGaps (+ churches del parser en workbook).
  const plan = planCongressImportCommit({
    preview: {
      ...preview,
      // tras el cambio: preview.churches o churchesToUpsert derivado
    } as typeof preview,
    existing: [],
    batchId: "batch-1",
  });
  assert.equal(plan.toCreate.length, 1);
  assert.ok(plan.churchesToUpsert.some((c) => c.churchName === "Quilicura"));
  assert.equal("lodgingToCreate" in plan ? (plan as { lodgingToCreate?: unknown[] }).lodgingToCreate?.length ?? 0 : 0, 0);
});
```

Ajustar el test al shape final: `ImportCommitPlan.churchesToUpsert: Array<{ zoneId; churchName }>` y **ningún** array de lodging writes.

- [ ] **Step 2: Correr test (debe fallar)**

Run: `npx tsx --test tests/baseline/congress-import-commit-write.test.ts`  
Expected: FAIL

- [ ] **Step 3: Extender parser**

En `parseZoneSheetGrid`, acumular cada `churchByBlock[blockIndex]` no vacío en un `Map` keyed por `fold(zoneId|churchName)` y devolver `churches: [...]`.

En `buildCongressImportPreview` / `previewCongressWorkbook`, unir churches de todas las hojas zona + churches derivadas de `namedPeople` / gaps.

- [ ] **Step 4: Extender plan + writer**

En `planCongressImportCommit`, añadir:

```ts
churchesToUpsert: Array<{ zoneId: string; churchName: string }>;
```

Deduplicar por `fold(zoneId + "|" + churchName)`.

En `src/lib/congress/import-commit-write.ts`:

```ts
export async function executeCongressImportCommit(input: {
  tenantId: string;
  actorUserId: string;
  batchId: string;
  fileName: string;
  plan: ImportCommitPlan;
}): Promise<{ created: number; churchesUpserted: number }>
```

Para cada `toCreate`: `buildRegistrationDraft({ source: "import", identityStatus: "provisional", importRowId, expectedDayLabel, needsReview: true, lodgingNeed: "unknown", ... })` + `insertCongressRegistration`.  
Para cada church: upsert en `congress_churches` (unique tenant+event+zone+churchName).  
**No** insertar `CongressChurchLodgingRequest`.  
Guardar batch doc + `appendCongressAudit({ action: "import.commit", ... })`.

- [ ] **Step 5: Correr tests**

Run: `npx tsx --test tests/baseline/congress-import-commit-write.test.ts tests/baseline/congress-critical-flows.test.ts`  
Expected: PASS

- [ ] **Step 6: Sin git commit**

---

### Task 4: API commit + UI Importación

**Files:**
- Modify: `src/app/api/congress/import/commit/route.ts`
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx` (tab importación)

**Interfaces:**
- Consumes: `previewCongressWorkbook`, `planCongressImportCommit`, `executeCongressImportCommit`
- Produces: `POST /api/congress/import/commit` escribe Mongo; UI habilita “Confirmar importación”

- [ ] **Step 1: Reemplazar handler bloqueado**

```ts
// POST: requireCongressImport → formData file → preview → plan → executeCongressImportCommit
// Respuesta: { ok: true, batchId, summary: { created, churchesUpserted, skipped } }
// Errores: 400 archivo; 403 sin permiso
```

Mantener `prepare-commit` como preview del plan (puede seguir `locked: false` solo informativo, o alinear mensaje: “listo para confirmar”).

- [ ] **Step 2: UI panel**

En tab Importación:

1. Previsualizar (existente).
2. Botón **Confirmar importación** habilitado si hay `importFile` y preview OK.
3. `POST /api/congress/import/commit` con el mismo file.
4. Mostrar nota: `Creados N · Iglesias M · Omitidos K`.
5. Tras éxito, refrescar listado de registrations (`loadAll` / fetch existente).

Copy: quitar “definitiva deshabilitada” / “fuera de alcance”.

- [ ] **Step 3: Verificación manual**

Con `npm run dev`, subir `REGISTRO CONGRESO NACIONAL 2026.xlsx` → preview → confirmar → ~184 fichas en Recepción; iglesias de Zona 4 visibles en filtros/alta; **cero** pedidos de alojamiento nuevos por el Excel.

- [ ] **Step 4: Sin git commit**

---

### Task 5: Catálogo de iglesias (repo + API)

**Files:**
- Create: `src/lib/congress/churches.ts`
- Create: `src/app/api/congress/churches/route.ts`
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx` — fusionar churches API en `churchesByZone`
- Optional migration index in `src/core/migrations/032-congress-varones-ops.ts` o migration nueva solo si el proyecto exige índices explícitos

**Interfaces:**
- Produces:
  - `upsertCongressChurches(tenantId, churches, batchId?)`
  - `listCongressChurches(tenantId, zoneId?)`
  - `GET /api/congress/churches?zone=zona-1` → `{ ok, churches: [{ zoneId, churchName }] }`

- [ ] **Step 1: Implementar repo**

```ts
export async function upsertCongressChurches(...)
export async function listCongressChurches(tenantId: string, zoneId?: string)
```

Unique logical key: `tenantId + eventId + zoneId + fold(churchName)`.

- [ ] **Step 2: Route GET**

Auth: mismo guard de operate/list del congreso (`requireCongressOperate` o el que use `GET /registrations`). No exponer en público sin tenant; el form público puede obtener iglesias vía endpoint experience dedicado en Task 8 si el admin API no es público.

Para el formulario público, preferir:

`GET /api/experience/forms/congress/churches?zone=zona-1` (sin datos personales; solo catálogo del evento).

Implementar ese route público en esta task o en Task 8; debe listar `congress_churches` (+ opcionalmente union con nombres ya en registrations).

- [ ] **Step 3: Panel usa catálogo**

Al cargar ops, fetch churches y merge con `registrations.map(r => r.churchName)` para `churchesByZone` (Set).

- [ ] **Step 4: Sin git commit**

---

### Task 6: API pública de búsqueda de nómina

**Files:**
- Create: `src/app/api/experience/forms/congress/roster/search/route.ts`
- Create: `src/lib/congress/roster-search.ts` (load claimable + `searchClaimableCongressRegistrations`)

**Interfaces:**
- Produces: `GET /api/experience/forms/congress/roster/search?q=`
  - `{ ok, matches: PublicHit[], suggestions: PublicHit[], hasMore, suggestionsHasMore }`
  - `PublicHit = { registrationId, fullName, churchName, zoneId }`

- [ ] **Step 1: Implementar loader**

```ts
export async function searchCongressPublicRoster(tenantId: string, query: string) {
  const all = await listCongressRegistrations(tenantId);
  const result = searchClaimableCongressRegistrations(all, query);
  return {
    matches: result.matches.map(toPublicCongressRosterHit),
    suggestions: result.suggestions.map(toPublicCongressRosterHit),
    hasMore: result.hasMore,
    suggestionsHasMore: result.suggestionsHasMore,
  };
}
```

- [ ] **Step 2: Route GET**

- Tenant activo requerido.
- `q.trim().length < 2` → listas vacías.
- Sin auth de usuario (formulario público), igual que roster convocatoria.
- Nunca devolver rut/email/phone.

- [ ] **Step 3: Smoke manual**

Tras import: `q=orellana` → match; `q=oreyana` / typo similar → suggestion si aplica; ficha con `submissionId` no aparece.

- [ ] **Step 4: Sin git commit**

---

### Task 7: Submit — reclamar ficha + sync sin duplicar

**Files:**
- Modify: `src/app/api/experience/forms/[id]/submit/route.ts`
- Modify: `src/lib/congress/sync-form.ts`
- Create: `src/lib/congress/claim-registration.ts` (orquestación server-only)
- Modify: `tests/baseline/congress-already-enrolled.test.ts` si aplica mensajes

**Interfaces:**
- Consumes: `applyCongressFormClaim`, `findCongressEnrolleeMatch`, `saveFormSubmission`
- Produces: submit con `data.registrationId` actualiza stub; sin `registrationId` = alta form (sync posterior o create inmediato)

- [ ] **Step 1: Orquestación `claimCongressRegistrationFromForm`**

```ts
export async function claimCongressRegistrationFromForm(input: {
  tenantId: string;
  registrationId: string;
  submissionId: string;
  data: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; error: "not_claimable" | "rut_conflict" | "not_found" }>
```

Pasos:

1. `getCongressRegistration` → not found.
2. Buscar otra registration con mismo RUT normalizado (si hay RUT) → `conflictingRutRegistrationId`.
3. `applyCongressFormClaim(...)`.
4. `updateCongressRegistration` con version.
5. También: si `findCongressEnrolleeMatch` ya encontró submission previa → el route debe 409 **antes** de guardar (orden actual).

Orden en submit route para `CONGRESS_VARONES_FORM_ID`:

1. Si `registrationId` presente: no depender solo de sync; tras `saveFormSubmission` exitoso, llamar claim. Si claim `not_claimable` → 409 already enrolled. Si `rut_conflict` → 409.
2. Si no hay `registrationId`: flujo actual (`findCongressEnrolleeMatch` → save → sync crea `source=form`).
3. Extender `findCongressEnrolleeMatch` **o** chequeo extra: registration reclamable con mismo RUT ya completada (`submissionId` set) también bloquea.

- [ ] **Step 2: `syncCongressFormSubmissions`**

Al inicio del loop, si ya existe registration con ese `submissionId`, skip (ya está).  
Si el submission trae `data.registrationId` y la ficha ya tiene ese submissionId, skip.  
**No** crear nuevo draft `source=form` cuando `data.registrationId` apunta a una ficha import.

- [ ] **Step 3: Mapear expectedDays desde campos del form**

Si el form hoy no tiene `expectedDays`, mapear desde los campos existentes (p. ej. día de asistencia / checkboxes). Si no hay campo, conservar `expectedDays` del stub en el claim (solo sobrescribir si el payload trae valores).

Implementación mínima aceptable: al reclamar, si el payload no trae días, **mantener** `registration.expectedDays`; si trae, usar `parseExpectedDayLabel` o booleans explícitos.

- [ ] **Step 4: Test de dominio ya cubre claim; añadir test sync puro si hay helper extraíble**

Si la lógica anti-duplicado se puede probar sin Mongo, extraer `shouldSyncFormSubmission(reg, submission)` y testearlo en `congress-nomina-claim.test.ts`.

- [ ] **Step 5: Sin git commit**

---

### Task 8: UI formulario público — buscar / reclamar / alta nueva

**Files:**
- Create: `src/components/portal/experience/forms/PortalCongressExperienceForm.tsx`
- Modify: `src/app/(site)/formularios/[id]/page.tsx` — usar el nuevo form cuando `id === VARONES_ATTENDANCE_FORM_ID`
- Reutilizar patrones de `PortalConvocatoriaExperienceForm.tsx` + `ConvocatoriaParticipantFields` (lookup UI)
- Modify experience copy en `page.tsx` description si hace falta: “Busca tu nombre en la nómina…”

**Interfaces:**
- Consumes: `/api/experience/forms/congress/roster/search`, churches public API, submit existente
- Produces: UX §2 del spec

- [ ] **Step 1: Componente**

Estados:

- `registrationMode: "roster" | "manual"`
- `selectedRegistrationId: string | null`
- `lookupQuery`, `matches`, `suggestions`, loading

Flujo UI:

1. Bloque “Busca tu nombre” (input debounce ≥2 chars) → fetch search.
2. Lista matches + sección “¿Quisiste decir?” para suggestions.
3. Al elegir: set mode roster, prefill `fullName`, `zona`/`zoneId`, `iglesia`/`churchName`, días si hay campos; campos editables.
4. Link “No aparezco en la lista” → mode manual; limpia `registrationId`; zona/iglesia desde catálogo.
5. Submit manda `registrationId` solo en mode roster.

Payload mínimo en `data`:

```ts
{
  registrationMode: "roster" | "manual",
  registrationId?: string,
  fullName, rut, email, phone, zona / zoneId, iglesia / churchName,
  // resto de campos del ExperienceFormDefinition
}
```

- [ ] **Step 2: Wire page**

```tsx
{isVaronesAttendance ? (
  <PortalCongressExperienceForm ... />
) : convocatoria ? (
  <PortalConvocatoriaExperienceForm ... />
) : (
  <PortalExperienceForm ... />
)}
```

- [ ] **Step 3: Prefill editable**

Al seleccionar hit, setear valores de campos del form definition por `name` (`fullName`/`nombre`, `zona`, `iglesia`, etc.). Detectar nombres reales del form en CMS/seed y mapear de forma explícita en el componente (constantes al inicio del archivo).

- [ ] **Step 4: Verificación en navegador**

1. Import commit hecho.
2. Abrir `/formularios/ipn-asistencia-congreso-varones-2026`.
3. Buscar con tilde y con typo → sugerencias.
4. Elegir → completar RUT/tel → enviar → en panel, misma ficha con datos y sin duplicado.
5. Segunda vez mismo RUT → bloqueado.
6. “No aparezco” → alta nueva con ILEU del catálogo (p. ej. GRANEROS).

- [ ] **Step 5: Sin git commit**

---

## Self-review (plan vs spec)

| Spec | Task |
|------|------|
| Stubs import con zona/ILEU/días, sin lodging | 3, 4 |
| Catálogo iglesias vacías | 3, 5 |
| Form buscar → reclamar / alta nueva | 6, 7, 8 |
| Prefill editable | 8 (+ 2 claim) |
| Ya completó → bloqueo | 1, 7 |
| Búsqueda tildes + typos | 1, 6, 8 |
| Reimport idempotente | 3 (+ critical-flows) |
| Operador alojamiento aparte | 3 (no writes lodging) |
| Panel commit UI | 4 |

Placeholders evitados: shapes y paths concretos; sin “ TBD”.  
Commits git omitidos a propósito (constraint del proyecto).

---

## Execution handoff

Plan guardado en `docs/superpowers/plans/2026-11-17-congreso-varones-nomina-precarga.md`.

**Opciones de ejecución:**

1. **Subagent-Driven (recomendado)** — un subagente fresco por task + review entre tasks  
2. **Inline Execution** — ejecutar en esta sesión con checkpoints  

¿Cuál preferís?
