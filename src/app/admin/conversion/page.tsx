import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Compatibilidad: el panel comercial vive en Oportunidades. */
export default function AdminCommercialPanelRedirectPage() {
  redirect("/admin/ventas");
}
