import type { ReactNode } from "react";
import type { CodedPageViewProps } from "@/sites/page-views";
import {
  slotAnimationEnabled,
  slotImage,
  slotText,
} from "@/sites/content/overlay";

export interface BrandedTheme {
  id: "formacion" | "adl";
  ink: string;
  accent: string;
  wash: string;
  muted: string;
}

export const FORMACION_THEME: BrandedTheme = {
  id: "formacion",
  ink: "#07122e",
  accent: "#6d28d9",
  wash: "#f4f0ff",
  muted: "#5c6b8a",
};

export const ADL_THEME: BrandedTheme = {
  id: "adl",
  ink: "#0b1f3a",
  accent: "#18b981",
  wash: "#eefbf5",
  muted: "#4b5d73",
};

export interface BrandedService {
  title: string;
  text: string;
}

function Nav({
  theme,
  institutionName,
  items,
}: {
  theme: BrandedTheme;
  institutionName: string;
  items: Array<{ href: string; label: string }>;
}) {
  return (
    <header className="border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <a href="/" className="text-sm font-bold tracking-tight" style={{ color: theme.ink }}>
          {institutionName}
        </a>
        <nav className="flex gap-4 text-sm font-medium" style={{ color: theme.muted }}>
          {items.map((item) => (
            <a key={item.href} href={item.href} className="hover:opacity-80">
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Footer({
  theme,
  institutionName,
  contact,
}: {
  theme: BrandedTheme;
  institutionName: string;
  contact: CodedPageViewProps["contact"];
}) {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm" style={{ color: theme.muted }}>
        <p className="font-semibold" style={{ color: theme.ink }}>
          {institutionName}
        </p>
        {contact.email ? (
          <a href={`mailto:${contact.email}`} className="hover:opacity-80">
            {contact.email}
          </a>
        ) : null}
        {contact.phone ? <p>{contact.phone}</p> : null}
      </div>
    </footer>
  );
}

export function BrandedShell({
  theme,
  institutionName,
  contact,
  motion,
  children,
}: {
  theme: BrandedTheme;
  institutionName: string;
  contact: CodedPageViewProps["contact"];
  motion: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="branded-site min-h-screen"
      data-theme={theme.id}
      data-motion={motion ? "on" : "off"}
      style={{ background: theme.wash, color: theme.ink }}
    >
      <Nav
        theme={theme}
        institutionName={institutionName}
        items={[
          { href: "/", label: "Inicio" },
          { href: "/contacto", label: "Contacto" },
        ]}
      />
      {children}
      <Footer theme={theme} institutionName={institutionName} contact={contact} />
    </div>
  );
}

export function BrandedHome({
  theme,
  institutionName,
  contact,
  content,
  intro,
  services,
}: CodedPageViewProps & {
  theme: BrandedTheme;
  intro: string;
  services: readonly BrandedService[];
}) {
  const kicker = slotText(content, "hero.kicker", theme.id === "adl" ? "Academia" : "Formación");
  const title = slotText(
    content,
    "hero.title",
    institutionName
  );
  const lead = slotText(content, "hero.lead", intro);
  const image = slotImage(content, "hero.image", { src: "", alt: "" });
  const motion = slotAnimationEnabled(content, "hero.animation", true);

  return (
    <BrandedShell
      theme={theme}
      institutionName={institutionName}
      contact={contact}
      motion={motion}
    >
      <main>
        <section className="relative overflow-hidden">
          <div
            className="branded-float pointer-events-none absolute -left-16 top-10 size-56 rounded-full opacity-30 blur-3xl"
            style={{ background: theme.accent }}
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:py-20">
            <div className="branded-rise">
              <p
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: theme.accent }}
              >
                {kicker}
              </p>
              <h1 className="mt-3 max-w-[16ch] text-4xl font-extrabold tracking-tight sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8" style={{ color: theme.muted }}>
                {lead}
              </p>
              <a
                href="/contacto"
                className="mt-8 inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold text-white"
                style={{ background: theme.accent }}
              >
                Hablar con el equipo
              </a>
            </div>
            <div className="branded-rise">
              {image.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-[22rem] w-full rounded-[2rem] object-cover shadow-2xl"
                />
              ) : (
                <div
                  className="relative h-[22rem] overflow-hidden rounded-[2rem]"
                  style={{ background: "white" }}
                  aria-hidden
                >
                  <div
                    className="branded-float absolute -right-10 top-8 size-48 rounded-full opacity-40 blur-2xl"
                    style={{ background: theme.accent }}
                  />
                  <div
                    className="absolute bottom-8 left-8 right-8 h-24 rounded-3xl opacity-20"
                    style={{ background: theme.ink }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <h2 className="text-2xl font-extrabold tracking-tight">Qué hacemos</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <li
                key={service.title}
                className="rounded-[1.6rem] border border-black/5 bg-white p-6"
              >
                <h3 className="text-lg font-bold" style={{ color: theme.ink }}>
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-6" style={{ color: theme.muted }}>
                  {service.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </BrandedShell>
  );
}

export function BrandedContact({
  theme,
  institutionName,
  contact,
  social,
}: CodedPageViewProps & { theme: BrandedTheme }) {
  const lines = [
    contact.email
      ? { label: "Correo", value: contact.email, href: `mailto:${contact.email}` }
      : null,
    contact.phone ? { label: "Teléfono", value: contact.phone, href: `tel:${contact.phone}` } : null,
    contact.whatsapp ? { label: "WhatsApp", value: contact.whatsapp } : null,
    contact.address ? { label: "Dirección", value: contact.address } : null,
    social.instagram ? { label: "Instagram", value: social.instagram, href: social.instagram } : null,
    social.linkedin ? { label: "LinkedIn", value: social.linkedin, href: social.linkedin } : null,
  ].filter((item): item is { label: string; value: string; href?: string } => item !== null);

  return (
    <BrandedShell
      theme={theme}
      institutionName={institutionName}
      contact={contact}
      motion={false}
    >
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: theme.accent }}>
          Contacto
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Hablemos.</h1>
        <p className="mt-4 text-base leading-7" style={{ color: theme.muted }}>
          El equipo de {institutionName} responde por estos canales.
        </p>
        {lines.length ? (
          <ul className="mt-10 space-y-4">
            {lines.map((line) => (
              <li key={line.label}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>
                  {line.label}
                </p>
                {line.href ? (
                  <a href={line.href} className="text-lg font-semibold" style={{ color: theme.ink }}>
                    {line.value}
                  </a>
                ) : (
                  <p className="text-lg font-semibold">{line.value}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-sm" style={{ color: theme.muted }}>
            Aún no hay datos de contacto. Complételos en Ajustes del sitio.
          </p>
        )}
      </main>
    </BrandedShell>
  );
}
