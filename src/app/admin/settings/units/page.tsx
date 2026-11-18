import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { UnitsSettingsClient } from "@/components/admin/UnitsSettingsClient";

export const dynamic = "force-dynamic";

export default function UnidadesPage() {
  return (
    <AdminPageFrame
      title="Unidades"
      description="Departamentos, áreas y sedes de este Espacio. La administración central las supervisa. Cada unidad conserva sus personas, documentos y aplicaciones."
      actions={<></>}
    >
      <UnitsSettingsClient />
    </AdminPageFrame>
  );
}
