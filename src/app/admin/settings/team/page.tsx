import { redirect } from "next/navigation";

export default function TeamSettingsRedirectPage() {
  redirect("/admin/settings/users");
}
