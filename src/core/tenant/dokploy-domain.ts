/**
 * Alta y baja del host en Dokploy para que Traefik pida el certificado.
 * Sin DOKPLOY_API_KEY no llama al panel: el dominio queda guardado y el DNS se puede comprobar igual.
 */

export interface DokployDomainConfig {
  apiUrl: string;
  apiKey: string;
  applicationId: string;
  port: number;
}

const DEFAULT_APPLICATION_ID = "U-N2L5eOgsYpx0g-EA-CW";

export function readDokployDomainConfig(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): DokployDomainConfig | null {
  const apiKey = env.DOKPLOY_API_KEY?.trim() ?? "";
  if (!apiKey) return null;
  const port = Number(env.DOKPLOY_APPLICATION_PORT ?? "3000");
  return {
    apiUrl: (env.DOKPLOY_API_URL?.trim() || "https://dokploy.mentorprime.cl").replace(
      /\/$/,
      ""
    ),
    apiKey,
    applicationId: env.DOKPLOY_APPLICATION_ID?.trim() || DEFAULT_APPLICATION_ID,
    port: Number.isInteger(port) && port > 0 ? port : 3000,
  };
}

type FetchLike = typeof fetch;

function alreadyExists(message: string): boolean {
  return /already|exist|duplicate|unique|en uso|taken/i.test(message);
}

async function dokployTrpc(
  config: DokployDomainConfig,
  path: string,
  body: unknown,
  fetchImpl: FetchLike
): Promise<{ ok: boolean; message: string }> {
  const response = await fetchImpl(`${config.apiUrl}/api/trpc/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey,
    },
    body: JSON.stringify({ json: body }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: { json?: { message?: string } };
    result?: { data?: { json?: unknown } };
  };
  const message =
    payload.error?.json?.message ||
    (response.ok ? "ok" : `Dokploy respondió ${response.status}`);
  if (response.ok && !payload.error) return { ok: true, message };
  if (alreadyExists(message)) return { ok: true, message };
  return { ok: false, message };
}

export async function ensureDokployDomains(
  hosts: string[],
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
  fetchImpl: FetchLike = fetch
): Promise<{ configured: boolean; ok: boolean; message: string }> {
  const config = readDokployDomainConfig(env);
  if (!config) {
    return {
      configured: false,
      ok: false,
      message:
        "El DNS puede apuntar al servidor. Falta DOKPLOY_API_KEY para emitir el certificado.",
    };
  }
  const failures: string[] = [];
  for (const host of hosts) {
    try {
      const created = await dokployTrpc(
        config,
        "domain.create",
        {
          host,
          path: "/",
          port: config.port,
          https: true,
          certificateType: "letsencrypt",
          applicationId: config.applicationId,
          domainType: "application",
          stripPath: false,
        },
        fetchImpl
      );
      if (!created.ok) failures.push(`${host}: ${created.message}`);
    } catch (error) {
      failures.push(
        `${host}: ${error instanceof Error ? error.message : "no se pudo pedir el certificado"}`
      );
    }
  }
  if (failures.length > 0) {
    return { configured: true, ok: false, message: failures.join(" ") };
  }
  return {
    configured: true,
    ok: true,
    message: "Certificado solicitado en el servidor.",
  };
}

export async function detachDokployDomains(
  hosts: string[],
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
  fetchImpl: FetchLike = fetch
): Promise<void> {
  const config = readDokployDomainConfig(env);
  if (!config || hosts.length === 0) return;
  try {
  const listed = await fetchImpl(
    `${config.apiUrl}/api/trpc/domain.byApplicationId?input=${encodeURIComponent(
      JSON.stringify({ json: { applicationId: config.applicationId } })
    )}`,
    { headers: { "x-api-key": config.apiKey } }
  );
  const payload = (await listed.json().catch(() => ({}))) as {
    result?: { data?: { json?: Array<{ domainId?: string; host?: string }> } };
  };
  const rows = payload.result?.data?.json ?? [];
  const wanted = new Set(hosts);
  for (const row of rows) {
    if (!row.domainId || !row.host || !wanted.has(row.host)) continue;
    await dokployTrpc(config, "domain.delete", { domainId: row.domainId }, fetchImpl);
  }
  } catch (error) {
    console.error("[space-domain] no se pudo retirar el certificado", error);
  }
}
