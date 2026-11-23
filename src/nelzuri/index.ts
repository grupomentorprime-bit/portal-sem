export { MENTOR_APPS, type MentorAppId } from "@/nelzuri/catalog/manifests";
export {
  ensureSpecializedCapabilities,
  focusedShells,
  formCatalogFor,
  generationOverlay,
  registerFormCatalog,
  registerFormEffect,
  registerPublicForm,
  registerRouteRules,
  registerSpecializedManifest,
  registeredFormCatalogs,
  resolveFormEffect,
  resolvePublicForm,
  routeRulesFor,
  setSpecializedCapabilityInstaller,
  SPECIALIZED_APPS,
  specializedAppForAlias,
  specializedManifests,
  specializedNavPlacements,
  type ConvocatoriaRecord,
  type FocusedShellHit,
  type FormEffectAfterInput,
  type FormEffectAfterResult,
  type FormEffectBeforeResult,
  type FormEffectInput,
  type GenerationOption,
  type PublicFormKind,
  type PublicFormRegistration,
  type PublicFormResolution,
  type ResolvedFormEffect,
  type SpecializedAppId,
  type SpecializedFormCatalog,
  type SpecializedFormEffect,
  type SpecializedManifestRegistration,
  type SpecializedNavItem,
  type SpecializedNavPlacement,
  type SpecializedRouteRules,
} from "@/nelzuri/contracts/capabilities";
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
