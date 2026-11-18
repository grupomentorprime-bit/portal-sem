export const META_PAGE_CHANNELS = ["facebook", "instagram"] as const;

export type MetaPageChannel = (typeof META_PAGE_CHANNELS)[number];

export interface MetaPageAccount {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  instagramId?: string;
  instagramUsername?: string;
}

/** Secreto solo en servidor. */
export interface MetaPageConnection {
  tenantId: string;
  channel: MetaPageChannel;
  pageId: string;
  pageName: string;
  instagramId?: string;
  instagramUsername?: string;
  accessToken: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MetaPageChannelStatus = "not_connected" | "authorized";

/** Vista de Canales. No incluye tokens ni ids de Meta. */
export interface MetaPageChannelView {
  channel: MetaPageChannel;
  status: MetaPageChannelStatus;
  accountLabel: string | null;
  /** El webhook de páginas todavía no ingresa mensajes a la bandeja. */
  receivesMessages: false;
}

export function toMetaPageChannelView(
  channel: MetaPageChannel,
  connection: MetaPageConnection | null
): MetaPageChannelView {
  if (!connection || connection.channel !== channel || !connection.enabled) {
    return {
      channel,
      status: "not_connected",
      accountLabel: null,
      receivesMessages: false,
    };
  }
  const accountLabel =
    channel === "instagram"
      ? connection.instagramUsername?.trim() || connection.pageName
      : connection.pageName;
  return {
    channel,
    status: "authorized",
    accountLabel: accountLabel.trim() || null,
    receivesMessages: false,
  };
}
