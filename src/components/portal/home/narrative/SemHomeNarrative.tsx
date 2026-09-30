import Image from "next/image";
import Link from "next/link";
import { nextImagePropsForSrc } from "@/lib/media/next-image-props";

const AXIS = [
  {
    index: "01",
    title: "Palabra",
    text: "La Escritura en el centro. El llamado se discierne y se sostiene en la Biblia.",
  },
  {
    index: "02",
    title: "Formación",
    text: "Una preparación seria y acompañada, para quien ya sirve y para quien se prepara a servir.",
  },
  {
    index: "03",
    title: "Servicio",
    text: "Lo estudiado vuelve a la congregación. Más que aprender, servir mejor.",
  },
] as const;

interface NarrativeAxisItem {
  index?: string;
  title?: string;
  text?: string;
}

interface SemHomeNarrativeProps {
  imageSrc?: string;
  imageAlt?: string;
  /** Campos del bloque CMS. Si vienen vacíos, se usa el copy de respaldo. */
  settings?: Record<string, unknown>;
}

function narrativeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function SemHomeNarrative({ imageSrc, imageAlt, settings }: SemHomeNarrativeProps) {
  const axisFromCms = Array.isArray(settings?.axisItems)
    ? settings.axisItems.filter(
        (item): item is NarrativeAxisItem =>
          Boolean(item) && typeof item === "object" && typeof (item as NarrativeAxisItem).title === "string"
      )
    : [];
  const axis = axisFromCms.length > 0 ? axisFromCms : AXIS;
  const churchLinkHref = narrativeText(settings?.churchLinkHref, "/el-sem");
  const photoProps = imageSrc ? nextImagePropsForSrc(imageSrc) : undefined;

  return (
    <div className="sem-narrative">
      <section className="sem-manifesto" aria-labelledby="sem-manifesto-title">
        <div className="sem-narrative__inner sem-manifesto__inner">
          <div className="sem-manifesto__copy">
            <p className="sem-narrative__kicker">{narrativeText(settings?.manifestoKicker, "Manifiesto")}</p>
            <h2 id="sem-manifesto-title" className="sem-manifesto__title">
              {typeof settings?.manifestoTitle === "string" && settings.manifestoTitle.trim() ? (
                settings.manifestoTitle
              ) : (
                <>
                  Formamos en la <span className="sem-narrative__mark">Palabra</span>
                  <br />
                  a quienes la Iglesia
                  <br />
                  envía a servir.
                </>
              )}
            </h2>
            <p className="sem-manifesto__lead">
              {narrativeText(
                settings?.manifestoLead,
                "El llamado no se queda en el deseo de aprender. Se prepara en la Escritura, se ordena en la formación y vuelve a la congregación como servicio."
              )}
            </p>
          </div>
          <svg className="sem-manifesto__curve" viewBox="0 0 280 560" aria-hidden="true">
            <path d="M196 16C72 78 48 196 132 286C214 374 86 446 64 544" />
          </svg>
        </div>
      </section>

      <section className="sem-axis" aria-labelledby="sem-axis-title">
        <div className="sem-narrative__inner">
          <h2 id="sem-axis-title" className="sem-narrative__sr">
            Palabra, formación y servicio
          </h2>
            <ol className="sem-axis__list">
            {axis.map((item, position) => (
              <li key={item.index || item.title || position} className="sem-axis__item">
                <span className="sem-axis__index">{item.index || String(position + 1).padStart(2, "0")}</span>
                <div className="sem-axis__body">
                  <h3 className="sem-axis__title">{item.title}</h3>
                  <p className="sem-axis__text">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <svg className="sem-axis__thread" viewBox="0 0 80 420" aria-hidden="true">
            <path d="M40 8C18 70 62 120 36 190C14 250 58 300 34 412" />
          </svg>
        </div>
      </section>

      <section className="sem-church" aria-labelledby="sem-church-title">
        <div className="sem-narrative__inner sem-church__grid">
          <div className="sem-church__copy">
            <p className="sem-narrative__kicker">{narrativeText(settings?.churchKicker, "La Iglesia")}</p>
            <h2 id="sem-church-title" className="sem-church__title">
              {typeof settings?.churchTitle === "string" && settings.churchTitle.trim() ? (
                settings.churchTitle
              ) : (
                <>
                  Formando para servir
                  <br />
                  a la Iglesia.
                </>
              )}
            </h2>
            <p className="sem-church__lead">
              {narrativeText(
                settings?.churchLead,
                "Cada clase y cada semana de estudio tienen un destino: la congregación. Allí el llamado se reconoce, la Palabra se comparte y el servicio toma cuerpo."
              )}
            </p>
            <p className="sem-church__affiliation">
              {narrativeText(settings?.churchAffiliation, "IPN Chile — Iglesia Pentecostal Nazareth")}
            </p>
            <Link href={churchLinkHref} className="sem-narrative__link">
              {narrativeText(settings?.churchLinkLabel, "El SEM")}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <figure className="sem-church__figure">
            <div className="sem-church__frame">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={imageAlt || "Formación bíblica del Seminario Eclesiástico Mayor"}
                  fill
                  sizes="(min-width: 960px) 38vw, 100vw"
                  {...photoProps}
                />
              ) : null}
              <svg className="sem-church__accent" viewBox="0 0 160 90" aria-hidden="true">
                <path d="M8 70C36 18 92 8 152 36" />
              </svg>
            </div>
            <figcaption>Formación bíblica para un servicio real.</figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
}
