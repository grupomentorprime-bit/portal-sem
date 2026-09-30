import "server-only";

import { getDatabase } from "@/lib/mongodb";
import {
  connectCustomDomain,
  disconnectCustomDomainHosts,
  publicCustomDomainConnection,
  type CustomDomainConnectStatus,
} from "@/core/tenant/custom-domain-connect";
import {
  customDomainDnsTarget,
  publicSpaceDomainResult,
  readSpaceDomainHosts,
  setSpaceCustomDomain,
  SetSpaceCustomDomainError,
  type SetSpaceCustomDomainResult,
} from "@/core/tenant/space-custom-domain";

export {
  customDomainDnsTarget,
  SetSpaceCustomDomainError,
  type SetSpaceCustomDomainResult,
};

export async function setPlatformSpaceCustomDomain(
  tenantId: string,
  host: string,
  actorUserId: string
): Promise<Omit<SetSpaceCustomDomainResult, "dnsTarget" | "records">> {
  const db = await getDatabase();
  const domain = await setSpaceCustomDomain(db, { tenantId, host, actorUserId });
  if (domain.detachedHosts.length > 0) {
    await disconnectCustomDomainHosts(domain.detachedHosts).catch((error) => {
      console.error("[space-domain] no se pudo retirar el certificado", error);
    });
  }
  return publicSpaceDomainResult(domain);
}

export async function checkPlatformSpaceCustomDomain(
  tenantId: string
): Promise<{ status: CustomDomainConnectStatus; message: string }> {
  const db = await getDatabase();
  const hosts = await readSpaceDomainHosts(db, tenantId);
  if (!hosts.customDomain) {
    return {
      status: "none",
      message: "Este Espacio no tiene dominio propio. La dirección pública es el subdominio.",
    };
  }
  return publicCustomDomainConnection(await connectCustomDomain(hosts.customDomain));
}
