export interface CustomDomainHostSet {
  /** Dirección principal del Espacio. */
  canonical: string;
  /** Apex y www, o solo el host si ya es un subdominio. */
  hosts: string[];
}

/**
 * `cliente.cl` y `www.cliente.cl` se conectan juntos.
 * Un subdominio distinto de www se conecta solo.
 */
export function customDomainHostSet(host: string): CustomDomainHostSet {
  const labels = host.split(".").filter(Boolean);
  if (labels[0] === "www" && labels.length >= 3) {
    const apex = labels.slice(1).join(".");
    return { canonical: apex, hosts: [apex, `www.${apex}`] };
  }
  if (labels.length === 2) {
    return { canonical: host, hosts: [host, `www.${host}`] };
  }
  return { canonical: host, hosts: [host] };
}

export type CustomDomainConnectStatus =
  | "none"
  | "pending"
  | "mismatch"
  | "dns_ready"
  | "connected";

/** Nombre público al que el cliente apunta su dominio. No es la IP del servidor. */
export const DEFAULT_CUSTOM_DOMAIN_CNAME_TARGET = "dominios.mentorprime.cl";

export function customDomainCnameTarget(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): string {
  const raw = (env.CUSTOM_DOMAIN_CNAME_TARGET ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");
  if (raw.includes(".") && !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(raw) && !raw.includes("/")) {
    return raw;
  }
  return DEFAULT_CUSTOM_DOMAIN_CNAME_TARGET;
}

export interface CustomDomainDnsRecord {
  type: "CNAME";
  host: string;
  name: string;
  value: string;
}

/** CNAME hacia el nombre de la plataforma. El cliente no recibe la IP del servidor. */
export function customDomainDnsRecords(
  host: string,
  cnameTarget: string
): CustomDomainDnsRecord[] {
  return customDomainHostSet(host).hosts.map((name) => ({
    type: "CNAME",
    host: name,
    name,
    value: cnameTarget,
  }));
}
