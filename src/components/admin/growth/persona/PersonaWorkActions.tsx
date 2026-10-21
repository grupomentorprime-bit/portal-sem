"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MessageSquare, Phone, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { growthNextActionKindLabel } from "@/lib/growth/labels";
import {
  GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL,
  GROWTH_VENTAS_FOLLOW_UP_PLACEHOLDER,
  GROWTH_VENTAS_REGISTER_CONTACT_LABEL,
  GROWTH_VENTAS_SAVE_NOTE_LABEL,
} from "@/lib/growth/labels";
import type { GrowthNextActionKind } from "@/core/growth/types";
import { cn } from "@/lib/utils";

const NEXT_KINDS: GrowthNextActionKind[] = [
  "contact",
  "review",
  "handoff",
  "wait",
  "other",
];

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
}

function useOpportunityWrite(oportunidadId: string) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>): Promise<boolean> => {
    setError(null);
    try {
      await fn();
      startTransition(() => {
        router.refresh();
      });
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar la acción.");
      return false;
    }
  };

  const postActivity = (kind: "note" | "contact", summary: string) =>
    run(async () => {
      const res = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(oportunidadId)}/activities`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, summary }),
        }
      );
      if (!res.ok) throw new Error(await readError(res));
    });

  const saveNext = (body: { summary: string; dueAt?: string; kind?: GrowthNextActionKind }) =>
    run(async () => {
      const res = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(oportunidadId)}/next-action`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error(await readError(res));
    });

  const clearNext = () =>
    run(async () => {
      const res = await fetch(
        `/api/growth/oportunidades/${encodeURIComponent(oportunidadId)}/next-action`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(await readError(res));
    });

  return { pending, error, postActivity, saveNext, clearNext };
}

export function PersonaQuickActions({
  canOperate,
  messagesHref,
  onContact,
  onNext,
}: {
  canOperate: boolean;
  messagesHref?: string;
  onContact: () => void;
  onNext: () => void;
}) {
  if (!canOperate && !messagesHref) return null;
  return (
    <div className="flex flex-wrap gap-1.5" data-persona-quick-actions>
      {canOperate ? (
        <Button type="button" size="sm" variant="outline" onClick={onContact}>
          <Phone className="mr-1.5 h-3.5 w-3.5" />
          {GROWTH_VENTAS_REGISTER_CONTACT_LABEL}
        </Button>
      ) : null}
      {canOperate ? (
        <Button type="button" size="sm" variant="outline" onClick={onNext}>
          <Target className="mr-1.5 h-3.5 w-3.5" />
          Qué hacer ahora
        </Button>
      ) : null}
      {messagesHref ? (
        <Button href={messagesHref} size="sm" variant="outline">
          <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
          Abrir conversaciones
        </Button>
      ) : null}
    </div>
  );
}

export function PersonaFollowUpForm({
  oportunidadId,
  kind,
  onDone,
}: {
  oportunidadId: string;
  kind: "note" | "contact";
  onDone?: () => void;
}) {
  const { pending, error, postActivity } = useOpportunityWrite(oportunidadId);
  const [summary, setSummary] = useState("");
  const label = kind === "note" ? GROWTH_VENTAS_SAVE_NOTE_LABEL : GROWTH_VENTAS_REGISTER_CONTACT_LABEL;

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!summary.trim() || pending) return;
        void postActivity(kind, summary).then((saved) => {
          if (!saved) return;
          setSummary("");
          onDone?.();
        });
      }}
    >
      <Textarea
        aria-label={kind === "note" ? "Nueva nota" : "Detalle del contacto"}
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        placeholder={GROWTH_VENTAS_FOLLOW_UP_PLACEHOLDER}
        rows={2}
        disabled={pending}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button type="submit" size="sm" disabled={pending || !summary.trim()}>
        {label}
      </Button>
    </form>
  );
}

export function PersonaNextActionForm({
  oportunidadId,
  initialSummary,
  initialKind,
  hasCurrent,
  onDone,
}: {
  oportunidadId: string;
  initialSummary: string;
  initialKind?: string;
  hasCurrent: boolean;
  onDone?: () => void;
}) {
  const { pending, error, saveNext, clearNext } = useOpportunityWrite(oportunidadId);
  const [summary, setSummary] = useState(initialSummary);
  const [kind, setKind] = useState<GrowthNextActionKind>(
    NEXT_KINDS.includes(initialKind as GrowthNextActionKind)
      ? (initialKind as GrowthNextActionKind)
      : "contact"
  );
  const [dueAt, setDueAt] = useState("");

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!summary.trim() || pending) return;
        void saveNext({
          summary,
          kind,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        }).then((saved) => {
          if (saved) onDone?.();
        });
      }}
    >
      <Input
        aria-label="Qué hacer ahora"
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        placeholder="Ej. Llamar para confirmar interés"
        disabled={pending}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          aria-label="Tipo de acción"
          className="h-10 rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm"
          value={kind}
          disabled={pending}
          onChange={(event) => setKind(event.target.value as GrowthNextActionKind)}
        >
          {NEXT_KINDS.map((value) => (
            <option key={value} value={value}>
              {growthNextActionKindLabel(value)}
            </option>
          ))}
        </select>
        <Input
          aria-label="Fecha límite"
          type="datetime-local"
          value={dueAt}
          disabled={pending}
          onChange={(event) => setDueAt(event.target.value)}
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending || !summary.trim()}>
          Guardar
        </Button>
        {hasCurrent ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              void clearNext().then((cleared) => {
                if (!cleared) return;
                setSummary("");
                onDone?.();
              });
            }}
          >
            {GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function PersonaWorkPanel({
  mode,
  oportunidadId,
  initialSummary,
  initialKind,
  hasCurrent,
  onDone,
}: {
  mode: "contact" | "next";
  oportunidadId: string;
  initialSummary: string;
  initialKind?: string;
  hasCurrent: boolean;
  onDone: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-3 py-3"
      )}
    >
      <p className="mb-2 text-sm font-semibold text-foreground">
        {mode === "contact" ? GROWTH_VENTAS_REGISTER_CONTACT_LABEL : "Qué hacer ahora"}
      </p>
      {mode === "contact" ? (
        <PersonaFollowUpForm oportunidadId={oportunidadId} kind="contact" onDone={onDone} />
      ) : (
        <PersonaNextActionForm
          oportunidadId={oportunidadId}
          initialSummary={initialSummary}
          initialKind={initialKind}
          hasCurrent={hasCurrent}
          onDone={onDone}
        />
      )}
    </div>
  );
}
