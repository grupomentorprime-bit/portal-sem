"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { executeExperienceAction } from "@/core/experience/actions";
import {
  normalizeFormSubmissionData,
  validateFormSubmission,
} from "@/core/experience/forms/validation";
import { CONGRESS_ZONES } from "@/core/congress/constants";
import {
  buildValidationSummaryItems,
  scrollToFirstFormError,
  type ValidationSummaryItem,
} from "@/lib/experience/forms/form-validation-ui";
import { useExperienceAction } from "@/components/portal/experience/ExperienceActionProvider";
import type { ExperienceFormDefinition } from "@/types/experience-forms";
import { PortalFormActions } from "./PortalFormActions";
import { PortalFormError } from "./PortalFormError";
import { PortalFormFields } from "./PortalFormFields";
import { PortalFormHeader } from "./PortalFormHeader";
import { PortalFormSuccess } from "./PortalFormSuccess";
import { PortalFormValidationSummary } from "./PortalFormValidationSummary";

type PublicHit = {
  registrationId: string;
  fullName: string;
  churchName: string;
  zoneId: string;
};

type RegistrationMode = "idle" | "roster" | "manual";

interface PortalCongressExperienceFormProps {
  form: ExperienceFormDefinition;
  overline?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  successMessage?: string;
  successTitle?: string;
  successExtras?: ReactNode;
  className?: string;
}

function formatZoneLabel(zoneId: string): string {
  const match = zoneId.trim().match(/^zona-(\d+)$/i);
  if (!match) return zoneId;
  return `Zona ${String(Number(match[1])).padStart(2, "0")}`;
}

function fieldName(
  form: ExperienceFormDefinition,
  candidates: string[]
): string | null {
  const names = new Set(form.fields.map((f) => f.name));
  for (const candidate of candidates) {
    if (names.has(candidate)) return candidate;
  }
  return null;
}

function initialValues(form: ExperienceFormDefinition): Record<string, unknown> {
  const values: Record<string, unknown> = {
    registrationMode: "idle",
    registrationId: "",
  };
  for (const field of form.fields) {
    if (field.defaultValue !== undefined) {
      values[field.name] = field.defaultValue;
    } else if (field.type === "checkbox") {
      values[field.name] = false;
    }
  }
  return values;
}

export function PortalCongressExperienceForm({
  form,
  overline,
  title,
  description,
  submitLabel,
  successMessage: successMessageOverride,
  successTitle,
  successExtras,
  className,
}: PortalCongressExperienceFormProps) {
  const actionCtx = useExperienceAction();
  const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(form));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationSummary, setValidationSummary] = useState<ValidationSummaryItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [alreadyEnrolledMessage, setAlreadyEnrolledMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<PublicHit[]>([]);
  const [suggestions, setSuggestions] = useState<PublicHit[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [suggestionsHasMore, setSuggestionsHasMore] = useState(false);
  const [registered, setRegistered] = useState<PublicHit[]>([]);
  const [registeredHasMore, setRegisteredHasMore] = useState(false);
  const [churchesByZone, setChurchesByZone] = useState<Record<string, string[]>>({});
  const [otherChurch, setOtherChurch] = useState(false);

  const mode = String(values.registrationMode ?? "idle") as RegistrationMode;
  const selectedId = String(values.registrationId ?? "").trim();

  const fullNameField = fieldName(form, ["fullName", "nombre", "name"]);
  const zoneField = fieldName(form, ["zona", "zoneId", "zone"]);
  const churchField = fieldName(form, ["iglesia", "churchName", "church"]);

  const formClass = useMemo(
    () =>
      ["portal-experience-form", "portal-experience-form--inline", className]
        .filter(Boolean)
        .join(" "),
    [className]
  );

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setValidationSummary((prev) => (prev.length > 0 ? [] : prev));
    setGlobalError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/experience/forms/congress/churches");
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data.ok) {
          setChurchesByZone(data.churchesByZone ?? {});
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (mode === "roster" && selectedId) return;
    if (q.length < 2) {
      setMatches([]);
      setSuggestions([]);
      setRegistered([]);
      setHasMore(false);
      setSuggestionsHasMore(false);
      setRegisteredHasMore(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const res = await fetch(
            `/api/experience/forms/congress/roster/search?q=${encodeURIComponent(q)}`
          );
          const data = await res.json().catch(() => ({}));
          if (cancelled) return;
          if (!res.ok || !data.ok) {
            setMatches([]);
            setSuggestions([]);
            setRegistered([]);
            return;
          }
          setMatches(data.matches ?? []);
          setSuggestions(data.suggestions ?? []);
          setRegistered(data.registered ?? []);
          setHasMore(Boolean(data.hasMore));
          setSuggestionsHasMore(Boolean(data.suggestionsHasMore));
          setRegisteredHasMore(Boolean(data.registeredHasMore));
        } finally {
          if (!cancelled) setSearching(false);
        }
      })();
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, mode, selectedId]);

  const applyHit = (hit: PublicHit) => {
    setValues((prev) => {
      const next: Record<string, unknown> = {
        ...prev,
        registrationMode: "roster",
        registrationId: hit.registrationId,
      };
      if (fullNameField) next[fullNameField] = hit.fullName;
      if (zoneField) next[zoneField] = hit.zoneId;
      if (churchField) next[churchField] = hit.churchName;
      return next;
    });
    setQuery(hit.fullName);
    setMatches([]);
    setSuggestions([]);
    setGlobalError(null);
  };

  const enableManual = () => {
    setValues((prev) => ({
      ...prev,
      registrationMode: "manual",
      registrationId: "",
    }));
    setMatches([]);
    setSuggestions([]);
  };

  const clearSelection = () => {
    setValues((prev) => {
      const next: Record<string, unknown> = {
        ...prev,
        registrationMode: "idle",
        registrationId: "",
      };
      if (fullNameField) next[fullNameField] = "";
      if (zoneField) next[zoneField] = "";
      if (churchField) next[churchField] = "";
      return next;
    });
    setQuery("");
  };

  const zoneValue = zoneField ? String(values[zoneField] ?? "") : "";
  const churchOptions = zoneValue ? churchesByZone[zoneValue] ?? [] : [];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setGlobalError(null);
    setValidationSummary([]);

    if (mode === "idle") {
      setGlobalError(
        "Busca tu nombre en la nómina o usa «No aparezco en la lista» para registrarte."
      );
      return;
    }

    const normalizedValues = normalizeFormSubmissionData(form, values);
    const clientErrors = validateFormSubmission(form, normalizedValues);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setValidationSummary(buildValidationSummaryItems(clientErrors, form));
      scrollToFirstFormError();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/experience/forms/${encodeURIComponent(form._id)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: normalizedValues }),
      });
      const payload = (await res.json()) as {
        ok: boolean;
        message?: string;
        errors?: Record<string, string>;
        error?: string;
        alreadyRegistered?: boolean;
      };

      if (payload.alreadyRegistered) {
        setAlreadyEnrolledMessage(
          payload.error ??
            payload.message ??
            "Ya estás inscrito. No necesitas enviar el formulario otra vez."
        );
        return;
      }

      if (!payload.ok) {
        if (payload.errors) {
          setErrors(payload.errors);
          setValidationSummary(buildValidationSummaryItems(payload.errors, form));
          scrollToFirstFormError();
        }
        setGlobalError(payload.error ?? payload.message ?? form.errorMessage);
        return;
      }

      const message =
        payload.message ??
        form.postSubmit?.message ??
        (successMessageOverride?.trim() ||
          form.successMessage ||
          "Formulario enviado correctamente.");

      if (form.postSubmit?.action) {
        await executeExperienceAction(form.postSubmit.action, actionCtx);
      }
      setSuccessMessage(message);
    } catch {
      setGlobalError(form.errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (alreadyEnrolledMessage) {
    return (
      <div className={`${formClass} portal-experience-form--submitted`}>
        <PortalFormSuccess
          kicker="Inscripción existente"
          title="Ya estás inscrito"
          message={alreadyEnrolledMessage}
          variant="overlay"
          className="portal-experience-form__success--registered"
          onClose={() => setAlreadyEnrolledMessage(null)}
          closeLabel="Volver al formulario"
        >
          {successExtras}
        </PortalFormSuccess>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className={`${formClass} portal-experience-form--submitted`}>
        <PortalFormSuccess title={successTitle} message={successMessage} variant="overlay">
          {successExtras}
        </PortalFormSuccess>
      </div>
    );
  }

  const showLookup = mode !== "roster" || !selectedId;
  const trimmedQuery = query.trim();

  return (
    <form className={formClass} onSubmit={handleSubmit} noValidate aria-labelledby="portal-form-title">
      <PortalFormHeader form={form} overline={overline} title={title} description={description} />

      {validationSummary.length > 0 ? <PortalFormValidationSummary items={validationSummary} /> : null}
      {globalError ? <PortalFormError message={globalError} /> : null}

      <div className="portal-experience-form__stack space-y-6">
        {showLookup ? (
          <div className="space-y-3">
            <Input
              label="Busca tu nombre en la nómina"
              placeholder="Escribe tu nombre o apellido…"
              helper="Si ya confirmaste por tu iglesia, deberías aparecer. También sugerimos nombres parecidos."
              icon={Search}
              value={query}
              disabled={submitting}
              onChange={(event) => setQuery(event.target.value)}
            />
            {searching ? <p className="text-xs text-muted">Buscando…</p> : null}

            {registered.length > 0 ? (
              <div role="status" aria-live="polite">
                <PortalFormSuccess
                  variant="inline"
                  className="portal-experience-form__success--registered"
                  kicker="Está OK"
                  title="Ya envió el formulario"
                  message={registered
                    .map(
                      (hit) =>
                        `${hit.fullName} · ${hit.churchName} · ${formatZoneLabel(hit.zoneId)}`
                    )
                    .join(". ")}
                >
                  <p className="text-sm font-semibold">
                    No necesita enviarlo otra vez.
                    {registeredHasMore ? " Hay más personas con ese nombre que ya enviaron." : ""}
                  </p>
                </PortalFormSuccess>
              </div>
            ) : null}

            {matches.length > 0 ? (
              <ul className="max-h-80 overflow-y-auto rounded-xl border border-border bg-background shadow-sm">
                {matches.map((hit) => (
                  <li key={hit.registrationId} className="border-b border-border last:border-0">
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition hover:bg-background-muted/60"
                      onClick={() => applyHit(hit)}
                      disabled={submitting}
                    >
                      <span className="font-medium text-foreground">{hit.fullName}</span>
                      <span className="text-sm text-muted">
                        {hit.churchName} · {formatZoneLabel(hit.zoneId)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {hasMore ? (
              <p className="text-xs text-muted">Hay más coincidencias. Agrega otro apellido.</p>
            ) : null}

            {suggestions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted">
                  {matches.length > 0
                    ? "Sugerencias parecidas"
                    : "No hay coincidencia exacta. Sugerencias:"}
                </p>
                <ul className="max-h-80 overflow-y-auto rounded-xl border border-border bg-background shadow-sm">
                  {suggestions.map((hit) => (
                    <li key={hit.registrationId} className="border-b border-border last:border-0">
                      <button
                        type="button"
                        className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition hover:bg-background-muted/60"
                        onClick={() => applyHit(hit)}
                        disabled={submitting}
                      >
                        <span className="font-medium text-foreground">{hit.fullName}</span>
                        <span className="text-sm text-muted">
                          {hit.churchName} · {formatZoneLabel(hit.zoneId)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {suggestionsHasMore ? (
                  <p className="text-xs text-muted">Hay más sugerencias. Afina la búsqueda.</p>
                ) : null}
              </div>
            ) : null}

            {trimmedQuery.length >= 2 &&
            !searching &&
            matches.length === 0 &&
            suggestions.length === 0 &&
            registered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background-muted/30 px-4 py-4">
                <p className="text-sm leading-relaxed text-muted">
                  No hay coincidencias para «{trimmedQuery}». Si no apareces, regístrate como nuevo.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={enableManual}
                  disabled={submitting}
                >
                  No aparezco en la lista
                </Button>
              </div>
            ) : null}

            {trimmedQuery.length >= 2 &&
            (matches.length > 0 || suggestions.length > 0 || registered.length > 0) ? (
              <Button type="button" variant="ghost" size="sm" onClick={enableManual} disabled={submitting}>
                No aparezco / registrarme
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">
                  {fullNameField ? String(values[fullNameField] ?? "") : "Seleccionado"}
                </p>
                <p className="text-sm text-muted">
                  {churchField ? String(values[churchField] ?? "") : ""}
                  {zoneField ? ` · ${formatZoneLabel(String(values[zoneField] ?? ""))}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted">Puedes corregir zona, iglesia y el resto abajo.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={clearSelection} disabled={submitting}>
                Cambiar
              </Button>
            </div>
          </div>
        )}

        {mode === "manual" || (mode === "roster" && selectedId) ? (
          <>
            {zoneField || churchField ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {zoneField ? (
                  <Select
                    label="Zona"
                    placeholder="Selecciona zona"
                    value={zoneValue}
                    disabled={submitting}
                    options={CONGRESS_ZONES.map((z) => ({ value: z.id, label: z.label }))}
                    onChange={(event) => {
                      handleChange(zoneField, event.target.value);
                      if (churchField) handleChange(churchField, "");
                      setOtherChurch(false);
                    }}
                  />
                ) : null}
                {churchField ? (
                  <Select
                    label="Iglesia"
                    placeholder="Selecciona iglesia"
                    value={otherChurch ? "__other__" : String(values[churchField] ?? "")}
                    disabled={submitting || !zoneValue}
                    options={[
                      ...churchOptions.map((name) => ({ value: name, label: name })),
                      { value: "__other__", label: "Otra / no listada" },
                    ]}
                    onChange={(event) => {
                      const next = event.target.value;
                      if (next === "__other__") {
                        setOtherChurch(true);
                        handleChange(churchField, "");
                        return;
                      }
                      setOtherChurch(false);
                      handleChange(churchField, next);
                    }}
                  />
                ) : null}
              </div>
            ) : null}

            {churchField && otherChurch ? (
              <Input
                label="Nombre de tu iglesia"
                value={String(values[churchField] ?? "")}
                disabled={submitting}
                onChange={(event) => handleChange(churchField, event.target.value)}
              />
            ) : null}

            <PortalFormFields
              fields={form.fields.filter((f) => {
                if (f.name === zoneField || f.name === churchField) return false;
                return true;
              })}
              values={values}
              errors={errors}
              disabled={submitting}
              onChange={handleChange}
            />

            <PortalFormActions submitLabel={submitLabel} loading={submitting} />
          </>
        ) : null}
      </div>
    </form>
  );
}
