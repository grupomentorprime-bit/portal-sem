import { redirect } from "next/navigation";

export default function LegacyFormsRedirect() {
  redirect("/admin/portal/forms");
}
