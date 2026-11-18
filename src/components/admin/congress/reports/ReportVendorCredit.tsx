"use client";

import { VENDOR_CREDIT_LABEL, VENDOR_CREDIT_URL } from "@/core/branding/display";

const CREDIT_TEXT = `${VENDOR_CREDIT_LABEL} · mentorprime.cl`;

type ReportVendorCreditProps = {
  /** Repite el crédito al pie de cada hoja al imprimir o guardar PDF. Una sola vez por documento. */
  repeatOnPrint?: boolean;
};

/** Crédito de Mentor Prime en cada informe. */
export function ReportVendorCredit({ repeatOnPrint = false }: ReportVendorCreditProps) {
  return (
    <>
      {repeatOnPrint ? (
        <style>{`
          .report-vendor-credit-fixed { display: none; }
          @media print {
            .report-vendor-credit { display: none !important; }
            .report-vendor-credit-fixed {
              display: block;
              position: fixed;
              bottom: 4mm;
              left: 12mm;
              right: 12mm;
              z-index: 2;
              background: #fff;
              color: var(--gray-700);
              text-align: center;
              font-size: 9px;
              line-height: 1.3;
            }
          }
        `}</style>
      ) : null}
      <p className="report-vendor-credit text-[11px] text-gray-600">
        <a
          href={VENDOR_CREDIT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-gray-800 underline-offset-2 hover:underline"
        >
          {VENDOR_CREDIT_LABEL}
        </a>
        {" · mentorprime.cl"}
      </p>
      {repeatOnPrint ? (
        <p className="report-vendor-credit-fixed" aria-hidden="true">
          {CREDIT_TEXT}
        </p>
      ) : null}
    </>
  );
}
