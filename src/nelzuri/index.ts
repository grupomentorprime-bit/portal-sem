export { MENTOR_APPS, type MentorAppId } from "@/nelzuri/catalog/manifests";
export {
  NELZURI_CAPABILITIES,
  availableCoreCapabilities,
  type NelzuriCapability,
} from "@/nelzuri/catalog/capabilities";
export type {
  AppClass,
  AppIntegration,
  AppManifest,
  DefaultContract,
  OpenDeclaration,
} from "@/nelzuri/catalog/types";
export {
  appsByClass,
  isMentorAppId,
  listManifests,
  manifestById,
  spaceRequiredBy,
  validateCatalog,
} from "@/nelzuri/catalog/registry";
export { desktopBands, relevance, type DesktopBands } from "@/nelzuri/catalog/relevance";
export {
  isHttpsEntry,
  newlyContracted,
  parseContractPatch,
  resolveContractedApps,
} from "@/nelzuri/contracts/ceiling";
export {
  canManageAppKeys,
  desktopVisibleApps,
  hasAppKey,
  migrationAuthorizedApps,
  parseAuthorizedApps,
  parseAuthorizedAppsPatch,
  resolveAuthorizedApps,
} from "@/nelzuri/contracts/authorization";
export { evaluateAppRequest } from "@/nelzuri/contracts/request";
export { decideOpening, type DesktopClick, type OpeningSignals } from "@/nelzuri/contracts/opening";
