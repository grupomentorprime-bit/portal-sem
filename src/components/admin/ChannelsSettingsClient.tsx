"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Check, Mail, MessageSquare } from "lucide-react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { Button, Input, Label, Modal } from "@/components/ui";
import { aek } from "@/components/admin/kit/utils/tokens";
import type {
  GrowthWhatsAppConnectionPublic,
  WhatsAppChannelAdminView,
} from "@/core/growth/whatsapp";
import {
  GROWTH_CHANNELS_CAN_REPLY_LABEL,
  GROWTH_CHANNELS_COMING_SOON,
  GROWTH_CHANNELS_COMPLETE_CONNECTION_LABEL,
  GROWTH_CHANNELS_CONNECT_LABEL,
  GROWTH_CHANNELS_DISCONNECT_LABEL,
  GROWTH_CHANNELS_MANAGE_LABEL,
  GROWTH_CHANNELS_META_UNAVAILABLE,
  GROWTH_CHANNELS_NUMBER_LABEL,
  GROWTH_CHANNELS_PAUSE_LABEL,
  GROWTH_CHANNELS_RECEIVES_LABEL,
  GROWTH_CHANNELS_RESUME_LABEL,
  GROWTH_CHANNELS_TECHNICAL_FALLBACK_LABEL,
  GROWTH_CHANNELS_TEST_FAIL,
  GROWTH_CHANNELS_TEST_LABEL,
  GROWTH_CHANNELS_TEST_OK,
  GROWTH_CHANNELS_UPDATED_LABEL,
  GROWTH_CHANNELS_VIEW_MESSAGES_LABEL,
  GROWTH_CHANNELS_WHATSAPP_LABEL,
} from "@/lib/growth/labels";
import {
  isFacebookSdkReady,
  launchWhatsAppEmbeddedSignupReady,
  loadFacebookSdk,
  submitWhatsAppEmbeddedSignupComplete,
} from "@/lib/growth/whatsapp-embedded-signup-client";
import {
  CHILE_PHONE_EXAMPLE,
  formatChilePhoneDisplay,
  formatChilePhoneInput,
  normalizeChilePhone,
} from "@/lib/experience/forms/phone-chile";
import { cn } from "@/lib/utils";

type TestStatus = "idle" | "testing" | "success" | "error";
type SaveStatus = "idle" | "saving" | "error";
type ChannelStatus = WhatsAppChannelAdminView["status"];

interface MetaSessionPublic {
  ready: boolean;
  appId: string | null;
  esConfigId: string | null;
  missing: string[];
}

interface ManageForm {
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifyToken: string;
  appSecret: string;
  accessToken: string;
}

function InstagramMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FacebookMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

const FUTURE_CHANNELS = [
  {
    id: "instagram",
    label: "Instagram",
    description: "Mensajes directos con tu audiencia",
    Icon: InstagramMark,
    accent:
      "bg-gradient-to-br from-warning/15 via-accent/15 to-accent/15 text-accent",
  },
  {
    id: "facebook",
    label: "Facebook",
    description: "Conversaciones desde Messenger",
    Icon: FacebookMark,
    accent: "bg-primary/12 text-primary",
  },
  {
    id: "site-chat",
    label: "Chat del sitio",
    description: "Atención en tiempo real en el portal",
    Icon: MessageSquare,
    accent: "bg-secondary/10 text-secondary",
  },
  {
    id: "email",
    label: "Correo",
    description: "Bandeja unificada de correo",
    Icon: Mail,
    accent: "bg-warning/12 text-warning",
  },
] as const;

function formatVisiblePhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return formatChilePhoneInput(trimmed);
}

function toStoredVisiblePhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return normalizeChilePhone(trimmed) ?? formatChilePhoneDisplay(trimmed) ?? trimmed;
}

function emptyForm(): ManageForm {
  return {
    phoneNumberId: "",
    displayPhoneNumber: "",
    verifyToken: "",
    appSecret: "",
    accessToken: "",
  };
}

function formatUpdatedAt(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function WhatsAppMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function CapabilityRow({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-2.5 text-sm",
        ok ? "text-foreground" : "text-muted"
      )}
    >
      <span
        className={cn(
          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs",
          ok
            ? "bg-success/15 text-success"
            : "bg-muted/60 text-muted"
        )}
        aria-hidden
      >
        {ok ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : "–"}
      </span>
      <span>{label}</span>
    </li>
  );
}

function ChannelStatusPill({
  status,
  label,
}: {
  status: ChannelStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
        status === "connected" && "bg-success/12 text-success",
        status === "paused" && "bg-warning/12 text-warning",
        status === "incomplete" && "bg-warning/12 text-warning",
        status === "not_connected" && "bg-muted/70 text-muted"
      )}
      data-channel-status-label
    >
      {label}
    </span>
  );
}

function SecondaryAction({
  children,
  onClick,
  href,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}) {
  const className = cn(
    "text-sm text-muted transition-colors hover:text-foreground",
    disabled && "pointer-events-none opacity-50"
  );

  if (href && !disabled) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function SecondaryDivider() {
  return (
    <span className="select-none text-sm text-border" aria-hidden>
      ·
    </span>
  );
}

export function ChannelsSettingsClient() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [channel, setChannel] = useState<WhatsAppChannelAdminView | null>(null);
  const [connection, setConnection] =
    useState<GrowthWhatsAppConnectionPublic | null>(null);
  const [meta, setMeta] = useState<MetaSessionPublic | null>(null);
  const [connectState, setConnectState] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [manageOpen, setManageOpen] = useState(false);
  const [manageMode, setManageMode] = useState<"connect" | "manage">("manage");
  const [form, setForm] = useState<ManageForm>(emptyForm());
  const [toggling, setToggling] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  const applyPayload = useCallback(
    (data: {
      connection?: GrowthWhatsAppConnectionPublic | null;
      channel?: WhatsAppChannelAdminView;
      meta?: MetaSessionPublic;
      state?: string | null;
    }) => {
      if ("connection" in data) setConnection(data.connection ?? null);
      if (data.channel) setChannel(data.channel);
      if (data.meta) setMeta(data.meta);
      if ("state" in data) {
        setConnectState(
          typeof data.state === "string" && data.state.trim()
            ? data.state
            : null
        );
      }
    },
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    setError("");
    const res = await fetch("/api/admin/integrations/whatsapp/meta/session");
    const data = await res.json();
    if (res.status === 403 || res.status === 401) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    if (!data.ok) {
      // Fallback a lectura legacy si el endpoint Meta falla.
      const legacy = await fetch("/api/admin/integrations/whatsapp");
      const legacyData = await legacy.json();
      if (legacy.status === 403 || legacy.status === 401) {
        setForbidden(true);
        setLoading(false);
        return;
      }
      if (!legacyData.ok) {
        setError(data.error ?? "No se pudo cargar los canales.");
        setLoading(false);
        return;
      }
      applyPayload(legacyData);
      setMeta({ ready: false, appId: null, esConfigId: null, missing: [] });
      setConnectState(null);
      setLoading(false);
      return;
    }
    applyPayload(data);
    setLoading(false);
  }, [applyPayload]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  // Precargar FB SDK cuando la sesión Meta está lista — FB.login debe ser
  // síncrono en el click (sin await previo) o Meta cae a scope=openid.
  useDeferredEffect(() => {
    const appId = meta?.appId?.trim() ?? "";
    if (!meta?.ready || !/^\d{5,}$/.test(appId)) return;
    void loadFacebookSdk(appId).catch(() => {
      /* el click reintentará / pedirá segundo click */
    });
  }, [meta?.ready, meta?.appId]);

  function openTechnical(mode: "connect" | "manage") {
    setManageMode(mode);
    setForm({
      phoneNumberId: connection?.phoneNumberId ?? "",
      displayPhoneNumber: formatVisiblePhone(
        connection?.displayPhoneNumber ?? ""
      ),
      verifyToken: "",
      appSecret: "",
      accessToken: "",
    });
    setSaveStatus("idle");
    setError("");
    // En conectar, mostrar de entrada lo que falta (IDs y secretos).
    setShowTechnical(mode === "connect");
    setManageOpen(true);
  }

  function handleConnectMeta() {
    setError("");

    const appId = meta?.appId?.trim() ?? "";
    const esConfigId = meta?.esConfigId?.trim() ?? "";
    // Guardia: sin config_id numérico FB.login cae a scope=openid (error Meta).
    if (
      !meta?.ready ||
      !connectState ||
      !/^\d{5,}$/.test(appId) ||
      !/^\d{5,}$/.test(esConfigId)
    ) {
      setConnecting(true);
      void (async () => {
        const sessionRes = await fetch(
          "/api/admin/integrations/whatsapp/meta/session"
        );
        const sessionData = await sessionRes.json();
        if (!sessionData.ok) {
          setError(sessionData.error ?? GROWTH_CHANNELS_META_UNAVAILABLE);
          setConnecting(false);
          return;
        }
        applyPayload(sessionData);
        const nextAppId =
          typeof sessionData.meta?.appId === "string"
            ? sessionData.meta.appId.trim()
            : "";
        if (sessionData.meta?.ready && /^\d{5,}$/.test(nextAppId)) {
          try {
            await loadFacebookSdk(nextAppId);
          } catch {
            /* ignore — pedimos segundo click */
          }
          setError(
            "Autorizador de Meta listo. Pulsá Conectar WhatsApp otra vez."
          );
          setConnecting(false);
          return;
        }
        setError(GROWTH_CHANNELS_META_UNAVAILABLE);
        setConnecting(false);
        openTechnical("connect");
      })();
      return;
    }

    if (!isFacebookSdkReady(appId)) {
      setConnecting(true);
      void loadFacebookSdk(appId)
        .then(() => {
          setError(
            "Autorizador de Meta listo. Pulsá Conectar WhatsApp otra vez."
          );
          setConnecting(false);
        })
        .catch(() => {
          setError("No se pudo iniciar el autorizador de Meta.");
          setConnecting(false);
        });
      return;
    }

    // FB.login síncrono en el click — no await previo (evita fallback openid).
    setConnecting(true);
    const state = connectState;
    void launchWhatsAppEmbeddedSignupReady({ appId, esConfigId }).then(
      async (launched) => {
        if (!launched.ok) {
          if (launched.reason !== "cancelled") {
            setError(launched.message);
          }
          setConnecting(false);
          return;
        }

        const complete = await submitWhatsAppEmbeddedSignupComplete({
          state,
          code: launched.code,
          assets: launched.assets,
        });
        if (!complete.ok) {
          setError(complete.error);
          setConnecting(false);
          return;
        }

        applyPayload(
          complete.data as {
            connection?: GrowthWhatsAppConnectionPublic | null;
            channel?: WhatsAppChannelAdminView;
          }
        );
        setConnecting(false);
      }
    );
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    setError("");
    const res = await fetch(
      "/api/admin/integrations/whatsapp/meta/disconnect",
      { method: "POST" }
    );
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "No se pudo desconectar WhatsApp.");
      setDisconnecting(false);
      return;
    }
    applyPayload(data);
    setDisconnecting(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus("saving");
    setError("");

    const phoneNumberId =
      form.phoneNumberId.trim() || connection?.phoneNumberId?.trim() || "";
    if (!phoneNumberId) {
      setSaveStatus("error");
      setError("El identificador del número es obligatorio.");
      return;
    }

    const payload: Record<string, string | boolean> = {
      phoneNumberId,
      enabled: connection?.enabled ?? true,
    };
    if (form.displayPhoneNumber.trim()) {
      payload.displayPhoneNumber = toStoredVisiblePhone(
        form.displayPhoneNumber
      );
    }
    if (form.verifyToken.trim()) payload.verifyToken = form.verifyToken.trim();
    if (form.appSecret.trim()) payload.appSecret = form.appSecret.trim();
    if (form.accessToken.trim()) payload.accessToken = form.accessToken.trim();

    const res = await fetch("/api/admin/integrations/whatsapp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) {
      setSaveStatus("error");
      setError(data.error ?? "No se pudo guardar la configuración.");
      return;
    }
    applyPayload(data);
    setSaveStatus("idle");
    setManageOpen(false);
  }

  async function handleToggleEnabled() {
    if (!connection?.phoneNumberId) return;
    setToggling(true);
    setError("");
    const nextEnabled = !connection.enabled;
    const res = await fetch("/api/admin/integrations/whatsapp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumberId: connection.phoneNumberId,
        enabled: nextEnabled,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "No se pudo actualizar el estado.");
      setToggling(false);
      return;
    }
    applyPayload(data);
    setToggling(false);
  }

  async function handleTest() {
    setTestStatus("testing");
    setTestMessage("");
    setError("");
    const res = await fetch("/api/admin/integrations/whatsapp/test", {
      method: "POST",
    });
    const data = await res.json();
    if (!data.ok) {
      setTestStatus("error");
      setTestMessage(data.error ?? GROWTH_CHANNELS_TEST_FAIL);
      return;
    }
    setTestStatus("success");
    setTestMessage(data.message ?? GROWTH_CHANNELS_TEST_OK);
    setTimeout(() => setTestStatus("idle"), 4000);
  }

  if (loading) {
    return <p className="text-sm text-muted">Cargando canales…</p>;
  }

  if (forbidden) {
    return (
      <p className="text-sm text-muted">
        No tienes permisos para administrar canales de mensajería.
      </p>
    );
  }

  const status = channel?.status ?? "not_connected";
  const updatedLabel = formatUpdatedAt(channel?.updatedAt ?? null);
  const statusLabel = channel?.statusLabel ?? "No conectado";
  const metaReady = Boolean(meta?.ready);

  const primaryAction =
    status === "not_connected" || status === "incomplete" ? (
      <Button
        type="button"
        variant="primary"
        onClick={() => void handleConnectMeta()}
        disabled={connecting}
      >
        {connecting
          ? "Conectando…"
          : status === "incomplete"
            ? GROWTH_CHANNELS_COMPLETE_CONNECTION_LABEL
            : GROWTH_CHANNELS_CONNECT_LABEL}
      </Button>
    ) : status === "paused" ? (
      <Button
        type="button"
        variant="primary"
        onClick={() => void handleToggleEnabled()}
        disabled={toggling}
      >
        {GROWTH_CHANNELS_RESUME_LABEL}
      </Button>
    ) : (
      <Button type="button" variant="primary" href="/admin/mensajes">
        {GROWTH_CHANNELS_VIEW_MESSAGES_LABEL}
      </Button>
    );

  const secondaryItems: Array<{ key: string; node: ReactNode }> = [];
  if (status === "not_connected") {
    secondaryItems.push({
      key: "technical",
      node: (
        <SecondaryAction onClick={() => openTechnical("connect")}>
          {GROWTH_CHANNELS_TECHNICAL_FALLBACK_LABEL}
        </SecondaryAction>
      ),
    });
  } else {
    if (status !== "connected") {
      secondaryItems.push({
        key: "messages",
        node: (
          <SecondaryAction href="/admin/mensajes">
            {GROWTH_CHANNELS_VIEW_MESSAGES_LABEL}
          </SecondaryAction>
        ),
      });
    }
    secondaryItems.push({
      key: "manage",
      node: (
        <SecondaryAction onClick={() => openTechnical("manage")}>
          {GROWTH_CHANNELS_MANAGE_LABEL}
        </SecondaryAction>
      ),
    });
    secondaryItems.push({
      key: "disconnect",
      node: (
        <SecondaryAction
          onClick={() => void handleDisconnect()}
          disabled={disconnecting}
        >
          {disconnecting ? "Desconectando…" : GROWTH_CHANNELS_DISCONNECT_LABEL}
        </SecondaryAction>
      ),
    });
    secondaryItems.push({
      key: "test",
      node: (
        <SecondaryAction
          onClick={() => void handleTest()}
          disabled={testStatus === "testing"}
        >
          {testStatus === "testing" ? "Probando…" : GROWTH_CHANNELS_TEST_LABEL}
        </SecondaryAction>
      ),
    });
    if (status === "connected") {
      secondaryItems.push({
        key: "pause",
        node: (
          <SecondaryAction
            onClick={() => void handleToggleEnabled()}
            disabled={toggling}
          >
            {GROWTH_CHANNELS_PAUSE_LABEL}
          </SecondaryAction>
        ),
      });
    } else if (status === "incomplete") {
      secondaryItems.push({
        key: "pause",
        node: (
          <SecondaryAction
            onClick={() => void handleToggleEnabled()}
            disabled={toggling}
          >
            {connection?.enabled
              ? GROWTH_CHANNELS_PAUSE_LABEL
              : GROWTH_CHANNELS_RESUME_LABEL}
          </SecondaryAction>
        ),
      });
    }
  }

  return (
    <div className="space-y-8" data-channels-settings>
      <section
        className={cn(
          aek.surface,
          "relative overflow-hidden shadow-[var(--admin-shadow-panel)]"
        )}
        data-channel="whatsapp"
        data-status={status}
        data-meta-ready={metaReady ? "true" : "false"}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[var(--color-success)]"
          aria-hidden
        />
        <div className="space-y-6 p-5 sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-success/15 text-success shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-success)_18%,transparent)]">
                <WhatsAppMark className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {GROWTH_CHANNELS_WHATSAPP_LABEL}
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  Canal activo de mensajería
                </p>
              </div>
            </div>
            <ChannelStatusPill status={status} label={statusLabel} />
          </div>

          {channel?.displayPhoneNumber ? (
            <p
              className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]"
              data-channel-phone
            >
              <span className="sr-only">{GROWTH_CHANNELS_NUMBER_LABEL}: </span>
              {formatVisiblePhone(channel.displayPhoneNumber) ||
                channel.displayPhoneNumber}
            </p>
          ) : status !== "not_connected" ? (
            <p className="text-sm text-muted">
              <span>{GROWTH_CHANNELS_NUMBER_LABEL}:</span> sin número visible
            </p>
          ) : (
            <p className="max-w-xl text-sm leading-relaxed text-muted">
              Conectá WhatsApp Business con Meta. Autorizás el negocio y el
              número; Growth OS guarda la conexión de este Espacio.
            </p>
          )}

          {status !== "not_connected" ? (
            <ul className="space-y-2.5" data-channel-capabilities>
              <CapabilityRow
                ok={Boolean(channel?.receivesMessages)}
                label={GROWTH_CHANNELS_RECEIVES_LABEL}
              />
              <CapabilityRow
                ok={Boolean(channel?.canReplyFromMensajes)}
                label={GROWTH_CHANNELS_CAN_REPLY_LABEL}
              />
            </ul>
          ) : null}

          {updatedLabel && status !== "not_connected" ? (
            <p className="text-xs text-muted">
              {GROWTH_CHANNELS_UPDATED_LABEL}: {updatedLabel}
            </p>
          ) : null}

          {!metaReady && status === "not_connected" ? (
            <p className="text-sm text-muted" data-meta-unavailable>
              {GROWTH_CHANNELS_META_UNAVAILABLE}
            </p>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {testMessage ? (
            <p
              className={cn(
                "text-sm",
                testStatus === "success"
                  ? "text-success"
                  : "text-destructive"
              )}
              data-channel-test-result
              role="status"
            >
              {testMessage}
            </p>
          ) : null}

          <div className="flex flex-col gap-4 border-t border-[var(--admin-border-subtle)] pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {primaryAction}
            </div>
            {secondaryItems.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
                {secondaryItems.map((item, index) => (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-2.5"
                  >
                    {index > 0 ? <SecondaryDivider /> : null}
                    {item.node}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-4" data-channels-future>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Otros canales
          </h3>
          <p className="mt-1 text-sm text-muted">
            Formarán parte del mismo centro cuando estén listos.
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FUTURE_CHANNELS.map((item) => {
            const Icon = item.Icon;
            return (
              <li
                key={item.id}
                className={cn(
                  aek.surfaceMuted,
                  "flex items-start gap-3.5 px-4 py-4 opacity-[0.72]"
                )}
                data-channel-future={item.id}
                aria-disabled="true"
              >
                <span
                  className={cn(
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
                    item.accent
                  )}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="text-sm leading-snug text-muted">
                    {item.description}
                  </p>
                  <p className="pt-0.5 text-xs font-medium text-muted">
                    {GROWTH_CHANNELS_COMING_SOON}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <Modal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        title={
          manageMode === "connect"
            ? "Conectar WhatsApp"
            : "Administrar WhatsApp"
        }
        description={
          manageMode === "connect"
            ? "Preferí el flujo guiado con Meta. Este formulario técnico es solo compatibilidad administrativa."
            : "Actualizá el número visible o, si hace falta, renovás secretos legacy. Dejá un campo vacío para mantener el valor actual."
        }
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-6 p-6 pt-1">
          <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--admin-border-subtle)] bg-[var(--admin-surface-muted)] px-4 py-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-success/15 text-success">
              <WhatsAppMark className="h-4 w-4" />
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                Configuración técnica temporal
              </p>
              <p className="text-xs leading-relaxed text-muted">
                El camino principal es autorizar en Meta. Usá este formulario
                solo si una conexión existente lo requiere.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="wa-display">Número visible</Label>
              <Input
                id="wa-display"
                type="tel"
                inputMode="tel"
                value={form.displayPhoneNumber}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    displayPhoneNumber: formatVisiblePhone(e.target.value),
                  }))
                }
                onBlur={() =>
                  setForm((prev) => ({
                    ...prev,
                    displayPhoneNumber: toStoredVisiblePhone(
                      prev.displayPhoneNumber
                    ),
                  }))
                }
                placeholder={CHILE_PHONE_EXAMPLE}
                autoComplete="tel"
              />
              <p className="text-xs text-muted">
                Formato Chile: {CHILE_PHONE_EXAMPLE}. Así aparece en Canales.
              </p>
            </div>

            <button
              type="button"
              className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
              onClick={() => setShowTechnical((v) => !v)}
            >
              {showTechnical
                ? "Ocultar identificadores y secretos"
                : "Mostrar identificadores y secretos"}
            </button>

            {showTechnical ? (
              <>
                {manageMode === "connect" ? (
                  <div className="space-y-2">
                    <Label htmlFor="wa-phone-id">Identificador del número</Label>
                    <Input
                      id="wa-phone-id"
                      value={form.phoneNumberId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          phoneNumberId: e.target.value,
                        }))
                      }
                      required
                      autoComplete="off"
                    />
                  </div>
                ) : null}

                <div className="space-y-4 rounded-[var(--radius-md)] border border-[var(--admin-border-subtle)] bg-background px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Credenciales
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {manageMode === "manage"
                        ? "Solo completá lo que quieras renovar."
                        : "Necesarias para la vía técnica legacy."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wa-verify">
                      Token de verificación
                      {manageMode === "manage" ? " (opcional)" : ""}
                    </Label>
                    <Input
                      id="wa-verify"
                      type="password"
                      value={form.verifyToken}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          verifyToken: e.target.value,
                        }))
                      }
                      required={manageMode === "connect"}
                      autoComplete="new-password"
                      placeholder={
                        manageMode === "manage" && connection?.hasVerifyToken
                          ? "Dejar vacío para mantener el actual"
                          : undefined
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wa-secret">
                      Secreto de la aplicación
                      {manageMode === "manage" ? " (opcional)" : ""}
                    </Label>
                    <Input
                      id="wa-secret"
                      type="password"
                      value={form.appSecret}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          appSecret: e.target.value,
                        }))
                      }
                      required={manageMode === "connect"}
                      autoComplete="new-password"
                      placeholder={
                        manageMode === "manage" && connection?.hasAppSecret
                          ? "Dejar vacío para mantener el actual"
                          : undefined
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wa-access">
                      Token de acceso
                      {manageMode === "manage" ? " (opcional)" : ""}
                    </Label>
                    <Input
                      id="wa-access"
                      type="password"
                      value={form.accessToken}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          accessToken: e.target.value,
                        }))
                      }
                      required={manageMode === "connect"}
                      autoComplete="new-password"
                      placeholder={
                        manageMode === "manage" && connection?.hasAccessToken
                          ? "Dejar vacío para mantener el actual"
                          : undefined
                      }
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {error && saveStatus === "error" ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--admin-border-subtle)] pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setManageOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saveStatus === "saving"}>
              {saveStatus === "saving" ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
