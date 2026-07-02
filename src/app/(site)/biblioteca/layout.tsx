import { requirePortalFeature } from "@/lib/portal/require-feature";

export default async function BibliotecaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePortalFeature("library");
  return children;
}
