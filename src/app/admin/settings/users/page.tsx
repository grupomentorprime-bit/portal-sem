import { redirect } from "next/navigation";

/** Compatibilidad: Usuarios → Equipo (superficie canónica). */
export default function UsersSettingsRedirectPage() {
  redirect("/admin/settings/team");
}
