"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SocialLinks } from "@/types/cms";

interface SocialLinksFormProps {
  value: SocialLinks;
  onChange: (value: SocialLinks) => void;
}

const fields: Array<{ key: keyof SocialLinks; label: string; placeholder: string }> = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/..." },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/..." },
];

export function SocialLinksForm({ value, onChange }: SocialLinksFormProps) {
  const update = <K extends keyof SocialLinks>(key: K, fieldValue: SocialLinks[K]) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redes sociales</CardTitle>
        <CardDescription>Enlaces a perfiles oficiales de la institución.</CardDescription>
      </CardHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key}>
            <Label className="mb-2 block">{field.label}</Label>
            <Input
              type="url"
              value={value[field.key]}
              onChange={(e) => update(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
