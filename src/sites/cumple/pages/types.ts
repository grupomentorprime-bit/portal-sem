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
  /** Placa tipográfica de reconocimiento en el héroe (varias líneas se apilan). */
  mark: readonly string[];
  /** Tono de la placa: ink (azul), sand (violeta), hot (cian). */
  markTone: "ink" | "sand" | "hot";
  normRef?: string;
  /** Deberes breves junto al número de ley (piloto visual Ley Karin). */
  baton?: { label: string; icon: string }[];
  /** Panel documental a la derecha del héroe (piloto Ley Karin). */
  heroAside?: {
    heading: string;
    vigenciaLabel: string;
    vigencia: string;
    dutiesHeading: string;
    duties: { label: string; detail: string; icon: string }[];
    source: OfficialSource;
    sourceLabel: string;
  };
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
  /** Puntos visuales para “qué implica” (piloto editorial). */
  implicaPoints?: {
    heading: string;
    items: { title: string; body: string }[];
  };
  /** Pasos del método Cumple en layout visual. */
  processSteps?: {
    heading: string;
    intro?: string;
    items: { title: string; body: string }[];
  };
  exige: MateriaSection;
  implica: MateriaSection;
  cumple: MateriaSection;
  sources: OfficialSource[];
  relatedPaths: string[];
};
