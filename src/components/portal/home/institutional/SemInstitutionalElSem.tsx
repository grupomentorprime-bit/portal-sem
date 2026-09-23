import Link from "next/link";
import { SEM_AFFILIATION, SEM_ISOTIPO_ON_DARK_SRC } from "@/lib/portal/sem-identity-v7";
import { semPreparedChildren } from "@/lib/portal/sem-prepared-pages";

const SECTIONS = semPreparedChildren("/el-sem");

/**
 * Página institucional /el-sem.
 * Solo frases ya cerradas y accesos al árbol real.
 * Las páginas hijas vacías no reciben texto inventado.
 */
export function SemInstitutionalElSem() {
  return (
    <div className="sem-institution">
      <header className="sem-institution__hero">
        <div className="sem-home__wrap sem-institution__hero-inner">
          <nav className="sem-institution__crumb" aria-label="Breadcrumb">
            <Link href="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <span>El SEM</span>
          </nav>
          <img
            src={SEM_ISOTIPO_ON_DARK_SRC}
            alt=""
            width={48}
            height={56}
            className="sem-institution__mark"
          />
          <p className="sem-home__eyebrow">Seminario Eclesiástico Mayor</p>
          <h1 className="sem-institution__title">
            Formación que transforma conocimiento en servicio.
          </h1>
          <p className="sem-institution__lead">Formación bíblica para un servicio real.</p>
          <p className="sem-institution__line">Más que aprender, servir mejor.</p>
        </div>
      </header>

      <section className="sem-home__band" aria-labelledby="sem-institution-pertenencia">
        <div className="sem-home__wrap sem-institution__belong">
          <p className="sem-home__kicker">Pertenencia</p>
          <h2 id="sem-institution-pertenencia">{SEM_AFFILIATION}</h2>
          <Link href="/el-sem/ipn-chile" className="sem-home__quiet-link">
            IPN Chile
          </Link>
        </div>
      </section>

      <section className="sem-home__band sem-home__band--muted" aria-labelledby="sem-institution-secciones">
        <div className="sem-home__wrap">
          <header className="sem-home__section-head">
            <p className="sem-home__kicker">El SEM</p>
            <h2 id="sem-institution-secciones">Secciones</h2>
          </header>
          <ol className="sem-institution__index">
            {SECTIONS.map((section, index) => (
              <li key={section.slug}>
                <Link href={section.slug}>
                  <span className="sem-institution__index-no">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="sem-institution__index-title">{section.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
