import type { PlatformLegalDocument } from "@/core/legal/platform";

export function PlatformLegalDocumentView({
  document,
}: {
  document: PlatformLegalDocument;
}) {
  const showToc = Boolean(document.showToc && document.sections.length > 3);

  return (
    <article className="space-y-8">
      <header className="space-y-3 border-b border-border/70 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--growth-os-secondary)]">
          Documento de plataforma
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {document.title}
        </h1>
        {document.intro.map((paragraph) => (
          <p key={paragraph.slice(0, 48)} className="text-base leading-relaxed text-muted">
            {paragraph}
          </p>
        ))}
      </header>

      {showToc ? (
        <nav
          aria-label="Índice"
          className="rounded-lg border border-border/80 bg-[var(--color-surface-default)] p-4 sm:p-5"
        >
          <p className="text-sm font-semibold text-foreground">Índice</p>
          <ol className="mt-3 space-y-2 text-sm">
            {document.sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-[var(--growth-os-primary)] underline-offset-2 hover:underline"
                >
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="space-y-10">
        {document.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="text-[15px] leading-relaxed text-foreground/90">
                {paragraph}
              </p>
            ))}
            {section.bullets?.length ? (
              <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-foreground/90">
                {section.bullets.map((item) => (
                  <li key={item.slice(0, 48)}>{item}</li>
                ))}
              </ul>
            ) : null}
            {section.steps?.length ? (
              <ol className="list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-foreground/90">
                {section.steps.map((step) => (
                  <li key={step.slice(0, 48)}>{step}</li>
                ))}
              </ol>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  );
}
