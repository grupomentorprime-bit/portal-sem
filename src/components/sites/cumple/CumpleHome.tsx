import { EvalForm } from "@/components/sites/cumple/eval-form";
import { FaqList } from "@/components/sites/cumple/faq-list";
import { Icon } from "@/components/sites/cumple/icons";
import { CumpleShell } from "@/components/sites/cumple/CumpleShell";
import {
  beneficios,
  confian,
  estadoHero,
  obligacionesArea,
  pasos,
  problemas,
  soluciones,
  stats,
  tesis,
  valorHero,
} from "@/sites/cumple/content";
import type { CodedPageViewProps } from "@/sites/page-views";

const rail = ["bg-cviolet", "bg-caccent", "bg-ccyan"];

const alertas = [
  { tag: "Atención", bar: "border-[#f59e0b]", wash: "bg-[#fff7ed] cdark:bg-[#2a1d0c]", ink: "text-[#b45309] cdark:text-[#fbbf24]" },
  { tag: "Alerta", bar: "border-[#ef4444]", wash: "bg-[#fef2f2] cdark:bg-[#2c1216]", ink: "text-[#b91c1c] cdark:text-[#fca5a5]" },
  { tag: "Prioridad", bar: "border-[#f97316]", wash: "bg-[#fff4eb] cdark:bg-[#2a160c]", ink: "text-[#c2410c] cdark:text-[#fdba74]" },
  { tag: "Alerta", bar: "border-[#ef4444]", wash: "bg-[#fef2f2] cdark:bg-[#2c1216]", ink: "text-[#b91c1c] cdark:text-[#fca5a5]" },
];

function EstadoCard() {
  return (
    <div className="float-card rounded-[22px] bg-white px-4 pb-4 pt-3.5 text-[#07122e] shadow-[0_30px_80px_-28px_rgba(0,0,0,0.55)] sm:px-5 sm:pb-5 sm:pt-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-cdisplay text-base font-extrabold tracking-tight sm:text-lg">Estado de su empresa</h2>
        <span className="shrink-0 rounded-full bg-[#eef3ff] px-2 py-0.5 text-[10px] font-semibold text-[#5c6b8a]">Ejemplo</span>
      </div>
      <div className="relative mx-auto mt-0.5 w-36 sm:w-40" role="img" aria-label="Cumplimiento de ejemplo: 78 por ciento">
        <svg viewBox="0 0 200 118" className="w-full" aria-hidden="true">
          <defs>
            <linearGradient id="gauge-hero" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
          </defs>
          <path d="M18 100 A82 82 0 0 1 182 100" fill="none" stroke="#e6eef8" strokeWidth="14" strokeLinecap="round" />
          <path
            d="M18 100 A82 82 0 0 1 182 100"
            fill="none"
            className="gauge-value"
            stroke="url(#gauge-hero)"
            strokeWidth="14"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="78 100"
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="font-cdisplay text-3xl font-extrabold leading-none tracking-tight">78%</p>
          <p className="mt-0.5 text-[11px] text-[#5c6b8a]">Cumplimiento general</p>
        </div>
      </div>
      <ul className="mt-2 divide-y divide-[#e6eef8] border-t border-[#e6eef8]">
        {estadoHero.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 py-1.5 text-[13px] leading-5">
            <span className="inline-flex min-w-0 items-center gap-2 text-[#5c6b8a]">
              <span className={`size-2 shrink-0 rounded-full ${item.dot}`} aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </span>
            <span className={`font-cdisplay text-sm font-extrabold tabular-nums sm:text-base ${item.tone}`}>{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="rounded-[22px] border border-[#1b2b57] bg-[#0b1638] p-2.5 shadow-[0_40px_80px_-36px_rgba(7,26,69,0.85)] sm:p-3">
        <div className="mb-2 flex items-center gap-1.5 px-1">
          <span className="size-2 rounded-full bg-[#ff5f57]" />
          <span className="size-2 rounded-full bg-[#febc2e]" />
          <span className="size-2 rounded-full bg-[#28c840]" />
          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
            Resumen de cumplimiento
          </span>
        </div>
        <div className="rounded-[16px] bg-[#f4f7ff] p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="font-cdisplay text-xs font-bold text-[#5c6b8a]">Resumen de cumplimiento</p>
              <p className="mt-2 font-cdisplay text-3xl font-extrabold text-[#07122e]">78%</p>
              <p className="text-xs text-[#5c6b8a]">Cumplimiento general</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e6eef8]">
                <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-[#4ade80] to-[#15803d]" />
              </div>
            </div>
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="font-cdisplay text-xs font-bold text-[#5c6b8a]">Obligaciones por área</p>
              <ul className="mt-3 space-y-2.5">
                {obligacionesArea.map((item) => (
                  <li key={item.title}>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-[#07122e]">{item.title}</span>
                      <span className="tabular-nums text-[#5c6b8a]">{item.value}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e6eef8]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#6246ff] to-[#2ec8ff]"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CumpleHome({ contact }: CodedPageViewProps) {
  return (
    <CumpleShell contact={contact}>
      <main>
        <section className="relative overflow-x-hidden bg-[#071a45] text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(640px_420px_at_72%_40%,rgba(61,107,255,0.42),transparent_68%)]" />
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#6d4dff]/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#2ec8ff]/20 blur-3xl" />
          <div className="relative z-10 mx-auto grid w-full max-w-6xl items-end gap-6 px-6 pt-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-2 lg:pt-8">
            <div className="rise min-w-0 pb-5 lg:pb-6">
              <p className="font-cdisplay text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                Cumplimiento empresarial
              </p>
              <h1 className="mt-3 max-w-xl font-cdisplay text-[2rem] font-extrabold leading-[1.08] tracking-tight sm:text-[2.75rem]">
                No descubra lo que falta durante <span className="grad-text">una fiscalización.</span>
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
                Mentor Cumple identifica sus obligaciones, detecta brechas y le ayuda a implementar, documentar y demostrar su
                cumplimiento.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href="#evaluar" className="glow-btn inline-flex justify-center rounded-full px-6 py-3.5 text-sm font-bold text-white">
                  Evaluar mi empresa →
                </a>
                <a
                  href="#soluciones"
                  className="inline-flex justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  Ver qué podemos revisar
                </a>
              </div>
            </div>

            <div className="rise relative mx-auto w-full max-w-[40rem] lg:max-w-none" style={{ animationDelay: "80ms" }}>
              {/* Mobile: card first, compact advisor strip */}
              <div className="lg:hidden">
                <EstadoCard />
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
                  <img
                    src="/hero-asesora.png"
                    alt=""
                    width={715}
                    height={1042}
                    className="size-14 shrink-0 rounded-2xl object-cover object-top"
                  />
                  <div>
                    <p className="font-chand text-lg font-bold leading-5 text-ccyan">¡Antes de que sea urgente!</p>
                    <p className="mt-1 text-xs text-white/75">Preparados para detectar cumplimiento.</p>
                  </div>
                </div>
              </div>

              {/* Desktop: card mid-left; advisor fully inside the box (no head clip) */}
              <div className="relative hidden h-[30rem] lg:block xl:h-[32rem]">
                <div className="pointer-events-none absolute right-[8%] top-8 h-72 w-72 rounded-full bg-[#3d6bff]/35 blur-3xl" />
                <div className="absolute left-0 top-[22%] z-10 w-[15.5rem] xl:left-[-0.25rem] xl:w-[16.75rem]">
                  <EstadoCard />
                </div>
                <img
                  src="/hero-asesora.png"
                  alt="Asesora de cumplimiento revisando el estado en una tablet"
                  width={715}
                  height={1042}
                  fetchPriority="high"
                  className="absolute bottom-0 right-[-0.75rem] z-20 h-full w-auto max-w-[18.5rem] object-contain object-bottom drop-shadow-[0_28px_40px_rgba(0,0,0,0.4)] xl:right-[-1.25rem] xl:max-w-[20.5rem]"
                />
                <p className="font-chand absolute right-[7.5rem] top-6 z-30 max-w-[11rem] -rotate-6 text-[1.4rem] font-bold leading-6 text-ccyan drop-shadow-[0_2px_8px_rgba(7,26,69,0.45)] xl:right-[9.5rem] xl:top-4 xl:text-[1.55rem]">
                  ¡Antes de que sea urgente!
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 border-t border-white/10 bg-[#061433]/55">
            <ul className="mx-auto grid max-w-6xl gap-3 px-6 py-4 sm:grid-cols-2 lg:grid-cols-4">
              {valorHero.map((item) => (
                <li key={item.title} className="flex items-center gap-3 text-sm font-semibold text-white/90">
                  <span className="grid size-8 place-items-center rounded-full bg-white/10 text-ccyan">
                    <Icon name={item.icon} className="size-4" />
                  </span>
                  {item.title}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16" aria-labelledby="cifras">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div>
              <h2 id="cifras" className="max-w-xl font-cdisplay text-3xl font-extrabold tracking-tight sm:text-4xl">
                Las reglas cambiaron. Su gestión también <span className="text-cviolet">debe hacerlo.</span>
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-cmuted lg:justify-self-end">
              Dirección del Trabajo, SEREMI de Salud y otras entidades intensifican fiscalizaciones y multas. El cumplimiento debe
              estar organizado, vigente y demostrable.
            </p>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {stats.map((item, index) => {
              const alerta = alertas[index];
              return (
                <li key={item.value} className={`flex gap-3 rounded-2xl border-l-4 px-4 py-4 ${alerta.bar} ${alerta.wash}`}>
                  <span className={`mt-0.5 ${alerta.ink}`} aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 4.5 20.5 19H3.5L12 4.5Z" />
                      <path d="M12 10v4" />
                      <path d="M12 16.5h.01" />
                    </svg>
                  </span>
                  <div>
                    <p className="mt-1 font-cdisplay text-3xl font-extrabold tracking-tight text-cink">{item.value}</p>
                    <p className="mt-1 text-sm leading-6 text-cink">{item.label}</p>
                    <p className="mt-1 text-xs text-cmuted">{item.note}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-xs text-cmuted">Fuente: Dirección del Trabajo. Datos oficiales a junio de 2025.</p>
        </section>

        <section id="soluciones" className="scroll-mt-32 bg-csand">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="max-w-3xl font-cdisplay text-3xl font-extrabold tracking-tight sm:text-4xl">
              ¿Qué obligaciones debe cumplir <span className="text-cviolet">su empresa?</span>
            </h2>
            <p className="mt-4 max-w-2xl text-cmuted">Mentor Cumple integra todas las áreas de cumplimiento en un solo lugar.</p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {soluciones.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="block scroll-mt-36 rounded-[24px] border border-cline bg-ccard p-5 transition hover:border-caccent/40 hover:bg-csand"
                  >
                    <span className="grid size-11 place-items-center rounded-full bg-cviolet text-white">
                      <Icon name={item.icon} className="size-4" />
                    </span>
                    <h3 className="mt-4 font-cdisplay text-lg font-extrabold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-cmuted">{item.description}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="diferencia" className="scroll-mt-32 mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="relative mx-auto w-full max-w-sm">
              <div className="pointer-events-none absolute inset-x-8 bottom-0 h-40 rounded-full bg-[#3d6bff]/20 blur-3xl" />
              <img
                src="/hero-asesora.png"
                alt="Asesora de cumplimiento"
                width={715}
                height={1042}
                className="relative mx-auto h-auto w-[min(100%,18rem)] drop-shadow-[0_28px_40px_rgba(0,0,0,0.2)]"
              />
            </div>
            <div>
              <p className="font-cdisplay text-xs font-bold uppercase tracking-[0.2em] text-cviolet">El problema real</p>
              <h2 className="mt-3 max-w-2xl font-cdisplay text-3xl font-extrabold tracking-tight sm:text-4xl">
                Muchas empresas no incumplen <span className="text-cviolet">porque quieran.</span>
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-cmuted">
                Incumplen porque las reglas cambiaron y su gestión no se actualizó a tiempo.
              </p>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {problemas.map((item) => (
                  <li key={item} className="rounded-2xl border border-cline bg-csand px-4 py-4 text-sm leading-6 text-cink">
                    “{item}”
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="plataforma" className="scroll-mt-32 bg-gradient-to-br from-[#071a45] via-[#1a237e] to-[#3a46d6] py-16 text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2">
            <div>
              <h2 className="font-cdisplay text-3xl font-extrabold tracking-tight sm:text-4xl">
                No basta con tener documentos. Hay que poder <span className="grad-text">demostrar cumplimiento.</span>
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/80">{tesis}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {["Menos incertidumbre", "Más control", "Más evidencia", "Menor exposición"].map((item) => (
                  <li key={item} className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                    <Icon name="check" className="size-4 text-ccyan" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/evaluar" className="glow-btn mt-8 inline-flex rounded-full px-6 py-3.5 text-sm font-bold text-white">
                Quiero un diagnóstico →
              </a>
            </div>
            <DashboardMockup />
          </div>
        </section>

        <section id="como" className="scroll-mt-32">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="font-cdisplay text-3xl font-extrabold tracking-tight sm:text-4xl">Cómo funciona</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-cmuted">Un proceso simple, claro y con acompañamiento experto.</p>
            <ol className="relative mt-10 grid gap-4 md:grid-cols-4">
              {pasos.map((item, index) => (
                <li key={item.step} className="relative rounded-[24px] border border-cline bg-ccard p-5">
                  {index < pasos.length - 1 ? (
                    <span aria-hidden className={`absolute top-10 left-[calc(100%+1px)] z-10 hidden h-0.5 w-4 -translate-y-1/2 md:block ${rail[index]}`} />
                  ) : null}
                  <p className="relative z-10 grid size-10 place-items-center rounded-full bg-cviolet font-cdisplay text-sm font-bold text-white">
                    {item.step}
                  </p>
                  <h3 className="mt-4 font-cdisplay text-xl font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-cmuted">{item.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-cline bg-csand">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <h2 className="font-cdisplay text-2xl font-extrabold tracking-tight sm:text-3xl">Resultados que generan tranquilidad</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {beneficios.map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-cviolet text-white">
                    <Icon name={item.icon} className="size-4" />
                  </span>
                  <span className="pt-2 font-cdisplay text-sm font-extrabold leading-5 text-cink">{item.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-6 py-10">
          <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1a237e] via-[#3a46d6] to-[#5b4bff] px-6 py-10 text-white sm:px-10 lg:flex-row lg:items-center">
            <div className="orb orb-a opacity-40" />
            <div className="relative max-w-2xl">
              <h2 className="font-cdisplay text-2xl font-extrabold tracking-tight sm:text-3xl">
                ¿Quiere saber en qué estado se encuentra su empresa?
              </h2>
              <p className="mt-3 text-base leading-7 text-white/80">
                Responda unas preguntas y reciba un diagnóstico preliminar de sus principales obligaciones y brechas.
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/85">
                <li>Rápido</li>
                <li>Sin compromiso</li>
                <li>Basado en normativa vigente</li>
              </ul>
            </div>
            <a
              href="/evaluar"
              className="relative inline-flex shrink-0 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#1a237e] transition hover:bg-white/90"
            >
              Evaluar mi empresa ahora →
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12" aria-labelledby="confian">
          <h2 id="confian" className="text-center font-cdisplay text-xl font-extrabold tracking-tight text-cink sm:text-2xl">
            Confían en nosotros
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {confian.map((item) => (
              <li
                key={item}
                className="grid h-16 place-items-center rounded-2xl border border-cline bg-ccard px-3 text-center text-[11px] font-bold tracking-wide text-cmuted"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section id="faq" className="scroll-mt-32 mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-cdisplay text-xs font-bold uppercase tracking-[0.2em] text-cviolet">Recursos</p>
            <h2 className="mt-3 font-cdisplay text-3xl font-extrabold tracking-tight sm:text-4xl">Preguntas frecuentes</h2>
            <p className="mt-4 text-cmuted">Qué cubre el servicio, para quién sirve y qué pasa cuando una ley se actualiza.</p>
          </div>
          <div className="rounded-[28px] border border-cline bg-ccard px-6 sm:px-8">
            <FaqList />
          </div>
        </section>

        <section id="evaluar" className="scroll-mt-32 px-6 pb-16">
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1a237e] via-[#3a46d6] to-[#5b4bff] px-6 py-10 text-white sm:px-10 lg:grid-cols-2">
            <div className="orb orb-a opacity-50" />
            <div className="orb orb-b opacity-40" />
            <div className="relative">
              <p className="font-cdisplay text-xs font-bold uppercase tracking-[0.2em] text-ccyan">Diagnóstico</p>
              <h2 className="mt-3 font-cdisplay text-3xl font-extrabold tracking-tight sm:text-4xl">
                ¿Quiere saber en qué estado se encuentra su empresa?
              </h2>
              <p className="mt-4 text-lg leading-8 text-white/80">
                Responda unas preguntas y reciba un diagnóstico preliminar de sus principales obligaciones y brechas.
              </p>
            </div>
            <EvalForm />
          </div>
        </section>
      </main>
    </CumpleShell>
  );
}
