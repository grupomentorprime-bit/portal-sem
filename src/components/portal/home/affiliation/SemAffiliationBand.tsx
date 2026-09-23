interface SemAffiliationBandProps {
  title: string;
  subtitle?: string;
  description?: string;
}

export function SemAffiliationBand({
  title,
  subtitle,
  description,
}: SemAffiliationBandProps) {
  return (
    <section className="sem-affiliation" aria-labelledby="sem-affiliation-heading">
      <div className="sem-affiliation__inner">
        <p className="sem-affiliation__kicker">Nuestra identidad institucional</p>
        <h2 id="sem-affiliation-heading" className="sem-affiliation__title">
          {title.split(/(IPN Chile)/i).map((part, index) =>
            /IPN Chile/i.test(part) ? (
              <span key={index} className="sem-affiliation__mark">
                {part}
              </span>
            ) : (
              <span key={index}>{part}</span>
            )
          )}
        </h2>
        {subtitle ? <p className="sem-affiliation__subtitle">{subtitle}</p> : null}
        {description ? <p className="sem-affiliation__text">{description}</p> : null}
      </div>
    </section>
  );
}
