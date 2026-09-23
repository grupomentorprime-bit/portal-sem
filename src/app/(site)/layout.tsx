import { PortalShell } from "@/components/portal/PortalShell";
import { isFocusedFormPath } from "@/lib/portal/form-focused";
import { getPortalContext } from "@/lib/portal/site";
import {
  resolveRequestHost,
  shouldEnterPlatformHome,
} from "@/core/tenant/hosts";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const host = resolveRequestHost(headerList);
  const pathname = headerList.get("x-pathname") ?? "";
  const ctx = await getPortalContext();

  if (shouldEnterPlatformHome(host, Boolean(ctx))) {
    if (pathname !== "/" && pathname !== "") {
      redirect("/");
    }
    return children;
  }
  const formFocused =
    headerList.get("x-form-focused") === "1" || isFocusedFormPath(pathname);

  if (formFocused) {
    return children;
  }

  return <PortalShell>{children}</PortalShell>;
}
