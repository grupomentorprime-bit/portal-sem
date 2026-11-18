import type { ReactNode } from "react";
import { PublicVendorCredit } from "@/components/portal/PublicVendorCredit";

/**
 * Envuelve cualquier superficie pública.
 * Si la página ya muestra el crédito de Mentor Prime, el de respaldo se oculta.
 * Si no, queda al final. Así los sitios y formularios nuevos no pueden omitirlo.
 */
export function PublicSurface({ children }: { children: ReactNode }) {
  return (
    <div className="public-surface">
      <div className="public-surface__content">{children}</div>
      <footer className="public-vendor-credit-guarantee" aria-label="Crédito">
        <PublicVendorCredit />
      </footer>
    </div>
  );
}
