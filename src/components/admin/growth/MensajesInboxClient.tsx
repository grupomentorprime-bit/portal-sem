"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  Globe2,
  Handshake,
  MessageSquare,
  Send,
  UserRound,
} from "lucide-react";
import { EmptyState, aek } from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { GrowthConversationChannel } from "@/core/growth/messaging";
import {
  GROWTH_MENSAJES_BACK_LABEL,
  GROWTH_MENSAJES_EMPTY_DESCRIPTION,
  GROWTH_MENSAJES_EMPTY_TITLE,
  GROWTH_MENSAJES_NO_MATCH_DESCRIPTION,
  GROWTH_MENSAJES_NO_MATCH_TITLE,
  GROWTH_MENSAJES_PAGE_DESCRIPTION,
  GROWTH_MENSAJES_PAGE_TITLE,
  GROWTH_MENSAJES_REPLY_ERROR_GENERIC,
  GROWTH_MENSAJES_REPLY_PLACEHOLDER,
  GROWTH_MENSAJES_SELECT_DESCRIPTION,
  GROWTH_MENSAJES_SELECT_TITLE,
  GROWTH_MENSAJES_SEND_FAILED_LABEL,
  GROWTH_MENSAJES_SEND_LABEL,
  GROWTH_MENSAJES_VIEW_OPPORTUNITY_LABEL,
  GROWTH_MENSAJES_VIEW_PERSONA_LABEL,
} from "@/lib/growth/labels";
import type {
  GrowthMensajesListItemView,
  GrowthMensajesThreadView,
} from "@/lib/growth/mensajes-view";
import { cn } from "@/lib/utils";

export interface MensajesInboxClientProps {
  items: GrowthMensajesListItemView[];
  selectedId: string;
  thread: GrowthMensajesThreadView | null;
  q: string;
  canReply: boolean;
}

function personaInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function humanReplyError(payload: {
  error?: string;
  reason?: string;
}): string {
  switch (payload.reason) {
    case "missing_body":
      return "Escribí un mensaje antes de enviar.";
    case "conversation_not_found":
      return "No encontramos esta conversación.";
    case "not_whatsapp_conversation":
      return "Por ahora solo se puede responder por WhatsApp.";
    case "connection_unavailable":
      return "WhatsApp no está disponible en este Espacio.";
    case "recipient_unavailable":
      return "No hay destinatario en esta conversación.";
    case "template_required":
      return "Ya no se puede enviar una respuesta libre en este momento.";
    case "provider_rejected":
      return GROWTH_MENSAJES_REPLY_ERROR_GENERIC;
    default:
      return payload.error?.trim() || GROWTH_MENSAJES_REPLY_ERROR_GENERIC;
  }
}

/** Icono de marca WhatsApp (reconocible); sin estados inventados. */
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

function ChannelMark({
  channel,
  className,
}: {
  channel: GrowthConversationChannel | string;
  className?: string;
}) {
  const iconClass = cn("h-3.5 w-3.5 shrink-0", className);
  switch (channel) {
    case "whatsapp":
      return <WhatsAppMark className={cn(iconClass, "text-[#25D366]")} />;
    case "web_chat":
      return <MessageSquare className={iconClass} aria-hidden />;
    case "instagram":
    case "facebook":
    default:
      return <Globe2 className={iconClass} aria-hidden />;
  }
}

function ChannelBadge({
  channel,
  label,
  className,
}: {
  channel: GrowthConversationChannel | string;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted",
        className
      )}
    >
      <ChannelMark channel={channel} />
      <span>{label}</span>
    </span>
  );
}

const listRowClass = cn(
  "relative flex w-full items-start gap-3 px-3 py-3 text-left transition duration-150",
  "hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]",
  aek.focus
);

const threadLinkClass = cn(
  "inline-flex items-center gap-1 text-xs text-muted",
  "hover:text-foreground",
  aek.focus,
  "rounded-[var(--radius-sm)]"
);

export function MensajesInboxClient({
  items,
  selectedId,
  thread,
  q,
  canReply,
}: MensajesInboxClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const hasSearch = Boolean(q.trim());
  const showThreadOnMobile = Boolean(selectedId);
  const compactMobileChat = isNarrow && showThreadOnMobile;
  const canSend = Boolean(draft.trim()) && !sending && !pending;

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /** En chat móvil: oculta migas del chrome sin tocar Shell. */
  useLayoutEffect(() => {
    if (!showThreadOnMobile) return;
    const style = document.createElement("style");
    style.setAttribute("data-mensajes-004a-chrome", "");
    style.textContent =
      "@media (max-width:767px){nav[aria-label='Breadcrumb']{display:none!important}}";
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, [showThreadOnMobile]);

  useEffect(() => {
    setDraft("");
    setSendError(null);
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.id, thread?.messages.length]);

  const openConversation = (id: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    params.set("c", id);
    startTransition(() => {
      router.push(`/admin/mensajes?${params.toString()}`);
    });
  };

  const backToList = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/admin/mensajes?${qs}` : "/admin/mensajes");
    });
  };

  const pushSearch = (value: string) => {
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    if (selectedId) params.set("c", selectedId);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/admin/mensajes?${qs}` : "/admin/mensajes");
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!thread || !canReply || sending) return;
    const body = draft.trim();
    if (!body) {
      setSendError("Escribí un mensaje antes de enviar.");
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(
        `/api/growth/conversaciones/${encodeURIComponent(thread.id)}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body,
            clientRequestId:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `reply-${Date.now()}`,
          }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        reason?: string;
      };
      if (!res.ok || !data.ok) {
        setSendError(humanReplyError(data));
        return;
      }
      setDraft("");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setSendError(GROWTH_MENSAJES_REPLY_ERROR_GENERIC);
    } finally {
      setSending(false);
    }
  };

  const listPane = (
    <div
      className={cn(
        aek.surface,
        "flex min-h-0 flex-1 flex-col overflow-hidden shadow-[var(--admin-shadow-panel)]",
        showThreadOnMobile ? "hidden md:flex" : "flex"
      )}
      data-mensajes-list
    >
      <div className="border-b border-[var(--admin-border-subtle)] px-3 py-3">
        <label className="sr-only" htmlFor="mensajes-search">
          Buscar conversaciones
        </label>
        <input
          id="mensajes-search"
          type="search"
          defaultValue={q}
          placeholder="Buscar por nombre…"
          className={cn(
            "h-10 w-full rounded-[var(--radius-md)] border border-[var(--admin-border-subtle)]",
            "bg-[var(--admin-surface)] px-3 text-sm text-foreground",
            "placeholder:text-muted",
            aek.focus
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              pushSearch((e.target as HTMLInputElement).value);
            }
          }}
          onBlur={(e) => {
            if (e.target.value.trim() !== q.trim()) {
              pushSearch(e.target.value);
            }
          }}
        />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-4">
          <EmptyState
            title={
              hasSearch
                ? GROWTH_MENSAJES_NO_MATCH_TITLE
                : GROWTH_MENSAJES_EMPTY_TITLE
            }
            description={
              hasSearch
                ? GROWTH_MENSAJES_NO_MATCH_DESCRIPTION
                : GROWTH_MENSAJES_EMPTY_DESCRIPTION
            }
            icon={<MessageSquare className="h-8 w-8" />}
            className="border-0 bg-transparent shadow-none"
          />
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto" role="list">
          {items.map((item) => {
            const active = item.id === selectedId;
            return (
              <li
                key={item.id}
                className="border-b border-[var(--admin-border-subtle)] last:border-b-0"
              >
                <button
                  type="button"
                  className={cn(
                    listRowClass,
                    active &&
                      "bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--admin-surface-muted))] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[var(--color-primary)]"
                  )}
                  aria-current={active ? "true" : undefined}
                  onClick={() => openConversation(item.id)}
                  data-mensajes-conversation={item.id}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      "bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--admin-surface-muted))]",
                      "text-sm font-semibold text-foreground"
                    )}
                    aria-hidden
                  >
                    {personaInitial(item.personaName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {item.personaName}
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {item.timeLabel}
                      </span>
                    </span>
                    <ChannelBadge
                      channel={item.channel}
                      label={item.channelLabel}
                      className="mt-0.5"
                    />
                    <span className="mt-1 block truncate text-sm text-muted">
                      {item.lastMessagePreview}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  const threadPane = (
    <div
      className={cn(
        aek.surface,
        "flex min-h-0 flex-1 flex-col overflow-hidden shadow-[var(--admin-shadow-panel)]",
        showThreadOnMobile ? "flex" : "hidden md:flex"
      )}
      data-mensajes-thread
    >
      {!thread ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <EmptyState
            title={GROWTH_MENSAJES_SELECT_TITLE}
            description={GROWTH_MENSAJES_SELECT_DESCRIPTION}
            icon={<MessageSquare className="h-8 w-8" />}
            className="border-0 bg-transparent shadow-none"
          />
        </div>
      ) : (
        <>
          <header className="shrink-0 border-b border-[var(--admin-border-subtle)] px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <button
                type="button"
                className={cn(
                  "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] md:hidden",
                  "text-foreground hover:bg-[var(--admin-surface-muted)]",
                  aek.focus
                )}
                onClick={backToList}
                aria-label={GROWTH_MENSAJES_BACK_LABEL}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
                      {thread.personaName}
                    </h2>
                    <ChannelBadge
                      channel={thread.channel}
                      label={thread.channelLabel}
                      className="mt-0.5"
                    />
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                    <Link
                      href={`/admin/personas/${encodeURIComponent(thread.personaId)}`}
                      className={threadLinkClass}
                    >
                      <UserRound className="h-3.5 w-3.5" aria-hidden />
                      {GROWTH_MENSAJES_VIEW_PERSONA_LABEL}
                    </Link>
                    {thread.oportunidadId ? (
                      <Link
                        href={`/admin/ventas/${encodeURIComponent(thread.oportunidadId)}`}
                        className={threadLinkClass}
                      >
                        <Handshake className="h-3.5 w-3.5" aria-hidden />
                        {GROWTH_MENSAJES_VIEW_OPPORTUNITY_LABEL}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--admin-surface-muted)]">
            <div className="flex min-h-full flex-col justify-end px-3 py-3 sm:px-4 sm:py-3">
              {thread.messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  Todavía no hay mensajes en esta conversación.
                </p>
              ) : (
                <ul
                  className="mx-auto flex w-full max-w-xl flex-col gap-2"
                  role="list"
                >
                  {thread.messages.map((message) => {
                    const outbound = message.direction === "outbound";
                    return (
                      <li
                        key={message.id}
                        className={cn(
                          "flex",
                          outbound ? "justify-end" : "justify-start"
                        )}
                        data-mensajes-direction={message.direction}
                      >
                        <div
                          className={cn(
                            "max-w-[min(100%,26rem)] rounded-[var(--radius-lg)] px-3.5 py-2",
                            outbound
                              ? "bg-[color-mix(in_srgb,var(--color-primary)_16%,var(--admin-surface))] text-foreground shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]"
                              : "border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] text-foreground"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {message.body}
                          </p>
                          <div
                            className={cn(
                              "mt-1 flex items-center gap-2 text-[11px] text-muted",
                              outbound && "justify-end"
                            )}
                          >
                            <time>{message.timeLabel}</time>
                            {message.sendFailed ? (
                              <span className="font-medium text-[var(--color-danger)]">
                                {GROWTH_MENSAJES_SEND_FAILED_LABEL}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <footer className="shrink-0 border-t border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-3 py-2.5 sm:px-4 sm:py-3">
            {canReply ? (
              <form onSubmit={onSubmit} className="mx-auto w-full max-w-2xl">
                <div
                  className={cn(
                    "flex items-end gap-2 rounded-[var(--radius-lg)] border border-[var(--admin-border-subtle)]",
                    "bg-[var(--admin-surface)] p-2 shadow-[var(--admin-shadow-panel)]"
                  )}
                >
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={GROWTH_MENSAJES_REPLY_PLACEHOLDER}
                    rows={2}
                    disabled={sending || pending}
                    className={cn(
                      "min-h-[2.75rem] flex-1 resize-none border-0 bg-transparent px-2 py-1.5 shadow-none",
                      "focus-visible:ring-0 focus-visible:ring-offset-0"
                    )}
                    data-mensajes-composer
                  />
                  <Button
                    type="submit"
                    size="sm"
                    loading={sending || pending}
                    disabled={!canSend}
                    className={cn(
                      "mb-0.5 shrink-0",
                      !canSend && "opacity-45"
                    )}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    {GROWTH_MENSAJES_SEND_LABEL}
                  </Button>
                </div>
                {sendError ? (
                  <p
                    className="mt-2 text-sm text-[var(--color-danger)]"
                    role="alert"
                  >
                    {sendError}
                  </p>
                ) : null}
              </form>
            ) : (
              <p className="text-sm text-muted">
                Podés leer esta conversación. Para responder necesitás permiso de
                operación en Ventas.
              </p>
            )}
          </footer>
        </>
      )}
    </div>
  );

  return (
    <AdminModulePage
      breadcrumbs={
        compactMobileChat
          ? [{ label: "Inicio" }]
          : [
              { label: "Inicio", href: "/admin" },
              { label: GROWTH_MENSAJES_PAGE_TITLE },
            ]
      }
      title={compactMobileChat ? "" : GROWTH_MENSAJES_PAGE_TITLE}
      description={
        compactMobileChat ? undefined : GROWTH_MENSAJES_PAGE_DESCRIPTION
      }
      headerClassName={cn(
        showThreadOnMobile && "max-md:hidden",
        compactMobileChat && "mb-0 border-0 pb-0"
      )}
      className="min-h-0"
    >
      <div
        className={cn(
          "grid gap-3 md:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)]",
          "min-h-[min(68dvh,36rem)] md:min-h-[calc(100dvh-11.5rem)]",
          compactMobileChat && "min-h-[calc(100dvh-4.5rem)]",
          pending && "opacity-90"
        )}
        data-mensajes-inbox
      >
        {listPane}
        {threadPane}
      </div>
    </AdminModulePage>
  );
}
