import type { OfficialSource } from "@/sites/cumple/pages/types";

export function SourcesBlock({ sources }: { sources: readonly OfficialSource[] }) {
  if (sources.length === 0) return null;
  return (
    <section aria-labelledby="fuentes-oficiales" className="rounded-2xl border border-cline bg-ccard p-6">
      <h2 id="fuentes-oficiales" className="font-cdisplay text-lg font-bold text-cink">
        Fuentes oficiales
      </h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-cmuted">
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-cink"
            >
              {source.nombre}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
