import { PortalContainer } from "@/components/portal/layout";
import { DEFAULT_ADMISSION_CONFIG } from "@/lib/portal/admission-content";

export function SemAdmissionDates() {
  const items = DEFAULT_ADMISSION_CONFIG.datesHighlight.items.filter((item) => item.visible);
  if (items.length === 0) return null;

  const lead = items.find((item) => /2027/.test(item.value)) ?? items[items.length - 1];
  const supporting = items.filter((item) => item.id !== lead.id);

  return (
    <div className="sem-admission-dates" aria-label="Fechas oficiales">
      <PortalContainer>
        <p className="sem-admission-dates__kicker">Fechas oficiales</p>
        <div className="sem-admission-dates__layout">
          <p className="sem-admission-dates__lead">
            <span>{lead.label}</span>
            <strong>{lead.value}</strong>
          </p>
          {supporting.length > 0 ? (
            <ul className="sem-admission-dates__support" role="list">
              {supporting.map((item) => (
                <li key={item.id}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </PortalContainer>
    </div>
  );
}
