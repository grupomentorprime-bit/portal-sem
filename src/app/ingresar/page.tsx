import { redirect } from "next/navigation";
import { toGrowthLoginPath } from "@/lib/identity/login-route";

export const dynamic = "force-dynamic";

/** Alias público del acceso a Growth OS. */
export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  redirect(toGrowthLoginPath({ next: params.next, error: params.error }));
}
