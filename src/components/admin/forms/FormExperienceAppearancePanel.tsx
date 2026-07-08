"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormExperienceAppearance } from "@/types/experience-form-experience";
import type { FormLandingTheme } from "@/lib/admin/forms-center";

interface FormExperienceAppearancePanelProps {
  appearance: FormExperienceAppearance;
  onChange: (appearance: FormExperienceAppearance) => void;
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

const THEMES: FormLandingTheme[] = [
  "convocatoria",
  "attendance",
  "absence",
  "information",
  "application",
];

export function FormExperienceAppearancePanel({
  appearance,
  onChange,
}: FormExperienceAppearancePanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Tema visual">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={appearance.theme}
          onChange={(e) =>
            onChange({ ...appearance, theme: e.target.value as FormLandingTheme })
          }
        >
          {THEMES.map((theme) => (
            <option key={theme} value={theme}>
              {theme}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Diseño">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={appearance.layout}
          onChange={(e) =>
            onChange({
              ...appearance,
              layout: e.target.value as FormExperienceAppearance["layout"],
            })
          }
        >
          <option value="hero">Hero</option>
          <option value="minimal">Minimal</option>
          <option value="institutional">Institucional</option>
          <option value="landing">Landing</option>
          <option value="event">Evento</option>
        </select>
      </Field>
      <Field label="Color principal">
        <Input
          value={appearance.primaryColor ?? ""}
          onChange={(e) => onChange({ ...appearance, primaryColor: e.target.value })}
          placeholder="Color primario institucional"
        />
      </Field>
      <Field label="Overlay (%)">
        <Input
          type="number"
          min={0}
          max={100}
          value={appearance.overlayOpacity}
          onChange={(e) =>
            onChange({ ...appearance, overlayOpacity: Number(e.target.value) || 0 })
          }
        />
      </Field>
      <Field label="Bordes">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={appearance.borderRadius}
          onChange={(e) =>
            onChange({
              ...appearance,
              borderRadius: e.target.value as FormExperienceAppearance["borderRadius"],
            })
          }
        >
          <option value="soft">Suaves</option>
          <option value="default">Estándar</option>
          <option value="sharp">Rectos</option>
        </select>
      </Field>
      <Field label="Sombras">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={appearance.shadow}
          onChange={(e) =>
            onChange({
              ...appearance,
              shadow: e.target.value as FormExperienceAppearance["shadow"],
            })
          }
        >
          <option value="none">Sin sombra</option>
          <option value="soft">Suave</option>
          <option value="elevated">Elevada</option>
        </select>
      </Field>
      <Field label="Ancho">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={appearance.contentWidth}
          onChange={(e) =>
            onChange({
              ...appearance,
              contentWidth: e.target.value as FormExperienceAppearance["contentWidth"],
            })
          }
        >
          <option value="narrow">Estrecho</option>
          <option value="default">Estándar</option>
          <option value="wide">Amplio</option>
        </select>
      </Field>
      <Field label="Espaciado">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={appearance.spacing}
          onChange={(e) =>
            onChange({
              ...appearance,
              spacing: e.target.value as FormExperienceAppearance["spacing"],
            })
          }
        >
          <option value="compact">Compacto</option>
          <option value="default">Estándar</option>
          <option value="airy">Amplio</option>
        </select>
      </Field>
    </div>
  );
}
