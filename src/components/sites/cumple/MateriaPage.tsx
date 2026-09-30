import type { ReactNode } from "react";
import { SourcesBlock } from "@/components/sites/cumple/SourcesBlock";
import { cumpleSite } from "@/sites/cumple/site";
import type { MateriaCitation, MateriaContent, MateriaSection } from "@/sites/cumple/pages/types";

function relatedLabel(path: string): string {
  return cumpleSite.pages.find((page) => page.path === path)?.navLabel ?? path;
}

const CITATION_LINK_CLASS =
  "font-semibold text-cink underline decoration-cviolet underline-offset-4 hover:text-cviolet";

/** Enlaza inline la primera aparición de cada `anchor` en los párrafos de la sección. */
function renderParagraphs(section: MateriaSection): ReactNode[] {
  const pending = [...(section.citations ?? [])];
  return section.paragraphs.map((paragraph) => {
    const nodes: ReactNode[] = [];
    let rest = paragraph;
    for (;;) {
      let next: { index: number; citation: MateriaCitation } | undefined;
      for (const citation of pending) {
        const index = rest.indexOf(citation.anchor);
        if (index !== -1 && (!next || index < next.index)) next = { index, citation };
      }
      if (!next) break;
      const { index, citation } = next;
      pending.splice(pending.indexOf(citation), 1);
      if (index > 0) nodes.push(rest.slice(0, index));
      nodes.push(
        <a
          key={`${citation.url}-${nodes.length}`}
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          title={citation.label}
          className={CITATION_LINK_CLASS}
        >
          {citation.anchor}
        </a>,
      );
      rest = rest.slice(index + citation.anchor.length);
    }
    if (rest) nodes.push(rest);
    return <p key={paragraph}>{nodes}</p>;
  });
}

function Section({ id, section, tinted }: { id: string; section: MateriaSection; tinted?: boolean }) {
  return (
    <section aria-labelledby={id} className={tinted ? "bg-csand" : undefined}>
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="max-w-3xl">
          <h2 id={id} className="font-cdisplay text-2xl font-extrabold tracking-tight text-cink sm:text-3xl">
            {section.heading}
          </h2>
          <div className="mt-5 space-y-4 text-base leading-7 text-cmuted">
            {renderParagraphs(section)}
          </div>
        </div>
      </div>
    </section>
  );
}

export function MateriaPage({ content }: { content: MateriaContent }) {
  return (
    <main>
      <section className="relative overflow-x-hidden bg-[#071a45] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(640px_420px_at_72%_40%,rgba(61,107,255,0.42),transparent_68%)]" />
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#6d4dff]/30 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-14 lg:py-20">
          <div className="rise max-w-3xl">
            <p className="font-cdisplay text-xs font-bold uppercase tracking-[0.2em] text-white/80">{content.eyebrow}</p>
            <h1 className="mt-3 font-cdisplay text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-[2.75rem]">
              {content.h1}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">{content.lead}</p>
            <div className="mt-6">
              <a
                href="/evaluar"
                className="glow-btn inline-flex justify-center rounded-full px-6 py-3.5 text-sm font-bold text-white"
              >
                Evaluar mi empresa →
              </a>
            </div>
          </div>
        </div>
      </section>

      <Section id="materia-exige" section={content.exige} />
      <Section id="materia-implica" section={content.implica} tinted />
      <Section id="materia-cumple" section={content.cumple} />

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
          </div>
          <a
            href="/evaluar"
            className="relative inline-flex shrink-0 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#1a237e] transition hover:bg-white/90"
          >
            Evaluar mi empresa ahora →
          </a>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-6 pb-16 pt-4">
        <p className="max-w-3xl rounded-2xl border border-cline bg-csand px-5 py-4 text-sm leading-6 text-cmuted">
          {content.disclaimer}
        </p>
        <SourcesBlock sources={content.sources} />
        {content.relatedPaths.length > 0 ? (
          <nav aria-label="Relacionado">
            <p className="font-cdisplay text-xs font-bold uppercase tracking-[0.2em] text-cviolet">Relacionado</p>
            <ul className="mt-3 flex flex-wrap gap-3">
              {content.relatedPaths.map((path) => (
                <li key={path}>
                  <a
                    href={path}
                    className="inline-flex rounded-full border border-cline bg-ccard px-4 py-2 text-sm font-semibold text-cink transition hover:border-caccent/40 hover:bg-csand"
                  >
                    {relatedLabel(path)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </main>
  );
}
