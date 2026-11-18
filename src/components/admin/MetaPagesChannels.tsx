"use client";

import { useState } from "react";
import { NetworkTile, type NetworkId } from "@/components/brand/NetworkMark";
import { aek } from "@/components/admin/kit/utils/tokens";
import { Button } from "@/components/ui";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { GROWTH_CHANNELS_META_UNAVAILABLE } from "@/lib/growth/labels";
import { loadFacebookSdk } from "@/lib/growth/whatsapp-embedded-signup-client";
import { cn } from "@/lib/utils";
import type { MetaPageChannelView } from "@/core/growth/meta-pages/types";

const ROWS: { channel: MetaPageChannelView["channel"]; network: NetworkId; label: string; text: string }[] = [
  {
    channel: "instagram",
    network: "instagram",
    label: "Instagram",
    text: "Mensajes directos de la cuenta vinculada a la página.",
  },
  {
    channel: "facebook",
    network: "facebook",
    label: "Facebook",
    text: "Conversaciones de Messenger de la página.",
  },
];

type SessionBody = {
  ok?: boolean;
  error?: string;
  meta?: { ready?: boolean; appId?: string | null; configId?: string | null };
  state?: string | null;
  channels?: MetaPageChannelView[];
};

export function MetaPagesChannels() {
  const [views, setViews] = useState<MetaPageChannelView[]>([]);
  const [ready, setReady] = useState(false);
  const [appId, setAppId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/admin/integrations/meta/pages/session").catch(() => null);
    const body = (await response?.json().catch(() => null)) as SessionBody | null;
    if (!response?.ok || !body?.ok) {
      setError(body?.error || "No se pudo preparar Instagram y Facebook.");
      return;
    }
    setViews(body.channels ?? []);
    setReady(Boolean(body.meta?.ready));
    setAppId(body.meta?.appId ?? null);
    setConfigId(body.meta?.configId ?? null);
    setState(body.state ?? null);
    setLoaded(true);
    setError("");
  }

  useDeferredEffect(() => {
    void load();
  }, []);

  async function connect() {
    if (!ready || !appId || !configId || !state) {
      setMessage(GROWTH_CHANNELS_META_UNAVAILABLE);
      return;
    }
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await loadFacebookSdk(appId);
      const code = await new Promise<string>((resolve, reject) => {
        const fb = window.FB;
        if (!fb) {
          reject(new Error("SDK"));
          return;
        }
        fb.login(
          (response) => {
            const next = response.authResponse?.code?.trim();
            if (!next) reject(new Error("cancel"));
            else resolve(next);
          },
          {
            config_id: configId,
            response_type: "code",
            override_default_response_type: true,
            extras: { setup: {}, sessionInfoVersion: "3" },
          }
        );
      });
      const response = await fetch("/api/admin/integrations/meta/pages/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, state }),
      });
      const body = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        channels?: MetaPageChannelView[];
      } | null;
      if (!response.ok || !body?.ok) {
        setError(body?.error || "No se pudo guardar la autorización.");
        return;
      }
      setViews(body.channels ?? []);
      setMessage("Página autorizada. Los mensajes de estas redes todavía no entran a la bandeja.");
      await load();
    } catch {
      setError("La autorización con Meta no se completó.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4" id="instagram" data-meta-pages>
      <div>
        <h3 className="text-sm font-semibold text-foreground">Instagram y Facebook</h3>
        <p className="mt-1 text-sm text-muted">
          Una autorización de Meta habilita la página y, si está vinculada, la cuenta de Instagram.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ROWS.map((row) => {
          const view = views.find((item) => item.channel === row.channel);
          const authorized = view?.status === "authorized";
          return (
            <li
              key={row.channel}
              id={row.channel === "facebook" ? "facebook" : undefined}
              className={cn(aek.surface, "flex items-start gap-3.5 px-4 py-4")}
              data-channel={row.channel}
              data-status={authorized ? "authorized" : "not_connected"}
            >
              <NetworkTile id={row.network} className="h-10 w-10 rounded-[var(--radius-md)]" />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">{row.label}</p>
                <p className="text-sm leading-snug text-muted">
                  {authorized && view?.accountLabel ? view.accountLabel : row.text}
                </p>
                <p className="pt-0.5 text-xs font-medium text-muted">
                  {authorized ? "Autorizada. Aún no recibe en Mensajes." : "No conectado"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="primary" disabled={busy} onClick={() => void connect()}>
          {busy ? "Conectando…" : "Conectar Instagram y Facebook"}
        </Button>
      </div>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {loaded && !ready && !error ? (
        <p className="text-sm text-muted">{GROWTH_CHANNELS_META_UNAVAILABLE}</p>
      ) : null}
    </section>
  );
}
