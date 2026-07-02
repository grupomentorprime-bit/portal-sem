import { redirect } from "next/navigation";

interface LegacyFormEditorRedirectProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyFormEditorRedirect({ params }: LegacyFormEditorRedirectProps) {
  const { id } = await params;
  redirect(`/admin/portal/forms/${id}`);
}
