import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeOpening } from "@/components/portal/home/opening/HomeOpening";
import { fetchPrograms } from "@/lib/portal/content";
import { resolveHomeOpening } from "@/lib/portal/home-opening-media";
import { listTheologicalCohortLinks } from "@/lib/portal/theological-cohorts";
import type { HomeHeroPhotoRef } from "@/types/cms";
import "@/styles/home-premium/home-continuation.css";

const STUDY = [
  {
    title: "100% online",
    text: "La formación se cursa completamente en línea.",
  },
  {
    title: "Clases en vivo cada lunes",
    text: "Nos encontramos el lunes.",
  },
  {
    title: "Plataforma académica",
    text: "El material y las actividades quedan en la plataforma.",
  },
  {
    title: "Estudio durante la semana",
    text: "Seguimos creciendo con estudio y actividades entre un lunes y el siguiente.",
  },
] as const;

const GALLERY = [
  "/images/provisional/home-community-1.jpg",
  "/images/provisional/home-about-top.jpg",
  "/images/provisional/home-community-2.jpg",
  "/images/provisional/home-community-3.jpg",
  "/images/provisional/home-community-4.jpg",
] as const;

function photoStyle(src: string): CSSProperties {
  return { "--hc-photo": `url("${src}")` } as CSSProperties;
}

/**
 * Home institucional del SEM.
 * El primer corte (héroe, tríada, presentación y líneas) no se toca.
 * Desde el programa, la misma dirección visual continúa hasta el footer.
 */
export async function SemInstitutionalHome({
  tenantId,
  heroPhotos = [],
}: {
  tenantId: string;
  heroPhotos?: HomeHeroPhotoRef[];
}) {
  const [opening, programs] = await Promise.all([
    resolveHomeOpening(tenantId, heroPhotos),
    fetchPrograms(tenantId, { limit: 100 }),
  ]);
  const cohorts = listTheologicalCohortLinks(programs);

  return (
    <div className="sem-home">
      {opening ? <HomeOpening content={opening} /> : null}

      <div className="sem-continue">
        <section className="sem-continue__section sem-continue__program" aria-labelledby="sem-home-programa">
          <div className="sem-continue__wrap">
            <article className="sem-continue__program-card">
              <div>
                <p className="sem-continue__kicker">Educación Teológica</p>
                <h2 id="sem-home-programa">Programa de Formación Teológica</h2>
                <p>
                  La línea principal tiene un programa. Las generaciones son cohortes de ese
                  programa.
                </p>
                <Link href="/formacion/educacion-teologica" className="sem-continue__btn sem-continue__btn--light">
                  Educación Teológica
                  <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
                </Link>
              </div>
              <div className="sem-continue__cohorts">
                <p id="sem-home-generaciones">Generaciones del programa</p>
                <ul className="sem-continue__chips" aria-labelledby="sem-home-generaciones">
                  {cohorts.map((cohort) => (
                    <li key={cohort.label}>
                      {cohort.href ? (
                        <Link href={cohort.href} className="sem-continue__chip">
                          {cohort.label}
                        </Link>
                      ) : (
                        <span className="sem-continue__chip">{cohort.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        </section>

        <section className="sem-continue__section sem-continue__how" aria-labelledby="sem-home-estudio">
          <div className="sem-continue__wrap sem-continue__how-grid">
            <div>
              <p className="sem-continue__kicker">Modalidad</p>
              <h2 id="sem-home-estudio">Cómo estudiamos</h2>
              <p className="sem-continue__lead">
                100% online. Clases en vivo cada lunes. Plataforma académica durante la semana.
              </p>
              <ul className="sem-continue__steps">
                {STUDY.map((item) => (
                  <li key={item.title} className="sem-continue__step">
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </li>
                ))}
              </ul>
              <Link href="/como-estudiamos" className="sem-continue__btn sem-continue__btn--outline">
                Cómo estudiamos
                <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
              </Link>
            </div>
            <div
              className="sem-continue__how-photo"
              style={photoStyle("/images/provisional/home-how.jpg")}
              aria-hidden="true"
            >
              <p className="sem-continue__badge">
                <strong>100% online</strong>
                <span>Clases en vivo cada lunes</span>
              </p>
            </div>
          </div>
        </section>

        <section className="sem-continue__section sem-continue__community" aria-labelledby="sem-home-servicio">
          <div className="sem-continue__wrap">
            <header className="sem-continue__community-head">
              <div>
                <p className="sem-continue__kicker">Comunidad y servicio</p>
                <h2 id="sem-home-servicio">
                  Más que aprender, <span className="sem-continue__accent">servir mejor.</span>
                </h2>
              </div>
              <Link href="/el-sem" className="sem-continue__btn sem-continue__btn--outline">
                El SEM
                <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
              </Link>
            </header>
            <div className="sem-continue__gallery" aria-hidden="true">
              {GALLERY.map((src, index) => (
                <div
                  key={src}
                  className={index === 0 ? "sem-continue__gal sem-continue__gal--main" : "sem-continue__gal"}
                  style={photoStyle(src)}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          className="sem-continue__ipn"
          style={photoStyle("/images/provisional/home-ipn.jpg")}
          aria-labelledby="sem-home-ipn"
        >
          <div className="sem-continue__wrap sem-continue__ipn-grid">
            <div>
              <p className="sem-continue__kicker">Pertenencia</p>
              <h2 id="sem-home-ipn">
                Somos parte de <span className="sem-continue__accent">IPN Chile</span>
              </h2>
              <p>Iglesia Pentecostal Nazareth.</p>
              <Link href="/el-sem/ipn-chile" className="sem-continue__btn sem-continue__btn--light">
                IPN Chile
                <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
              </Link>
            </div>
            <p className="sem-continue__ipn-mark" aria-hidden="true">
              IPN
            </p>
          </div>
        </section>

        <section className="sem-continue__admit" aria-labelledby="sem-home-admision">
          <div className="sem-continue__wrap">
            <div className="sem-continue__admit-card">
              <div>
                <p className="sem-continue__kicker">Convocatoria vigente</p>
                <h2 id="sem-home-admision">Admisión 2027</h2>
              </div>
              <Link href="/admision" className="sem-continue__btn sem-continue__btn--primary">
                Admisión 2027
                <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
