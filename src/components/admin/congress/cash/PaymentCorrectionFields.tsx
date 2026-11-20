"use client";

import { useState } from "react";
import { ClpAmountInput } from "@/components/admin/congress/ClpAmountInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  CONGRESS_PAYMENT_NOTE_MAX,
  congressTransferBankOptions,
  normalizeCongressTransferBank,
} from "@/core/congress/banks";
import type { CongressPayment, CongressPaymentMethod } from "@/core/congress/types";

export type PaymentCorrectionPatch = {
  payerName: string;
  method: CongressPaymentMethod;
  bank?: string;
  paidOn: string;
  receiptRef?: string;
  note?: string;
  amountClp: number;
};

export function PaymentCorrectionFields({
  payment,
  busy,
  onCancel,
  onSave,
}: {
  payment: CongressPayment;
  busy?: boolean;
  onCancel: () => void;
  onSave: (patch: PaymentCorrectionPatch) => Promise<boolean>;
}) {
  const amountLocked = payment.allocations.length > 1;
  const [amount, setAmount] = useState<number | null>(payment.amountClp);
  const [payerName, setPayerName] = useState(payment.payerName);
  const [method, setMethod] = useState<CongressPaymentMethod>(payment.method ?? "cash");
  const [bank, setBank] = useState(payment.bank ?? "");
  const [bankError, setBankError] = useState<string | null>(null);
  const [paidOn, setPaidOn] = useState(payment.paidOn ?? payment.createdAt.slice(0, 10));
  const [receiptRef, setReceiptRef] = useState(payment.receiptRef ?? "");
  const [note, setNote] = useState(payment.note ?? "");

  return (
    <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-white p-3">
      {amountLocked ? (
        <p className="col-span-2 text-xs text-muted">
          Este comprobante está repartido en varias fichas: el monto se mantiene.
          Puede corregir pagador, fecha, tipo y referencia las veces que haga falta.
        </p>
      ) : (
        <div className="col-span-2">
          <ClpAmountInput label="Monto" value={amount} onValueChange={setAmount} />
        </div>
      )}
      <div className="col-span-2">
        <Input
          label="Pagador"
          value={payerName}
          onChange={(event) => setPayerName(event.target.value)}
        />
      </div>
      <Select
        label="Tipo"
        value={method}
        onChange={(event) => {
          const next = event.target.value as CongressPaymentMethod;
          setMethod(next);
          if (next !== "transfer") {
            setBank("");
            setBankError(null);
          }
        }}
        options={[
          { value: "cash", label: "Efectivo" },
          { value: "transfer", label: "Transferencia" },
          { value: "other", label: "Otro" },
        ]}
      />
      <Input
        label="Fecha de pago"
        type="date"
        value={paidOn}
        onChange={(event) => setPaidOn(event.target.value)}
      />
      {method === "transfer" ? (
        <div className="col-span-2">
          <Select
            label="Banco"
            value={bank}
            error={bankError ?? undefined}
            onChange={(event) => {
              setBank(event.target.value);
              if (normalizeCongressTransferBank(event.target.value)) setBankError(null);
            }}
            options={congressTransferBankOptions()}
          />
        </div>
      ) : null}
      <div className="col-span-2">
        <Input
          label="Detalle"
          value={note}
          maxLength={CONGRESS_PAYMENT_NOTE_MAX}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
      <div className="col-span-2">
        <Input
          label="Referencia"
          value={receiptRef}
          onChange={(event) => setReceiptRef(event.target.value)}
        />
      </div>
      <div className="col-span-2 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          loading={busy}
          disabled={busy}
          onClick={() => {
            const nextAmount = amountLocked ? payment.amountClp : (amount ?? 0);
            if (!nextAmount || !payerName.trim() || !paidOn) return;
            if (method === "transfer" && !normalizeCongressTransferBank(bank)) {
              setBankError("Elija el banco.");
              return;
            }
            void onSave({
              payerName: payerName.trim(),
              method,
              bank: bank || undefined,
              paidOn,
              receiptRef: receiptRef.trim() || undefined,
              note: note.trim() || undefined,
              amountClp: nextAmount,
            }).then((ok) => {
              if (ok) onCancel();
            });
          }}
        >
          Guardar comprobante
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
