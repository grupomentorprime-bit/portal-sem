"use client";

import { Button } from "@/components/ui";
import { blocksFromTemplate } from "@/lib/cms/page-defaults";
import type { CmsTemplate } from "@/types/page";

interface TemplateSelectorProps {
  templates: CmsTemplate[];
  onApply: (blocks: ReturnType<typeof blocksFromTemplate>) => void;
}

export function TemplateSelector({ templates, onApply }: TemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-caption text-muted">Aplicar plantilla (reemplaza bloques actuales)</p>
      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <Button
            key={template._id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm(`¿Aplicar plantilla "${template.name}"? Se reemplazarán los bloques.`)) {
                onApply(blocksFromTemplate(template));
              }
            }}
          >
            {template.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
