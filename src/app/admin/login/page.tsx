import { redirect } from "next/navigation";
import { toGrowthLoginPath } from "@/lib/identity/login-route";

export const dynamic = "force-dynamic";

/**
 * Compatibilidad: la entrada oficial es /login.
 * Conserva next y error para no romper enlaces antiguos.
 */
export default async function AdminLoginRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  redirect(toGrowthLoginPath({ next: params.next, error: params.error }));
}
