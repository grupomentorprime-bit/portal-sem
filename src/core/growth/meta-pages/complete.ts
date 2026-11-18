import type { MetaPageAccount, MetaPageChannelView, MetaPageConnection } from "./types";
import { META_PAGE_CHANNELS, toMetaPageChannelView } from "./types";
import { verifyMetaPagesConnectState } from "./state";

export interface MetaPagesGraphPort {
  exchangeCode(input: {
    appId: string;
    appSecret: string;
    code: string;
  }): Promise<{ ok: true; accessToken: string } | { ok: false; message: string }>;
  listPages(
    accessToken: string
  ): Promise<{ ok: true; pages: MetaPageAccount[] } | { ok: false; message: string }>;
}

export interface MetaPageConnectionStore {
  listByTenant(tenantId: string): Promise<MetaPageConnection[]>;
  upsert(connection: MetaPageConnection): Promise<MetaPageConnection>;
}

export interface CompleteMetaPagesInput {
  tenantId: string;
  state: string;
  code: string;
  appId: string;
  appSecret: string;
  now?: string;
}

export type CompleteMetaPagesResult =
  | { ok: true; channels: MetaPageChannelView[] }
  | { ok: false; reason: "invalid_state" | "state_tenant_mismatch" | "missing_code" | "no_pages" }
  | { ok: false; reason: "token_exchange_failed" | "pages_failed"; message: string };

function viewsFor(connections: MetaPageConnection[]): MetaPageChannelView[] {
  return META_PAGE_CHANNELS.map((channel) =>
    toMetaPageChannelView(
      channel,
      connections.find((item) => item.channel === channel) ?? null
    )
  );
}

export async function completeMetaPagesConnection(
  store: MetaPageConnectionStore,
  graph: MetaPagesGraphPort,
  input: CompleteMetaPagesInput
): Promise<CompleteMetaPagesResult> {
  const code = input.code.trim();
  if (!code) return { ok: false, reason: "missing_code" };

  const state = verifyMetaPagesConnectState(input.state, {
    expectedTenantId: input.tenantId,
  });
  if (!state.ok) {
    return {
      ok: false,
      reason: state.reason === "tenant_mismatch" ? "state_tenant_mismatch" : "invalid_state",
    };
  }

  const exchanged = await graph.exchangeCode({
    appId: input.appId,
    appSecret: input.appSecret,
    code,
  });
  if (!exchanged.ok) {
    return { ok: false, reason: "token_exchange_failed", message: exchanged.message };
  }

  const listed = await graph.listPages(exchanged.accessToken);
  if (!listed.ok) return { ok: false, reason: "pages_failed", message: listed.message };

  const page = listed.pages.find((item) => item.instagramId) ?? listed.pages[0];
  if (!page?.pageId || !page.pageAccessToken) {
    return { ok: false, reason: "no_pages" };
  }

  const now = input.now ?? new Date().toISOString();
  const existing = await store.listByTenant(input.tenantId);
  const facebookPrevious = existing.find((item) => item.channel === "facebook");
  const instagramPrevious = existing.find((item) => item.channel === "instagram");

  await store.upsert({
    tenantId: input.tenantId,
    channel: "facebook",
    pageId: page.pageId,
    pageName: page.pageName || "Página de Facebook",
    accessToken: page.pageAccessToken,
    enabled: true,
    createdAt: facebookPrevious?.createdAt ?? now,
    updatedAt: now,
  });

  if (page.instagramId) {
    await store.upsert({
      tenantId: input.tenantId,
      channel: "instagram",
      pageId: page.pageId,
      pageName: page.pageName || "Página de Facebook",
      instagramId: page.instagramId,
      ...(page.instagramUsername ? { instagramUsername: page.instagramUsername } : {}),
      accessToken: page.pageAccessToken,
      enabled: true,
      createdAt: instagramPrevious?.createdAt ?? now,
      updatedAt: now,
    });
  } else if (instagramPrevious) {
    await store.upsert({
      ...instagramPrevious,
      enabled: false,
      updatedAt: now,
    });
  }

  const saved = await store.listByTenant(input.tenantId);
  return { ok: true, channels: viewsFor(saved) };
}

export function metaPageChannelViews(
  connections: MetaPageConnection[]
): MetaPageChannelView[] {
  return viewsFor(connections);
}
