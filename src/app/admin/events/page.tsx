import Link from "next/link";
import { EventsAdminClient } from "@/components/events/EventsAdminClient";
import { AdminSystemPanel } from "@/components/admin/AdminSystemPanel";
import { ADMIN_PANEL_META } from "@/lib/admin/module-panels";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function AdminEventsPage() {
  return (
    <AdminSystemPanel
      meta={ADMIN_PANEL_META.events}
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Event Bus" },
      ]}
      title="Event Bus"
      description="Domain Events, replay y dead letter queue"
      actions={
        <Link href="/admin/config">
          <Button variant="outline">Configuración</Button>
        </Link>
      }
    >
      <EventsAdminClient />
    </AdminSystemPanel>
  );
}
