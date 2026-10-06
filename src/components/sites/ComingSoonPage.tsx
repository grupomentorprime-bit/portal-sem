import type { ComingSoonLine, ComingSoonModel } from "@/sites/public-decision";

const CHANNELS = ["Correo", "Teléfono", "WhatsApp", "Horario"];
const PLACE = ["Dirección", "Ciudad", "País"];
const SOCIAL = ["Facebook", "Instagram", "YouTube", "LinkedIn", "TikTok", "Spotify"];

function pick(lines: ComingSoonLine[], labels: string[]) {
  const rank = new Map(labels.map((label, index) => [label, index]));
  return lines
    .filter((line) => rank.has(line.label))
    .sort((a, b) => (rank.get(a.label) ?? 0) - (rank.get(b.label) ?? 0));
}

function LineValue({ item }: { item: ComingSoonLine }) {
  return item.href ? <a href={item.href}>{item.value}</a> : <strong>{item.value}</strong>;
}

function placeCopy(lines: ComingSoonLine[]) {
  const address = lines.find((line) => line.label === "Dirección")?.value;
  const locality = [
    lines.find((line) => line.label === "Ciudad")?.value,
    lines.find((line) => line.label === "País")?.value,
  ]
    .filter(Boolean)
    .join(", ");

  if (!address && lines.length === 1) {
    return { label: lines[0]?.label ?? "Lugar", address: undefined, locality: undefined, single: lines[0] };
  }

  return {
    label: address && !locality ? "Dirección" : "Lugar",
    address,
    locality,
    single: undefined,
  };
}

export function ComingSoonPage({ model }: { model: ComingSoonModel }) {
  const known = new Set([...CHANNELS, ...PLACE, ...SOCIAL]);
  const channels = pick(model.lines, CHANNELS);
  const place = pick(model.lines, PLACE);
  const social = pick(model.lines, SOCIAL);
  const rest = model.lines.filter((line) => !known.has(line.label));
  const placeView = placeCopy(place);
  const delay = model.institutionName ? "0.52s" : "0.4s";

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
            <aside className="coming-soon-notes coming-soon-rise" style={{ animationDelay: delay }}>
              <p className="coming-soon-notes-label">Contacto mientras armamos el sitio</p>

              {channels.length > 0 ? (
                <ul className="coming-soon-rows">
                  {channels.map((item) => (
                    <li key={item.label}>
                      <span className="coming-soon-kicker">{item.label}</span>
                      <LineValue item={item} />
                    </li>
                  ))}
                </ul>
              ) : null}

              {place.length > 0 ? (
                <ul className="coming-soon-rows">
                  <li>
                    <span className="coming-soon-kicker">{placeView.label}</span>
                    {placeView.single ? (
                      <LineValue item={placeView.single} />
                    ) : (
                      <span className="coming-soon-place">
                        {placeView.address ? <span>{placeView.address}</span> : null}
                        {placeView.locality ? <span>{placeView.locality}</span> : null}
                      </span>
                    )}
                  </li>
                </ul>
              ) : null}

              {social.length > 0 ? (
                <p className="coming-soon-socials">
                  {social.map((item, index) => (
                    <span key={item.label}>
                      {index > 0 ? <span aria-hidden> · </span> : null}
                      <a href={item.href ?? item.value}>{item.label}</a>
                    </span>
                  ))}
                </p>
              ) : null}

              {rest.length > 0 ? (
                <ul className="coming-soon-rows">
                  {rest.map((item) => (
                    <li key={item.label}>
                      <span className="coming-soon-kicker">{item.label}</span>
                      <LineValue item={item} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </aside>
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
