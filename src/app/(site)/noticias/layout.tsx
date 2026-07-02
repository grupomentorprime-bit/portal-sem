import { requirePortalFeature } from "@/lib/portal/require-feature";

export default async function NoticiasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePortalFeature("news");
  return children;
}
