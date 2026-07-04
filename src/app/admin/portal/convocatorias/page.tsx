import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Alias legacy — resultados viven en asuntos estudiantiles. */
export default function ConvocatoriasIndexPage() {
  redirect("/admin/portal/asuntos-estudiantiles");
}
