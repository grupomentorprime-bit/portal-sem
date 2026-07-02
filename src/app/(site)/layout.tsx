import { PortalShell } from "@/components/portal/PortalShell";
import { isFocusedFormPath } from "@/lib/portal/form-focused";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";
  const formFocused =
    headerList.get("x-form-focused") === "1" || isFocusedFormPath(pathname);

  if (formFocused) {
    return children;
  }

  return <PortalShell>{children}</PortalShell>;
}
