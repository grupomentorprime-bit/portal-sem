import { requirePortalFeature } from "@/lib/portal/require-feature";

export default async function EventosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePortalFeature("events");
  return children;
}
