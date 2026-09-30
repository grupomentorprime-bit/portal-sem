import { EvaluarCta, HERO_CTA_CLASS, SupportHero } from "@/components/sites/cumple/pages/SupportBlocks";
import { comoFunciona } from "@/sites/cumple/pages/como-funciona";

export function ComoFuncionaPage() {
  return (
    <main>
      <SupportHero eyebrow={comoFunciona.eyebrow} title={comoFunciona.h1} lead={comoFunciona.lead}>
        <a href="/evaluar" className={HERO_CTA_CLASS}>
          {comoFunciona.ctaLabel} →
        </a>
      </SupportHero>

      <section aria-label="Pasos del método">
        <ol className="mx-auto max-w-6xl space-y-6 px-6 py-14">
          {comoFunciona.steps.map((step) => (
            <li key={step.step} className="grid gap-4 rounded-[28px] border border-cline bg-ccard p-6 sm:p-8 md:grid-cols-[auto_1fr] md:gap-8">
              <span className="font-cdisplay text-4xl font-extrabold text-cviolet" aria-hidden="true">
                {step.step}
              </span>
              <div className="max-w-3xl">
                <h2 className="font-cdisplay text-2xl font-extrabold tracking-tight text-cink">{step.title}</h2>
                <p className="mt-2 text-base font-semibold leading-7 text-cink">{step.summary}</p>
                <div className="mt-3 space-y-3 text-base leading-7 text-cmuted">
                  {step.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <EvaluarCta title={comoFunciona.ctaTitle} text={comoFunciona.ctaText} label={comoFunciona.ctaLabel} />
    </main>
  );
}