export {
  MENTOR_APPS,
  SPECIALIZED_APPS,
  type MentorAppId,
  type SpecializedAppId,
} from "@/nelzuri/catalog/manifests";
export {
  NELZURI_CAPABILITIES,
  availableCoreCapabilities,
  type NelzuriCapability,
} from "@/nelzuri/catalog/capabilities";
export type {
  AppClass,
  AppIntegration,
  AppManifest,
  AppPublication,
  DefaultContract,
  OpenDeclaration,
  SpecializedDoor,
} from "@/nelzuri/catalog/types";
export { lifecycleMarks, projectAppLifecycle, type AppLifecycle } from "@/nelzuri/catalog/lifecycle";
export {
  appsByClass,
  isMentorAppId,
  isSpecializedAppId,
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
export { decideOpening, hasRealEntry, type DesktopClick, type OpeningSignals } from "@/nelzuri/contracts/opening";
export { specializedAppForInternalPath } from "@/nelzuri/contracts/shell";
export {
  canSeeSpecialized,
  openSpecialized,
  visibleSpecializedIds,
  type SpecializedPerson,
} from "@/nelzuri/contracts/specialized";
