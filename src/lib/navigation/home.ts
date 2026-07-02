"use client";

import { usePathname } from "next/navigation";
import { useCallback } from "react";

export const HOME_SECTION_ID = "inicio";

export function isHomeHref(href: string): boolean {
  const path = href.split("#")[0] ?? "";
  return path === "" || path === "/";
}

export function scrollToHomeTop(behavior: ScrollBehavior = "smooth"): void {
  window.scrollTo({ top: 0, left: 0, behavior });
}

export function useHomeLinkHandler() {
  const pathname = usePathname();

  return useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (pathname === "/" && isHomeHref(href)) {
        event.preventDefault();
        scrollToHomeTop();
        if (window.location.hash) {
          window.history.replaceState(null, "", "/");
        }
      }
    },
    [pathname]
  );
}
