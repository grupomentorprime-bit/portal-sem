import { FormFocusedShell } from "@/components/portal/FormFocusedShell";

/** Experiencia enfocada para cada formulario público (sin menú del portal). */
export default function FormularioDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FormFocusedShell>{children}</FormFocusedShell>;
}
