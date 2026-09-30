"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";

type Turn = { role: "user" | "assistant"; text: string };

const sugeridas = [
  "¿Qué exige la Ley Karin?",
  "¿Qué cubre el DS 44?",
  "¿Qué rige a los contratistas?",
  "¿Cómo contrato el servicio?",
];

const saludo: Turn = {
  role: "assistant",
  text: "Consulte una obligación, norma o situación de su organización. Si hay norma revisada, la respuesta sale de ahí.",
};

function oficial(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return ["bcn.cl", "dt.gob.cl", "suseso.cl", "isl.gob.cl", "mintrab.gob.cl", "diariooficial.interior.gob.cl"].some(
      (permitido) => host === permitido || host.endsWith(`.${permitido}`),
    );
  } catch {
    return false;
  }
}

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("http") && oficial(part)) {
      return (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="font-semibold text-cviolet underline">
          Ver en Ley Chile
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function Formato({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const list = lines.length > 0 && lines.every((line) => /^[-*•]\s+/.test(line));
        if (list) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-4">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{inline(line.replace(/^[-*•]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {inline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 16.5 3.5 20V6.5A2.5 2.5 0 0 1 6 4h12a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 16H8.2L6 16.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function AsesorChat() {
  const [open, setOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const [messages, setMessages] = useState<Turn[]>([saludo]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const titleId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setPeek(true), reduced ? 0 : 1400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, pending, open]);

  async function ask(text: string) {
    const question = text.trim();
    if (!question || pending) return;

    const next = [...messages, { role: "user" as const, text: question }];
    setMessages(next);
    setDraft("");
    setPending(true);

    try {
      const response = await fetch("/api/sites/cumple/asesor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((item) => item !== saludo).slice(-8) }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      const answer = data.reply || data.error || "No pude completar la revisión.";
      setMessages((current) => [...current, { role: "assistant", text: answer }]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "No pude completar la revisión de la norma. Intente de nuevo en un momento." },
      ]);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="flex h-[min(34rem,calc(100dvh-7rem))] w-[min(100vw-2.5rem,24rem)] flex-col overflow-hidden rounded-[28px] border border-cline bg-ccard text-cink shadow-[0_24px_70px_-28px_rgba(20,40,120,0.55)]"
        >
          <header className="flex items-start justify-between gap-3 bg-gradient-to-br from-[#1a237e] via-[#3a46d6] to-[#5b4bff] px-5 py-4 text-white">
            <div>
              <p id={titleId} className="font-cdisplay text-base font-extrabold">
                Asistente CUMPLE
              </p>
              <p className="mt-1 text-xs text-white/80">Consulte una obligación, norma o situación de su organización.</p>
            </div>
            <button
              type="button"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15 text-lg leading-none"
              aria-label="Cerrar chat"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-csand px-4 py-4" aria-live="polite">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={
                  item.role === "user"
                    ? "ml-8 rounded-2xl rounded-tr-md bg-[#3a46d6] px-3.5 py-3 text-sm leading-6 text-white"
                    : "mr-4 rounded-2xl rounded-tl-md bg-ccard px-3.5 py-3 text-sm leading-5 text-cink shadow-sm"
                }
              >
                {item.role === "assistant" ? <Formato text={item.text} /> : item.text}
              </div>
            ))}
            {pending ? (
              <p className="mr-6 rounded-2xl rounded-tl-md bg-ccard px-3.5 py-3 text-sm leading-6 text-cmuted shadow-sm">
                Revisando la norma por segunda vez…
              </p>
            ) : null}
            {messages.length === 1 && !pending ? (
              <ul className="flex flex-col items-end gap-2">
                {sugeridas.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      className="rounded-full border border-cline bg-ccard px-3.5 py-2 text-left text-sm font-semibold text-cink transition hover:border-caccent/40"
                      onClick={() => void ask(item)}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="border-t border-cline bg-ccard px-3 py-3">
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="asesor-pregunta">
                Escriba su consulta
              </label>
              <input
                id="asesor-pregunta"
                ref={inputRef}
                value={draft}
                maxLength={800}
                placeholder="Una obligación, una norma o una situación"
                className="h-11 min-w-0 flex-1 rounded-full border border-cline bg-cpaper px-4 text-sm text-cink outline-none focus:border-caccent"
                onChange={(event) => setDraft(event.target.value)}
              />
              <button
                type="submit"
                disabled={pending || draft.trim().length === 0}
                className="glow-btn inline-flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
            <a href="#evaluar" className="mt-2 block px-2 text-center text-xs font-semibold text-cviolet" onClick={() => setOpen(false)}>
              Solicitar diagnóstico
            </a>
          </form>
        </section>
      ) : null}

      {peek && !open ? (
        <button
          type="button"
          className="hidden max-w-[18rem] rounded-2xl rounded-br-md border border-cline bg-ccard px-3.5 py-3 text-left text-sm leading-5 text-cink shadow-[0_16px_40px_-24px_rgba(20,40,120,0.55)] sm:block"
          onClick={() => setOpen(true)}
        >
          <span className="block font-cdisplay text-[11px] font-bold uppercase tracking-[0.14em] text-cviolet">
            Asistente CUMPLE
          </span>
          <span className="mt-1 block">Consulte una obligación, norma o situación de su organización.</span>
        </button>
      ) : null}

      <button
        type="button"
        className="glow-btn grid size-14 place-items-center rounded-full text-white shadow-[0_16px_40px_-16px_rgba(61,107,255,0.9)]"
        aria-expanded={open}
        aria-label={open ? "Cerrar chat" : "Abrir Asistente CUMPLE"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <span className="text-2xl leading-none" aria-hidden="true">
            ×
          </span>
        ) : (
          <ChatIcon className="size-7" />
        )}
      </button>
    </div>
  );
}
