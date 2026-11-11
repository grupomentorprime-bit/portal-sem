"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  DESKTOP_FALLBACK,
  MENTOR_APPS,
  mentorAppBlurb,
  mentorAppLabel,
  nextWallpaper,
  wallpaperSrc,
  type DesktopWallpaper,
  type MentorAppId,
} from "@/lib/desktop/catalog";
import { desktopClick, type DesktopClick } from "@/lib/desktop/contract";

export interface MentorDesktopProps {
  spaceName: string;
  spaces: { tenantId: string; name: string }[];
  activeTenantId: string;
  user: { displayName: string; email: string };
  contracted: MentorAppId[];
  aprendeHoyEntryUrl: string | null;
  cumpleOrigin: string | null;
  wallpaper: DesktopWallpaper;
  requested: MentorAppId[];
}

type SheetState = {
  appId: MentorAppId;
  kind: Exclude<DesktopClick["kind"], "open">;
};

function formatClock(date = new Date()): string {
  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initialsForUser(user: MentorDesktopProps["user"]): string {
  const parts = (user.displayName || user.email)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return (parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "MP").slice(0, 2);
}

function glyphClass(appId: MentorAppId): string {
  if (appId === "growth-os") return "glyph g-growth";
  if (appId === "cumple") return "glyph g-cumple";
  if (appId === "aprende-hoy") return "glyph g-aprende";
  return "glyph g-rrhh";
}

function renderGlyph(appId: MentorAppId) {
  if (appId === "growth-os") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 16l5-5 3 3 8-8" />
        <path d="M14 6h6v6" />
      </svg>
    );
  }
  if (appId === "cumple") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M8.5 12l2.2 2.2 4.8-5" />
      </svg>
    );
  }
  if (appId === "aprende-hoy") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="9" r="3" />
      <circle cx="16" cy="10" r="2.4" />
      <path d="M4 19c.6-2.6 2.6-4 5-4s4.4 1.4 5 4" />
      <path d="M14 15.2c1.2-.5 2.5-.6 3.6-.2 1.2.8 1.8 2 2 3.8" />
    </svg>
  );
}

function renderLock() {
  return (
    <span className="lock" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
        <path d="M8 10V8a4 4 0 1 1 8 0v2" />
        <rect x="6" y="10" width="12" height="10" rx="2" />
      </svg>
    </span>
  );
}

export function MentorDesktop(props: MentorDesktopProps) {
  const [timeText, setTimeText] = useState(() => formatClock());
  const [wallpaper, setWallpaper] = useState(props.wallpaper);
  const [imageBroken, setImageBroken] = useState(false);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [requested, setRequested] = useState<MentorAppId[]>(props.requested);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [spaceListOpen, setSpaceListOpen] = useState(false);

  useEffect(() => {
    setTimeText(formatClock());
    const timer = window.setInterval(() => {
      setTimeText(formatClock());
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const requestedSet = useMemo(() => new Set(requested), [requested]);
  const wallpaperUrl = wallpaperSrc(wallpaper);
  const deskStyle: CSSProperties & Record<"--wall", string> = imageBroken
    ? { "--wall": "none", background: DESKTOP_FALLBACK }
    : { "--wall": `url("${wallpaperUrl}")` };
  const displayName = props.user.displayName || props.user.email;
  const otherSpaces = props.spaces.filter((space) => space.tenantId !== props.activeTenantId);

  async function handleWallpaper() {
    const next = nextWallpaper(wallpaper);
    setWallpaper(next);
    setImageBroken(false);
    const response = await fetch("/api/desktop/wallpaper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallpaper: next }),
    }).catch(() => null);
    if (!response?.ok) return;
  }

  function openSheet(appId: MentorAppId, kind: Exclude<DesktopClick["kind"], "open">) {
    setSendingRequest(false);
    setSheet({ appId, kind });
  }

  function handleApp(appId: MentorAppId) {
    const action = desktopClick({
      appId,
      tenantId: props.activeTenantId,
      contracted: props.contracted,
      aprendeHoyEntryUrl: props.aprendeHoyEntryUrl,
      cumpleOrigin: props.cumpleOrigin,
    });
    if (action.kind === "open") {
      window.location.assign(action.href);
      return;
    }
    openSheet(appId, action.kind);
  }

  async function submitRequest(appId: MentorAppId) {
    if (sendingRequest || requestedSet.has(appId)) return;
    setSendingRequest(true);
    const response = await fetch("/api/desktop/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId }),
    }).catch(() => null);
    if (!response?.ok) {
      setSendingRequest(false);
      return;
    }
    const body = (await response.json().catch(() => null)) as { ok?: boolean } | null;
    if (body?.ok) {
      setRequested((current) => (current.includes(appId) ? current : [...current, appId]));
    }
    setSendingRequest(false);
  }

  async function switchSpace(tenantId: string) {
    const response = await fetch("/api/identity/spaces/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { ok?: boolean } | null;
    if (!response?.ok || !body?.ok) return;
    window.location.assign("/escritorio");
  }

  async function logout() {
    await fetch("/api/identity/logout", { method: "POST" }).catch(() => null);
    window.location.assign("/login");
  }

  const sheetRequested = sheet ? requestedSet.has(sheet.appId) : false;
  const sheetKicker =
    sheet?.kind === "request"
      ? "No está en el plan"
      : sheet?.kind === "later"
        ? "Llega después"
        : "Entrada no conectada";

  return (
    <main className="desk" style={deskStyle}>
      <img
        src={wallpaperUrl}
        alt=""
        hidden
        onLoad={() => setImageBroken(false)}
        onError={() => setImageBroken(true)}
      />

      <div className="bar">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <button type="button" className="fondo" onClick={handleWallpaper}>
            Fondo
          </button>
        </div>

        <div className="meta">
          {props.spaces.length > 1 ? (
            <button type="button" className="fondo" onClick={() => setSpaceListOpen((open) => !open)}>
              {props.spaceName}
            </button>
          ) : (
            <span>{props.spaceName}</span>
          )}
          <span suppressHydrationWarning>{timeText}</span>
          <a className="who" href="/admin/settings/profile" title={props.user.email}>
            <span className="avatar">{initialsForUser(props.user)}</span>
            <span>{displayName}</span>
          </a>
          <button type="button" className="fondo" onClick={logout}>
            Salir
          </button>
        </div>
      </div>

      {spaceListOpen && otherSpaces.length > 0 ? (
        <div className="space-list">
          {otherSpaces.map((space) => (
            <button
              key={space.tenantId}
              type="button"
              onClick={() => void switchSpace(space.tenantId)}
            >
              {space.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="dock-wrap">
        <div className="dock">
          {MENTOR_APPS.map((appId) => {
            const action = desktopClick({
              appId,
              tenantId: props.activeTenantId,
              contracted: props.contracted,
              aprendeHoyEntryUrl: props.aprendeHoyEntryUrl,
              cumpleOrigin: props.cumpleOrigin,
            });
            return (
              <button key={appId} type="button" className="app" onClick={() => handleApp(appId)}>
                <span className={glyphClass(appId)}>
                  {renderGlyph(appId)}
                  {action.kind === "request" ? renderLock() : null}
                </span>
                <small>{mentorAppLabel(appId)}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`sheet-back${sheet ? " show" : ""}`}>
        {sheet ? (
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="desktop-sheet-title">
            <p className="kicker">{sheetKicker}</p>
            <h2 id="desktop-sheet-title">{mentorAppLabel(sheet.appId)}</h2>
            <p>{mentorAppBlurb(sheet.appId)}</p>
            <div className="row">
              {sheet.kind === "request" ? (
                <button
                  type="button"
                  className="primary"
                  disabled={sheetRequested || sendingRequest}
                  onClick={() => void submitRequest(sheet.appId)}
                >
                  {sheetRequested ? "Solicitud enviada" : "Solicitar acceso"}
                </button>
              ) : null}
              <button type="button" className="ghost" onClick={() => setSheet(null)}>
                Cerrar
              </button>
            </div>
            {sheet.kind === "request" && sheetRequested ? (
              <p className="sent">Queda registrada para este Espacio.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
