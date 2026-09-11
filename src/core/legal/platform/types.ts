export interface PlatformLegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  /** Pasos numerados (p. ej. eliminación de datos). */
  steps?: string[];
}

export interface PlatformLegalDocument {
  slug: "privacidad" | "terminos" | "eliminacion-de-datos";
  title: string;
  description: string;
  intro: string[];
  sections: PlatformLegalSection[];
  showToc?: boolean;
}
