"use client";

import { Input, Label, Textarea } from "@/components/ui";
import { MediaField } from "@/components/media/MediaPicker";
import { AudienceProfilesBuilder } from "@/components/admin/builders/AudienceProfilesBuilder";
import type { AudienceProfileItem } from "@/components/portal/home/audience";
import { parseAudienceProfiles } from "@/lib/portal/audience-profiles";
import { BlockDataSourceEditor } from "./BlockDataSourceEditor";
import type { PageBlock } from "@/types/page";

interface BlockEditorProps {
  block: PageBlock;
  onChange: (block: PageBlock) => void;
  tenant: string;
}

function updateSetting(
  block: PageBlock,
  key: string,
  value: unknown,
  onChange: (block: PageBlock) => void
) {
  onChange({
    ...block,
    settings: { ...block.settings, [key]: value },
  });
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

export function BlockEditor({ block, onChange, tenant }: BlockEditorProps) {
  const s = block.settings;

  switch (block.type) {
    case "hero": {
      const variant = String(s.variant ?? "default");
      const isPremium = variant === "sem_premium";
      const generationCard =
        s.generationCard && typeof s.generationCard === "object"
          ? (s.generationCard as Record<string, unknown>)
          : {};
      const primaryCta =
        s.primaryCta && typeof s.primaryCta === "object"
          ? (s.primaryCta as Record<string, unknown>)
          : {};
      const secondaryCta =
        s.secondaryCta && typeof s.secondaryCta === "object"
          ? (s.secondaryCta as Record<string, unknown>)
          : {};

      return (
        <div className="space-y-4">
          <Field label="Variante">
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={variant}
              onChange={(e) => updateSetting(block, "variant", e.target.value, onChange)}
            >
              <option value="default">Institucional (default)</option>
              <option value="sem_premium">SEM Premium</option>
            </select>
          </Field>

          {isPremium ? (
            <>
              <Field label="Eyebrow">
                <Input
                  value={String(s.eyebrow ?? "")}
                  onChange={(e) => updateSetting(block, "eyebrow", e.target.value, onChange)}
                />
              </Field>
              <Field label="Título (use \\n para saltos de línea)">
                <Textarea
                  value={String(s.title ?? "")}
                  onChange={(e) => updateSetting(block, "title", e.target.value, onChange)}
                  rows={3}
                />
              </Field>
              <Field label="Palabra destacada (teal)">
                <Input
                  value={String(s.highlight ?? "")}
                  onChange={(e) => updateSetting(block, "highlight", e.target.value, onChange)}
                />
              </Field>
              <Field label="Descripción">
                <Textarea
                  value={String(s.description ?? "")}
                  onChange={(e) => updateSetting(block, "description", e.target.value, onChange)}
                  rows={3}
                />
              </Field>
              <Field label="CTA primario — etiqueta">
                <Input
                  value={String(primaryCta.label ?? s.primaryLabel ?? "")}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      settings: {
                        ...s,
                        primaryCta: { ...primaryCta, label: e.target.value },
                      },
                    })
                  }
                />
              </Field>
              <Field label="CTA primario — enlace">
                <Input
                  value={String(primaryCta.href ?? s.primaryHref ?? "")}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      settings: {
                        ...s,
                        primaryCta: { ...primaryCta, href: e.target.value },
                      },
                    })
                  }
                />
              </Field>
              <Field label="CTA secundario — etiqueta">
                <Input
                  value={String(secondaryCta.label ?? s.secondaryLabel ?? "")}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      settings: {
                        ...s,
                        secondaryCta: { ...secondaryCta, label: e.target.value },
                      },
                    })
                  }
                />
              </Field>
              <Field label="CTA secundario — enlace">
                <Input
                  value={String(secondaryCta.href ?? s.secondaryHref ?? "")}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      settings: {
                        ...s,
                        secondaryCta: { ...secondaryCta, href: e.target.value },
                      },
                    })
                  }
                />
              </Field>
              <Field label="Texto alternativo de imagen">
                <Input
                  value={String(s.imageAlt ?? s.heroImageAlt ?? "")}
                  onChange={(e) => updateSetting(block, "imageAlt", e.target.value, onChange)}
                />
              </Field>
              <Field label="Tarjeta generación — etiqueta">
                <Input
                  value={String(generationCard.label ?? "")}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      settings: {
                        ...s,
                        generationCard: { ...generationCard, label: e.target.value },
                      },
                    })
                  }
                />
              </Field>
              <Field label="Tarjeta generación — año">
                <Input
                  value={String(generationCard.year ?? "")}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      settings: {
                        ...s,
                        generationCard: { ...generationCard, year: e.target.value },
                      },
                    })
                  }
                />
              </Field>
              <Field label="Tarjeta generación — descripción">
                <Textarea
                  value={String(generationCard.description ?? "")}
                  onChange={(e) =>
                    onChange({
                      ...block,
                      settings: {
                        ...s,
                        generationCard: { ...generationCard, description: e.target.value },
                      },
                    })
                  }
                  rows={2}
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Título / Nombre institución">
                <Input
                  value={String(s.institutionName ?? "")}
                  onChange={(e) => updateSetting(block, "institutionName", e.target.value, onChange)}
                />
              </Field>
              <Field label="Lema">
                <Input
                  value={String(s.motto ?? "")}
                  onChange={(e) => updateSetting(block, "motto", e.target.value, onChange)}
                />
              </Field>
              <Field label="Texto del botón">
                <Input
                  value={String(s.ctaLabel ?? "")}
                  onChange={(e) => updateSetting(block, "ctaLabel", e.target.value, onChange)}
                />
              </Field>
              <Field label="Enlace del botón">
                <Input
                  value={String(s.ctaHref ?? "")}
                  onChange={(e) => updateSetting(block, "ctaHref", e.target.value, onChange)}
                />
              </Field>
            </>
          )}

          <MediaField
            label="Imagen hero"
            value={String(s.heroMediaId ?? s.heroImage ?? "")}
            onChange={(mediaId) =>
              onChange({
                ...block,
                settings: { ...s, heroMediaId: mediaId, heroImage: "" },
              })
            }
            tenant={tenant}
            folder="Hero"
            category="Imagen"
          />
        </div>
      );
    }

    case "text":
      return (
        <div className="space-y-4">
          <Field label="Overline">
            <Input value={String(s.overline ?? "")} onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)} />
          </Field>
          <Field label="Título">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Contenido">
            <Textarea value={String(s.body ?? "")} onChange={(e) => updateSetting(block, "body", e.target.value, onChange)} />
          </Field>
        </div>
      );

    case "presentation":
      return (
        <div className="space-y-4">
          <Field label="Overline">
            <Input value={String(s.overline ?? "")} onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)} />
          </Field>
          <Field label="Título">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Subtítulo">
            <Input value={String(s.subtitle ?? "")} onChange={(e) => updateSetting(block, "subtitle", e.target.value, onChange)} />
          </Field>
          <Field label="Descripción">
            <Textarea value={String(s.description ?? "")} onChange={(e) => updateSetting(block, "description", e.target.value, onChange)} />
          </Field>
          <Field label="Puntos destacados (JSON)">
            <Textarea
              className="min-h-48 font-mono text-xs"
              value={JSON.stringify(s.highlights ?? [], null, 2)}
              onChange={(e) => {
                try {
                  updateSetting(block, "highlights", JSON.parse(e.target.value), onChange);
                } catch {
                  /* ignore invalid json while typing */
                }
              }}
            />
          </Field>
        </div>
      );

    case "feature_grid":
      return (
        <div className="space-y-4">
          <Field label="Overline">
            <Input value={String(s.overline ?? "")} onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)} />
          </Field>
          <Field label="Título">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Descripción">
            <Textarea value={String(s.description ?? "")} onChange={(e) => updateSetting(block, "description", e.target.value, onChange)} />
          </Field>
          <Field label="Características (JSON) — title, description, icon, color, order, visible, url">
            <Textarea
              className="min-h-48 font-mono text-xs"
              value={JSON.stringify(s.features ?? [], null, 2)}
              onChange={(e) => {
                try {
                  updateSetting(block, "features", JSON.parse(e.target.value), onChange);
                } catch {
                  /* ignore invalid json while typing */
                }
              }}
            />
          </Field>
          <Field label="Título estado vacío">
            <Input value={String(s.emptyTitle ?? "")} onChange={(e) => updateSetting(block, "emptyTitle", e.target.value, onChange)} />
          </Field>
          <Field label="Descripción estado vacío">
            <Textarea value={String(s.emptyDescription ?? "")} onChange={(e) => updateSetting(block, "emptyDescription", e.target.value, onChange)} />
          </Field>
        </div>
      );

    case "audience_profiles": {
      const profiles = parseAudienceProfiles(s.profiles);
      return (
        <div className="space-y-6">
          <div className="space-y-4">
            <Field label="Antetítulo">
              <Input
                value={String(s.overline ?? "")}
                onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)}
              />
            </Field>
            <Field label="Título">
              <Input
                value={String(s.title ?? "")}
                onChange={(e) => updateSetting(block, "title", e.target.value, onChange)}
              />
            </Field>
            <Field label="Descripción">
              <Textarea
                value={String(s.description ?? "")}
                onChange={(e) => updateSetting(block, "description", e.target.value, onChange)}
              />
            </Field>
          </div>

          <MediaField
            label="Imagen lateral"
            tenant={tenant}
            folder="Galería"
            value={String(s.imageMediaId ?? s.image ?? "")}
            onChange={(mediaId) =>
              onChange({
                ...block,
                settings: { ...s, imageMediaId: mediaId, image: "" },
              })
            }
          />
          <Field label="Texto alternativo de la imagen">
            <Input
              value={String(s.imageAlt ?? "")}
              onChange={(e) => updateSetting(block, "imageAlt", e.target.value, onChange)}
            />
          </Field>
          <Field label="Cita editorial">
            <Textarea
              value={String(s.quote ?? "")}
              onChange={(e) => updateSetting(block, "quote", e.target.value, onChange)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Texto del botón">
              <Input
                value={String(s.ctaLabel ?? "")}
                onChange={(e) => updateSetting(block, "ctaLabel", e.target.value, onChange)}
              />
            </Field>
            <Field label="Enlace del botón">
              <Input
                value={String(s.ctaHref ?? "")}
                onChange={(e) => updateSetting(block, "ctaHref", e.target.value, onChange)}
                placeholder="/admision"
              />
            </Field>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
              Perfiles de audiencia
            </p>
            <AudienceProfilesBuilder
              items={profiles}
              onChange={(items: AudienceProfileItem[]) =>
                updateSetting(block, "profiles", items, onChange)
              }
            />
          </div>
        </div>
      );
    }

    case "modality":
      return (
        <div className="space-y-4">
          <Field label="Overline">
            <Input value={String(s.overline ?? "")} onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)} />
          </Field>
          <Field label="Título">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Subtítulo">
            <Input value={String(s.subtitle ?? "")} onChange={(e) => updateSetting(block, "subtitle", e.target.value, onChange)} />
          </Field>
          <Field label="Descripción">
            <Textarea value={String(s.description ?? "")} onChange={(e) => updateSetting(block, "description", e.target.value, onChange)} />
          </Field>
          <MediaField
            label="Imagen"
            value={String(s.imageMediaId ?? s.image ?? "")}
            onChange={(mediaId) =>
              onChange({
                ...block,
                settings: { ...s, imageMediaId: mediaId, image: "" },
              })
            }
            tenant={tenant}
            folder="Otros"
            category="Imagen"
          />
          <Field label="Puntos de modalidad (JSON)">
            <Textarea
              className="min-h-48 font-mono text-xs"
              value={JSON.stringify(s.items ?? [], null, 2)}
              onChange={(e) => {
                try {
                  updateSetting(block, "items", JSON.parse(e.target.value), onChange);
                } catch {
                  /* ignore */
                }
              }}
            />
          </Field>
          <Field label="Botón — etiqueta">
            <Input value={String(s.buttonLabel ?? "")} onChange={(e) => updateSetting(block, "buttonLabel", e.target.value, onChange)} />
          </Field>
          <Field label="Botón — enlace">
            <Input value={String(s.buttonHref ?? "")} onChange={(e) => updateSetting(block, "buttonHref", e.target.value, onChange)} />
          </Field>
        </div>
      );

    case "cta":
    case "cta_premium":
      return (
        <div className="space-y-4">
          <Field label="Eyebrow (overline)">
            <Input value={String(s.overline ?? "")} onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)} />
          </Field>
          <Field label="Título">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Descripción">
            <Textarea value={String(s.description ?? "")} onChange={(e) => updateSetting(block, "description", e.target.value, onChange)} />
          </Field>
          <Field label="Variante">
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={String(s.variant ?? "highlight")}
              onChange={(e) => updateSetting(block, "variant", e.target.value, onChange)}
            >
              <option value="center">Center</option>
              <option value="split">Split</option>
              <option value="banner">Banner</option>
              <option value="minimal">Minimal</option>
              <option value="highlight">Highlight</option>
            </select>
          </Field>
          <Field label="Fondo">
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={String(s.background ?? "primary")}
              onChange={(e) => updateSetting(block, "background", e.target.value, onChange)}
            >
              <option value="default">Default</option>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="surface">Surface</option>
              <option value="muted">Muted</option>
            </select>
          </Field>
          <Field label="Imagen (URL)">
            <Input value={String(s.image ?? "")} onChange={(e) => updateSetting(block, "image", e.target.value, onChange)} />
          </Field>
          <Field label="Botones (JSON, máx. 3 — campo action por botón)">
            <Textarea
              className="min-h-40 font-mono text-xs"
              value={JSON.stringify(s.buttons ?? [], null, 2)}
              onChange={(e) => {
                try {
                  updateSetting(block, "buttons", JSON.parse(e.target.value), onChange);
                } catch {
                  /* ignore invalid json while typing */
                }
              }}
              placeholder={'[{ "label": "...", "action": { "type": "url", "href": "/ruta" } }]'}
            />
          </Field>
          <p className="text-xs text-muted">
            Tipos de acción: ver{" "}
            <code>docs/core/CORE-EXPERIENCE-ACTIONS-v1.md</code>. Compatibilidad:{" "}
            <code>href</code> legacy se convierte automáticamente a{" "}
            <code>action.type: url</code>.
          </p>
          <Field label="Mostrar estadísticas">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(s.showStats)}
                onChange={(e) => updateSetting(block, "showStats", e.target.checked, onChange)}
              />
              Activar stats opcionales
            </label>
          </Field>
          <Field label="Estadísticas (JSON)">
            <Textarea
              className="min-h-32 font-mono text-xs"
              value={JSON.stringify(s.stats ?? [], null, 2)}
              onChange={(e) => {
                try {
                  updateSetting(block, "stats", JSON.parse(e.target.value), onChange);
                } catch {
                  /* ignore invalid json while typing */
                }
              }}
            />
          </Field>
          {block.type === "cta" ? (
            <>
              <Field label="Botón principal (legacy)">
                <Input value={String(s.primaryLabel ?? "")} onChange={(e) => updateSetting(block, "primaryLabel", e.target.value, onChange)} />
              </Field>
              <Field label="Enlace principal (legacy)">
                <Input value={String(s.primaryHref ?? "")} onChange={(e) => updateSetting(block, "primaryHref", e.target.value, onChange)} />
              </Field>
            </>
          ) : null}
        </div>
      );

    case "admission_process":
    case "timeline":
      return (
        <div className="space-y-4">
          <Field label="Overline">
            <Input value={String(s.overline ?? "")} onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)} />
          </Field>
          <Field label="Título">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Descripción">
            <Textarea value={String(s.description ?? "")} onChange={(e) => updateSetting(block, "description", e.target.value, onChange)} />
          </Field>
          {block.type === "timeline" ? (
            <>
              <Field label="Diseño (layout)">
                <select
                  className="w-full rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 text-sm"
                  value={String(s.layout ?? "auto")}
                  onChange={(e) => updateSetting(block, "layout", e.target.value, onChange)}
                >
                  <option value="auto">Auto</option>
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                </select>
              </Field>
              <Field label="Variante">
                <select
                  className="w-full rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 text-sm"
                  value={String(s.variant ?? "process")}
                  onChange={(e) => updateSetting(block, "variant", e.target.value, onChange)}
                >
                  <option value="process">Proceso</option>
                  <option value="chronology">Cronología</option>
                  <option value="calendar">Calendario</option>
                  <option value="route">Ruta</option>
                  <option value="steps">Pasos</option>
                  <option value="roadmap">Roadmap</option>
                </select>
              </Field>
            </>
          ) : null}
          <Field label="Etapas (JSON) — title, description, icon, step, order, status, color, date, visible, url">
            <Textarea
              className="min-h-48 font-mono text-xs"
              value={JSON.stringify(s.items ?? [], null, 2)}
              onChange={(e) => {
                try {
                  updateSetting(block, "items", JSON.parse(e.target.value), onChange);
                } catch {
                  /* ignore */
                }
              }}
            />
          </Field>
          {block.type === "timeline" ? (
            <>
              <Field label="Título estado vacío">
                <Input value={String(s.emptyTitle ?? "")} onChange={(e) => updateSetting(block, "emptyTitle", e.target.value, onChange)} />
              </Field>
              <Field label="Descripción estado vacío">
                <Textarea value={String(s.emptyDescription ?? "")} onChange={(e) => updateSetting(block, "emptyDescription", e.target.value, onChange)} />
              </Field>
            </>
          ) : null}
        </div>
      );

    case "scholarships":
    case "faq":
      return (
        <div className="space-y-4">
          <Field label="Overline">
            <Input value={String(s.overline ?? "")} onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)} />
          </Field>
          <Field label="Título">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Descripción">
            <Textarea value={String(s.description ?? "")} onChange={(e) => updateSetting(block, "description", e.target.value, onChange)} />
          </Field>
          <Field label="Items (JSON)">
            <Textarea
              className="min-h-48 font-mono text-xs"
              value={JSON.stringify(s.items ?? [], null, 2)}
              onChange={(e) => {
                try {
                  updateSetting(block, "items", JSON.parse(e.target.value), onChange);
                } catch {
                  /* ignore */
                }
              }}
            />
          </Field>
        </div>
      );

    case "quick_contact":
      return (
        <div className="space-y-4">
          <Field label="Overline">
            <Input value={String(s.overline ?? "")} onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)} />
          </Field>
          <Field label="Título">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Descripción">
            <Textarea value={String(s.description ?? "")} onChange={(e) => updateSetting(block, "description", e.target.value, onChange)} />
          </Field>
          <p className="text-caption text-muted">
            @deprecated — Usar bloque Contact Hub. Datos desde Configuración → Contacto.
          </p>
        </div>
      );

    case "contact_hub":
      return (
        <div className="space-y-4">
          <Field label="Eyebrow (overline)">
            <Input value={String(s.overline ?? "")} onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)} />
          </Field>
          <Field label="Título">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Descripción">
            <Textarea value={String(s.description ?? "")} onChange={(e) => updateSetting(block, "description", e.target.value, onChange)} />
          </Field>
          <Field label="Mostrar mapa">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(s.showMap ?? true)} onChange={(e) => updateSetting(block, "showMap", e.target.checked, onChange)} />
              Mapa
            </label>
          </Field>
          <Field label="Mostrar horario">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(s.showHours ?? true)} onChange={(e) => updateSetting(block, "showHours", e.target.checked, onChange)} />
              Horario
            </label>
          </Field>
          <Field label="Mostrar redes">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(s.showSocial ?? true)} onChange={(e) => updateSetting(block, "showSocial", e.target.checked, onChange)} />
              Redes sociales
            </label>
          </Field>
          <Field label="Mostrar formulario (acción)">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(s.showForm ?? true)} onChange={(e) => updateSetting(block, "showForm", e.target.checked, onChange)} />
              Botón solicitar información
            </label>
          </Field>
          <Field label="ID formulario">
            <Input value={String(s.formId ?? "contact")} onChange={(e) => updateSetting(block, "formId", e.target.value, onChange)} />
          </Field>
          <Field label="Proveedor mapa">
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={String(s.mapProvider ?? "google")}
              onChange={(e) => updateSetting(block, "mapProvider", e.target.value, onChange)}
            >
              <option value="google">Google Maps</option>
              <option value="openstreetmap">OpenStreetMap</option>
              <option value="apple">Apple Maps</option>
            </select>
          </Field>
          <Field label="Canales (JSON — vacío = Institution Config)">
            <Textarea
              className="min-h-32 font-mono text-xs"
              value={JSON.stringify(s.channels ?? [], null, 2)}
              onChange={(e) => {
                try {
                  updateSetting(block, "channels", JSON.parse(e.target.value), onChange);
                } catch {
                  /* ignore */
                }
              }}
            />
          </Field>
          <Field label="Acciones (JSON)">
            <Textarea
              className="min-h-32 font-mono text-xs"
              value={JSON.stringify(s.actions ?? [], null, 2)}
              onChange={(e) => {
                try {
                  updateSetting(block, "actions", JSON.parse(e.target.value), onChange);
                } catch {
                  /* ignore */
                }
              }}
            />
          </Field>
          <p className="text-xs text-muted">
            Canales y contacto base desde Institution Config. Acciones vía Experience Actions Engine.
          </p>
        </div>
      );

    case "experience_form":
      return (
        <div className="space-y-4">
          <Field label="ID del formulario">
            <Input
              value={String(s.formId ?? "information-request")}
              onChange={(e) => updateSetting(block, "formId", e.target.value, onChange)}
            />
          </Field>
          <Field label="Eyebrow (overline)">
            <Input value={String(s.overline ?? "")} onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)} />
          </Field>
          <Field label="Título (opcional — usa nombre del formulario si vacío)">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Descripción">
            <Textarea value={String(s.description ?? "")} onChange={(e) => updateSetting(block, "description", e.target.value, onChange)} />
          </Field>
          <p className="text-xs text-muted">
            Formularios SEM: attendance-confirmation, absence-justification, information-request, program-application. Alias: contact → information-request.
          </p>
        </div>
      );

    case "footer_premium":
      return (
        <div className="space-y-4">
          <Field label="Mostrar descripción">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(s.showDescription ?? true)} onChange={(e) => updateSetting(block, "showDescription", e.target.checked, onChange)} />
              Descripción institucional
            </label>
          </Field>
          <Field label="Mostrar navegación">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(s.showNavigation ?? true)} onChange={(e) => updateSetting(block, "showNavigation", e.target.checked, onChange)} />
              Columnas de menú y programas
            </label>
          </Field>
          <Field label="Mostrar contacto">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(s.showContact ?? true)} onChange={(e) => updateSetting(block, "showContact", e.target.checked, onChange)} />
              Contact Hub
            </label>
          </Field>
          <Field label="Mostrar redes">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(s.showSocial ?? true)} onChange={(e) => updateSetting(block, "showSocial", e.target.checked, onChange)} />
              Redes sociales
            </label>
          </Field>
          <Field label="Mostrar legales">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(s.showLegal ?? true)} onChange={(e) => updateSetting(block, "showLegal", e.target.checked, onChange)} />
              Copyright y enlaces legales
            </label>
          </Field>
          <p className="text-xs text-muted">
            Datos desde Institution Config, Navigation y Contact Hub. El footer global del portal usa{" "}
            <code>portalExperience.footerPremium</code> en Configuration Hub.
          </p>
        </div>
      );

    case "alliance":
      return (
        <div className="space-y-4">
          <Field label="Título (vacío = nombre de organización en config)">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Descripción">
            <Textarea value={String(s.description ?? "")} onChange={(e) => updateSetting(block, "description", e.target.value, onChange)} />
          </Field>
          <p className="text-caption text-muted">Logo secundario desde Configuración → Branding.</p>
        </div>
      );

    case "programs":
    case "news":
    case "teachers":
    case "people":
    case "events":
    case "testimonials":
    case "gallery":
    case "library":
      return <BlockDataSourceEditor block={block} onChange={onChange} />;

    case "stats":
      return (
        <div className="space-y-4">
          <Field label="Overline">
            <Input value={String(s.overline ?? "")} onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)} />
          </Field>
          <Field label="Título de sección">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Estadísticas (JSON)">
            <Textarea
              className="min-h-48 font-mono text-xs"
              value={JSON.stringify(s.items ?? [], null, 2)}
              onChange={(e) => {
                try {
                  updateSetting(block, "items", JSON.parse(e.target.value), onChange);
                } catch {
                  /* ignore invalid json while typing */
                }
              }}
            />
          </Field>
        </div>
      );

    case "resources":
      return (
        <div className="space-y-4">
          <Field label="Overline">
            <Input value={String(s.overline ?? "")} onChange={(e) => updateSetting(block, "overline", e.target.value, onChange)} />
          </Field>
          <Field label="Título">
            <Input value={String(s.title ?? "")} onChange={(e) => updateSetting(block, "title", e.target.value, onChange)} />
          </Field>
          <Field label="Descripción">
            <Textarea value={String(s.description ?? "")} onChange={(e) => updateSetting(block, "description", e.target.value, onChange)} />
          </Field>
          <Field label="Recursos destacados (JSON)">
            <Textarea
              className="min-h-48 font-mono text-xs"
              value={JSON.stringify(s.items ?? [], null, 2)}
              onChange={(e) => {
                try {
                  updateSetting(block, "items", JSON.parse(e.target.value), onChange);
                } catch {
                  /* ignore */
                }
              }}
            />
          </Field>
        </div>
      );

    case "verse":
      return (
        <div className="space-y-4">
          <Field label="Texto">
            <Textarea value={String(s.text ?? "")} onChange={(e) => updateSetting(block, "text", e.target.value, onChange)} />
          </Field>
          <Field label="Referencia">
            <Input value={String(s.reference ?? "")} onChange={(e) => updateSetting(block, "reference", e.target.value, onChange)} />
          </Field>
          <Field label="Fondo (gradient | primary | soft)">
            <Input value={String(s.background ?? "gradient")} onChange={(e) => updateSetting(block, "background", e.target.value, onChange)} />
          </Field>
          <MediaField
            label="Imagen de fondo (opcional)"
            value={String(s.imageMediaId ?? s.image ?? "")}
            onChange={(mediaId) =>
              onChange({
                ...block,
                settings: { ...s, imageMediaId: mediaId, image: "" },
              })
            }
            tenant={tenant}
            folder="Otros"
            category="Imagen"
          />
        </div>
      );

    case "html":
    case "markdown":
      return (
        <Field label="Contenido">
          <Textarea
            className="min-h-48 font-mono text-xs"
            value={String(s.content ?? "")}
            onChange={(e) => updateSetting(block, "content", e.target.value, onChange)}
          />
        </Field>
      );

    default:
      return (
        <p className="text-caption text-muted">
          Editor básico no disponible para este bloque.
        </p>
      );
  }
}
