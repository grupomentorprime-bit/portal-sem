import {
  VENDOR_CREDIT_LABEL,
  VENDOR_CREDIT_URL,
} from "@/core/branding/display";

interface PublicVendorCreditProps {
  className?: string;
}

/** Crédito fijo en superficies públicas: enlace a Mentor Prime Consultores. */
export function PublicVendorCredit({ className }: PublicVendorCreditProps) {
  const classes = ["public-vendor-credit", className].filter(Boolean).join(" ");

  return (
    <p className={classes}>
      <a
        href={VENDOR_CREDIT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="public-vendor-credit__link"
      >
        {VENDOR_CREDIT_LABEL}
      </a>
    </p>
  );
}
