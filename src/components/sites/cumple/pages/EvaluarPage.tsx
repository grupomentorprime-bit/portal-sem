import { EvalForm } from "@/components/sites/cumple/eval-form";
import { evaluarPage } from "@/sites/cumple/pages/evaluar";

export function EvaluarPage() {
  return (
    <main className="px-4 py-6 sm:px-6 sm:py-10">
      <section aria-label="Diagnóstico de la empresa" className="mx-auto max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-caccent">{evaluarPage.eyebrow}</p>
        <h1 className="mt-3 font-cdisplay text-3xl font-extrabold leading-tight text-cink">{evaluarPage.h1}</h1>
        <p className="mt-3 mb-6 text-sm leading-6 text-cmuted">{evaluarPage.lead}</p>
        <EvalForm />
      </section>
    </main>
  );
}
