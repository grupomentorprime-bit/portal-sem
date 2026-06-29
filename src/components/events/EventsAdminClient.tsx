"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DeadLetterEntry, StoredEvent } from "@/types/events";

type Tab = "events" | "dead-letter" | "registry";

export function EventsAdminClient() {
  const [tab, setTab] = useState<Tab>("events");
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [deadLetters, setDeadLetters] = useState<DeadLetterEntry[]>([]);
  const [registry, setRegistry] = useState<{ eventTypes: string[]; subscriptions: { eventType: string; name: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StoredEvent | null>(null);
  const [replayStatus, setReplayStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        if (tab === "events") {
          const res = await fetch("/api/events?limit=50");
          const data = await res.json();
          if (!cancelled && data.ok) setEvents(data.events ?? []);
        } else if (tab === "dead-letter") {
          const res = await fetch("/api/events?view=dead-letter&limit=50");
          const data = await res.json();
          if (!cancelled && data.ok) setDeadLetters(data.deadLetters ?? []);
        } else {
          const res = await fetch("/api/events?view=registry");
          const data = await res.json();
          if (!cancelled && data.ok) {
            setRegistry({
              eventTypes: data.eventTypes ?? [],
              subscriptions: data.subscriptions ?? [],
            });
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "events") {
        const res = await fetch("/api/events?limit=50");
        const data = await res.json();
        if (data.ok) setEvents(data.events ?? []);
      } else if (tab === "dead-letter") {
        const res = await fetch("/api/events?view=dead-letter&limit=50");
        const data = await res.json();
        if (data.ok) setDeadLetters(data.deadLetters ?? []);
      } else {
        const res = await fetch("/api/events?view=registry");
        const data = await res.json();
        if (data.ok) {
          setRegistry({
            eventTypes: data.eventTypes ?? [],
            subscriptions: data.subscriptions ?? [],
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [tab]);

  async function replayEvent(eventId: string) {
    setReplayStatus(null);
    const res = await fetch("/api/events/replay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    const data = await res.json();
    setReplayStatus(data.ok ? `Replay OK: ${data.result?.handlersExecuted?.join(", ") || "sin handlers"}` : data.error);
    await refresh();
  }

  async function replayByType(type: string) {
    setReplayStatus(null);
    const res = await fetch("/api/events/replay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, limit: 10 }),
    });
    const data = await res.json();
    setReplayStatus(data.ok ? `Replayed ${data.replayed} eventos de tipo ${type}` : data.error);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(["events", "dead-letter", "registry"] as Tab[]).map((t) => (
          <Button
            key={t}
            type="button"
            variant={tab === t ? "primary" : "outline"}
            onClick={() => setTab(t)}
          >
            {t === "events" ? "Eventos" : t === "dead-letter" ? "Dead Letter" : "Registry"}
          </Button>
        ))}
        <Button type="button" variant="outline" onClick={refresh} disabled={loading}>
          Actualizar
        </Button>
      </div>

      {replayStatus ? (
        <p className="rounded border border-border bg-muted/30 px-3 py-2 text-sm">{replayStatus}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : tab === "events" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Eventos recientes</CardTitle>
              <CardDescription>core_events — últimos 50</CardDescription>
            </CardHeader>
            <div className="max-h-[480px] overflow-auto px-4 pb-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-muted">
                    <th className="py-2 pr-2">Tipo</th>
                    <th className="py-2 pr-2">Estado</th>
                    <th className="py-2">Entidad</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr
                      key={e.id}
                      className="cursor-pointer border-b border-border/50 hover:bg-muted/20"
                      onClick={() => setSelected(e)}
                    >
                      <td className="py-2 pr-2 font-mono">{e.type}</td>
                      <td className="py-2 pr-2">{e.status}</td>
                      <td className="py-2 font-mono">{e.entityId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalle</CardTitle>
              <CardDescription>{selected?.id ?? "Selecciona un evento"}</CardDescription>
            </CardHeader>
            {selected ? (
              <div className="space-y-3 px-4 pb-4 text-xs">
                <dl className="grid grid-cols-2 gap-1">
                  <dt className="text-muted">Handlers</dt>
                  <dd>{selected.handlersExecuted?.join(", ") || "—"}</dd>
                  <dt className="text-muted">Retries</dt>
                  <dd>{selected.retries}</dd>
                  <dt className="text-muted">Procesamiento</dt>
                  <dd>{selected.processingMs != null ? `${selected.processingMs}ms` : "—"}</dd>
                  <dt className="text-muted">Error</dt>
                  <dd className="text-red-600">{selected.error ?? "—"}</dd>
                </dl>
                <pre className="max-h-48 overflow-auto rounded bg-muted/30 p-2">
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
                <Button type="button" variant="outline" onClick={() => replayEvent(selected.id)}>
                  Replay
                </Button>
              </div>
            ) : (
              <p className="px-4 pb-4 text-sm text-muted">Sin selección</p>
            )}
          </Card>
        </div>
      ) : tab === "dead-letter" ? (
        <Card>
          <CardHeader>
            <CardTitle>Dead Letter Queue</CardTitle>
            <CardDescription>Handlers que fallaron tras reintentos</CardDescription>
          </CardHeader>
          <div className="max-h-[520px] overflow-auto px-4 pb-4">
            {deadLetters.length === 0 ? (
              <p className="text-sm text-muted">Sin entradas en DLQ.</p>
            ) : (
              <ul className="space-y-3 text-xs">
                {deadLetters.map((d) => (
                  <li key={d._id} className="rounded border border-border p-3">
                    <p className="font-mono font-medium">{d.type}</p>
                    <p className="text-muted">Handler: {d.handler}</p>
                    <p className="text-red-600">{d.error}</p>
                    <p className="text-muted">{d.createdAt}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tipos registrados</CardTitle>
              <CardDescription>DOMAIN_EVENT_TYPES + dinámicos</CardDescription>
            </CardHeader>
            <ul className="max-h-64 overflow-auto px-4 pb-4 text-xs font-mono">
              {registry?.eventTypes.map((t) => (
                <li key={t} className="flex items-center justify-between border-b py-1">
                  <span>{t}</span>
                  <Button type="button" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => replayByType(t)}>
                    Replay
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Suscripciones activas</CardTitle>
              <CardDescription>Handlers en memoria del proceso</CardDescription>
            </CardHeader>
            <ul className="max-h-64 overflow-auto px-4 pb-4 text-xs">
              {registry?.subscriptions.map((s, i) => (
                <li key={`${s.eventType}-${s.name}-${i}`} className="border-b py-1">
                  <span className="font-mono">{s.eventType}</span> → {s.name}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
