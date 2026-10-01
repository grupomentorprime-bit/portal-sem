import type { ReactNode } from "react";
import { EvaluarCta, HERO_CTA_CLASS, SupportHero } from "@/components/sites/cumple/pages/SupportBlocks";
import { contactoPage } from "@/sites/cumple/pages/contacto";
import type { CodedPageViewProps } from "@/sites/page-views";

const LINK_CLASS = "font-semibold text-cink underline decoration-cviolet underline-offset-4 hover:text-cviolet";

/** Solo URLs http(s): evita esquemas como `javascript:` provenientes de datos editables. */
function safeUrl(value: string): string | undefined {
  return /^https?:\/\//i.test(value) ? value : undefined;
}

function whatsappHref(value: string): string | undefined {
  const url = safeUrl(value);
  if (url) return url;
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : undefined;
}

type Row = { key: string; label: string; content: ReactNode };

export function ContactoPage({ contact, social }: Pick<CodedPageViewProps, "contact" | "social">) {
  const text = (value: string | undefined) => (value ?? "").trim();
  const email = text(contact.email);
  const phone = text(contact.phone);
  const whatsapp = text(contact.whatsapp);
  const address = text(contact.address);
  const place = [text(contact.city), text(contact.country)].filter(Boolean).join(", ");
  const hours = text(contact.hours);

  const rows: Row[] = [];
  if (email) {
    rows.push({
      key: "email",
      label: "Correo",
      content: (
        <a href={`mailto:${contact.email.trim()}`} className={LINK_CLASS}>
          {email}
        </a>
      ),
    });
  }
  if (phone) {
    rows.push({
      key: "phone",
      label: "Teléfono",
      content: (
        <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={LINK_CLASS}>
          {phone}
        </a>
      ),
    });
  }
  if (whatsapp) {
    const href = whatsappHref(whatsapp);
    rows.push({
      key: "whatsapp",
      label: "WhatsApp",
      content: href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {whatsapp}
        </a>
      ) : (
        whatsapp
      ),
    });
  }
  if (address) rows.push({ key: "address", label: "Dirección", content: address });
  if (place) rows.push({ key: "place", label: "Ubicación", content: place });
  if (hours) rows.push({ key: "hours", label: "Horario de atención", content: hours });

  const socials = (
    [
      ["facebook", "Facebook"],
      ["instagram", "Instagram"],
      ["youtube", "YouTube"],
      ["linkedin", "LinkedIn"],
      ["tiktok", "TikTok"],
      ["spotify", "Spotify"],
    ] as const
  ).flatMap(([key, label]) => {
    const href = safeUrl(text(social[key]));
    return href ? [{ key, label, href }] : [];
  });

  return (
    <main>
      <SupportHero eyebrow={contactoPage.eyebrow} title={contactoPage.h1} lead={contactoPage.lead}>
        <a href="/evaluar" className={HERO_CTA_CLASS}>
          {contactoPage.ctaLabel} →
        </a>
      </SupportHero>

      <section aria-label="Canales de contacto">
        <div className="mx-auto max-w-6xl px-6 py-14">
          {rows.length > 0 ? (
            <dl className="grid max-w-3xl gap-6 sm:grid-cols-2">
              {rows.map((row) => (
                <div key={row.key} className="rounded-2xl border border-cline bg-ccard p-5">
                  <dt className="font-cdisplay text-xs font-bold uppercase tracking-[0.16em] text-cviolet">{row.label}</dt>
                  <dd className="mt-2 text-base leading-7 text-cink">{row.content}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="max-w-3xl text-base leading-7 text-cmuted">{contactoPage.vacio}</p>
          )}

          {socials.length > 0 ? (
            <nav aria-label="Redes sociales" className="mt-10">
              <p className="font-cdisplay text-xs font-bold uppercase tracking-[0.2em] text-cviolet">Redes sociales</p>
              <ul className="mt-3 flex flex-wrap gap-3">
                {socials.map((item) => (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-full border border-cline bg-ccard px-4 py-2 text-sm font-semibold text-cink transition hover:border-caccent/40 hover:bg-csand"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </section>

      <EvaluarCta title={contactoPage.ctaTitle} text={contactoPage.ctaText} label={contactoPage.ctaLabel} />
    </main>
  );
}