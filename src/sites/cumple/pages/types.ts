export type OfficialSource = { nombre: string; url: string };

export type MateriaSection = {
  heading: string;
  paragraphs: string[];
  /** Frases con mención a institución; el render puede enlazar la primera fuente coincidente. */
  citations?: { label: string; url: string }[];
};

export type MateriaContent = {
  slug: string;
  path: string;
  eyebrow: string;
  h1: string;
  lead: string;
  disclaimer: string;
  exige: MateriaSection;
  implica: MateriaSection;
  cumple: MateriaSection;
  sources: OfficialSource[];
  relatedPaths: string[];
};
