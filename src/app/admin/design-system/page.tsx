import { redirect } from "next/navigation";

/** @deprecated Usar /internal/design-system — OT-BRANDING-005 */
export default function AdminDesignSystemRedirect() {
  redirect("/internal/design-system");
}
