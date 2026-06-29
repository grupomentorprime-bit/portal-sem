import { cn } from "@/lib/utils";
import Link from "next/link";
import { Container } from "@/components/layout";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  columns?: FooterColumn[];
  copyright?: string;
  className?: string;
}

const defaultColumns: FooterColumn[] = [
  {
    title: "Institución",
    links: [
      { label: "Quiénes somos", href: "/nosotros" },
      { label: "Historia", href: "/historia" },
      { label: "Contacto", href: "/contacto" },
    ],
  },
  {
    title: "Académico",
    links: [
      { label: "Programas", href: "/programas" },
      { label: "Admisiones", href: "/admisiones" },
      { label: "Campus Virtual", href: "/campus" },
    ],
  },
];

export function Footer({
  columns = defaultColumns,
  copyright = `© ${new Date().getFullYear()} Seminario Eclesiástico Mayor. Todos los derechos reservados.`,
  className,
}: FooterProps) {
  return (
    <footer className={cn("border-t border-border bg-primary text-text-inverse", className)}>
      <Container>
        <div className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-lg font-bold">SEM</p>
            <p className="mt-2 text-sm text-gray-300">
              Seminario Eclesiástico Mayor
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-300 transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-700 py-6">
          <p className="text-center text-xs text-gray-400">{copyright}</p>
        </div>
      </Container>
    </footer>
  );
}
