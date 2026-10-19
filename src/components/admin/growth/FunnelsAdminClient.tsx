"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { useConfirmDialog } from "@/components/admin/kit/hooks/useConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface FunnelAdminStage {
  key: string;
  label: string;
  position: number;
  active: boolean;
  isInitial: boolean;
}

export interface FunnelAdminField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  position: number;
  active: boolean;
  help?: string;
  options: Array<{ key: string; label: string; active: boolean }>;
}

export interface FunnelAdminRow {
  key: string;
  name: string;
  status: "active" | "archived";
  isDefault: boolean;
  openCount: number;
  stages: FunnelAdminStage[];
  fields: FunnelAdminField[];
}

function slugInput(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-{2,}/g, "-");
}

async function postFunnel(body: Record<string, unknown>): Promise<string | null> {
  const response = await fetch("/api/growth/funnels", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok || !payload.ok) return payload.error ?? "No se pudo guardar.";
  return null;
}

export function FunnelsAdminClient({
  funnels,
  staleAfterDays,
}: {
  funnels: FunnelAdminRow[];
  staleAfterDays: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [staleDays, setStaleDays] = useState(String(staleAfterDays));
  const [key, setKey] = useState("");
  const [stageNonce, setStageNonce] = useState<Record<string, number>>({});
  const { confirm, dialog } = useConfirmDialog();

  function run(body: Record<string, unknown>, onSuccess?: () => void) {
    setError(null);
    setBusy(true);
    void (async () => {
      try {
        const message = await postFunnel(body);
        if (message) setError(message);
        else {
          onSuccess?.();
          router.refresh();
        }
      } finally {
        setBusy(false);
      }
    })();
  }

  return (
    <AdminModulePage
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Ventas", href: "/admin/ventas" },
        { label: "Embudos" },
      ]}
      title="Embudos"
      description="Cada Espacio administra sus embudos y etapas. Los resultados Ganada, Perdida, Archivada y Traspasada son de plataforma: no se renombran, reordenan ni desactivan."
    >
      {dialog}
      <form
        className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const days = Number(staleDays);
          run({ action: "staleDays", days });
        }}
      >
        <label className="text-sm">
          Días para considerar una oportunidad estancada
          <Input
            aria-label="Días de estancamiento"
            type="number"
            min={1}
            max={90}
            value={staleDays}
            onChange={(event) => setStaleDays(event.target.value)}
            className="mt-1 w-28"
          />
        </label>
        <Button type="submit" size="sm" variant="outline" disabled={busy}>
          Guardar umbral
        </Button>
      </form>
      <form
        className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const nextKey = slugInput(key).replace(/-+$/, "");
          const nextName = name.trim();
          run({ action: "create", key: nextKey, name: nextName }, () => {
            setKey("");
            setName("");
          });
        }}
      >
        <label className="w-full text-sm sm:w-auto">
          Clave
          <Input
            aria-label="Clave del embudo"
            value={key}
            onChange={(event) => setKey(slugInput(event.target.value))}
            placeholder="admision"
            className="mt-1 w-full sm:w-40"
          />
        </label>
        <label className="w-full text-sm sm:w-auto">
          Nombre
          <Input
            aria-label="Nombre del embudo"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Admisión"
            className="mt-1 w-full sm:w-56"
          />
        </label>
        <Button type="submit" size="sm" disabled={busy || !key.trim() || !name.trim()}>
          Crear embudo
        </Button>
      </form>
      {error ? (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {funnels.length === 0 ? (
        <p className="text-sm text-muted">Este Espacio todavía no tiene embudos.</p>
      ) : (
        <div className="space-y-4">
          {funnels.map((funnel) => (
            <section
              key={funnel.key}
              className="rounded-lg border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold">{funnel.name}</h2>
                  <p className="text-sm text-muted">
                    {funnel.key}
                    {funnel.isDefault ? " · Predeterminado" : ""}
                    {funnel.status === "archived" ? " · Archivado" : ""}
                    {` · ${funnel.openCount} abiertas`}
                  </p>
                  <FunnelRename
                    name={funnel.name}
                    disabled={busy}
                    onSave={(nextName) =>
                      run({ action: "rename", key: funnel.key, name: nextName })
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {!funnel.isDefault && funnel.status === "active" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => run({ action: "makeDefault", key: funnel.key })}
                    >
                      Hacer predeterminado
                    </Button>
                  ) : null}
                  {funnel.status === "active" && !funnel.isDefault ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        if (funnel.openCount > 0) {
                          run({ action: "archive", key: funnel.key });
                          return;
                        }
                        void (async () => {
                          const ok = await confirm({
                            title: `Archivar ${funnel.name}`,
                            description:
                              "Deja de ofrecerse para altas nuevas. Las oportunidades ya cerradas no se mueven.",
                            confirmLabel: "Archivar",
                            destructive: true,
                          });
                          if (!ok) return;
                          run({ action: "archive", key: funnel.key });
                        })();
                      }}
                    >
                      Archivar
                    </Button>
                  ) : null}
                </div>
              </div>
              {funnel.isDefault && funnel.status === "active" ? (
                <p className="mt-3 text-sm text-muted">
                  Para archivarlo, marca otro embudo como predeterminado.
                </p>
              ) : null}
              <ol className="mt-4 space-y-2">
                {funnel.stages.map((stage, index) => (
                  <li
                    key={stage.key}
                    className="rounded-md border border-[var(--admin-border-subtle)] p-3 sm:flex sm:flex-wrap sm:items-center sm:gap-2"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                      <span className="w-6 text-muted">{index + 1}</span>
                      <span className="font-medium">
                        {stage.label}
                        {stage.isInitial ? " · inicial" : ""}
                        {!stage.active ? " · inactiva" : ""}
                      </span>
                      <span className="text-muted">{stage.key}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy || index === 0}
                        onClick={() =>
                          run({
                            action: "reorderStage",
                            key: funnel.key,
                            stageKey: stage.key,
                            direction: "up",
                          })
                        }
                      >
                        Subir
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy || index === funnel.stages.length - 1}
                        onClick={() =>
                          run({
                            action: "reorderStage",
                            key: funnel.key,
                            stageKey: stage.key,
                            direction: "down",
                          })
                        }
                      >
                        Bajar
                      </Button>
                      <StageRename
                        disabled={busy}
                        label={stage.label}
                        onSave={(label) =>
                          run({
                            action: "renameStage",
                            key: funnel.key,
                            stageKey: stage.key,
                            label,
                          })
                        }
                      />
                      {!stage.isInitial && stage.active ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => {
                            void (async () => {
                              const ok = await confirm({
                                title: `Desactivar ${stage.label}`,
                                description:
                                  "Sigue visible si hay oportunidades ahí. Esas pueden salir. No vuelve a ofrecerse como destino.",
                                confirmLabel: "Desactivar",
                                destructive: true,
                              });
                              if (!ok) return;
                              run({
                                action: "deactivateStage",
                                key: funnel.key,
                                stageKey: stage.key,
                              });
                            })();
                          }}
                        >
                          Desactivar
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
              <FunnelFields funnel={funnel} disabled={busy} onRun={run} />
              <NewStage
                disabled={busy}
                resetKey={stageNonce[funnel.key] ?? 0}
                onCreate={(stageKey, label) =>
                  run({ action: "createStage", key: funnel.key, stageKey, label }, () =>
                    setStageNonce((current) => ({
                      ...current,
                      [funnel.key]: (current[funnel.key] ?? 0) + 1,
                    }))
                  )
                }
              />
            </section>
          ))}
        </div>
      )}
    </AdminModulePage>
  );
}

function FunnelRename({
  name,
  disabled,
  onSave,
}: {
  name: string;
  disabled: boolean;
  onSave: (name: string) => void;
}) {
  const [value, setValue] = useState(name);
  useEffect(() => {
    setValue(name);
  }, [name]);
  return (
    <form
      className="mt-2 flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim() && value.trim() !== name) onSave(value.trim());
      }}
    >
      <Input
        aria-label={`Renombrar embudo ${name}`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-8 w-full sm:w-56"
      />
      <Button type="submit" size="sm" variant="outline" disabled={disabled || !value.trim() || value.trim() === name}>
        Renombrar embudo
      </Button>
    </form>
  );
}

function StageRename({
  label,
  disabled,
  onSave,
}: {
  label: string;
  disabled: boolean;
  onSave: (label: string) => void;
}) {
  const [value, setValue] = useState(label);
  useEffect(() => {
    setValue(label);
  }, [label]);
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim() && value.trim() !== label) onSave(value.trim());
      }}
    >
      <Input
        aria-label={`Renombrar ${label}`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-8 w-full sm:w-40"
      />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={disabled || !value.trim() || value.trim() === label}
      >
        Renombrar
      </Button>
    </form>
  );
}

function NewStage({
  disabled,
  resetKey,
  onCreate,
}: {
  disabled: boolean;
  resetKey: number;
  onCreate: (key: string, label: string) => void;
}) {
  const [stageKey, setStageKey] = useState("");
  const [label, setLabel] = useState("");
  useEffect(() => {
    setStageKey("");
    setLabel("");
  }, [resetKey]);
  return (
    <form
      className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
      onSubmit={(event) => {
        event.preventDefault();
        onCreate(slugInput(stageKey).replace(/-+$/, ""), label.trim());
      }}
    >
      <Input
        aria-label="Clave de la etapa"
        value={stageKey}
        onChange={(event) => setStageKey(slugInput(event.target.value))}
        placeholder="clave"
        className="h-8 w-full sm:w-32"
        disabled={disabled}
      />
      <Input
        aria-label="Etiqueta de la etapa"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        placeholder="Etiqueta"
        className="h-8 w-full sm:w-48"
        disabled={disabled}
      />
      <Button type="submit" size="sm" disabled={disabled || !stageKey.trim() || !label.trim()}>
        Agregar etapa
      </Button>
    </form>
  );
}

function FieldOptions({
  funnelKey,
  field,
  disabled,
  onRun,
}: {
  funnelKey: string;
  field: FunnelAdminField;
  disabled: boolean;
  onRun: (body: Record<string, unknown>, onSuccess?: () => void) => void;
}) {
  const [optionKey, setOptionKey] = useState("");
  const [optionLabel, setOptionLabel] = useState("");
  return (
    <div className="mt-3 border-t border-[var(--admin-border-subtle)] pt-3">
      <p className="text-xs font-medium text-muted">Opciones</p>
      <ul className="mt-2 space-y-2">
        {field.options.map((option) => (
          <li key={option.key} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="min-w-0 flex-1">
              {option.label}
              <span className="text-muted">
                {" "}
                · {option.key}
                {option.active ? "" : " · inactiva"}
              </span>
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => {
                  const next = window.prompt("Nuevo nombre de la opción", option.label);
                  if (!next?.trim() || next.trim() === option.label) return;
                  onRun({
                    action: "patchFieldOption",
                    key: funnelKey,
                    fieldKey: field.key,
                    optionKey: option.key,
                    label: next.trim(),
                  });
                }}
              >
                Renombrar
              </Button>
              {option.active ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() =>
                    onRun({
                      action: "patchFieldOption",
                      key: funnelKey,
                      fieldKey: field.key,
                      optionKey: option.key,
                      active: false,
                    })
                  }
                >
                  Desactivar
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <form
        className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
        onSubmit={(event) => {
          event.preventDefault();
          const key = slugInput(optionKey).replace(/-+$/, "");
          const label = optionLabel.trim();
          if (!key || !label) return;
          onRun(
            {
              action: "addFieldOption",
              key: funnelKey,
              fieldKey: field.key,
              optionKey: key,
              label,
            },
            () => {
              setOptionKey("");
              setOptionLabel("");
            }
          );
        }}
      >
        <Input
          aria-label={`Clave de opción de ${field.label}`}
          value={optionKey}
          onChange={(event) => setOptionKey(slugInput(event.target.value))}
          placeholder="clave"
          className="h-8 sm:w-32"
          disabled={disabled}
        />
        <Input
          aria-label={`Nombre de opción de ${field.label}`}
          value={optionLabel}
          onChange={(event) => setOptionLabel(event.target.value)}
          placeholder="Nombre de la opción"
          className="h-8 sm:w-48"
          disabled={disabled}
        />
        <Button type="submit" size="sm" disabled={disabled || !optionKey.trim() || !optionLabel.trim()}>
          Agregar opción
        </Button>
      </form>
    </div>
  );
}

function FunnelFields({
  funnel,
  disabled,
  onRun,
}: {
  funnel: FunnelAdminRow;
  disabled: boolean;
  onRun: (body: Record<string, unknown>, onSuccess?: () => void) => void;
}) {
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [type, setType] = useState("text");
  const [options, setOptions] = useState("");
  const [required, setRequired] = useState(false);
  return (
    <div className="mt-4 border-t border-[var(--admin-border-subtle)] pt-3">
      <p className="text-sm font-medium">Campos del embudo</p>
      <ul className="mt-2 space-y-2">
        {funnel.fields.map((field, index) => (
          <li key={field.key} className="rounded-md border border-[var(--admin-border-subtle)] px-3 py-2 text-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="min-w-0 flex-1">
                {field.label}
                <span className="text-muted"> · {field.type}{field.required ? " · obligatorio" : ""}{field.active ? "" : " · inactivo"}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" disabled={disabled || index === 0} onClick={() => onRun({ action: "reorderField", key: funnel.key, fieldKey: field.key, direction: "up" })}>
                  Subir
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={disabled || index === funnel.fields.length - 1} onClick={() => onRun({ action: "reorderField", key: funnel.key, fieldKey: field.key, direction: "down" })}>
                  Bajar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => {
                    const next = window.prompt("Nuevo nombre", field.label);
                    if (next?.trim()) onRun({ action: "renameField", key: funnel.key, fieldKey: field.key, label: next.trim(), help: field.help });
                  }}
                >
                  Renombrar
                </Button>
                {field.active ? (
                  <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => onRun({ action: "deactivateField", key: funnel.key, fieldKey: field.key })}>
                    Desactivar
                  </Button>
                ) : null}
              </div>
            </div>
            {field.type === "select" ? (
              <FieldOptions funnelKey={funnel.key} field={field} disabled={disabled} onRun={onRun} />
            ) : null}
          </li>
        ))}
      </ul>
      {funnel.status === "active" ? (
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
          onSubmit={(event) => {
            event.preventDefault();
            const parsed = options
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
              .map((item) => ({ key: slugInput(item).replace(/-+$/, ""), label: item }));
            onRun({
              action: "createField",
              key: funnel.key,
              fieldKey: slugInput(key).replace(/-+$/, ""),
              label: label.trim(),
              type,
              required,
              options: type === "select" ? parsed : undefined,
            });
            setLabel("");
            setKey("");
            setOptions("");
          }}
        >
          <Input aria-label="Clave del campo" value={key} onChange={(event) => setKey(slugInput(event.target.value))} placeholder="clave" className="h-8 sm:w-32" disabled={disabled} />
          <Input aria-label="Nombre del campo" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Nombre" className="h-8 sm:w-40" disabled={disabled} />
          <select aria-label="Tipo del campo" className="h-8 rounded-md border px-2 text-sm" value={type} onChange={(event) => setType(event.target.value)} disabled={disabled}>
            <option value="text">Texto</option>
            <option value="long_text">Texto largo</option>
            <option value="number">Número</option>
            <option value="date">Fecha</option>
            <option value="select">Lista</option>
            <option value="boolean">Sí / no</option>
          </select>
          {type === "select" ? (
            <Input aria-label="Opciones separadas por coma" value={options} onChange={(event) => setOptions(event.target.value)} placeholder="opciones, separadas" className="h-8 sm:w-56" disabled={disabled} />
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} disabled={disabled} />
            Obligatorio
          </label>
          <Button type="submit" size="sm" disabled={disabled || !key.trim() || !label.trim()}>
            Agregar campo
          </Button>
        </form>
      ) : null}
    </div>
  );
}
