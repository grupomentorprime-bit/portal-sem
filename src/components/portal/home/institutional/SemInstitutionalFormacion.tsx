import Link from "next/link";
import { SEM_ISOTIPO_ON_DARK_SRC } from "@/lib/portal/sem-identity-v7";

/**
 * Página institucional /formacion.
 * Solo las dos líneas aprobadas y el acceso a la malla.
 * No lista generaciones como programas ni muestra cursos, duración,
 * asignaturas, aranceles o requisitos que no estén publicados.
 */
export function SemInstitutionalFormacion({
  coursesPublished,
}: {
  coursesPublished: boolean;
}) {
  return (
    <div className="sem-institution">
      <header className="sem-institution__hero">
        <div className="sem-home__wrap sem-institution__hero-inner">
          <nav className="sem-institution__crumb" aria-label="Breadcrumb">
            <Link href="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <span>Formación</span>
          </nav>
          <img
            src={SEM_ISOTIPO_ON_DARK_SRC}
            alt=""
            width={48}
            height={56}
            className="sem-institution__mark"
          />
          <p className="sem-home__eyebrow">Seminario Eclesiástico Mayor</p>
          <h1 className="sem-institution__title">Formación</h1>
          <p className="sem-institution__lead">Formación bíblica para un servicio real.</p>
        </div>
      </header>

      <section className="sem-home__band sem-home__band--muted" aria-labelledby="sem-formacion-lineas">
        <div className="sem-home__wrap">
          <header className="sem-home__section-head">
            <p className="sem-home__kicker">Líneas</p>
            <h2 id="sem-formacion-lineas">Líneas de formación</h2>
          </header>
          <div className="sem-home__lines">
            <article className="sem-home__line">
              <p className="sem-home__index">01</p>
              <h3>Educación Teológica</h3>
              <p>
                Línea principal del SEM. Un programa. Las generaciones son cohortes de ese
                programa.
              </p>
              <Link href="/formacion/educacion-teologica" className="sem-home__quiet-link">
                Educación Teológica
              </Link>
            </article>
            <article className="sem-home__line">
              <p className="sem-home__index">02</p>
              <h3>Cursos de Formación</h3>
              <p>
                Línea complementaria y escalable.
                {coursesPublished ? "" : " La oferta aparece cuando haya un curso publicado."}
              </p>
              <Link href="/formacion/cursos" className="sem-home__quiet-link">
                Cursos de Formación
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="sem-home__band" aria-labelledby="sem-formacion-malla">
        <div className="sem-home__wrap sem-institution__belong">
          <p className="sem-home__kicker">Plan de estudios</p>
          <h2 id="sem-formacion-malla">Malla</h2>
          <Link href="/formacion/malla" className="sem-home__quiet-link">
            Malla / Plan de estudios
          </Link>
        </div>
      </section>
    </div>
  );
}
