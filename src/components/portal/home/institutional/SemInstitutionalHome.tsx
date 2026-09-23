import Link from "next/link";
import { SEM_ISOTIPO_ON_DARK_SRC } from "@/lib/portal/sem-identity-v7";

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

/**
 * Home institucional del SEM.
 * Solo frases ya cerradas. Sin duración, asignaturas, cursos, generaciones,
 * fechas, aranceles, testimonios ni fotografía de banco.
 */
export function SemInstitutionalHome() {
  return (
    <div className="sem-home">
      <header className="sem-home__hero">
        <div className="sem-home__wrap sem-home__hero-inner">
          <img
            src={SEM_ISOTIPO_ON_DARK_SRC}
            alt=""
            width={56}
            height={64}
            className="sem-home__mark"
          />
          <p className="sem-home__eyebrow">Seminario Eclesiástico Mayor</p>
          <h1 className="sem-home__title">
            Tu llamado merece
            <span> preparación.</span>
          </h1>
          <p className="sem-home__lead">Formación bíblica para un servicio real.</p>
          <p className="sem-home__belong">
            Somos parte de IPN Chile — Iglesia Pentecostal Nazareth.
          </p>
          <div className="sem-home__hero-actions">
            <Link href="/admision" className="sem-home__quiet-link sem-home__quiet-link--on-dark">
              Admisión 2027
            </Link>
            <Link href="/como-estudiamos" className="sem-home__quiet-link sem-home__quiet-link--on-dark">
              Cómo estudiamos
            </Link>
          </div>
        </div>
      </header>

      <section className="sem-home__band" aria-labelledby="sem-home-presentacion">
        <div className="sem-home__wrap sem-home__present">
          <p className="sem-home__kicker">El SEM</p>
          <h2 id="sem-home-presentacion" className="sem-home__statement">
            Formación bíblica para un servicio real.
          </h2>
          <p className="sem-home__statement-sub">Más que aprender, servir mejor.</p>
          <Link href="/el-sem/quienes-somos" className="sem-home__quiet-link">
            Quiénes somos
          </Link>
        </div>
      </section>

      <section className="sem-home__band sem-home__band--muted" aria-labelledby="sem-home-lineas">
        <div className="sem-home__wrap">
          <header className="sem-home__section-head">
            <p className="sem-home__kicker">Formación</p>
            <h2 id="sem-home-lineas">Líneas de formación</h2>
          </header>
          <div className="sem-home__lines">
            <article className="sem-home__line">
              <p className="sem-home__index">01</p>
              <h3>Educación Teológica</h3>
              <p>Línea principal. Un programa.</p>
              <Link href="/formacion/educacion-teologica" className="sem-home__quiet-link">
                Educación Teológica
              </Link>
            </article>
            <article className="sem-home__line">
              <p className="sem-home__index">02</p>
              <h3>Cursos de Formación</h3>
              <p>Línea independiente. La oferta aparece cuando haya un curso publicado.</p>
              <Link href="/formacion/cursos" className="sem-home__quiet-link">
                Cursos de Formación
              </Link>
            </article>
          </div>

          <article className="sem-home__program" aria-labelledby="sem-home-programa">
            <p className="sem-home__kicker">Educación Teológica</p>
            <h2 id="sem-home-programa">Programa de Formación Teológica</h2>
            <p>
              La línea principal tiene un programa. Las generaciones son cohortes de ese
              programa.
            </p>
            <Link href="/formacion/educacion-teologica" className="sem-home__quiet-link">
              Educación Teológica
            </Link>
          </article>
        </div>
      </section>

      <section className="sem-home__band" aria-labelledby="sem-home-estudio">
        <div className="sem-home__wrap">
          <header className="sem-home__section-head">
            <p className="sem-home__kicker">Modalidad</p>
            <h2 id="sem-home-estudio">Cómo estudiamos</h2>
            <p className="sem-home__section-lead">
              100% online. Clases en vivo cada lunes. Plataforma académica durante la semana.
            </p>
          </header>
          <ol className="sem-home__study">
            {STUDY.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ol>
          <Link href="/como-estudiamos" className="sem-home__quiet-link">
            Cómo estudiamos
          </Link>
        </div>
      </section>

      <section className="sem-home__service" aria-labelledby="sem-home-servicio">
        <div className="sem-home__wrap">
          <p className="sem-home__kicker sem-home__kicker--on-dark">Comunidad y servicio</p>
          <h2 id="sem-home-servicio">Más que aprender, servir mejor.</h2>
          <Link href="/el-sem" className="sem-home__quiet-link sem-home__quiet-link--on-dark">
            El SEM
          </Link>
        </div>
      </section>

      <section className="sem-home__band" aria-labelledby="sem-home-ipn">
        <div className="sem-home__wrap sem-home__affiliation">
          <p className="sem-home__kicker">Pertenencia</p>
          <h2 id="sem-home-ipn">
            Somos parte de <span>IPN Chile</span>
          </h2>
          <p>Iglesia Pentecostal Nazareth.</p>
          <Link href="/el-sem/ipn-chile" className="sem-home__quiet-link">
            IPN Chile
          </Link>
        </div>
      </section>

      <section className="sem-home__admit" aria-labelledby="sem-home-admision">
        <div className="sem-home__wrap sem-home__admit-inner">
          <div>
            <p className="sem-home__kicker">Convocatoria vigente</p>
            <h2 id="sem-home-admision">Admisión 2027</h2>
          </div>
          <div className="sem-home__admit-links">
            <Link href="/admision" className="sem-home__admit-go">
              Admisión 2027
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
