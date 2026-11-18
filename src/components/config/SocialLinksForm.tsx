"use client";

import { NetworkTile, type NetworkId } from "@/components/brand/NetworkMark";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SocialLinks } from "@/types/cms";

interface SocialLinksFormProps {
  value: SocialLinks;
  onChange: (value: SocialLinks) => void;
  /** false: solo campos, sin Card. */
  framed?: boolean;
}

const fields: Array<{
  key: keyof SocialLinks;
  network: NetworkId;
  label: string;
  placeholder: string;
}> = [
  { key: "facebook", network: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "instagram", network: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "youtube", network: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
  { key: "linkedin", network: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/..." },
  { key: "tiktok", network: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/..." },
  { key: "spotify", network: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/..." },
];

export function SocialLinksForm({ value, onChange, framed = true }: SocialLinksFormProps) {
  const update = <K extends keyof SocialLinks>(key: K, fieldValue: SocialLinks[K]) => {
    onChange({ ...value, [key]: fieldValue });
  };

  const fieldsGrid = (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.key}>
          <Label className="mb-2 flex items-center gap-2">
            <NetworkTile id={field.network} className="h-[22px] w-[22px] rounded-[7px]" />
            {field.label}
          </Label>
          <Input
            type="url"
            value={value[field.key]}
            onChange={(e) => update(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      ))}
    </div>
  );

  if (!framed) return fieldsGrid;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Redes sociales</CardTitle>
        <CardDescription>Enlaces a perfiles oficiales de la institución.</CardDescription>
      </CardHeader>
      {fieldsGrid}
    </Card>
  );
}
