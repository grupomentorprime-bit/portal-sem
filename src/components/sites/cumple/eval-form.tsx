"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { CUMPLE_FORM_ID } from "@/sites/cumple/site";
import {
  CHECK_OPTIONS,
  DIAGNOSTICO_DISCLAIMER,
  HEADCOUNT_OPTIONS,
  YES_NO_OPTIONS,
  applicableMatters,
  buildDiagnostico,
  type CheckAnswer,
  type DiagnosticoInput,
  type Headcount,
  type MatterId,
  type YesNo,
} from "@/sites/cumple/diagnostico";
import { isValidChilePhone } from "@/lib/experience/forms/phone-chile";

type Step = "headcount" | "operacion" | "datos" | "materia" | "contacto" | "creando" | "resultado";

const BUILD_LINES = [
  "Leyendo el perfil de la empresa",
  "Revisando cada materia",
  "Ordenando las prioridades",
] as const;

const fieldClass =
  "h-11 w-full rounded-xl border border-cline bg-cpaper px-3 text-sm font-normal text-cink outline-none focus:border-caccent focus:ring-2 focus:ring-caccent/20";

function ChoiceButton({
  selected,
  children,
  onClick,
  compact = false,
}: {
  selected?: boolean;
  children: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-2xl border text-sm font-semibold transition ${
        compact ? "min-h-11 px-2 py-2 text-center" : "min-h-14 px-4 py-3 text-left"
      } ${
        selected
          ? "border-caccent bg-caccent/10 text-cink"
          : "border-cline bg-cpaper text-cink hover:border-caccent"
      }`}
    >
      {children}
    </button>
  );
}

export function EvalForm() {
  const [step, setStep] = useState<Step>("headcount");
  const [headcount, setHeadcount] = useState<Headcount | "">("");
  const [contractors, setContractors] = useState<YesNo | "">("");
  const [multiSite, setMultiSite] = useState<YesNo | "">("");
  const [personalData, setPersonalData] = useState<YesNo | "">("");
  const [matterIndex, setMatterIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<MatterId, Partial<Record<string, CheckAnswer>>>>>({});
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [comunicacionesComerciales, setComunicacionesComerciales] = useState(false);
  const [pending, setPending] = useState(false);
  const [buildPhase, setBuildPhase] = useState(0);
  const [falta, setFalta] = useState(100);
  const [message, setMessage] = useState("");
  const [reportPath, setReportPath] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const buildTimers = useRef<number[]>([]);
  const percentTimer = useRef<number | null>(null);

  const profileReady = headcount !== "" && contractors !== "" && personalData !== "";
  const matters = useMemo(
    () =>
      profileReady
        ? applicableMatters({ headcount, contractors, personalData })
        : [],
    [profileReady, headcount, contractors, personalData]
  );
  const currentMatter = matters[matterIndex];
  const materiaLista = Boolean(
    currentMatter && currentMatter.checks.every((check) => answers[currentMatter.id]?.[check.id])
  );
  const stepNumber =
    step === "headcount" ? 1 : step === "operacion" ? 2 : step === "datos" ? 3 : step === "materia" ? 4 + matterIndex : step === "contacto" ? 4 + matters.length : 0;
  const stepTotal = 4 + matters.length;

  const diagnostico = useMemo(() => {
    if (!profileReady || !multiSite) return null;
    const input: DiagnosticoInput = {
      headcount,
      contractors,
      multiSite,
      personalData,
      answers,
    };
    return buildDiagnostico(input);
  }, [profileReady, headcount, contractors, multiSite, personalData, answers]);

  function goBack() {
    if (step === "contacto") {
      if (matters.length === 0) setStep("datos");
      else {
        setMatterIndex(matters.length - 1);
        setStep("materia");
      }
      return;
    }
    if (step === "materia") {
      if (matterIndex > 0) setMatterIndex((index) => index - 1);
      else setStep("datos");
      return;
    }
    if (step === "datos") setStep("operacion");
    else if (step === "operacion") setStep("headcount");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!diagnostico || multiSite === "") return;
    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) nextErrors.fullName = "Este campo es obligatorio";
    if (!email.trim()) nextErrors.email = "Este campo es obligatorio";
    if (!phone.trim()) nextErrors.phone = "Este campo es obligatorio";
    else if (!isValidChilePhone(phone)) nextErrors.phone = "Ingrese un teléfono chileno válido";
    if (!company.trim()) nextErrors.company = "Este campo es obligatorio";
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length > 0) return;

    setBuildPhase(0);
    setFalta(100);
    setStep("creando");
    setPending(true);
    for (const timer of buildTimers.current) window.clearTimeout(timer);
    if (percentTimer.current !== null) window.clearInterval(percentTimer.current);
    const started = Date.now();
    const pace = (elapsed: number) => {
      const left = Math.max(12, Math.round(100 * Math.exp(-elapsed / 9000)));
      const progressed = 100 - left;
      return {
        left,
        phase: progressed >= 72 ? 3 : progressed >= 48 ? 2 : progressed >= 24 ? 1 : 0,
      };
    };
    percentTimer.current = window.setInterval(() => {
      const next = pace(Date.now() - started);
      setFalta(next.left);
      setBuildPhase(next.phase);
    }, 120);
    try {
      const response = await fetch(`/api/experience/forms/${CUMPLE_FORM_ID}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            company: company.trim(),
            diagnosticoResumen: diagnostico.resumen,
            headcount,
            contractors,
            multiSite,
            personalData,
            answers,
            comunicacionesComerciales,
          },
        }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
        errors?: Record<string, string>;
        reportPath?: string;
      };
      if (!response.ok || !body.ok) {
        setStep("contacto");
        setErrors(body.errors ?? {});
        setMessage(body.error || "No pudimos guardar la solicitud. Revise los datos e intente de nuevo.");
        return;
      }
      const minimum = started + 6400 - Date.now();
      if (minimum > 0) await new Promise((resolve) => window.setTimeout(resolve, minimum));
      if (percentTimer.current !== null) window.clearInterval(percentTimer.current);
      percentTimer.current = null;
      const from = Math.max(12, Math.round(100 * Math.exp(-(Date.now() - started) / 9000)));
      const finishAt = Date.now();
      await new Promise<void>((resolve) => {
        const finish = window.setInterval(() => {
          const t = Math.min(1, (Date.now() - finishAt) / 1600);
          const left = Math.round(from * (1 - t));
          const progressed = 100 - left;
          setFalta(left);
          setBuildPhase(progressed >= 72 ? 3 : progressed >= 48 ? 2 : progressed >= 24 ? 1 : 0);
          if (t >= 1) {
            window.clearInterval(finish);
            resolve();
          }
        }, 80);
        buildTimers.current.push(finish);
      });
      setReportPath(
        typeof body.reportPath === "string" &&
          body.reportPath.startsWith("/informe/") &&
          !body.reportPath.startsWith("//")
          ? body.reportPath
          : ""
      );
      setFalta(0);
      setBuildPhase(3);
      await new Promise((resolve) => window.setTimeout(resolve, 280));
      setStep("resultado");
    } catch {
      setStep("contacto");
      setMessage("No pudimos guardar la solicitud. Revise los datos e intente de nuevo.");
    } finally {
      for (const timer of buildTimers.current) window.clearTimeout(timer);
      if (percentTimer.current !== null) window.clearInterval(percentTimer.current);
      percentTimer.current = null;
      setPending(false);
    }
  }

  return (
    <div className="rounded-[28px] bg-ccard p-6 shadow-[0_24px_60px_-36px_rgba(20,20,20,0.45)] sm:p-8">
      {step === "creando" ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-caccent">Creando su diagnóstico</p>
          <h2 className="mt-3 font-cdisplay text-2xl font-extrabold leading-snug text-cink">
            {company.trim() || "Su empresa"}
          </h2>
          <p className="mt-4 font-cdisplay text-4xl font-extrabold tracking-tight text-cink">Falta {falta}%</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-csand">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6d4dff] to-[#3d6bff] transition-all duration-150"
              style={{ width: `${100 - falta}%` }}
            />
          </div>
          <ul className="mt-6 space-y-3">
            {BUILD_LINES.map((line, index) => {
              const done = buildPhase > index;
              const active = buildPhase === index;
              return (
                <li key={line} className={`flex items-center gap-3 text-sm ${done ? "font-semibold text-cink" : "text-cmuted"}`}>
                  <span
                    className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                      done ? "bg-caccent text-white" : "border border-cline bg-cpaper text-cmuted"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  <span className="flex-1">{line}</span>
                  {active ? <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-caccent" aria-hidden="true" /> : null}
                </li>
              );
            })}
            {buildPhase >= BUILD_LINES.length ? (
              <li className="flex items-center gap-3 text-sm font-semibold text-cink">
                <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-caccent" aria-hidden="true" />
                Preparando el resultado
              </li>
            ) : null}
          </ul>
        </div>
      ) : step === "resultado" && diagnostico ? (
        <div className="rise">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-caccent">Diagnóstico orientativo</p>
          <p className="mt-3 text-sm font-semibold text-cmuted">{company.trim()}</p>
          <h2 className="mt-1 font-cdisplay text-3xl font-extrabold leading-tight text-cink">
            {diagnostico.headline}
          </h2>
          <p className="mt-2 text-sm leading-6 text-cmuted">
            Hallazgos declarados. No es una certificación ni un porcentaje de cumplimiento legal.
          </p>
          {diagnostico.priorities.length > 0 ? (
            <ol className="mt-6 space-y-3">
              {diagnostico.priorities.map((item, index) => (
                <li
                  key={item.id}
                  className="rise flex items-start gap-3 rounded-2xl border border-cline bg-cpaper px-4 py-3"
                  style={{ animationDelay: `${index * 0.12}s` }}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white ${
                      item.status === "no_esta" ? "bg-[#ef4444]" : "bg-[#f59e0b]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-cink">{item.label}</span>
                    <span className="text-sm leading-5 text-cmuted">
                      {item.findings.map((finding) => finding.charAt(0).toUpperCase() + finding.slice(1)).join(". ")}.
                    </span>
                    <span className="mt-2 block text-sm leading-5 text-cink">{item.exposure}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 rounded-2xl border border-cline bg-cpaper px-4 py-4 text-sm leading-6 text-cink">
              Según lo declarado, no hay brechas en las materias aplicables. Esto no certifica el cumplimiento legal.
            </p>
          )}
          <div className="mt-6 rounded-2xl bg-[#071a45] px-4 py-4 text-sm leading-6 text-white">
            {diagnostico.callLine}
          </div>
          {reportPath ? (
            <a href={reportPath} className="mt-6 inline-block text-sm font-semibold text-cink underline">
              Ver informe
            </a>
          ) : null}
          <p className="mt-4 text-xs leading-5 text-cmuted">{diagnostico.disclaimer}</p>
        </div>
      ) : (
        <div>
          {stepNumber > 0 ? (
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-caccent">
              {profileReady ? `${stepNumber} de ${stepTotal}` : `Paso ${stepNumber}`}
            </p>
          ) : null}

          {step === "headcount" ? (
            <div className="mt-3">
              <h2 className="font-cdisplay text-2xl font-extrabold leading-snug text-cink">
                ¿Cuántas personas trabajan en la empresa?
              </h2>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {HEADCOUNT_OPTIONS.map((option) => (
                  <ChoiceButton
                    key={option.value}
                    selected={headcount === option.value}
                    onClick={() => {
                      setHeadcount(option.value);
                      setStep("operacion");
                    }}
                  >
                    {option.label}
                  </ChoiceButton>
                ))}
              </div>
            </div>
          ) : null}

          {step === "operacion" ? (
            <div className="mt-3">
              <h2 className="font-cdisplay text-2xl font-extrabold leading-snug text-cink">Su operación</h2>
              <fieldset className="mt-6">
                <legend className="text-sm font-semibold text-cink">¿Trabaja con contratistas?</legend>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {YES_NO_OPTIONS.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      selected={contractors === option.value}
                      onClick={() => setContractors(option.value)}
                    >
                      {option.label}
                    </ChoiceButton>
                  ))}
                </div>
              </fieldset>
              <fieldset className="mt-6">
                <legend className="text-sm font-semibold text-cink">¿Tiene más de un local, sucursal o faena?</legend>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {YES_NO_OPTIONS.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      selected={multiSite === option.value}
                      onClick={() => setMultiSite(option.value)}
                    >
                      {option.label}
                    </ChoiceButton>
                  ))}
                </div>
              </fieldset>
              <button
                type="button"
                disabled={contractors === "" || multiSite === ""}
                onClick={() => setStep("datos")}
                className="glow-btn mt-6 w-full rounded-full px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continuar
              </button>
            </div>
          ) : null}

          {step === "datos" ? (
            <div className="mt-3">
              <h2 className="font-cdisplay text-2xl font-extrabold leading-snug text-cink">
                ¿Trata datos de clientes o de trabajadores más allá de la nómina?
              </h2>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {YES_NO_OPTIONS.map((option) => (
                  <ChoiceButton
                    key={option.value}
                    selected={personalData === option.value}
                    onClick={() => {
                      setPersonalData(option.value);
                      setMatterIndex(0);
                      setStep("materia");
                    }}
                  >
                    {option.label}
                  </ChoiceButton>
                ))}
              </div>
            </div>
          ) : null}

          {step === "materia" && currentMatter ? (
            <div className="mt-3">
              <h2 className="font-cdisplay text-2xl font-extrabold leading-snug text-cink">{currentMatter.label}</h2>
              <p className="mt-2 text-sm leading-6 text-cmuted">Según lo que sabe ahora. No hace falta buscar documentos.</p>
              <ul className="mt-6 space-y-5">
                {currentMatter.checks.map((check) => (
                  <li key={check.id}>
                    <p className="text-sm font-semibold leading-6 text-cink">{check.prompt}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {CHECK_OPTIONS.map((option) => (
                        <ChoiceButton
                          key={option.value}
                          compact
                          selected={answers[currentMatter.id]?.[check.id] === option.value}
                          onClick={() =>
                            setAnswers((current) => ({
                              ...current,
                              [currentMatter.id]: { ...current[currentMatter.id], [check.id]: option.value },
                            }))
                          }
                        >
                          {option.label}
                        </ChoiceButton>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={!materiaLista}
                onClick={() => {
                  if (matterIndex < matters.length - 1) setMatterIndex((index) => index + 1);
                  else setStep("contacto");
                }}
                className="glow-btn mt-6 w-full rounded-full px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continuar
              </button>
            </div>
          ) : null}

          {step === "contacto" ? (
            <form onSubmit={onSubmit} className="mt-3" noValidate>
              <h2 className="font-cdisplay text-2xl font-extrabold leading-snug text-cink">
                Datos de contacto
              </h2>
              <p className="mt-2 text-sm leading-6 text-cmuted">
                El diagnóstico aparece al enviar. Estos datos sirven para elaborarlo y para que el equipo del Espacio lo vea. No queda un contacto automático por WhatsApp.
              </p>
              <div className="mt-6 grid gap-4">
                <label className="grid gap-1.5 text-sm font-semibold text-cink">
                  Nombre
                  <input
                    name="fullName"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    className={fieldClass}
                  />
                  {errors.fullName ? <span className="text-xs font-normal text-[#b91c1c]">{errors.fullName}</span> : null}
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-cink">
                  Teléfono
                  <input
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                    placeholder="+56 9 1234 5678"
                    className={fieldClass}
                  />
                  {errors.phone ? <span className="text-xs font-normal text-[#b91c1c]">{errors.phone}</span> : null}
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-cink">
                  Correo
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className={fieldClass}
                  />
                  {errors.email ? <span className="text-xs font-normal text-[#b91c1c]">{errors.email}</span> : null}
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-cink">
                  Nombre de la empresa
                  <input
                    name="company"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    autoComplete="organization"
                    placeholder="Ej. Comercial Andes"
                    className={fieldClass}
                  />
                  {errors.company ? <span className="text-xs font-normal text-[#b91c1c]">{errors.company}</span> : null}
                </label>
                <label className="flex items-start gap-3 text-sm font-normal leading-6 text-cink">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={comunicacionesComerciales}
                    onChange={(event) => setComunicacionesComerciales(event.target.checked)}
                  />
                  Acepto comunicaciones comerciales de este Espacio. Es independiente de la entrega del diagnóstico.
                </label>
                {message ? <p className="text-sm text-[#b91c1c]">{message}</p> : null}
                <button
                  type="submit"
                  disabled={
                    pending ||
                    !diagnostico ||
                    !fullName.trim() ||
                    !email.trim() ||
                    !phone.trim() ||
                    !company.trim()
                  }
                  className="glow-btn mt-1 rounded-full px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Enviando…" : "Ver mi diagnóstico"}
                </button>
              </div>
            </form>
          ) : null}

          {step !== "headcount" ? (
            <button type="button" onClick={goBack} className="mt-4 text-sm font-semibold text-cmuted">
              Atrás
            </button>
          ) : null}
          <p className="mt-6 text-xs leading-5 text-cmuted">{DIAGNOSTICO_DISCLAIMER}</p>
        </div>
      )}
    </div>
  );
}
