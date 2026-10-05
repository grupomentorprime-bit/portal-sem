import { EvaluarCta, HERO_CTA_CLASS, SupportHero } from "@/components/sites/cumple/pages/SupportBlocks";
import { nosotrosPage } from "@/sites/cumple/pages/nosotros";

export function NosotrosPage() {
  return (
    <main>
      <SupportHero eyebrow={nosotrosPage.eyebrow} title={nosotrosPage.h1} lead={nosotrosPage.lead}>
        <a href="/evaluar" className={HERO_CTA_CLASS}>
          {nosotrosPage.ctaLabel} →
        </a>
      </SupportHero>

      {nosotrosPage.sections.map((section, index) => (
        <section key={section.heading} className={index % 2 === 1 ? "bg-csand" : undefined}>
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="max-w-3xl">
              <h2 className="font-cdisplay text-2xl font-extrabold tracking-tight text-cink sm:text-3xl">
                {section.heading}
              </h2>
              <div className="mt-5 space-y-4 text-base leading-7 text-cmuted">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      <EvaluarCta title={nosotrosPage.ctaTitle} text={nosotrosPage.ctaText} label={nosotrosPage.ctaLabel} />
    </main>
  );
}