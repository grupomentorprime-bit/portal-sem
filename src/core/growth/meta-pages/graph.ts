import type { MetaPageAccount } from "./types";
import type { MetaPagesGraphPort } from "./complete";

const GRAPH_BASE = "https://graph.facebook.com";
const GRAPH_VERSION = "v21.0";

function readGraphError(json: unknown): string {
  if (!json || typeof json !== "object") return "Respuesta inválida de Meta.";
  const message = (json as { error?: { message?: string } }).error?.message;
  if (typeof message === "string" && message.trim()) return message.trim();
  return "Meta rechazó la operación.";
}

export function createHttpMetaPagesGraph(options?: {
  fetchImpl?: typeof fetch;
}): MetaPagesGraphPort {
  const fetchImpl = options?.fetchImpl ?? fetch;

  return {
    async exchangeCode({ appId, appSecret, code }) {
      const url = new URL(`${GRAPH_BASE}/${GRAPH_VERSION}/oauth/access_token`);
      url.searchParams.set("client_id", appId);
      url.searchParams.set("client_secret", appSecret);
      url.searchParams.set("code", code);
      let response: Response;
      try {
        response = await fetchImpl(url.toString(), { method: "GET" });
      } catch {
        return { ok: false, message: "No se pudo contactar la API de Meta." };
      }
      const json = await response.json().catch(() => null);
      if (!response.ok) return { ok: false, message: readGraphError(json) };
      const token =
        json && typeof json === "object" && typeof (json as { access_token?: unknown }).access_token === "string"
          ? (json as { access_token: string }).access_token.trim()
          : "";
      if (!token) return { ok: false, message: "Meta no devolvió un token." };
      return { ok: true, accessToken: token };
    },

    async listPages(accessToken) {
      const url = new URL(`${GRAPH_BASE}/${GRAPH_VERSION}/me/accounts`);
      url.searchParams.set(
        "fields",
        "id,name,access_token,instagram_business_account{id,username}"
      );
      url.searchParams.set("access_token", accessToken);
      let response: Response;
      try {
        response = await fetchImpl(url.toString(), { method: "GET" });
      } catch {
        return { ok: false, message: "No se pudo contactar la API de Meta." };
      }
      const json = await response.json().catch(() => null);
      if (!response.ok) return { ok: false, message: readGraphError(json) };
      const data =
        json && typeof json === "object" && Array.isArray((json as { data?: unknown }).data)
          ? (json as { data: unknown[] }).data
          : [];
      const pages: MetaPageAccount[] = [];
      for (const item of data) {
        if (!item || typeof item !== "object") continue;
        const row = item as {
          id?: unknown;
          name?: unknown;
          access_token?: unknown;
          instagram_business_account?: { id?: unknown; username?: unknown };
        };
        const pageId = typeof row.id === "string" ? row.id.trim() : "";
        const pageAccessToken =
          typeof row.access_token === "string" ? row.access_token.trim() : "";
        if (!pageId || !pageAccessToken) continue;
        const ig = row.instagram_business_account;
        const instagramId = typeof ig?.id === "string" ? ig.id.trim() : "";
        const instagramUsername = typeof ig?.username === "string" ? ig.username.trim() : "";
        pages.push({
          pageId,
          pageName: typeof row.name === "string" && row.name.trim() ? row.name.trim() : "Página de Facebook",
          pageAccessToken,
          ...(instagramId ? { instagramId } : {}),
          ...(instagramUsername ? { instagramUsername } : {}),
        });
      }
      return { ok: true, pages };
    },
  };
}
