"use client";

import { Input, Label, Textarea } from "@/components/ui";
import type { CmsPage } from "@/types/page";

interface PageSettingsProps {
  page: CmsPage;
  onChange: (updates: Partial<CmsPage>) => void;
}

export function PageSettings({ page, onChange }: PageSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Título de la página</Label>
        <Input
          value={page.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Slug</Label>
        <Input
          value={page.slug}
          onChange={(e) => onChange({ slug: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <Textarea
          value={page.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>SEO — Título</Label>
        <Input
          value={page.seo.title ?? ""}
          onChange={(e) => onChange({ seo: { ...page.seo, title: e.target.value } })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>SEO — Descripción</Label>
        <Textarea
          value={page.seo.description ?? ""}
          onChange={(e) => onChange({ seo: { ...page.seo, description: e.target.value } })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Programar publicación</Label>
        <Input
          type="datetime-local"
          value={page.scheduledAt?.slice(0, 16) ?? ""}
          onChange={(e) =>
            onChange({
              scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
            })
          }
        />
      </div>
    </div>
  );
}
