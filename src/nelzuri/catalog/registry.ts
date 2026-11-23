import {
  APP_MANIFESTS,
  MENTOR_APPS,
  SPECIALIZED_APPS,
  type MentorAppId,
  type SpecializedAppId,
} from "@/nelzuri/catalog/manifests";
import type { AppClass, AppManifest } from "@/nelzuri/catalog/types";

/** Siguen aparte hasta que se autorice su incorporación al catálogo. */
const INDEPENDENT_PRODUCTS = new Set(["factura", "nelzuri-factura"]);

export function validateCatalog(
  manifests: readonly AppManifest[],
  contractableOrder: readonly string[]
): void {
  const seen = new Set<string>();
  let unconditionalDefaults = 0;

  for (const item of manifests) {
    const id = item.id.trim();
    if (!id || seen.has(id)) {
      throw new Error(`Manifiesto duplicado o vacío: ${item.id}`);
    }
    seen.add(id);

    if ((item.class as string) === "essential") {
      throw new Error(`${id} no es una capacidad esencial. Las capacidades esenciales no son aplicaciones.`);
    }
    if (INDEPENDENT_PRODUCTS.has(id)) {
      throw new Error(`${id} permanece independiente hasta una autorización expresa.`);
    }
    if (typeof item.version !== "string" || item.version !== item.version.trim() || !item.version) {
      throw new Error(`${id} necesita una versión.`);
    }
    if (item.publication !== "draft" && item.publication !== "published" && item.publication !== "retired") {
      throw new Error(`${id} no declara una publicación conocida.`);
    }
    if (item.integration === "pending") {
      if (item.contractable || item.defaultContract.when !== "never" || item.open.type !== "none") {
        throw new Error(`${id} está pendiente y no entra al contrato ni a la mesa.`);
      }
      if (item.sectors?.length) {
        throw new Error(`${id} está pendiente y no se recomienda como operativa.`);
      }
      if (item.publication !== "draft") {
        throw new Error(`${id} está pendiente y no se publica como servicio operativo.`);
      }
    }
    if (item.contractable && item.publication !== "published") {
      throw new Error(`${id} se contrata solo cuando está publicada.`);
    }
    if (item.class === "specialized" && item.contractable) {
      throw new Error(`${id} es especializada y no se contrata.`);
    }
    if (item.class === "specialized" && item.defaultContract.when !== "never") {
      throw new Error(`${id} no puede ser el contrato por omisión.`);
    }
    if (item.class === "specialized" && item.sectors?.length) {
      throw new Error(`${id} es especializada y no se recomienda por rubro.`);
    }
    if (item.class === "specialized" && item.integration !== "pending") {
      if (item.publication !== "published" || item.integration !== "internal") {
        throw new Error(`${id} se publica en su Espacio o sigue pendiente.`);
      }
      if (item.open.type !== "internal" || !item.open.href.startsWith("/")) {
        throw new Error(`${id} abre por la ruta que ya tiene.`);
      }
      if (!item.requiresSpaceId) {
        throw new Error(`${id} exige el Espacio al que pertenece.`);
      }
      const door = item.door;
      const permissions = door?.anyPermission ?? [];
      if (
        permissions.length === 0 ||
        permissions.some((code) => !code || code.trim() !== code) ||
        new Set(permissions).size !== permissions.length
      ) {
        throw new Error(`${id} exige la puerta de permisos existente.`);
      }
      if (door?.unitId != null && (!door.unitId || door.unitId.trim() !== door.unitId)) {
        throw new Error(`${id} declara una unidad vacía.`);
      }
    }
    if (item.contractable && item.open.type === "none") {
      throw new Error(`${id} se contrata y no declara cómo se abre.`);
    }
    if (item.integration === "internal" && item.open.type !== "internal") {
      throw new Error(`${id} es interna y debe abrir por su ruta.`);
    }
    if (item.integration === "connect" && (item.open.type === "none" || item.open.type === "internal")) {
      throw new Error(`${id} sale por Connect y no por una ruta interna.`);
    }
    if (item.open.type === "connect-in-space" && !item.requiresSpaceId) {
      throw new Error(`${id} exige el Espacio en el que se abre.`);
    }
    if (
      item.open.type === "connect" ||
      item.open.type === "connect-or-https" ||
      item.open.type === "connect-in-space"
    ) {
      if (item.open.channel !== id) {
        throw new Error(`${id} no puede abrir el canal de otra aplicación.`);
      }
    }
    if (item.defaultContract.when === "field-missing" && item.defaultContract.spaceId == null) {
      unconditionalDefaults += 1;
    }
    if (
      item.defaultContract.when === "field-missing" &&
      item.defaultContract.spaceId != null &&
      item.defaultContract.spaceId !== item.requiresSpaceId
    ) {
      throw new Error(`${id} declara un Espacio distinto del que exige la apertura.`);
    }
  }

  if (unconditionalDefaults !== 1) {
    throw new Error("Debe haber una sola aplicación de compatibilidad cuando el Espacio no trae el campo.");
  }

  const contractable = manifests.filter((item) => item.contractable).map((item) => item.id);
  if (
    contractable.length !== contractableOrder.length ||
    contractable.some((id, index) => id !== contractableOrder[index])
  ) {
    throw new Error("El orden contratable no coincide con los identificadores históricos.");
  }
}

validateCatalog(APP_MANIFESTS, MENTOR_APPS);

const byId = new Map<string, AppManifest>(APP_MANIFESTS.map((item) => [item.id, item]));

export function listManifests(): readonly AppManifest[] {
  return APP_MANIFESTS;
}

export function manifestById(appId: string): AppManifest {
  const manifest = byId.get(appId);
  if (!manifest) throw new Error(`Aplicación desconocida: ${appId}`);
  return manifest;
}

export function appsByClass(appClass: AppClass): readonly AppManifest[] {
  return APP_MANIFESTS.filter((item) => item.class === appClass);
}

export function isMentorAppId(value: string): value is MentorAppId {
  return (MENTOR_APPS as readonly string[]).includes(value);
}

export function isSpecializedAppId(value: string): value is SpecializedAppId {
  return (SPECIALIZED_APPS as readonly string[]).includes(value);
}

export function spaceRequiredBy(appId: MentorAppId): string | null {
  return manifestById(appId).requiresSpaceId ?? null;
}
