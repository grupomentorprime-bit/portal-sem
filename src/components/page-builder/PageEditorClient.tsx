"use client";

import { ExperienceStudio } from "@/components/visual-builder";
import type { BlockDefinition, CmsPage, CmsTemplate } from "@/types/page";
import type { SiteConfig } from "@/types/cms";

interface PageEditorClientProps {
  initialPage: CmsPage;
  blockLibrary: BlockDefinition[];
  templates: CmsTemplate[];
  config: SiteConfig;
}

export function PageEditorClient({
  initialPage,
  blockLibrary,
  templates,
  config,
}: PageEditorClientProps) {
  const handleSave = async (page: CmsPage, options?: { publish?: boolean }) => {
    const res = await fetch(`/api/cms/pages/${page._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: page.title,
        slug: page.slug,
        description: page.description,
        status: page.status,
        template: page.template,
        seo: page.seo,
        blocks: page.blocks,
        scheduledAt: page.scheduledAt,
        publish: options?.publish,
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "Error al guardar");
    return data.page as CmsPage;
  };

  return (
    <ExperienceStudio
      initialPage={initialPage}
      blockLibrary={blockLibrary}
      templates={templates}
      config={config}
      onSave={handleSave}
    />
  );
}
