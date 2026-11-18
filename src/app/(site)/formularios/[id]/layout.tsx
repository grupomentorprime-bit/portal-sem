import { FormFocusedShell } from "@/components/portal/FormFocusedShell";

const VARONES_ATTENDANCE_FORM_ID = "ipn-asistencia-congreso-varones-2026";

/** Experiencia enfocada para cada formulario público (sin menú del portal). */
export default async function FormularioDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isVaronesAttendance = id === VARONES_ATTENDANCE_FORM_ID;

  return (
    <FormFocusedShell
      tone={isVaronesAttendance ? "corporate" : "default"}
      showBrandHeader={!isVaronesAttendance}
    >
      {children}
    </FormFocusedShell>
  );
}
