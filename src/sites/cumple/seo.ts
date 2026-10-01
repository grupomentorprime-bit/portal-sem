import { CUMPLE_SEO, cumpleSite } from "@/sites/cumple/site";

function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function resolveCumpleSeo(pathname: string): { title: string; description: string } {
  const path = normalizePath(pathname);
  const page = cumpleSite.pages.find((entry) => entry.path === path);
  if (!page) return { title: CUMPLE_SEO.title, description: CUMPLE_SEO.description };
  return {
    title: page.title,
    description: page.description ?? CUMPLE_SEO.description,
  };
}
