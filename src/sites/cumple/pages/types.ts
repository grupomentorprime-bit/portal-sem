export type OfficialSource = { nombre: string; url: string };

export type MateriaCitation = {
  label: string;
  url: string;
  /** Frase literal de un párrafo de la sección que se renderiza como enlace inline a `url`. */
  anchor: string;
};

export type MateriaSection = {
  heading: string;
  paragraphs: string[];
  /** Citas puntuales: cada `anchor` debe aparecer en un párrafo de la sección y se enlaza en el texto. */
  citations?: MateriaCitation[];
};

export type MateriaContent = {
  slug: string;
  path: string;
  eyebrow: string;
  titleName: string;
  normRef?: string;
  lead: string;
  disclaimer: string;
  /** Bloque opcional de conceptos (piloto editorial Ley Karin). */
  concepts?: {
    heading: string;
    items: { title: string; body: string; icon?: string; tone?: "ink" | "sand" | "hot" }[];
  };
  /** Checklist opcional de evidencias típicas para la organización. */
  checklist?: {
    heading: string;
    intro?: string;
    items: string[];
  };
  exige: MateriaSection;
  implica: MateriaSection;
  cumple: MateriaSection;
  sources: OfficialSource[];
  relatedPaths: string[];
};
