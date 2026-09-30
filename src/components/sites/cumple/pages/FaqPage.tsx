import { EvaluarCta, SupportHero } from "@/components/sites/cumple/pages/SupportBlocks";
import { faqItems, faqPage } from "@/sites/cumple/pages/faq";

export function FaqPage() {
  return (
    <main>
      <SupportHero eyebrow={faqPage.eyebrow} title={faqPage.heading} lead={faqPage.lead} />

      <section aria-label="Preguntas y respuestas">
        <div className="mx-auto max-w-3xl space-y-10 px-6 py-14">
          {faqItems.map((item) => (
            <article key={item.q}>
              <h2 className="font-cdisplay text-xl font-extrabold tracking-tight text-cink sm:text-2xl">{item.q}</h2>
              <p className="mt-3 text-base leading-7 text-cmuted">{item.a}</p>
              {item.links && item.links.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {item.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="inline-flex rounded-full border border-cline bg-ccard px-4 py-1.5 text-sm font-semibold text-cink transition hover:border-caccent/40 hover:bg-csand"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <EvaluarCta title={faqPage.ctaTitle} text={faqPage.ctaText} label={faqPage.ctaLabel} />
    </main>
  );
}