"use client";

import { MediaField } from "@/components/media/MediaPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormExperienceSeo, FormExperienceShare } from "@/types/experience-form-experience";

interface FormExperienceSeoPanelProps {
  tenantId: string;
  seo: FormExperienceSeo;
  share: FormExperienceShare;
  onChangeSeo: (seo: FormExperienceSeo) => void;
  onChangeShare: (share: FormExperienceShare) => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function FormExperienceSeoPanel({
  tenantId,
  seo,
  share,
  onChangeSeo,
  onChangeShare,
}: FormExperienceSeoPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="admin-form-detail__section space-y-4">
        <h3 className="admin-form-detail__section-title">SEO</h3>
        <Field label="Título">
          <Input
            value={seo.title ?? ""}
            onChange={(e) => onChangeSeo({ ...seo, title: e.target.value })}
          />
        </Field>
        <Field label="Descripción">
          <Textarea
            rows={3}
            value={seo.description ?? ""}
            onChange={(e) => onChangeSeo({ ...seo, description: e.target.value })}
          />
        </Field>
        <Field label="Keywords (separadas por coma)">
          <Input
            value={seo.keywords.join(", ")}
            onChange={(e) =>
              onChangeSeo({
                ...seo,
                keywords: e.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
        <MediaField
          label="Imagen Open Graph"
          tenant={tenantId}
          folder="Hero"
          value={seo.openGraphImageId ?? ""}
          onChange={(mediaId) => onChangeSeo({ ...seo, openGraphImageId: mediaId })}
          onAssetChange={(asset) =>
            onChangeSeo({ ...seo, openGraphImageUrl: asset?.url })
          }
        />
      </section>

      <section className="admin-form-detail__section space-y-4">
        <h3 className="admin-form-detail__section-title">Compartir</h3>
        <Field label="Texto WhatsApp">
          <Textarea
            rows={2}
            value={share.whatsappText ?? ""}
            onChange={(e) => onChangeShare({ ...share, whatsappText: e.target.value })}
          />
        </Field>
        <Field label="Texto Facebook">
          <Textarea
            rows={2}
            value={share.facebookText ?? ""}
            onChange={(e) => onChangeShare({ ...share, facebookText: e.target.value })}
          />
        </Field>
        <Field label="Asunto correo">
          <Input
            value={share.emailSubject ?? ""}
            onChange={(e) => onChangeShare({ ...share, emailSubject: e.target.value })}
          />
        </Field>
        <Field label="Cuerpo correo">
          <Textarea
            rows={3}
            value={share.emailBody ?? ""}
            onChange={(e) => onChangeShare({ ...share, emailBody: e.target.value })}
          />
        </Field>
        <Field label="Etiqueta copiar enlace">
          <Input
            value={share.copyLinkLabel ?? ""}
            onChange={(e) => onChangeShare({ ...share, copyLinkLabel: e.target.value })}
          />
        </Field>
      </section>
    </div>
  );
}
