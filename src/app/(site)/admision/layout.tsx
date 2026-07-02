import { requirePortalFeature } from "@/lib/portal/require-feature";

export default async function AdmisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePortalFeature("applications");
  return children;
}
