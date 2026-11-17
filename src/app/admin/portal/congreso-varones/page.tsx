import { redirect } from "next/navigation";
import { CONGRESS_VARONES_HOME_PATH } from "@/lib/admin/nav-access";

export const dynamic = "force-dynamic";

/** Alias: la administración vive en Formularios → Operación. */
export default function CongresoVaronesOpsPage() {
  redirect(CONGRESS_VARONES_HOME_PATH);
}