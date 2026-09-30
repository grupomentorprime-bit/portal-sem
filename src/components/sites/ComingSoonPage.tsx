import type { ComingSoonModel } from "@/sites/public-decision";

export function ComingSoonPage({ model }: { model: ComingSoonModel }) {
  return (
    <main className="coming-soon">
      <div className="coming-soon-glow coming-soon-glow--a" aria-hidden />
      <div className="coming-soon-glow coming-soon-glow--b" aria-hidden />
      <div className="coming-soon-grid" aria-hidden />
      <span className="coming-soon-mark coming-soon-mark--tl" aria-hidden />
      <span className="coming-soon-mark coming-soon-mark--tr" aria-hidden />
      <span className="coming-soon-mark coming-soon-mark--bl" aria-hidden />
      <span className="coming-soon-mark coming-soon-mark--br" aria-hidden />

      <div className="coming-soon-layout">
        <section className="coming-soon-copy">
          <p className="coming-soon-chip coming-soon-rise" style={{ animationDelay: "0.05s" }}>
            <span className="coming-soon-chip-dot" aria-hidden>
              <span />
              <span />
            </span>
            En construcción
          </p>

          {model.institutionName ? (
            <h1 className="coming-soon-title coming-soon-rise" style={{ animationDelay: "0.16s" }}>
              {model.institutionName}
            </h1>
          ) : null}

          <p
            className="coming-soon-message coming-soon-rise"
            style={{ animationDelay: model.institutionName ? "0.28s" : "0.16s" }}
          >
            {model.message}
          </p>

          <div
            className="coming-soon-progress coming-soon-rise"
            style={{ animationDelay: model.institutionName ? "0.4s" : "0.28s" }}
            aria-hidden
          >
            <div className="coming-soon-progress-track">
              <span className="coming-soon-progress-fill" />
            </div>
            <p>Armando las primeras páginas…</p>
          </div>

          {model.lines.length > 0 ? (
            <ul
              className="coming-soon-contacts coming-soon-rise"
              style={{ animationDelay: model.institutionName ? "0.52s" : "0.4s" }}
            >
              {model.lines.map((item) => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  {item.href ? <a href={item.href}>{item.value}</a> : <strong>{item.value}</strong>}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <div className="coming-soon-stage" aria-hidden>
          <div className="coming-soon-orbit">
            <span />
            <span />
            <span />
          </div>
          <div className="coming-soon-sheet" />
          <div className="coming-soon-frame">
            <div className="coming-soon-scan" />
            <div className="coming-soon-chrome">
              <span />
              <span />
              <span />
              <i />
            </div>
            <div className="coming-soon-body">
              <div className="coming-soon-hero" />
              <div className="coming-soon-row">
                <div />
                <div />
              </div>
              <div className="coming-soon-lines">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
