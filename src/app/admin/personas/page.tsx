import { PersonasListClient } from "@/components/admin/growth/PersonasListClient";
import { listGrowthPersonaViews } from "@/lib/growth/personas-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
  }>;
}

export default async function AdminPersonasPage({ searchParams }: PageProps) {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId) {
    redirect("/admin/login?next=/admin/personas");
  }

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const opportunityType = params.type?.trim() ?? "";
  const opportunityStatus = params.status?.trim() ?? "";

  const items = await listGrowthPersonaViews(tenantId, {
    q: q || undefined,
    opportunityType: opportunityType || undefined,
    opportunityStatus: opportunityStatus || undefined,
  });

  return (
    <PersonasListClient
      items={items}
      q={q}
      opportunityType={opportunityType}
      opportunityStatus={opportunityStatus}
    />
  );
}
