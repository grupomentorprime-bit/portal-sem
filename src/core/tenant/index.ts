export type { TenantContext } from "./context";
export {
  getActiveTenantContext,
  getTenantContext,
  resolveActiveTenantIdFromRequest,
  resolveTenantForRequestHost,
} from "./context";

export {
  ADL_DEV_HOST_DEFAULT,
  ADL_SITE_CODE,
  ADL_SITE_ID,
  ADL_TENANT_CODE,
  ADL_TENANT_ID,
  DOMAINS_COLLECTION,
  SEM_DEV_HOST_DEFAULT,
  SEM_SITE_CODE,
  SEM_SITE_ID,
  SEM_TENANT_CODE,
  SEM_TENANT_ID,
  SITE_CONFIG_COLLECTION,
  SITES_COLLECTION,
  TENANTS_COLLECTION,
} from "./constants";

export type {
  DomainDocument,
  DomainKind,
  SiteConfigDocument,
  SiteDocument,
  SiteStatus,
  TenantDocument,
  TenantStatus,
  TenantType,
} from "./types";

export {
  buildDefaultSpaceHost,
  buildPlatformSubdomainHost,
  classifySpaceDomainKind,
  extractHostsFromAppUrls,
  isBarePlatformOriginHost,
  isDevLoopbackSpaceHost,
  isLoopbackHost,
  isPlatformOriginHost,
  isPlatformSubdomainHost,
  isReservedPlatformHost,
  isReservedSpaceSlug,
  isSemDevHost,
  normalizeHost,
  normalizePlatformHostSlug,
  publicOriginFromHost,
  publicUrlForPath,
  resolveAppHostsFromEnv,
  resolveDevLoopbackSuffix,
  resolvePlatformBaseDomain,
  resolveReservedSpaceSlugs,
  resolveSpaceBaseDomain,
  resolveRequestHost,
  resolveSemBootstrapHostsFromEnv,
  shouldEnterPlatformHome,
} from "./hosts";

export {
  findDefaultSiteForTenant,
  findDomainByHost,
  findDomainsBySiteId,
  findDomainsByTenantId,
  findPrimaryDomainBySiteId,
  findSiteById,
  findSiteConfigBySiteId,
  findSitesByTenantId,
  findTenantById,
  findTenantBySlug,
  listTenants,
} from "./repositories";

export {
  addDomainToSite,
  assertHostAvailableForSite,
  buildDomainRecord,
  changeDomainHost,
  ensureDomainIndexes,
  getPrimaryDomain,
  listSiteDomains,
  removeDomainFromSite,
  setPrimaryDomain,
  type DomainMutationFailure,
  type DomainMutationFailureReason,
  type DomainMutationResult,
  type DomainMutationSuccess,
} from "./domains";

export {
  isHostResolutionPortalActive,
  isSemEligibleHost,
  resolvePublicTenantByHost,
  type HostResolution,
  type HostResolutionFailure,
  type HostResolutionFailureReason,
  type HostResolutionSource,
  type HostResolutionSuccess,
} from "./resolve";

export {
  buildDomainDocument,
  buildSemSiteDocument,
  buildSemTenantDocument,
  buildSiteConfigDocument,
  ensureSemTenantFoundation,
  materializeSemSiteIdentity,
  type SemFoundationResult,
} from "./migrate-sem";

export { isSemTenant } from "./is-sem";

export {
  materializeSemTenantContent,
  type SemContentMaterializeResult,
} from "./sem-content";

export {
  applySemSiteIdentity,
  SEM_SITE_IDENTITY,
} from "./sem-site-identity";

export {
  applyAdlSiteIdentity,
  ADL_SITE_IDENTITY,
  configLooksLikeAdlIdentity,
} from "./adl-site-identity";

export {
  ensureAdlTenantFoundation,
  resolveAdlBootstrapMemberEmail,
  resolveAdlDevHosts,
  type AdlFoundationResult,
} from "./migrate-adl";

export {
  buildProvisionedSiteConfigDocument,
  provisionTenantFoundation,
  type TenantProvisionHost,
  type TenantProvisionResult,
  type TenantProvisionSpec,
} from "./provision";

export {
  createPlatformSpace,
  CreatePlatformSpaceError,
  normalizeSpaceSlug,
  type CreatePlatformSpaceErrorCode,
  type CreatePlatformSpaceInput,
  type CreatePlatformSpaceSummary,
} from "./create-platform-space";

export {
  deletePlatformSpace,
  DeletePlatformSpaceError,
  isProtectedPlatformSpace,
  type DeletePlatformSpaceErrorCode,
  type DeletePlatformSpaceResult,
} from "./delete-platform-space";

export {
  isSpaceControlStatus,
  setPlatformSpaceStatus,
  SetPlatformSpaceStatusError,
  SPACE_CONTROL_STATUSES,
  type SetPlatformSpaceStatusErrorCode,
  type SetPlatformSpaceStatusResult,
  type SpaceControlStatus,
} from "./space-status";

export {
  homologateAllPlatformDomains,
  homologateSitePlatformDomain,
  type HomologateAllDomainsResult,
  type HomologateSiteDomainsResult,
} from "./homologate-domains";

export { mirrorLegacyConfigToSiteConfig } from "./site-config-mirror";

export {
  isHomePageId,
  isScopedResourceId,
  LEGACY_STORAGE_INTEGRATION_ID,
  logicalResourceId,
  RESOURCE_ID_SEP,
  resourceIdCandidates,
  scopedResourceId,
  storageIntegrationIdForTenant,
} from "./resource-ids";
