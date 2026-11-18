"use client";

import { useEffect, useState } from "react";

type AreaRow = { id: string; name: string; description: string; active: boolean; builtin: boolean };
type AgentRow = {
  userId: string;
  displayName: string;
  email: string;
  profile: "platform_owner" | "platform_operator" | null;
  status: string;
  areaIds: string[];
};

export function DesktopAttentionSettings() {
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/platform/attention", { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          areas?: AreaRow[];
          agents?: AgentRow[];
        } | null;
        if (!response.ok || !body?.ok) {
          setError(body?.error || "No se pudo abrir la configuración de Atención.");
          return;
        }
        setAreas(body.areas ?? []);
        setAgents(body.agents ?? []);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError("No se pudo conectar con el servidor.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  async function post(payload: Record<string, unknown>): Promise<boolean> {
    setSaving(true);
    setError("");
    const response = await fetch("/api/platform/attention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      areas?: AreaRow[];
      userId?: string;
      areaIds?: string[];
    } | null;
    setSaving(false);
    if (!response?.ok || !body?.ok) {
      setError(body?.error || "No se pudo guardar.");
      return false;
    }
    if (body.areas) setAreas(body.areas);
    if (body.userId && body.areaIds) {
      setAgents((current) =>
        current.map((agent) => (agent.userId === body.userId ? { ...agent, areaIds: body.areaIds ?? [] } : agent))
      );
    }
    return true;
  }

  if (loading) return <p className="ajustes-wait">Cargando Atención…</p>;

  return (
    <div className="desk-users owner-pane attn-settings">
      {error ? <p className="form-error">{error}</p> : null}
      <section className="desk-card">
        <h2>Áreas</h2>
        <p className="lead">El cliente elige una al abrir un caso. Comercial no se apaga: ahí entran las solicitudes de aplicaciones.</p>
        <ul>
          {areas.map((area) => (
            <li key={area.id}>
              <div className="person">
                <div>
                  <p className="name">{area.name}</p>
                  <p>{area.description}</p>
                </div>
                <button
                  type="button"
                  className="resend"
                  disabled={saving || area.id === "comercial"}
                  onClick={() => void post({ action: "active", id: area.id, active: !area.active })}
                >
                  {area.id === "comercial" ? "Siempre activa" : area.active ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void post({ action: "add", name }).then((ok) => {
              if (ok) setName("");
            });
          }}
        >
          <label>
            Nueva área
            <input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} />
          </label>
          <button type="submit" className="primary" disabled={saving || name.trim().length < 2}>
            Agregar
          </button>
        </form>
      </section>
      <section className="desk-card">
        <h2>Ejecutivos</h2>
        <p className="lead">El dueño ve todas las áreas. Un operador solo ve las que marques. Sin marcas, no entra a ningún caso.</p>
        {agents.length === 0 ? <p className="lead">Todavía no hay cuentas de plataforma.</p> : null}
        <ul>
          {agents.map((agent) => (
            <li key={agent.userId}>
              <p className="name">
                {agent.displayName}
                {agent.profile === "platform_owner" ? <span className="you">Dueño</span> : null}
              </p>
              <p>{agent.email}</p>
              {agent.profile === "platform_operator" ? (
                <div className="attn-filters">
                  {areas.map((area) => {
                    const checked = agent.areaIds.includes(area.id);
                    return (
                      <label key={area.id} className="check">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={saving}
                          onChange={() => {
                            const areaIds = checked
                              ? agent.areaIds.filter((id) => id !== area.id)
                              : [...agent.areaIds, area.id];
                            void post({ action: "grant", userId: agent.userId, areaIds });
                          }}
                        />
                        {area.name}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="lead">Ve todas las áreas.</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
