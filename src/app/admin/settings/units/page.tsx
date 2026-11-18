import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { UnitsSettingsClient } from "@/components/admin/UnitsSettingsClient";

export const dynamic = "force-dynamic";

export default function UnidadesPage() {
  return (
    <AdminPageFrame
      title="Unidades"
      description="Departamentos de este Espacio. La administración central los supervisa."
      actions={<></>}
    >
      <UnitsSettingsClient />
    </AdminPageFrame>
  );
}
