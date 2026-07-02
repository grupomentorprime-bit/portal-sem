import { requirePortalFeature } from "@/lib/portal/require-feature";

export default async function AgendaAcademicaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePortalFeature("academicAgenda");
  return children;
}
