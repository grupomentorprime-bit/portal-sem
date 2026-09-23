import Link from "next/link";
import { SEM_ISOTIPO_ON_DARK_SRC } from "@/lib/portal/sem-identity-v7";

const AREAS = [
  {
    title: "Estudios Bíblicos",
    text: "La Escritura como centro de la formación.",
  },
  {
    title: "Formación Ministerial",
    text: "Preparación para el servicio en la Iglesia.",
  },
  {
    title: "Área Teológica y General",
    text: "Fundamentos teológicos y formación complementaria.",
  },
] as const;

/**
 * Página institucional /formacion/malla.
 * Solo la estructura ya validada: cuatro años, ocho semestres y tres áreas.
 * No lista asignaturas, créditos, horas, certificaciones, requisitos,
 * equivalencias ni una duración distinta por cohorte.
 */
export function SemInstitutionalMalla() {
  return (
    <div className="sem-institution">
      <header className="sem-institution__hero">
        <div className="sem-home__wrap sem-institution__hero-inner">
          <nav className="sem-institution__crumb" aria-label="Breadcrumb">
            <Link href="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link href="/formacion">Formación</Link>
            <span aria-hidden="true">/</span>
            <span>Malla</span>
          </nav>
          <img
            src={SEM_ISOTIPO_ON_DARK_SRC}
            alt=""
            width={48}
            height={56}
            className="sem-institution__mark"
          />
          <p className="sem-home__eyebrow">Seminario Eclesiástico Mayor</p>
          <h1 className="sem-institution__title">Malla</h1>
          <p className="sem-institution__lead">4 años · 8 semestres · 3 áreas formativas</p>
          <p className="sem-institution__line">
            Formación progresiva a lo largo de los ocho semestres.
          </p>
        </div>
      </header>

      <section className="sem-home__band" aria-labelledby="sem-malla-areas">
        <div className="sem-home__wrap">
          <header className="sem-home__section-head">
            <p className="sem-home__kicker">Áreas formativas</p>
            <h2 id="sem-malla-areas">Tres áreas formativas</h2>
            <p className="sem-home__section-lead">
              Cada etapa se apoya en la anterior, a lo largo de los ocho semestres.
            </p>
          </header>
          <ol className="sem-malla__areas">
            {AREAS.map((area, index) => (
              <li key={area.title} className="sem-malla__area">
                <span className="sem-malla__no">{String(index + 1).padStart(2, "0")}</span>
                <h3>{area.title}</h3>
                <p>{area.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sem-home__band sem-home__band--muted" aria-label="Accesos de la malla">
        <div className="sem-home__wrap">
          <div className="sem-institution__links">
            <Link href="/formacion/educacion-teologica" className="sem-home__quiet-link">
              Educación Teológica
            </Link>
            <Link href="/como-estudiamos" className="sem-home__quiet-link">
              Cómo estudiamos
            </Link>
          </div>
          <p className="sem-malla__secondary">
            <Link href="/admision" className="sem-home__quiet-link">
              Admisión 2027
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
