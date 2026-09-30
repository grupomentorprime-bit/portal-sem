import type { ContactInfo, SocialLinks } from "@/types/cms";
import type { CodedSite } from "@/sites/types";

export function CodedSiteView({
  site,
  path,
  institutionName,
  contact,
  social,
}: {
  site: CodedSite;
  path: string;
  institutionName: string;
  contact: ContactInfo;
  social: SocialLinks;
}) {
  const page = site.pages.find((item) => item.path === path);
  if (!page) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-muted">{institutionName}</p>
      <nav className="mt-4 flex gap-4 text-sm">
        {site.pages.map((item) => (
          <a key={item.path} href={item.path}>
            {item.navLabel}
          </a>
        ))}
      </nav>
      <h1 className="mt-8 text-3xl font-semibold">{page.title}</h1>
      <p className="mt-4 text-sm text-muted">{contact.email || social.instagram || ""}</p>
    </main>
  );
}
