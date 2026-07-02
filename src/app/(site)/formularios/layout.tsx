import { requirePortalFeature } from "@/lib/portal/require-feature";

export default async function FormulariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePortalFeature("forms");
  return children;
}
