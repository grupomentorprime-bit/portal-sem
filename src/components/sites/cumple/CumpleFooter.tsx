import { Logo } from "@/components/sites/cumple/logo";
import { tagline } from "@/sites/cumple/content";
import type { CodedPageViewProps } from "@/sites/page-views";

const materiasLinks = [
  { label: "Ley Karin", href: "/materias/ley-karin" },
  { label: "Seguridad y Salud en el Trabajo", href: "/materias/seguridad-salud-trabajo" },
  { label: "Laboral y RR.HH.", href: "/materias/laboral-rrhh" },
  { label: "Protección de datos", href: "/materias/proteccion-datos" },
  { label: "Inclusión laboral", href: "/materias/inclusion-laboral" },
  { label: "Contratistas y terceros", href: "/materias/contratistas-terceros" },
] as const;

const recursosLinks = [
  { label: "Cómo funciona", href: "/como-funciona" },
  { label: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
] as const;

export function CumpleFooter({ contact }: Pick<CodedPageViewProps, "contact">) {
  return (
    <footer className="border-t border-cline bg-[#071a45] pb-24 text-white sm:pb-0">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.2fr_0.9fr_0.9fr]">
        <div>
          <Logo />
          <p className="mt-6 max-w-md text-sm leading-7 text-white/70">{tagline}</p>
          <a href="/evaluar" className="glow-btn mt-6 inline-flex rounded-full px-5 py-3 text-sm font-bold text-white">
            Evaluar mi empresa →
          </a>
        </div>
        <nav className="grid content-start gap-6 sm:grid-cols-2" aria-label="Pie">
          <div>
            <p className="font-cdisplay text-xs font-bold uppercase tracking-[0.16em] text-ccyan">Información</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {materiasLinks.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="hover:text-white">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-cdisplay text-xs font-bold uppercase tracking-[0.16em] text-ccyan">Recursos</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {recursosLinks.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="hover:text-white">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <div className="text-sm text-white/70">
          <p className="font-cdisplay text-xs font-bold uppercase tracking-[0.16em] text-ccyan">Contacto</p>
          {contact.phone ? <p className="mt-3">{contact.phone}</p> : null}
          {contact.email ? (
            <p className="mt-2">
              <a href={`mailto:${contact.email}`} className="hover:text-white">
                {contact.email}
              </a>
            </p>
          ) : null}
          {(contact.city || contact.country) && (
            <p className="mt-2">{[contact.city, contact.country].filter(Boolean).join(", ")}</p>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-6 py-4 text-xs text-white/55">
          <span>
            Mentor Cumple es una empresa del <span className="font-semibold text-white/80">Grupo Mentor Prime</span>.
          </span>
          <span aria-hidden="true">·</span>
          <span>© 2026</span>
        </p>
      </div>
    </footer>
  );
}
