import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Compass } from "lucide-react";
import { HomeHeroCarousel } from "@/components/portal/home/opening/HomeHeroCarousel";
import type { ResolvedHomeOpening } from "@/lib/portal/home-opening";
import "@/styles/home-premium/home-opening.css";

interface HomeOpeningProps {
  content: ResolvedHomeOpening;
}

function TitleWithHighlight({ title, highlight }: { title: string; highlight: string }) {
  const lines = title.split("\n");
  return (
    <>
      {lines.map((line, index) => {
        const key = `${index}-${line}`;
        if (!highlight || !line.includes(highlight)) {
          return (
            <span key={key}>
              {index > 0 ? <br /> : null}
              {line}
            </span>
          );
        }
        const [before, after] = line.split(highlight);
        return (
          <span key={key}>
            {index > 0 ? <br /> : null}
            {before}
            <span className="home-opening__accent">{highlight}</span>
            {after}
          </span>
        );
      })}
    </>
  );
}

const PILLAR_ICONS = {
  book: BookOpen,
  path: Compass,
  service: ArrowUpRight,
} as const;

function photoStyle(src: string): CSSProperties {
  return { "--ho-photo": `url("${src}")` } as CSSProperties;
}

export function HomeOpening({ content }: HomeOpeningProps) {
  const { hero, pillars, presentation, lines } = content;

  return (
    <div className="home-opening">
      <section className="home-opening__hero" aria-label={hero.eyebrow}>
        <HomeHeroCarousel images={hero.photos} />
        <div className="home-opening__wrap home-opening__hero-inner">
          <div className="home-opening__hero-copy">
            <p className="home-opening__kicker">{hero.eyebrow}</p>
            <h1>
              <TitleWithHighlight title={hero.title} highlight={hero.highlight} />
            </h1>
            <p className="home-opening__hero-lead">{hero.lead}</p>
            <p className="home-opening__hero-aff">{hero.affiliation}</p>
            <div className="home-opening__hero-actions">
              <Link href={hero.primary.href} className="home-opening__btn home-opening__btn--primary">
                {hero.primary.label}
                <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
              </Link>
              <Link href={hero.secondary.href} className="home-opening__btn home-opening__btn--ghost">
                {hero.secondary.label}
                <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="home-opening__wrap">
        <ul className="home-opening__ribbon">
          {pillars.map((pillar) => {
            const Icon = PILLAR_ICONS[pillar.icon];
            return (
              <li key={pillar.id} className="home-opening__ribbon-card">
                <span className="home-opening__ribbon-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <span>
                  <strong>{pillar.title}</strong>
                  <span>{pillar.text}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <section className="home-opening__about" aria-labelledby="home-opening-presentacion">
        <div className="home-opening__wrap home-opening__about-grid">
          <div className="home-opening__collage" aria-hidden="true">
            {presentation.images.map((image, index) => (
              <div
                key={image.src}
                className={
                  index === 0
                    ? "home-opening__photo home-opening__photo--main"
                    : "home-opening__photo"
                }
                style={photoStyle(image.src)}
                data-provisional={image.provisional ? "true" : undefined}
              />
            ))}
          </div>
          <div className="home-opening__about-copy">
            <p className="home-opening__kicker">{presentation.kicker}</p>
            <h2 id="home-opening-presentacion">
              <TitleWithHighlight title={presentation.title} highlight={presentation.highlight} />
            </h2>
            <p className="home-opening__lead">{presentation.lead}</p>
            <Link href={presentation.link.href} className="home-opening__btn home-opening__btn--outline">
              {presentation.link.label}
              <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-opening__lines" aria-labelledby="home-opening-lineas">
        <div className="home-opening__wrap">
          <header className="home-opening__lines-head">
            <p className="home-opening__kicker">{lines.kicker}</p>
            <h2 id="home-opening-lineas">{lines.title}</h2>
          </header>
          <div className="home-opening__lines-grid">
            {lines.items.map((item) => (
              <article
                key={item.id}
                className={`home-opening__line home-opening__line--${item.tone}`}
                style={photoStyle(item.image.src)}
                data-provisional={item.image.provisional ? "true" : undefined}
              >
                <div className="home-opening__line-copy">
                  <p className={item.tone === "secondary" ? "home-opening__index home-opening__index--mint" : "home-opening__index"}>
                    {item.index}
                  </p>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <Link href={item.link.href} className="home-opening__line-link">
                    {item.link.label}
                    <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
