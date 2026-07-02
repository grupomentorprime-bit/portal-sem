import type { ExperienceFormDefinition } from "@/types/experience-forms";

interface PortalFormHeaderProps {
  form: ExperienceFormDefinition;
  overline?: string;
  title?: string;
  description?: string;
}

export function PortalFormHeader({
  form,
  overline,
  title,
  description,
}: PortalFormHeaderProps) {
  const heading = title?.trim() || form.name;
  const body = description?.trim() || form.description;

  return (
    <header className="portal-experience-form__header">
      {overline ? (
        <p className="portal-experience-form__overline">{overline}</p>
      ) : null}
      <h2 className="portal-experience-form__title" id="portal-form-title">
        {heading}
      </h2>
      {body ? <p className="portal-experience-form__description">{body}</p> : null}
    </header>
  );
}
