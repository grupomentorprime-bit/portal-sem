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

const THEME_LABELS: Record<FormLandingTheme, string> = {
  convocatoria: "Convocatoria",
  attendance: "Asistencia",
  absence: "Inasistencia",
  information: "Información",
  application: "Postulación",
  testimonial: "Testimonio",
};

const THEMES: FormLandingTheme[] = [
  "convocatoria",
  "attendance",
  "absence",
  "information",
  "application",
  "testimonial",
];

export function FormExperienceAppearancePanel({
  appearance,
  onChange,
}: FormExperienceAppearancePanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Estilo">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={appearance.theme}
          onChange={(e) =>
            onChange({ ...appearance, theme: e.target.value as FormLandingTheme })
          }
        >
          {THEMES.map((theme) => (
            <option key={theme} value={theme}>
              {THEME_LABELS[theme]}
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
          <option value="hero">Con portada</option>
          <option value="minimal">Simple</option>
          <option value="institutional">Institucional</option>
          <option value="landing">Página completa</option>
          <option value="event">Evento</option>
        </select>
      </Field>
      <Field label="Color principal">
        <Input
          value={appearance.primaryColor ?? ""}
          onChange={(e) => onChange({ ...appearance, primaryColor: e.target.value })}
          placeholder="Ej. el color de tu marca"
        />
      </Field>
      <Field label="Oscurecer imagen de fondo (%)">
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
      <Field label="Esquinas">
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
          <option value="soft">Redondeadas</option>
          <option value="default">Normales</option>
          <option value="sharp">Rectas</option>
        </select>
      </Field>
      <Field label="Sombra">
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
          <option value="elevated">Marcada</option>
        </select>
      </Field>
      <Field label="Ancho del contenido">
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
          <option value="default">Normal</option>
          <option value="wide">Amplio</option>
        </select>
      </Field>
      <Field label="Espacio entre bloques">
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
          <option value="compact">Junto</option>
          <option value="default">Normal</option>
          <option value="airy">Holgado</option>
        </select>
      </Field>
    </div>
  );
}
