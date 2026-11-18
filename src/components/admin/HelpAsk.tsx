"use client";

import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_ATTENTION_AREAS } from "@/lib/desktop/attention";
import { findHelpOrigin, formatHelpOrigin, screenForPath } from "@/lib/desktop/help-origins";

interface HelpDraft {
  originId: string;
  capturedAt: string;
}

interface HelpAskContextValue {
  ask: (originId: string) => void;
}

const HelpAskContext = createContext<HelpAskContextValue>({
  ask: () => undefined,
});

export function useHelpAsk(): HelpAskContextValue {
  return useContext(HelpAskContext);
}

export function HelpAskHost({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [draft, setDraft] = useState<HelpDraft | null>(null);
  const [areaId, setAreaId] = useState("general");
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<Record<string, string> | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const screen = screenForPath(pathname);
    if (!screen) return;
    void fetch("/api/help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "locate", originId: screen.id }),
    }).catch(() => undefined);
  }, [pathname]);

  function ask(originId: string) {
    setError("");
    setDraft((current) => current ?? { originId, capturedAt: new Date().toISOString() });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setSending(true);
    setError("");
    const response = await fetch("/api/help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "open",
        asRequester: true,
        areaId,
        subject: body.trim().slice(0, 80) || "Consulta",
        body,
        originId: draft.originId,
        capturedAt: draft.capturedAt,
        attachment,
        priority: "normal",
      }),
    }).catch(() => null);
    setSending(false);
    const payload = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      case?: { code?: string };
      receipt?: { title?: string; correlative?: string };
    } | null;
    if (!response?.ok || !payload?.ok) {
      setError(payload?.error || "No se pudo abrir el ticket.");
      return;
    }
    setResult(payload.receipt?.correlative || payload.case?.code || "");
    setBody("");
    setAttachment(null);
  }

  const origin = draft ? findHelpOrigin(draft.originId) : null;

  return (
    <HelpAskContext.Provider value={{ ask }}>
      {children}
      {draft ? (
        <form className="help-ask" onSubmit={submit} aria-label="Pedir ayuda">
          <header>
            <strong>Pedir ayuda</strong>
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                setResult("");
              }}
              aria-label="Cerrar ayuda"
            >
              Cerrar
            </button>
          </header>
          {result ? (
            <p role="status">
              <strong>Solicitud recibida</strong>
              <br />
              {result}
            </p>
          ) : null}
          <p>
            Origen: {origin ? formatHelpOrigin(origin) : "Origen no registrado"}
            {draft.capturedAt
              ? ` · ${new Date(draft.capturedAt).toLocaleString("es-CL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}`
              : ""}
          </p>
          {result ? null : (
            <>
          <label>
            Área
            <select aria-label="Área" value={areaId} onChange={(event) => setAreaId(event.target.value)}>
              {DEFAULT_ATTENTION_AREAS.filter((area) => area.active).map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </label>
          <textarea
            value={body}
            required
            minLength={3}
            maxLength={2000}
            rows={4}
            aria-label="Qué ocurrió"
            placeholder="Cuéntalo en pocas palabras"
            onChange={(event) => setBody(event.target.value)}
          />
          <label>
            Captura
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label="Captura opcional"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  setAttachment(null);
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === "string") {
                    setAttachment({ name: file.name, mediaType: file.type, dataUrl: reader.result });
                  }
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {error ? <p role="alert">{error}</p> : null}
          <button type="submit" disabled={sending || body.trim().length < 3}>
            {sending ? "Enviando…" : "Enviar ticket"}
          </button>
            </>
          )}
        </form>
      ) : null}
      <style>{`
        .help-ask, .help-ask-done {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 80;
          width: min(360px, calc(100vw - 32px));
          padding: 16px;
          border-radius: 16px;
          background: var(--color-surface);
          color: var(--color-foreground);
          box-shadow: 0 16px 40px color-mix(in srgb, var(--gray-900) 18%, transparent);
        }
        .help-ask header, .help-ask label { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
        .help-ask textarea, .help-ask input { width: 100%; margin-top: 8px; }
        .help-ask button[type="submit"] { margin-top: 12px; }
      `}</style>
    </HelpAskContext.Provider>
  );
}
