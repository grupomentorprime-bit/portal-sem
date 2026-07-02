import { requirePortalFeature } from "@/lib/portal/require-feature";

export default async function AvisosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePortalFeature("institutionalNotices");
  return children;
}
