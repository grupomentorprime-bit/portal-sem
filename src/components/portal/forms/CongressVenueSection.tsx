import { QUILICURA_NAZARETH_VENUE } from "@/lib/experience/forms/quilicura-nazareth-venue";

/** Sede del congreso: nombre, dirección, mapa y navegación. */
export function CongressVenueSection() {
  const venue = QUILICURA_NAZARETH_VENUE;

  return (
    <section className="congress-venue" aria-labelledby="congress-venue-title">
      <h2 id="congress-venue-title" className="congress-venue__title">
        Lugar del Congreso
      </h2>
      <p className="congress-venue__name">{venue.name}</p>
      <p className="congress-venue__address">{venue.address}</p>
      <div className="congress-venue__map">
        <iframe
          title={`Mapa de ${venue.name}`}
          src={venue.embedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <a
        className="congress-venue__directions"
        href={venue.directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Cómo llegar
      </a>
    </section>
  );
}
