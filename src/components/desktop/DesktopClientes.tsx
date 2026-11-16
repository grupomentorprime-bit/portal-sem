"use client";

import { useEffect, useMemo, useState } from "react";
import { DesktopClientConsole } from "@/components/desktop/DesktopClientConsole";
import { readClientConsole } from "@/lib/desktop/client-console";
import { proposeInitialSpaceHost } from "@/lib/platform/propose-space-host";
import { SPACE_ORGANIZATION_TYPES } from "@/lib/platform/space-organization-types";
import { slugify } from "@/lib/slugify";

type ClientRow = { tenantId: string; name: string };

export function DesktopClientes({
  spaces,
  onClose,
  onEnter,
}: {
  spaces: ClientRow[];
  onClose: () => void;
  onEnter: (tenantId: string) => void;
}) {
  const [rows, setRows] = useState(spaces);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<string>(SPACE_ORGANIZATION_TYPES[0].value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setDetail(null);
    void fetch(`/api/platform/spaces/${encodeURIComponent(selectedId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          space?: unknown;
        } | null;
        if (!response.ok || !body?.ok || !body.space) {
          setError(body?.error || "No se pudo abrir ese cliente.");
          return;
        }
        setDetail(body.space);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError("No se pudo conectar con el servidor.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [selectedId]);

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const slug = slugify(name).slice(0, 64);
    try {
      const response = await fetch("/api/platform/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug,
          type,
          host: proposeInitialSpaceHost(slug),
          siteName: name.trim(),
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        space?: { tenantId: string; name: string };
      } | null;
      if (!response.ok || !body?.ok || !body.space) {
        setError(body?.error || "No se pudo crear el cliente.");
        return;
      }
      setRows((current) =>
        [...current, { tenantId: body.space!.tenantId, name: body.space!.name }].sort((a, b) =>
          a.name.localeCompare(b.name, "es")
        )
      );
      setName("");
      setCreating(false);
      setSelectedId(body.space.tenantId);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  const selected = rows.find((row) => row.tenantId === selectedId) ?? null;
  const model = useMemo(() => readClientConsole(detail), [detail]);

  return (
    <div className="ajustes-back" onClick={onClose}>
      <div
        className="ajustes-window is-clients"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clientes-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ajustes-head">
          <div>
            <p className="kicker">Plataforma</p>
            <h2 id="clientes-title">Clientes</h2>
            <p>Estado, plan y dominio de cada organización. Entrar abre su escritorio.</p>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Cerrar
          </button>
        </header>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="client-desk desk-users">
          <section className="desk-card">
            <header>
              <h2>Organizaciones</h2>
              <p>{rows.length === 1 ? "1 cliente" : `${rows.length} clientes`}</p>
            </header>
            <ul>
              {rows.map((row) => (
                <li key={row.tenantId}>
                  <button
                    type="button"
                    className={row.tenantId === selectedId ? "is-active" : undefined}
                    onClick={() => {
                      setCreating(false);
                      setSelectedId(row.tenantId);
                    }}
                  >
                    <span className="client-mark" aria-hidden="true">
                      {row.name.trim().charAt(0).toUpperCase() || "C"}
                    </span>
                    <span className="client-copy">
                      <strong>{row.name}</strong>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="primary" onClick={() => { setCreating(true); setSelectedId(null); }}>
              Nueva organización
            </button>
          </section>
          <section className="desk-card">
            {creating ? (
              <form onSubmit={(event) => void onCreate(event)}>
                <h2>Nueva organización</h2>
                <p className="lead">Queda como cliente. No abre su escritorio.</p>
                <label>
                  Nombre
                  <input value={name} onChange={(event) => setName(event.target.value)} required />
                </label>
                <label>
                  Tipo
                  <select value={type} onChange={(event) => setType(event.target.value)}>
                    {SPACE_ORGANIZATION_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="primary" disabled={saving}>
                  {saving ? "Creando…" : "Crear cliente"}
                </button>
              </form>
            ) : selected && model ? (
              <DesktopClientConsole
                tenantId={selected.tenantId}
                model={model}
                onEnter={() => onEnter(selected.tenantId)}
                onChanged={(patch) =>
                  setDetail((current) => ({
                    ...(current && typeof current === "object" ? current : {}),
                    ...(patch && typeof patch === "object" ? patch : {}),
                  }))
                }
              />
            ) : selected ? (
              <p className="lead">{loading ? "Abriendo…" : "No se pudo leer este cliente."}</p>
            ) : (
              <>
                <h2>Elige un cliente</h2>
                <p className="lead">Desde aquí entras al escritorio de cada organización.</p>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
