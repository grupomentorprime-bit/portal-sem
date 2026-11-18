"use client";

import { useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { formatHelpOrigin, findHelpOrigin } from "@/lib/desktop/help-origins";

interface VisitorCase {
  correlative: string;
  subject: string;
  status: string;
  helpFromLabel: string;
  helpPlace: string;
  nextStepLabel: string;
  messages: Array<{ id: string; label: string; body: string }>;
}

export function PublicHelpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [code, setCode] = useState("");
  const [correlative, setCorrelative] = useState("");
  const [follow, setFollow] = useState("");
  const [ticket, setTicket] = useState<VisitorCase | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [capturedAt] = useState(() => new Date().toISOString());
  const origin = findHelpOrigin("web.publica.pedir-ayuda");

  async function post(payload: Record<string, unknown>) {
    setSending(true);
    setError("");
    const response = await fetch("/api/help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    setSending(false);
    const data = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      correlative?: string;
      mailSent?: boolean;
      case?: VisitorCase;
    } | null;
    if (!response?.ok || !data?.ok) {
      setError(data?.error || "No se pudo guardar.");
      return null;
    }
    return data;
  }

  async function openTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = await post({
      action: "visitor-open",
      name,
      email,
      body,
      originId: "web.publica.pedir-ayuda",
      capturedAt,
    });
    if (!data) return;
    setCorrelative(data.correlative || "");
    const mailLine = data.mailSent === false ? "\nNo se pudo enviar el código al correo." : "";
    setNote(
      data.correlative ? `Solicitud recibida\n${data.correlative}${mailLine}` : `Solicitud recibida${mailLine}`
    );
    setBody("");
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = await post({ action: "visitor-verify", correlative, email, code });
    if (!data?.case) return;
    setTicket(data.case);
    setNote(`Caso ${data.case.correlative}. ${data.case.nextStepLabel}.`);
  }

  async function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = await post({ action: "visitor-message", correlative, email, code, body: follow });
    if (!data?.case) return;
    setTicket(data.case);
    setFollow("");
  }

  return (
    <div className="mx-auto grid max-w-xl gap-8 px-4 py-12">
      <header>
        <p className="text-sm text-muted">NELZURI</p>
        <h1 className="text-3xl font-semibold">Pedir ayuda</h1>
        <p className="mt-2 text-sm text-muted">
          Cuéntalo en pocas palabras. Para seguir el caso hay que verificar el correo.
        </p>
      </header>
      <form className="grid gap-3" onSubmit={openTicket}>
        <label className="grid gap-1 text-sm">
          Nombre
          <input className="rounded-md border px-3 py-2" value={name} required onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          Correo
          <input className="rounded-md border px-3 py-2" type="email" value={email} required onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          Qué ocurrió
          <textarea className="rounded-md border px-3 py-2" value={body} required minLength={3} rows={4} onChange={(event) => setBody(event.target.value)} />
        </label>
        <p className="text-sm">Origen: {origin ? formatHelpOrigin(origin) : "Web"}</p>
        <button className="rounded-md bg-foreground px-4 py-2 text-background" type="submit" disabled={sending}>
          Enviar
        </button>
      </form>
      <form className="grid gap-3" onSubmit={verify}>
        <h2 className="text-lg font-semibold">Seguir un caso</h2>
        <label className="grid gap-1 text-sm">
          Correlativo
          <input className="rounded-md border px-3 py-2" value={correlative} required onChange={(event) => setCorrelative(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          Correo
          <input className="rounded-md border px-3 py-2" type="email" value={email} required onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          Código
          <input className="rounded-md border px-3 py-2" value={code} required onChange={(event) => setCode(event.target.value)} />
        </label>
        <button className="rounded-md border px-4 py-2" type="submit" disabled={sending}>
          Verificar contacto
        </button>
      </form>
      {ticket ? (
        <section className="grid gap-3">
          <h2 className="text-lg font-semibold">{ticket.correlative}</h2>
          <p className="text-sm">
            {ticket.helpFromLabel} {ticket.helpPlace}. {ticket.nextStepLabel}.
          </p>
          <ul className="grid gap-2 text-sm">
            {ticket.messages.map((message) => (
              <li key={message.id}>
                <strong>{message.label}. </strong>
                {message.body}
              </li>
            ))}
          </ul>
          <form className="grid gap-3" onSubmit={reply}>
            <textarea className="rounded-md border px-3 py-2" value={follow} required minLength={1} rows={3} aria-label="Respuesta" onChange={(event) => setFollow(event.target.value)} />
            <button className="rounded-md border px-4 py-2" type="submit" disabled={sending}>
              Responder
            </button>
          </form>
        </section>
      ) : null}
      {note ? (
        <p role="status" className="whitespace-pre-line">
          {note}
        </p>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}

export function PublicHelpDock() {
  const pathname = usePathname();
  const [capturedAt, setCapturedAt] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [correlative, setCorrelative] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const origin = findHelpOrigin("web.publica.pedir-ayuda");

  if (pathname === "/ayuda") return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    const response = await fetch("/api/help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "visitor-open",
        name,
        email,
        body,
        originId: "web.publica.pedir-ayuda",
        capturedAt,
      }),
    }).catch(() => null);
    setSending(false);
    const data = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      correlative?: string;
    } | null;
    if (!response?.ok || !data?.ok || !data.correlative) {
      setError(data?.error || "No se pudo guardar.");
      return;
    }
    setCorrelative(data.correlative);
    setBody("");
  }

  return (
    <div className="public-help-dock">
      {capturedAt ? (
        <form onSubmit={submit} aria-label="Pedir ayuda">
          <header>
            <strong>Pedir ayuda</strong>
            <button
              type="button"
              onClick={() => {
                setCapturedAt("");
                setCorrelative("");
              }}
            >
              Cerrar
            </button>
          </header>
          <p>Origen: {origin ? formatHelpOrigin(origin) : "Web"}</p>
          {correlative ? (
            <p role="status">
              <strong>Solicitud recibida</strong>
              <br />
              {correlative}
            </p>
          ) : (
            <>
              <label>
                Nombre
                <input value={name} required onChange={(event) => setName(event.target.value)} />
              </label>
              <label>
                Correo
                <input type="email" value={email} required onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label>
                Qué ocurrió
                <textarea value={body} required minLength={3} rows={3} onChange={(event) => setBody(event.target.value)} />
              </label>
              {error ? <p role="alert">{error}</p> : null}
              <button type="submit" disabled={sending}>
                {sending ? "Enviando…" : "Enviar"}
              </button>
            </>
          )}
        </form>
      ) : (
        <button type="button" onClick={() => setCapturedAt(new Date().toISOString())}>
          Pedir ayuda
        </button>
      )}
      <style>{`
        .public-help-dock { position: fixed; right: 16px; bottom: 16px; z-index: 40; }
        .public-help-dock form {
          width: min(320px, calc(100vw - 32px));
          display: grid;
          gap: 8px;
          padding: 16px;
          border-radius: 16px;
          background: var(--color-surface);
          color: var(--color-foreground);
          box-shadow: 0 16px 40px color-mix(in srgb, var(--gray-900) 18%, transparent);
        }
        .public-help-dock header { display: flex; justify-content: space-between; gap: 8px; }
        .public-help-dock input, .public-help-dock textarea { width: 100%; }
        .public-help-dock > button {
          border: 0;
          border-radius: 999px;
          padding: 10px 16px;
          background: var(--color-foreground);
          color: var(--color-surface);
        }
      `}</style>
    </div>
  );
}
