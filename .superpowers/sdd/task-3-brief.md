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

If the audit wants folio metadata, add `folio: result.payment.folio` in `metadata` (optional, recommended). Match style of sibling route `payments/[id]/void/route.ts` for params Promise pattern.
