import { EvalForm } from "@/components/sites/cumple/eval-form";
import { SupportHero } from "@/components/sites/cumple/pages/SupportBlocks";
import { evaluarPage } from "@/sites/cumple/pages/evaluar";

export function EvaluarPage() {
  return (
    <main>
      <SupportHero eyebrow={evaluarPage.eyebrow} title={evaluarPage.h1} lead={evaluarPage.lead} />

      <section aria-label="Solicitud de diagnóstico">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <ul className="space-y-5">
              {evaluarPage.confianza.map((item) => (
                <li key={item.title}>
                  <h2 className="font-cdisplay text-lg font-extrabold text-cink">{item.title}</h2>
                  <p className="mt-1 text-base leading-7 text-cmuted">{item.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-8 rounded-2xl border border-cline bg-csand px-5 py-4 text-sm leading-6 text-cmuted">
              {evaluarPage.nota}
            </p>
          </div>
          <div id="formulario">
            <EvalForm />
          </div>
        </div>
      </section>
    </main>
  );
}