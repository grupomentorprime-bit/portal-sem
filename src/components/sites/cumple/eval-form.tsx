"use client";

import { FormEvent, useState } from "react";
import { organizaciones } from "@/sites/cumple/content";
import { CUMPLE_FORM_ID } from "@/sites/cumple/site";

const field =
  "h-11 w-full rounded-xl border border-cline bg-cpaper px-3 text-sm font-normal text-cink outline-none focus:border-caccent focus:ring-2 focus:ring-caccent/20";

export function EvalForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setErrors({});
    setMessage("");
    try {
      const response = await fetch(`/api/experience/forms/${CUMPLE_FORM_ID}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            fullName: String(data.get("fullName") ?? ""),
            email: String(data.get("email") ?? ""),
            company: String(data.get("company") ?? ""),
            organizationType: String(data.get("organizationType") ?? ""),
          },
        }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        errors?: Record<string, string>;
      };
      if (!response.ok || !body.ok) {
        setErrors(body.errors ?? {});
        setMessage(body.error || "No pudimos guardar la solicitud. Revise los datos e intente de nuevo.");
        return;
      }
      setMessage(body.message || "Gracias. El diagnóstico queda en curso.");
      form.reset();
    } catch {
      setMessage("No pudimos guardar la solicitud. Revise los datos e intente de nuevo.");
    } finally {
      setPending(false);
    }
  }

  if (message && Object.keys(errors).length === 0) {
    return (
      <div className="rounded-[28px] bg-ccard p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-caccent">Solicitud lista</p>
        <p className="mt-3 font-cdisplay text-2xl font-extrabold leading-snug text-cink">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[28px] bg-ccard p-6 shadow-[0_24px_60px_-36px_rgba(20,20,20,0.45)] sm:p-8">
      <div className="grid gap-4">
        <label className="grid gap-1.5 text-sm font-semibold text-cink">
          Nombre
          <input name="fullName" required autoComplete="name" className={field} />
          {errors.fullName ? <span className="text-xs font-normal text-[#b91c1c]">{errors.fullName}</span> : null}
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-cink">
          Correo
          <input name="email" type="email" required autoComplete="email" className={field} />
          {errors.email ? <span className="text-xs font-normal text-[#b91c1c]">{errors.email}</span> : null}
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-cink">
          Empresa
          <input name="company" required autoComplete="organization" className={field} />
          {errors.company ? <span className="text-xs font-normal text-[#b91c1c]">{errors.company}</span> : null}
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-cink">
          Tipo de organización
          <select name="organizationType" required className={field} defaultValue="">
            <option value="" disabled>
              Seleccione
            </option>
            {organizaciones.map((item) => (
              <option key={item.title} value={item.title}>
                {item.title}
              </option>
            ))}
          </select>
          {errors.organizationType ? (
            <span className="text-xs font-normal text-[#b91c1c]">{errors.organizationType}</span>
          ) : null}
        </label>
        {message ? <p className="text-sm text-[#b91c1c]">{message}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="glow-btn mt-1 rounded-full px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Enviando…" : "Solicitar el diagnóstico"}
        </button>
      </div>
    </form>
  );
}
