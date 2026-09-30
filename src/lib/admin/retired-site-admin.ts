const RETIRED_EXACT = new Set([
  "/admin/pages",
  "/admin/menus",
  "/admin/media",
  "/admin/content",
]);

const RETIRED_PREFIXES = [
  "/admin/pages/",
  "/admin/menus/",
  "/admin/media/",
  "/admin/content/people",
  "/admin/content/team",
  "/admin/content/programs",
  "/admin/content/courses",
  "/admin/content/news",
  "/admin/content/events",
  "/admin/content/library",
  "/admin/content/academic-agenda",
  "/admin/content/academic_agenda",
  "/admin/content/avisos",
  "/admin/content/institutional_notices",
];

const RETIRED_SECTIONS = new Set([
  "people",
  "team",
  "programs",
  "courses",
  "news",
  "events",
  "library",
  "academic-agenda",
  "academic_agenda",
  "avisos",
  "institutional_notices",
]);

export function isRetiredContentSection(section: string): boolean {
  return RETIRED_SECTIONS.has(section);
}

export function isRetiredSiteAdminPath(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  if (RETIRED_EXACT.has(path)) return true;
  return RETIRED_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}
