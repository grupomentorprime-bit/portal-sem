import { manifestById } from "@/nelzuri/catalog/registry";
import type { AppClass, AppIntegration, AppPublication } from "@/nelzuri/catalog/types";
import { hasRealEntry, type OpeningSignals } from "@/nelzuri/contracts/opening";

const CATEGORY_LABEL: Record<AppClass, string> = {
  transversal: "Transversal",
  specialized: "Especializada",
};

const INTEGRATION_LABEL: Record<AppIntegration, string> = {
  internal: "Interna",
  connect: "Connect",
  pending: "Pendiente",
};

const PUBLICATION_LABEL: Record<AppPublication, string> = {
  draft: "Borrador",
  published: "Publicada",
  retired: "Retirada",
};

/**
 * Relación proyectada de una aplicación con un Espacio.
 * No se guarda. No contrata, no cobra y no autoriza a una persona.
 */
export interface AppLifecycle {
  id: string;
  label: string;
  category: AppClass;
  categoryLabel: string;
  version: string;
  integration: AppIntegration;
  integrationLabel: string;
  publication: AppPublication;
  publicationLabel: string;
  /** El manifiesto está publicado. */
  published: boolean;
  /** Publicada y con entrada real en este Espacio. */
  available: boolean;
  /** Está en el contrato. Un pedido no cuenta. */
  contracted: boolean;
  /** Contratada, no borrador, y con entrada real. */
  enabled: boolean;
  /**
   * La autorización es de cada persona.
   * Este plano no la concede ni la deduce del contrato.
   */
  authorized: false;
  requested: boolean;
  /** Publicada e integrada. Una pendiente no opera. */
  operational: boolean;
  contractable: boolean;
}

export function projectAppLifecycle(input: {
  appId: string;
  tenantId: string;
  contractedApps: readonly string[];
  requestedApps?: readonly string[];
  signals: OpeningSignals;
}): AppLifecycle {
  const manifest = manifestById(input.appId);
  const published = manifest.publication === "published";
  const operational = published && manifest.integration !== "pending";
  const real = hasRealEntry(manifest.id, {
    tenantId: input.tenantId,
    signals: input.signals,
  });
  const contracted = manifest.contractable && input.contractedApps.includes(manifest.id);
  const enabled = contracted && manifest.publication !== "draft" && real;
  const requested =
    manifest.contractable && !contracted && (input.requestedApps ?? []).includes(manifest.id);

  return {
    id: manifest.id,
    label: manifest.label,
    category: manifest.class,
    categoryLabel: CATEGORY_LABEL[manifest.class],
    version: manifest.version,
    integration: manifest.integration,
    integrationLabel: INTEGRATION_LABEL[manifest.integration],
    publication: manifest.publication,
    publicationLabel: PUBLICATION_LABEL[manifest.publication],
    published,
    available: operational && real,
    contracted,
    enabled,
    authorized: false,
    requested,
    operational,
    contractable: manifest.contractable,
  };
}

/** Marcas que ve el operador. Una pendiente no se lista como servicio. */
export function lifecycleMarks(view: AppLifecycle): string[] {
  const marks = [
    view.categoryLabel,
    `Versión ${view.version}`,
    view.integrationLabel,
    view.publicationLabel,
  ];
  if (view.category === "specialized") {
    if (!view.operational) {
      marks.push("No operativa");
      return marks;
    }
    marks.push(view.available ? "De este Espacio" : "De otro Espacio");
    marks.push("No se contrata");
    return marks;
  }
  if (!view.operational && !view.contracted) {
    marks.push("No operativa");
    return marks;
  }
  marks.push(view.available ? "Disponible" : "No disponible");
  marks.push(view.contracted ? "Contratada" : "Sin contratar");
  marks.push(view.enabled ? "Habilitada" : "Sin habilitar");
  marks.push("Autorización por persona");
  return marks;
}
