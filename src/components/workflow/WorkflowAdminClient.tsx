"use client";

import { useEffect, useState } from "react";
import { neutralScale } from "@/design/tokens/colors";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WorkflowDefinition, WorkflowHistoryEntry, WorkflowInstance } from "@/types/workflow";

export function WorkflowAdminClient() {
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [history, setHistory] = useState<WorkflowHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [defRes, histRes] = await Promise.all([
          fetch("/api/workflows/definitions"),
          fetch("/api/workflows/history"),
        ]);
        if (cancelled) return;

        const defData = await defRes.json();
        const histData = await histRes.json();

        if (defData.ok) {
          setDefinitions(defData.definitions ?? []);
          setInstances(defData.instances ?? []);
          if (defData.definitions?.[0]) {
            setSelectedDef(defData.definitions[0]._id);
          }
        }
        if (histData.ok) setHistory(histData.history ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function runTransition(instanceId: string, transitionId: string) {
    const res = await fetch("/api/workflows/transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceId, transitionId }),
    });
    const data = await res.json();
    if (data.ok) {
      const defRes = await fetch("/api/workflows/definitions");
      const defData = await defRes.json();
      if (defData.ok) setInstances(defData.instances ?? []);
    }
  }

  const activeDef = definitions.find((d) => d._id === selectedDef);

  if (loading) return <p className="text-sm text-muted">Cargando workflows…</p>;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Definiciones</CardTitle>
          <CardDescription>Flujos reutilizables por tipo de entidad.</CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2 px-6 pb-6">
          {definitions.map((d) => (
            <Button
              key={d._id}
              type="button"
              variant={selectedDef === d._id ? "primary" : "outline"}
              size="sm"
              onClick={() => setSelectedDef(d._id)}
            >
              {d.name}
            </Button>
          ))}
        </div>
        {activeDef ? (
          <div className="border-t px-6 py-4 text-sm">
            <p className="text-muted">{activeDef.description}</p>
            <p className="mt-2">
              <span className="font-medium">Entidad:</span> {activeDef.entityType} ·{" "}
              <span className="font-medium">Estado inicial:</span> {activeDef.initialState}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 font-medium">Estados</p>
                <ul className="space-y-1">
                  {activeDef.states.map((s) => (
                    <li key={s.id} className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: s.color ?? neutralScale[400] }}
                      />
                      {s.label} <code className="text-xs text-muted">({s.key})</code>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-medium">Transiciones</p>
                <ul className="space-y-1">
                  {activeDef.transitions.map((t) => (
                    <li key={t.id}>
                      {t.fromState} → {t.toState}: {t.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instancias activas</CardTitle>
          <CardDescription>Entidades con workflow en curso.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted">
                <th className="px-4 py-2">Entidad</th>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Flujo</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((inst) => {
                const def = definitions.find((d) => d._id === inst.definitionId);
                const nextTransitions =
                  def?.transitions.filter((t) => t.fromState === inst.currentState) ?? [];
                return (
                  <tr key={inst._id} className="border-b">
                    <td className="px-4 py-3">{inst.entityType}</td>
                    <td className="px-4 py-3 font-mono text-xs">{inst.entityId}</td>
                    <td className="px-4 py-3">{inst.currentState}</td>
                    <td className="px-4 py-3">{inst.definitionKey}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {nextTransitions.map((t) => (
                          <Button
                            key={t.id}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => runTransition(inst._id, t.id)}
                          >
                            {t.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {instances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted">
                    No hay instancias activas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial reciente</CardTitle>
        </CardHeader>
        <ul className="space-y-2 px-6 pb-6 text-sm">
          {history.map((h) => (
            <li key={h._id} className="flex justify-between border-b py-2">
              <span>
                {h.entityType}/{h.entityId}: {h.fromState} → {h.toState}
              </span>
              <span className="text-muted">
                {new Date(h.performedAt).toLocaleString("es")}
              </span>
            </li>
          ))}
          {history.length === 0 ? (
            <li className="py-4 text-center text-muted">Sin historial.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
