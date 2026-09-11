"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SeoConfig } from "@/types/cms";

interface SeoEditorProps {
  value: SeoConfig;
  onChange: (value: SeoConfig) => void;
}

export function SeoEditor({ value, onChange }: SeoEditorProps) {
  const update = <K extends keyof SeoConfig>(key: K, fieldValue: SeoConfig[K]) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO y metadatos</CardTitle>
        <CardDescription>
          Estos valores alimentan automáticamente metadata, Open Graph y Twitter Cards.
        </CardDescription>
      </CardHeader>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Título SEO</Label>
          <Input
            value={value.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Título del sitio"
          />
        </div>

        <div>
          <Label className="mb-2 block">Descripción</Label>
          <Textarea
            value={value.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Descripción del sitio"
          />
        </div>

        <div>
          <Label className="mb-2 block">Palabras clave</Label>
          <Input
            value={value.keywords.join(", ")}
            onChange={(e) =>
              update(
                "keywords",
                e.target.value
                  .split(",")
                  .map((k) => k.trim())
                  .filter(Boolean)
              )
            }
            placeholder="educación, programas, admisión"
          />
          <p className="mt-1 text-xs text-gray-400">Separadas por comas.</p>
        </div>
      </div>
    </Card>
  );
}
