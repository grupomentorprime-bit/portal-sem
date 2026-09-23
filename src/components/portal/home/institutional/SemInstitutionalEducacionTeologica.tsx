import Link from "next/link";
import { SEM_AFFILIATION, SEM_ISOTIPO_ON_DARK_SRC } from "@/lib/portal/sem-identity-v7";
import type { TheologicalCohortLink } from "@/lib/portal/theological-cohorts";

/**
 * Página institucional /formacion/educacion-teologica.
 * Una línea, un programa. Las generaciones son cohortes de ese programa.
 * No muestra duración, asignaturas, aranceles, requisitos, perfiles,
 * certificaciones ni una cohorte que todavía no existe.
 */
export function SemInstitutionalEducacionTeologica({
  cohorts,
}: {
  cohorts: readonly TheologicalCohortLink[];
}) {
  return (
    <div className="sem-institution">
      <header className="sem-institution__hero">
        <div className="sem-home__wrap sem-institution__hero-inner">
          <nav className="sem-institution__crumb" aria-label="Breadcrumb">
            <Link href="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link href="/formacion">Formación</Link>
            <span aria-hidden="true">/</span>
            <span>Educación Teológica</span>
          </nav>
          <img
            src={SEM_ISOTIPO_ON_DARK_SRC}
            alt=""
            width={48}
            height={56}
            className="sem-institution__mark"
          />
          <p className="sem-home__eyebrow">Seminario Eclesiástico Mayor</p>
          <h1 className="sem-institution__title">Educación Teológica</h1>
          <p className="sem-institution__lead">Formación bíblica para un servicio real.</p>
          <p className="sem-institution__line">Línea principal del SEM.</p>
        </div>
      </header>

      <section className="sem-home__band" aria-labelledby="sem-teologia-programa">
        <div className="sem-home__wrap sem-institution__belong">
          <p className="sem-home__kicker">Programa</p>
          <h2 id="sem-teologia-programa">Programa de Formación Teológica</h2>
          <p className="sem-institution__copy">Un programa de formación teológica.</p>
          <p className="sem-institution__copy">Las generaciones son cohortes de ese programa.</p>

          <p className="sem-home__kicker sem-institution__cohort-kicker" id="sem-teologia-generaciones">
            Generaciones del programa
          </p>
          <ul className="sem-institution__cohorts" aria-labelledby="sem-teologia-generaciones">
            {cohorts.map((cohort) => (
              <li key={cohort.label}>
                {cohort.href ? (
                  <Link href={cohort.href}>{cohort.label}</Link>
                ) : (
                  <span>{cohort.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sem-home__band sem-home__band--muted" aria-label="Accesos de la línea">
        <div className="sem-home__wrap sem-institution__links">
          <Link href="/formacion/malla" className="sem-home__quiet-link">
            Malla / Plan de estudios
          </Link>
          <Link href="/como-estudiamos" className="sem-home__quiet-link">
            Cómo estudiamos
          </Link>
        </div>
      </section>

      <section className="sem-home__band" aria-labelledby="sem-teologia-pertenencia">
        <div className="sem-home__wrap sem-institution__belong">
          <p className="sem-home__kicker">Pertenencia</p>
          <h2 id="sem-teologia-pertenencia">{SEM_AFFILIATION}</h2>
          <Link href="/el-sem/ipn-chile" className="sem-home__quiet-link">
            IPN Chile
          </Link>
        </div>
      </section>
    </div>
  );
}
