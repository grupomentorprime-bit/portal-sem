import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { iconSizes } from "@/design";
import type { AdmissionClosingContactData } from "@/types/admission-closing";

interface ClosingContactProps {
  data: AdmissionClosingContactData;
}

export function ClosingContact({ data }: ClosingContactProps) {
  const social = data.social.filter((item) => item.visible && item.url.trim());
  const hasContact =
    data.title.trim() ||
    data.description.trim() ||
    data.email.trim() ||
    data.phone.trim() ||
    data.whatsapp?.trim() ||
    data.schedule?.trim() ||
    data.address?.trim();

  if (!hasContact) return null;

  return (
    <section
      className="admission-closing__contact"
      aria-labelledby="admission-closing-contact-title"
    >
      <div className="admission-closing__contact-grid">
        <div className="admission-closing__contact-main">
          {data.title ? (
            <h3 id="admission-closing-contact-title" className="admission-closing__contact-title">
              {data.title}
            </h3>
          ) : null}
          {data.description ? (
            <p className="admission-closing__contact-description">{data.description}</p>
          ) : null}

          <ul className="admission-closing__contact-list">
            {data.email ? (
              <li>
                <Mail size={iconSizes.sm} aria-hidden />
                <a href={`mailto:${data.email}`}>{data.email}</a>
              </li>
            ) : null}
            {data.phone ? (
              <li>
                <Phone size={iconSizes.sm} aria-hidden />
                <a href={`tel:${data.phone.replace(/\s/g, "")}`}>{data.phone}</a>
              </li>
            ) : null}
            {data.whatsapp ? (
              <li>
                <Phone size={iconSizes.sm} aria-hidden />
                <a
                  href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp: {data.whatsapp}
                </a>
              </li>
            ) : null}
          </ul>

          {social.length > 0 ? (
            <ul className="admission-closing__contact-social">
              {social.map((item) => (
                <li key={item.id}>
                  <Link href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.platform}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="admission-closing__contact-aside">
          {data.schedule ? (
            <div className="admission-closing__contact-panel">
              <h4 className="admission-closing__contact-panel-title">
                <Clock size={iconSizes.sm} aria-hidden />
                Horario de atención
              </h4>
              <p className="admission-closing__contact-panel-text">{data.schedule}</p>
            </div>
          ) : null}
          {data.address ? (
            <div className="admission-closing__contact-panel">
              <h4 className="admission-closing__contact-panel-title">
                <MapPin size={iconSizes.sm} aria-hidden />
                Modalidad
              </h4>
              <p className="admission-closing__contact-panel-text">{data.address}</p>
            </div>
          ) : null}
        </div>
      </div>

      {data.mapEmbedUrl ? (
        <div className="admission-closing__contact-map">
          <iframe
            title={data.title || "Mapa"}
            src={data.mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
    </section>
  );
}
