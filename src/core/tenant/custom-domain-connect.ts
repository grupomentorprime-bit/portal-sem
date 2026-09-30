import { Resolver } from "node:dns/promises";
import {
  customDomainCnameTarget,
  customDomainDnsRecords,
  customDomainHostSet,
  type CustomDomainConnectStatus,
  type CustomDomainDnsRecord,
} from "@/core/tenant/custom-domain-records";
import {
  detachDokployDomains,
  ensureDokployDomains,
} from "@/core/tenant/dokploy-domain";

export type { CustomDomainConnectStatus };

export interface CustomDomainDnsCheck extends CustomDomainDnsRecord {
  resolved: string[];
  matches: boolean;
}

export interface CustomDomainConnection {
  status: CustomDomainConnectStatus;
  message: string;
  cnameTarget: string;
  records: CustomDomainDnsCheck[];
}

function normalizeDnsName(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

export async function resolvePublicCname(host: string): Promise<string[]> {
  const resolver = new Resolver();
  resolver.setServers(["1.1.1.1", "8.8.8.8"]);
  try {
    return await resolver.resolveCname(host);
  } catch {
    return [];
  }
}

export async function checkCustomDomainDns(
  host: string,
  options?: {
    cnameTarget?: string;
    resolveCname?: (hostname: string) => Promise<string[]>;
  }
): Promise<CustomDomainConnection> {
  const cnameTarget = normalizeDnsName(options?.cnameTarget ?? customDomainCnameTarget());
  const resolveCname = options?.resolveCname ?? resolvePublicCname;
  const records = customDomainDnsRecords(host, cnameTarget);
  const checked: CustomDomainDnsCheck[] = [];
  for (const record of records) {
    const resolved = (await resolveCname(record.host)).map(normalizeDnsName);
    checked.push({
      ...record,
      resolved,
      matches: resolved.includes(cnameTarget),
    });
  }

  if (checked.every((record) => record.matches)) {
    return {
      status: "dns_ready",
      message: "El CNAME apunta al servicio.",
      cnameTarget,
      records: checked,
    };
  }

  if (checked.some((record) => record.resolved.length > 0 && !record.matches)) {
    return {
      status: "mismatch",
      message: `El CNAME debe apuntar a ${cnameTarget}.`,
      cnameTarget,
      records: checked,
    };
  }

  return {
    status: "pending",
    message: "Todavía no aparece el CNAME. Puede tardar en propagarse.",
    cnameTarget,
    records: checked,
  };
}

export async function connectCustomDomain(
  host: string,
  options?: {
    cnameTarget?: string;
    resolveCname?: (hostname: string) => Promise<string[]>;
    env?: NodeJS.ProcessEnv;
    fetchImpl?: typeof fetch;
  }
): Promise<CustomDomainConnection & { certificate: string | null }> {
  const dns = await checkCustomDomainDns(host, options);
  if (dns.status !== "dns_ready") {
    return { ...dns, certificate: null };
  }
  const hosts = customDomainHostSet(host).hosts;
  const provision = await ensureDokployDomains(hosts, options?.env, options?.fetchImpl);
  if (!provision.configured) {
    return {
      ...dns,
      status: "dns_ready",
      message: provision.message,
      certificate: null,
    };
  }
  if (!provision.ok) {
    return {
      ...dns,
      status: "mismatch",
      message: provision.message,
      certificate: null,
    };
  }
  return {
    ...dns,
    status: "connected",
    message: "Dominio conectado. El certificado puede tardar unos minutos.",
    certificate: provision.message,
  };
}

/** Lo que puede ver el navegador. Sin la IP de origen ni las direcciones resueltas. */
export function publicCustomDomainConnection(
  connection: CustomDomainConnection & { certificate?: string | null }
): { status: CustomDomainConnectStatus; message: string } {
  return { status: connection.status, message: connection.message };
}

export async function disconnectCustomDomainHosts(hosts: string[]): Promise<void> {
  await detachDokployDomains(hosts);
}
