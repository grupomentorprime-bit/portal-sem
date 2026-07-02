import { requirePortalFeature } from "@/lib/portal/require-feature";

export default async function PostulacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePortalFeature("applications");
  return children;
}
