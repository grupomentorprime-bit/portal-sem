# Congreso Varones — Comprobante PDF de ingreso Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Emitir comprobante PDF de ingreso con folio correlativo `CV-2026-#####`, logo del Departamento de Varones y detalle de imputaciones, descargable tras guardar (individual/grupal) y re-descargable desde movimientos/ficha.

**Architecture:** Folio atómico en Mongo al crear el pago (`recordCongressPayment`); campo `folio` en `CongressPayment`; endpoint idempotente `ensure-folio` para legacy; PDF generado en cliente con `jsPDF` (patrón AE) sin storage; CTA de descarga post-éxito (toast sin acciones → botón temporal) + botón en `CashBoxView` y ficha.

**Tech Stack:** TypeScript, Next.js App Router, MongoDB (`findOneAndUpdate` + `$inc`), jsPDF, admin kit, `npx tsx --test`.

**Spec:** `docs/superpowers/specs/2026-11-18-congreso-varones-comprobante-ingreso-pdf-design.md`

## Global Constraints

- Sin boleta/factura SII, sin correo del comprobante, sin firma digital, sin storage permanente del PDF.
- Sin formulario público, import commit Excel, despliegue; **sin commit/PR de git** salvo que el usuario lo pida explícitamente (omitir pasos `git commit` / `git push`).
- Folio inmutable; anular no libera secuencia.
- Pagos nuevos **siempre** con folio; si falla la secuencia → no insertar el pago.
- Logo: `/branding/ipn-chile/varones-nacional.png`; si no carga, PDF sin logo.
- Toast admin actual **no** soporta acciones → CTA = botón temporal post-éxito (no extender Toast global salvo que sea trivial y local).
- Reutilizar permisos `congress.payments` / `congress.view` (quien ve/registra pagos descarga).
- Año del folio = año del evento Congreso 2026 (`CONGRESS_PAYMENT_FOLIO_YEAR = 2026`), no el año del servidor.

## File map

| Path | Responsibility |
|------|----------------|
| `src/core/congress/types.ts` | `folio?: string \| null` en `CongressPayment` |
| `src/core/congress/constants.ts` | `CONGRESS_PAYMENT_FOLIO_YEAR`; colección `sequences` |
| `src/core/congress/payment-folio.ts` | `formatPaymentFolio`, `paymentReceiptFilename`, helpers puros |
| `src/lib/congress/repository.ts` | `allocateNextPaymentFolio`, set folio al crear, `ensureCongressPaymentFolio` |
| `src/app/api/congress/payments/[id]/ensure-folio/route.ts` | POST idempotente legacy |
| `src/lib/congress/download-payment-receipt-pdf.ts` | Generar/descargar PDF con jsPDF + logo |
| `src/components/admin/congress/cash/CashBoxView.tsx` | Botón Comprobante por movimiento |
| `src/components/admin/congress/CongressOpsPanel.tsx` | CTA post-grupal; wire download + ensure-folio |
| `src/components/admin/congress/participant/ParticipantSheet.tsx` | CTA post-individual + lista comprobantes de la ficha |
| `tests/baseline/congress-payment-folio.test.ts` | Tests dominio folio / filename |

---

### Task 1: Dominio — folio puro + tipo

**Files:**
- Modify: `src/core/congress/types.ts`
- Modify: `src/core/congress/constants.ts`
- Create: `src/core/congress/payment-folio.ts`
- Create: `tests/baseline/congress-payment-folio.test.ts`

**Interfaces:**
- Produces:
  - `CONGRESS_PAYMENT_FOLIO_YEAR = 2026`
  - `CONGRESS_COLLECTIONS.sequences = "congress_sequences"`
  - `formatPaymentFolio(seq: number, year?: number): string` → `CV-2026-00042`
  - `paymentReceiptFilename(folio: string): string` → `comprobante-ingreso-CV-2026-00042.pdf`
  - `CongressPayment.folio?: string | null`

- [ ] **Step 1: Test fallido — formato y filename**

Crear `tests/baseline/congress-payment-folio.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatPaymentFolio,
  paymentReceiptFilename,
} from "../../src/core/congress/payment-folio";

describe("congress payment folio", () => {
  it("formatea CV-YYYY-##### con padding", () => {
    assert.equal(formatPaymentFolio(42), "CV-2026-00042");
    assert.equal(formatPaymentFolio(1, 2026), "CV-2026-00001");
  });

  it("rechaza secuencia no positiva", () => {
    assert.throws(() => formatPaymentFolio(0));
    assert.throws(() => formatPaymentFolio(-1));
  });

  it("arma nombre de archivo estable", () => {
    assert.equal(
      paymentReceiptFilename("CV-2026-00042"),
      "comprobante-ingreso-CV-2026-00042.pdf"
    );
  });
});
```

- [ ] **Step 2: Correr test — debe fallar**

Run: `npx tsx --test tests/baseline/congress-payment-folio.test.ts`  
Expected: FAIL (módulo / exports ausentes)

- [ ] **Step 3: Implementar constantes, tipo y helpers**

En `constants.ts`:

```ts
/** Año fijo del folio de comprobantes del Congreso 2026. */
export const CONGRESS_PAYMENT_FOLIO_YEAR = 2026;
```

En `CONGRESS_COLLECTIONS`:

```ts
  sequences: "congress_sequences",
```

En `CongressPayment` (`types.ts`):

```ts
  /** Folio correlativo CV-YYYY-#####. Requerido en pagos nuevos. */
  folio?: string | null;
```

Crear `payment-folio.ts`:

```ts
import { CONGRESS_PAYMENT_FOLIO_YEAR } from "@/core/congress/constants";

export function formatPaymentFolio(
  seq: number,
  year: number = CONGRESS_PAYMENT_FOLIO_YEAR
): string {
  if (!Number.isInteger(seq) || seq <= 0) {
    throw new Error("invalid_folio_sequence");
  }
  return `CV-${year}-${String(seq).padStart(5, "0")}`;
}

export function paymentReceiptFilename(folio: string): string {
  return `comprobante-ingreso-${folio}.pdf`;
}
```

- [ ] **Step 4: Correr test — debe pasar**

Run: `npx tsx --test tests/baseline/congress-payment-folio.test.ts`  
Expected: PASS

---

### Task 2: Repositorio — secuencia atómica + folio al crear + ensure

**Files:**
- Modify: `src/lib/congress/repository.ts`
- (sin test de integración Mongo en baseline; dominio cubierto en Task 1)

**Interfaces:**
- Consumes: `formatPaymentFolio`, `CONGRESS_COLLECTIONS.sequences`, `CONGRESS_EVENT_ID`, `CONGRESS_PAYMENT_FOLIO_YEAR`
- Produces:
  - `allocateNextPaymentFolio(tenantId: string): Promise<string>`
  - `ensureCongressPaymentFolio(input: { tenantId; paymentId }): Promise<{ ok: true; payment } | { ok: false; error }>`
  - `recordCongressPayment` → `payment.folio` siempre presente en éxito

- [ ] **Step 1: Añadir allocateNextPaymentFolio**

En `repository.ts`, tras imports existentes:

```ts
import { formatPaymentFolio } from "@/core/congress/payment-folio";
import { CONGRESS_PAYMENT_FOLIO_YEAR } from "@/core/congress/constants";
```

```ts
function paymentFolioSequenceId(tenantId: string, eventId = CONGRESS_EVENT_ID) {
  return `${tenantId}:${eventId}:payment-folio`;
}

export async function allocateNextPaymentFolio(tenantId: string): Promise<string> {
  const db = await getDatabase();
  const doc = await db
    .collection<{ _id: string; seq: number }>(CONGRESS_COLLECTIONS.sequences)
    .findOneAndUpdate(
      { _id: paymentFolioSequenceId(tenantId) },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
  const seq = doc?.seq;
  if (!seq || !Number.isInteger(seq) || seq <= 0) {
    throw new Error("folio_sequence_failed");
  }
  return formatPaymentFolio(seq, CONGRESS_PAYMENT_FOLIO_YEAR);
}
```

Nota: el driver Mongo puede devolver el documento en `doc` o `doc.value` según versión — usar el patrón ya existente en este repo para `findOneAndUpdate` (ver `updateCongressRegistration` en el mismo archivo) y adaptar.

- [ ] **Step 2: Asignar folio en recordCongressPayment antes de insertOne**

Dentro de `recordCongressPayment`, **después** de `allocatePayment` OK y **después** de aplicar updates a registrations (o justo antes de `insertOne`, pero si falla el folio tras haber escrito registrations hay que compensar — por eso asignar folio **antes** del loop de updates, inmediatamente tras `result.ok`):

```ts
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  let folio: string;
  try {
    folio = await allocateNextPaymentFolio(input.tenantId);
  } catch {
    return { ok: false, error: "folio_sequence_failed" };
  }

  const paymentWithFolio: CongressPayment = { ...result.payment, folio };
```

Usar `paymentWithFolio` en el `insertOne` y en el return. El loop de `updatedRegistrations` sigue igual.

Si el loop de registrations falla (`concurrent_payment`), el folio queda “consumido” (hueco en secuencia) — aceptable (no reutilizar).

- [ ] **Step 3: ensureCongressPaymentFolio**

```ts
export async function ensureCongressPaymentFolio(input: {
  tenantId: string;
  paymentId: string;
}): Promise<
  | { ok: true; payment: CongressPayment }
  | { ok: false; error: "not_found" | "folio_sequence_failed" }
> {
  const db = await getDatabase();
  const existing = await db
    .collection<CongressPayment>(CONGRESS_COLLECTIONS.payments)
    .findOne({ ...eventFilter(input.tenantId), _id: input.paymentId });
  if (!existing) return { ok: false, error: "not_found" };
  if (existing.folio) return { ok: true, payment: existing };

  let folio: string;
  try {
    folio = await allocateNextPaymentFolio(input.tenantId);
  } catch {
    return { ok: false, error: "folio_sequence_failed" };
  }

  const claimed = await db.collection<CongressPayment>(CONGRESS_COLLECTIONS.payments).findOneAndUpdate(
    {
      ...eventFilter(input.tenantId),
      _id: input.paymentId,
      $or: [{ folio: null }, { folio: { $exists: false } }, { folio: "" }],
    },
    { $set: { folio } },
    { returnDocument: "after" }
  );

  // Si otro request ganó la carrera, releer
  const payment =
    (claimed as CongressPayment | null) ??
    (await db
      .collection<CongressPayment>(CONGRESS_COLLECTIONS.payments)
      .findOne({ ...eventFilter(input.tenantId), _id: input.paymentId }));

  if (!payment?.folio) {
    // carrera: alguien más asignó — releer; si aún no, fallar
    if (payment?.folio) return { ok: true, payment };
    const again = await db
      .collection<CongressPayment>(CONGRESS_COLLECTIONS.payments)
      .findOne({ ...eventFilter(input.tenantId), _id: input.paymentId });
    if (again?.folio) return { ok: true, payment: again };
    return { ok: false, error: "folio_sequence_failed" };
  }

  return { ok: true, payment };
}
```

Simplificar la rama de carrera al patrón real del driver (si `claimed` viene vacío pero otro escribió folio, `findOne` final).

- [ ] **Step 4: Smoke manual / typecheck**

Run: `npx tsc --noEmit -p tsconfig.json` (o el comando de typecheck del repo si difiere)  
Expected: sin errores nuevos en estos archivos.

---

### Task 3: API ensure-folio

**Files:**
- Create: `src/app/api/congress/payments/[id]/ensure-folio/route.ts`

**Interfaces:**
- Consumes: `requireCongressPayments` (misma barra que crear pagos; quien descarga necesita poder asegurar folio)
- Produces: `POST` → `{ ok: true, payment }` | errores 404/500

- [ ] **Step 1: Crear route**

```ts
import { NextResponse } from "next/server";
import { requireCongressPayments } from "@/app/api/congress/guard";
import { ensureCongressPaymentFolio } from "@/lib/congress/repository";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireCongressPayments();
    if (ctx instanceof NextResponse) return ctx;

    const { id } = await context.params;
    const result = await ensureCongressPaymentFolio({
      tenantId: ctx.tenantId,
      paymentId: id,
    });

    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : 500;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }

    return NextResponse.json({ ok: true, payment: result.payment });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Error interno." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verificar que POST /payments ya devuelve `payment` completo**

No cambiar contrato salvo confirmar que `payment.folio` viaja en la respuesta existente:

```ts
return NextResponse.json({
  ok: true,
  payment: result.payment,
  updatedRegistrations: result.updated,
});
```

Si el audit quiere metadata de folio, añadir `folio: result.payment.folio` en `metadata` (opcional, recomendado).

---

### Task 4: Cliente PDF (jsPDF)

**Files:**
- Create: `src/lib/congress/download-payment-receipt-pdf.ts`

**Interfaces:**
- Consumes: `CongressPayment`, `paymentReceiptFilename`, logo path
- Produces:
  - `downloadCongressPaymentReceiptPdf(input: { payment; participantNames: Record<string, string>; zoneLabel?: string | null }): Promise<void>`

- [ ] **Step 1: Implementar descarga**

Patrón mínimo (inspirado en AE; sin copiar helpers de handoff enteros):

```ts
"use client";

import { jsPDF } from "jspdf";
import { paymentReceiptFilename } from "@/core/congress/payment-folio";
import type { CongressPayment } from "@/core/congress/types";
import { paymentMethodLabel } from "@/components/admin/congress/labels";
import { normalizePaymentMethod } from "@/core/congress/cash-box";

const LOGO_PATH = "/branding/ipn-chile/varones-nacional.png";

async function loadLogoDataUrl(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatClp(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

export async function downloadCongressPaymentReceiptPdf(input: {
  payment: CongressPayment;
  participantNames: Record<string, string>;
  zoneLabel?: string | null;
}): Promise<void> {
  const { payment } = input;
  if (!payment.folio) throw new Error("missing_folio");

  const logo = await loadLogoDataUrl();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  let y = margin;

  if (logo) {
    doc.addImage(logo, "PNG", margin, y, 28, 28);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Comprobante de ingreso", margin + (logo ? 34 : 0), y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Congreso Nacional de Varones 2026", margin + (logo ? 34 : 0), y + 18);
  y += 36;

  if (payment.status === "voided") {
    doc.setTextColor(180, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("ANULADO", 105, y, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y += 10;
  }

  const method = paymentMethodLabel(normalizePaymentMethod(payment.method));
  const lines: Array<[string, string]> = [
    ["Folio", payment.folio],
    ["Fecha de pago", payment.paidOn ?? payment.createdAt.slice(0, 10)],
    ["Tipo", method],
    ["Pagador", payment.payerName],
  ];
  if (payment.churchName) lines.push(["Iglesia", payment.churchName]);
  if (input.zoneLabel) lines.push(["Zona", input.zoneLabel]);
  lines.push(["Monto total", formatClp(payment.amountClp)]);
  if (payment.receiptRef) lines.push(["Referencia", payment.receiptRef]);
  if (payment.status === "voided" && payment.voidReason) {
    lines.push(["Motivo anulación", payment.voidReason]);
  }

  doc.setFontSize(11);
  for (const [k, v] of lines) {
    doc.setFont("helvetica", "bold");
    doc.text(`${k}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(v), margin + 45, y);
    y += 7;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Distribución", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");

  for (const row of payment.allocations) {
    const name =
      input.participantNames[row.registrationId] ??
      `Participante ${row.registrationId.slice(-6)}`;
    if (y > 270) {
      doc.addPage();
      y = margin;
    }
    doc.text(name, margin, y);
    doc.text(formatClp(row.amountClp), 194, y, { align: "right" });
    y += 7;
  }

  y = Math.max(y + 8, 275);
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    "Comprobante operativo de recaudación del Departamento de Varones (no es boleta ni factura SII).",
    margin,
    y,
    { maxWidth: 180 }
  );
  const emitted = new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" });
  doc.text(`Emitido: ${emitted}`, margin, y + 6);

  doc.save(paymentReceiptFilename(payment.folio));
}
```

Ajustar imports si `paymentMethodLabel` / `normalizePaymentMethod` viven en paths distintos; no inventar labels nuevos.

- [ ] **Step 2: Verificar que jsPDF ya está en package.json**

Si falta: `npm ls jspdf` — el proyecto AE ya lo usa; no agregar dependencia duplicada.

---

### Task 5: UI — descarga compartida + movimientos + post-guardado + ficha

**Files:**
- Modify: `src/components/admin/congress/CongressOpsPanel.tsx`
- Modify: `src/components/admin/congress/cash/CashBoxView.tsx`
- Modify: `src/components/admin/congress/participant/ParticipantSheet.tsx`

**Interfaces:**
- Produces:
  - Helper interno `downloadPaymentReceipt(payment: CongressPayment)` que:
    1. Si no hay `folio` → `POST /api/congress/payments/${id}/ensure-folio`
    2. Arma `participantNames` desde `registrations`
    3. `zoneLabel` = `formatZoneLabel` de la primera inscripción cubierta con `zoneId`, si hay
    4. Llama `downloadCongressPaymentReceiptPdf`
  - Estado `lastReceiptPayment: CongressPayment | null` tras éxito individual/grupal
  - Botón “Descargar comprobante” visible mientras `lastReceiptPayment` no sea null
  - `CashBoxView`: prop `onDownloadReceipt?: (payment) => void` + botón Comprobante
  - `ParticipantSheet`: props `payments` + `onDownloadReceipt`; lista filtrada por `allocations`

- [ ] **Step 1: Helper download en CongressOpsPanel**

```ts
const downloadPaymentReceipt = async (payment: CongressPayment) => {
  try {
    let current = payment;
    if (!current.folio) {
      const res = await fetch(`/api/congress/payments/${current._id}/ensure-folio`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.payment?.folio) {
        push({ title: "No se pudo asignar folio", tone: "error" });
        return;
      }
      current = data.payment;
      setPayments((prev) =>
        prev.map((p) => (p._id === current._id ? current : p))
      );
    }
    const names: Record<string, string> = {};
    let zoneLabel: string | null = null;
    for (const row of current.allocations) {
      const reg = registrations.find((r) => r._id === row.registrationId);
      if (reg) {
        names[row.registrationId] = reg.identity.fullName;
        if (!zoneLabel && reg.zoneId) zoneLabel = formatZoneLabel(reg.zoneId);
      }
    }
    await downloadCongressPaymentReceiptPdf({
      payment: current,
      participantNames: names,
      zoneLabel,
    });
  } catch {
    push({ title: "No se pudo generar el PDF", tone: "error" });
  }
};
```

- [ ] **Step 2: Post-éxito grupal e individual**

Tras `push({ title: "Pago grupal registrado", ...})` / `"Pago registrado"`:

```ts
if (data.payment) {
  setLastReceiptPayment(data.payment);
  setPayments((prev) => [data.payment, ...prev.filter((p) => p._id !== data.payment._id)]);
}
```

UI cerca del form grupal / en ficha:

```tsx
{lastReceiptPayment ? (
  <Button
    type="button"
    size="sm"
    variant="outline"
    onClick={() => void downloadPaymentReceipt(lastReceiptPayment)}
  >
    Descargar comprobante
  </Button>
) : null}
```

En individual: o bien el panel pasa `lastReceiptPayment` + callback a `ParticipantSheet`, o la ficha recibe `onPaymentSuccess` con el payment. Preferir: `individualPayment` retorna el payment al sheet vía cambiar firma a `Promise<CongressPayment | null>` **o** estado en panel + prop `receiptPayment` + `onDownloadReceipt` al sheet. Elegir la opción que menos rompa props existentes (prop `lastReceiptPayment` + `onDownloadReceipt` desde panel).

- [ ] **Step 3: CashBoxView — botón Comprobante**

Añadir prop:

```ts
onDownloadReceipt?: (payment: CongressPayment) => void;
```

En cada fila de Movimientos, junto a Anular:

```tsx
{onDownloadReceipt ? (
  <Button
    size="sm"
    variant="outline"
    onClick={() => onDownloadReceipt(p)}
  >
    Comprobante
  </Button>
) : null}
```

Pasar `onDownloadReceipt={(p) => void downloadPaymentReceipt(p)}` desde el panel.

- [ ] **Step 4: ParticipantSheet — comprobantes de la persona**

Props nuevas:

```ts
payments: CongressPayment[];
onDownloadReceipt: (payment: CongressPayment) => void;
lastReceiptPayment?: CongressPayment | null;
```

Filtrar:

```ts
const relatedPayments = payments.filter((p) =>
  p.allocations.some((a) => a.registrationId === registration._id)
);
```

En sección Alimentación / pagos: botón post-éxito si `lastReceiptPayment` imputa a esta ficha; lista “Comprobantes” con botón por pago.

- [ ] **Step 5: Verificación manual en navegador**

Checklist:
1. Pago individual → aparece CTA → PDF con folio, 1 fila, logo.
2. Pago grupal → PDF con N filas y total.
3. Movimientos → Comprobante → mismo folio.
4. Anular → Comprobante con ANULADO.
5. (Si hay pago legacy sin folio) ensure-folio asigna y descarga.

---

## Self-review (plan vs spec)

| Spec | Task |
|------|------|
| Folio CV-2026-##### al crear | Task 1–2 |
| ensure-folio legacy | Task 2–3 |
| PDF jsPDF + logo same-page header | Task 4 |
| Individual + grupal CTA post-save | Task 5 |
| Re-descarga Aportes/movimientos + ficha | Task 5 |
| Anulado con sello | Task 4–5 |
| Sin storage / sin SII / sin correo | Global Constraints |
| Toast sin forzar download | Task 5 (botón) |

Sin placeholders pendientes. Firmas alineadas: `formatPaymentFolio` → repo → `payment.folio` → PDF/`paymentReceiptFilename`.
