"use client";

import "./mentor-desktop.css";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  DESKTOP_FALLBACK,
  desktopCanSwitchSpace,
  desktopContextLabel,
  desktopDock,
  writeEnteredClientCookie,
  isMentorAppId,
  dockAppBlurb,
  dockAppLabel,
  mentorAppBlurb,
  mentorAppLabel,
  type DockAppId,
  nextWallpaper,
  wallpaperSrc,
  type DesktopWallpaper,
  type MentorAppId,
  type WallpaperChoice,
} from "@/lib/desktop/catalog";
import { canManageAppKeys, desktopVisibleApps } from "@/lib/desktop/app-access";
import {
  connectLaunchForm,
  createTransactionVerifier,
  hashTransactionVerifier,
} from "@/lib/connect/policy";
import { desktopClick, type DesktopClick } from "@/lib/desktop/contract";
import {
  deskIconsForDock,
  DESK_ICON_HEIGHT,
  DESK_ICON_WIDTH,
  cellAnchor,
  cellUnderPointer,
  deskIconGap,
  deskIconPixels,
  layoutAfterDrop,
  moveDeskIcon,
  spotCell,
  pointOnDock,
  type DeskIconSpot,
} from "@/lib/desktop/layout";
import { DesktopAccount } from "@/components/desktop/DesktopAccount";
import { DesktopAjustes } from "@/components/desktop/DesktopAjustes";
import { DesktopAvatar } from "@/components/desktop/DesktopAvatar";
import { DesktopClientes } from "@/components/desktop/DesktopClientes";
import { DesktopDay } from "@/components/desktop/DesktopDay";
import { DesktopFinder } from "@/components/desktop/DesktopFinder";
import { DesktopSpaceAjustes } from "@/components/desktop/DesktopSpaceAjustes";
import { resolveDesktopAvatar } from "@/lib/desktop/avatar-catalog";
import type { DesktopDayLine } from "@/lib/desktop/day";
import { hasAnySpaceSetting } from "@/lib/desktop/space-settings";
import {
  NELZURI_BACKING,
  NELZURI_LOGO_ON_DARK,
  NELZURI_MARK,
  NELZURI_NAME,
  NELZURI_SLOGAN,
} from "@/lib/desktop/nelzuri";

export interface MentorDesktopProps {
  spaceName: string;
  spaces: { tenantId: string; name: string; needsAccess?: boolean }[];
  activeTenantId: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    avatarPresetId?: string | null;
    avatarPhoto?: boolean;
    avatarPhotoUpdatedAt?: string | null;
  };
  contracted: MentorAppId[];
  /** Llaves de la membresía en el Espacio activo. Ausente = legado (todo el techo). */
  authorizedApps?: MentorAppId[] | null;
  aprendeHoyEntryUrl: string | null;
  cumpleOrigin: string | null;
  rrhhOrigin: string | null;
  wallpaper: WallpaperChoice;
  /** Imagen propia, si ya subió una. Sigue disponible aunque el fondo activo sea del catálogo. */
  customWallpaper?: string | null;
  /** `null` si la persona todavía no movió nada. */
  layout: DeskIconSpot[] | null;
  requested: MentorAppId[];
  /** Asuntos de hoy de la empresa activa. Vacío en la mesa de la plataforma. */
  dayLines?: DesktopDayLine[];
  /** Dueño del ecosistema: Ajustes controla el acceso total y aparece Clientes. */
  owner?: boolean;
  /** El dueño abrió el escritorio de un cliente y puede volver a la plataforma. */
  canReturnToPlatform?: boolean;
  /** Permisos del Espacio activo. Filtran Ajustes de empresa. */
  permissions?: string[];
}

type SheetState = {
  appId: MentorAppId;
  kind: Exclude<DesktopClick["kind"], "open">;
};

type LaunchState = {
  appId: DockAppId;
  top: number;
  left: number;
  width: number;
  height: number;
};

const DOCK_RANGE = 150;
const DOCK_MAX = 1.48;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Curva del Dock: el icono bajo el cursor crece y los vecinos lo acompañan. */
function dockMagnification(distance: number): number {
  const span = Math.abs(distance);
  if (span >= DOCK_RANGE) return 1;
  const influence = Math.cos((span / DOCK_RANGE) * (Math.PI / 2));
  return 1 + (DOCK_MAX - 1) * influence;
}

function formatClock(date = new Date()): string {
  return date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toneClass(appId: DockAppId): string {
  if (appId === "growth-os") return "g-growth";
  if (appId === "cumple") return "g-cumple";
  if (appId === "aprende-hoy") return "g-aprende";
  if (appId === "clientes") return "g-clientes";
  if (appId === "ajustes") return "g-ajustes";
  return "g-rrhh";
}

function glyphClass(appId: DockAppId): string {
  return `glyph ${toneClass(appId)}`;
}

function renderGlyph(appId: DockAppId) {
  if (appId === "clientes") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" aria-hidden="true">
        <path d="M4 20V9l8-5 8 5v11" strokeLinejoin="round" />
        <path d="M9 20v-6h6v6" />
        <path d="M12 8v4M10 10h4" />
      </svg>
    );
  }
  if (appId === "ajustes") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 13a7.7 7.7 0 0 0 .1-2l2-1.2-2-3.4-2.3.6a7.8 7.8 0 0 0-1.7-1L15 3h-4l-.5 2.9a7.8 7.8 0 0 0-1.7 1L6.5 6.4l-2 3.4L6.5 11a7.7 7.7 0 0 0 .1 2l-2 1.2 2 3.4 2.3-.6a7.8 7.8 0 0 0 1.7 1L11 21h4l.5-2.9a7.8 7.8 0 0 0 1.7-1l2.3.6 2-3.4-2-1.3z"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (appId === "growth-os") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3.2l1.15 4.05L17.2 8.4l-4.05 1.15L12 13.6l-1.15-4.05L6.8 8.4l4.05-1.15L12 3.2z"
          fill="#fff"
        />
        <path
          d="M17.2 13.2l.62 2.18 2.18.62-2.18.62-.62 2.18-.62-2.18-2.18-.62 2.18-.62.62-2.18z"
          fill="#fff"
        />
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
  const [wallpaper, setWallpaper] = useState<WallpaperChoice>(props.wallpaper);
  const [customUrl, setCustomUrl] = useState<string | null>(props.customWallpaper ?? null);
  const [imageBroken, setImageBroken] = useState(false);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [requested, setRequested] = useState<MentorAppId[]>(props.requested);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [spaceListOpen, setSpaceListOpen] = useState(false);
  const [ajustesOpen, setAjustesOpen] = useState(false);
  const [clientesOpen, setClientesOpen] = useState(false);
  const [spaceAjustesOpen, setSpaceAjustesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [entering, setEntering] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(
    () => props.user.displayName || props.user.email
  );
  const [avatarState, setAvatarState] = useState(() => ({
    avatarPresetId: props.user.avatarPresetId ?? null,
    avatarPhoto: props.user.avatarPhoto === true,
    avatarPhotoUpdatedAt: props.user.avatarPhotoUpdatedAt ?? null,
  }));
  const [companySettings, setCompanySettings] = useState(() =>
    Boolean(props.owner) ||
      hasAnySpaceSetting(props.permissions ?? [], props.contracted)
  );
  const [pressedId, setPressedId] = useState<DockAppId | null>(null);
  const [shakeId, setShakeId] = useState<DockAppId | null>(null);
  const [launch, setLaunch] = useState<LaunchState | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<HTMLElement>(null);
  const owner = Boolean(props.owner);
  const canRequestPlan = canManageAppKeys(props.permissions ?? []);
  const dockApps = useMemo<DockAppId[]>(() => {
    if (owner) return desktopDock(true);
    return desktopVisibleApps({
      contracted: props.contracted,
      authorizedApps: props.authorizedApps ?? null,
      canRequestPlan,
    });
  }, [owner, props.contracted, props.authorizedApps, canRequestPlan]);
  const [icons, setIcons] = useState<DeskIconSpot[]>(() =>
    deskIconsForDock(
      props.layout,
      owner
        ? desktopDock(true)
        : desktopVisibleApps({
            contracted: props.contracted,
            authorizedApps: props.authorizedApps ?? null,
            canRequestPlan: canManageAppKeys(props.permissions ?? []),
          })
    )
  );
  const [ghost, setGhost] = useState<{ appId: DockAppId } | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const ghostPos = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ appId: DockAppId; moved: boolean } | null>(null);
  const dragOrigin = useRef<{ x: number; y: number; homeX: number; homeY: number } | null>(null);
  const suppressClick = useRef(false);
  const iconsRef = useRef(icons);
  const savedRef = useRef<DeskIconSpot[]>(props.layout ?? []);
  iconsRef.current = icons;
  const canSwitchSpace = desktopCanSwitchSpace({
    owner,
    spaceCount: props.spaces.length,
  });
  const contextLabel = desktopContextLabel({ owner, spaceName: props.spaceName });
  const scalesRef = useRef<number[]>(dockApps.map(() => 1));
  const velocityRef = useRef<number[]>(dockApps.map(() => 0));
  const targetRef = useRef<number[]>(dockApps.map(() => 1));
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const connectingRef = useRef(false);
  const [deskSize, setDeskSize] = useState({ width: 1440, height: 900 });

  useEffect(() => {
    const desk = deskRef.current;
    if (!desk) return;
    const measure = () => {
      const rect = desk.getBoundingClientRect();
      setDeskSize({ width: rect.width, height: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(desk);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function releaseLaunch() {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      connectingRef.current = false;
      setLaunch(null);
      setPressedId(null);
      setShakeId(null);
    }
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) releaseLaunch();
    }
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", releaseLaunch);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", releaseLaunch);
      if (frameRef.current != null) window.cancelAnimationFrame(frameRef.current);
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!props.rrhhOrigin) return;
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = props.rrhhOrigin;
    document.head.append(link);
    return () => link.remove();
  }, [props.rrhhOrigin]);

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const drag = dragRef.current;
      const origin = dragOrigin.current;
      if (!drag || !origin) return;
      const distance = Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
      if (!drag.moved && distance < 8) return;
      const x = origin.homeX + (event.clientX - origin.x);
      const y = origin.homeY + (event.clientY - origin.y);
      ghostPos.current = { x, y };
      if (!drag.moved) {
        drag.moved = true;
        setGhost({ appId: drag.appId });
        return;
      }
      const node = ghostRef.current;
      if (!node) return;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
    }
    function onUp(event: PointerEvent) {
      const drag = dragRef.current;
      dragRef.current = null;
      dragOrigin.current = null;
      if (!drag) return;
      if (!drag.moved) {
        setGhost(null);
        setPressedId(null);
        return;
      }
      suppressClick.current = true;
      const dropX = ghostPos.current.x || event.clientX;
      const dropY = ghostPos.current.y || event.clientY;
      const box = dockRef.current?.getBoundingClientRect();
      const onDock = box
        ? pointOnDock({
            clientX: dropX,
            clientY: dropY,
            left: box.left,
            top: box.top,
            right: box.right,
            bottom: box.bottom,
          })
        : false;
      const desk = deskRef.current?.getBoundingClientRect();
      const current = iconsRef.current;
      const deskBox = desk ? { width: desk.width, height: desk.height } : null;
      const gap = deskBox ? deskIconGap(deskBox) : 0;
      const aim = desk
        ? cellUnderPointer({
            clientX: dropX,
            clientY: dropY,
            deskLeft: desk.left,
            deskTop: desk.top,
            desk: { width: desk.width, height: desk.height },
          })
        : null;
      const next = onDock
        ? current.filter((icon) => icon.appId !== drag.appId)
        : aim && desk
          ? moveDeskIcon({
              icons: current,
              appId: drag.appId,
              col: aim.col,
              row: aim.row,
              at: {
                x: dropX - desk.left,
                y: dropY - desk.top,
                pitchX: DESK_ICON_WIDTH + gap,
                pitchY: DESK_ICON_HEIGHT + gap,
              },
            })
          : current;
      const unchanged =
        next.length === current.length &&
        next.every((icon, index) => {
          const before = current[index];
          return before?.appId === icon.appId && before.x === icon.x && before.y === icon.y;
        });
      function commit() {
        if (unchanged) {
          setGhost(null);
          setPressedId(null);
          return;
        }
        setIcons(next);
        setGhost(null);
        setPressedId(null);
        const stored = layoutAfterDrop({
          saved: savedRef.current,
          dock: dockApps,
          visible: next,
        });
        savedRef.current = stored;
        void fetch("/api/desktop/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ icons: stored }),
        }).catch(() => null);
      }
      const node = ghostRef.current;
      const canGlide = Boolean(node && desk && desk.width > 0 && !onDock && !prefersReducedMotion());
      if (!canGlide || !node || !desk) {
        commit();
        return;
      }
      const landed = next.find((icon) => icon.appId === drag.appId);
      const cell = landed ? spotCell(landed) : aim ?? { col: 0, row: 0 };
      const anchor = cellAnchor({
        col: cell.col,
        row: cell.row,
        deskLeft: desk.left,
        deskTop: desk.top,
        desk: { width: desk.width, height: desk.height },
      });
      node.classList.add("is-settling");
      node.style.left = `${anchor.x}px`;
      node.style.top = `${anchor.y}px`;
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        commit();
      };
      node.addEventListener("transitionend", (end) => {
        if (end.propertyName === "left" || end.propertyName === "top") finish();
      });
      window.setTimeout(finish, 420);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dockApps]);

  function paintScales(values: number[]) {
    const dock = dockRef.current;
    if (!dock) return;
    const glyphs = dock.querySelectorAll<HTMLElement>(".glyph");
    glyphs.forEach((glyph, index) => {
      glyph.style.setProperty("--s", (values[index] ?? 1).toFixed(3));
    });
  }

  function stepDock() {
    let moving = false;
    const next = scalesRef.current.map((value, index) => {
      const target = targetRef.current[index] ?? 1;
      let velocity = velocityRef.current[index] ?? 0;
      velocity += (target - value) * 0.22;
      velocity *= 0.64;
      const stepped = Math.min(DOCK_MAX + 0.06, Math.max(0.86, value + velocity));
      velocityRef.current[index] = velocity;
      if (Math.abs(target - stepped) > 0.004 || Math.abs(velocity) > 0.004) moving = true;
      return stepped;
    });
    scalesRef.current = next;
    paintScales(next);
    frameRef.current = moving ? window.requestAnimationFrame(stepDock) : null;
  }

  function wakeDock() {
    if (frameRef.current == null) frameRef.current = window.requestAnimationFrame(stepDock);
  }

  function aimDock(clientX: number) {
    const dock = dockRef.current;
    if (!dock || prefersReducedMotion()) return;
    const dockLeft = dock.getBoundingClientRect().left;
    const buttons = dock.querySelectorAll<HTMLButtonElement>(".app");
    targetRef.current = Array.from(buttons).map((button) => {
      const rect = button.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      return dockMagnification(clientX - center);
    });
    const localX = clientX - dockLeft;
    dock.style.setProperty("--glow", `${localX}px`);
    dock.style.setProperty("--glow-on", "1");
    wakeDock();
  }

  function releaseDock() {
    targetRef.current = dockApps.map(() => 1);
    dockRef.current?.style.setProperty("--glow-on", "0");
    if (!prefersReducedMotion()) wakeDock();
  }

  function handleDockMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" || launch) return;
    aimDock(event.clientX);
  }

  useEffect(() => {
    setTimeText(formatClock());
    const timer = window.setInterval(() => {
      setTimeText(formatClock());
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setDisplayName(props.user.displayName || props.user.email);
  }, [props.user.displayName, props.user.email]);

  useEffect(() => {
    setAvatarState({
      avatarPresetId: props.user.avatarPresetId ?? null,
      avatarPhoto: props.user.avatarPhoto === true,
      avatarPhotoUpdatedAt: props.user.avatarPhotoUpdatedAt ?? null,
    });
  }, [props.user.avatarPhoto, props.user.avatarPhotoUpdatedAt, props.user.avatarPresetId]);

  useEffect(() => {
    setIcons(deskIconsForDock(props.layout, dockApps));
    scalesRef.current = dockApps.map(() => 1);
    velocityRef.current = dockApps.map(() => 0);
    targetRef.current = dockApps.map(() => 1);
  }, [dockApps, props.layout]);

  useEffect(() => {
    if (owner) {
      setCompanySettings(true);
      return;
    }
    if (props.permissions) {
      setCompanySettings(hasAnySpaceSetting(props.permissions, props.contracted));
      return;
    }
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/identity/me").catch(() => null);
      const body = (await response?.json().catch(() => null)) as {
        ok?: boolean;
        permissions?: string[];
      } | null;
      if (cancelled || !response?.ok || !body?.ok) return;
      setCompanySettings(hasAnySpaceSetting(body.permissions ?? [], props.contracted));
    })();
    return () => {
      cancelled = true;
    };
  }, [owner, props.activeTenantId, props.permissions, props.contracted]);

  const requestedSet = useMemo(() => new Set(requested), [requested]);
  const avatarView = useMemo(
    () =>
      resolveDesktopAvatar({
        displayName,
        email: props.user.email,
        avatarPhoto: avatarState.avatarPhoto,
        avatarPhotoUpdatedAt: avatarState.avatarPhotoUpdatedAt ?? undefined,
        avatarPresetId: avatarState.avatarPresetId,
        userId: props.user.id,
      }),
    [avatarState, displayName, props.user.email, props.user.id]
  );
  const wallpaperUrl =
    wallpaper === "custom" && customUrl
      ? customUrl
      : wallpaperSrc(wallpaper === "custom" ? "mar" : wallpaper);
  const deskStyle: CSSProperties & Record<"--wall", string> = imageBroken
    ? { "--wall": "none", background: DESKTOP_FALLBACK }
    : { "--wall": `url("${wallpaperUrl}")` };
  const clientCount = props.spaces.length;

  function beginDrag(appId: DockAppId, event: ReactPointerEvent<HTMLButtonElement>) {
    const glyph = event.currentTarget.querySelector(".glyph")?.getBoundingClientRect();
    const rect = event.currentTarget.getBoundingClientRect();
    const box = glyph ?? rect;
    dragRef.current = { appId, moved: false };
    dragOrigin.current = {
      x: event.clientX,
      y: event.clientY,
      homeX: box.left + box.width / 2,
      homeY: box.top + box.height / 2,
    };
  }

  function openIfStill(appId: DockAppId, event: ReactMouseEvent<HTMLButtonElement>) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    handleApp(appId, event);
  }

  async function persistWallpaper(next: DesktopWallpaper) {
    setWallpaper(next);
    setImageBroken(false);
    const response = await fetch("/api/desktop/wallpaper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallpaper: next }),
    }).catch(() => null);
    if (!response?.ok) throw new Error("wallpaper");
    const body = (await response.json().catch(() => null)) as {
      ok?: boolean;
      wallpaper?: WallpaperChoice;
    } | null;
    if (!body?.ok || !body.wallpaper || body.wallpaper === "custom") throw new Error("wallpaper");
    setWallpaper(body.wallpaper);
  }

  async function useCustomWallpaper() {
    const response = await fetch("/api/desktop/wallpaper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallpaper: "custom" }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      url?: string;
    } | null;
    if (!response?.ok || !body?.ok) throw new Error("wallpaper");
    setWallpaper("custom");
    if (body.url) setCustomUrl(body.url);
    setImageBroken(false);
  }

  async function uploadWallpaper(file: File) {
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/desktop/wallpaper", {
      method: "POST",
      body: form,
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      url?: string;
      width?: number;
      height?: number;
      savedWidth?: number;
      savedHeight?: number;
    } | null;
    if (!response?.ok || !body?.ok || !body.url || !body.width || !body.height) {
      throw new Error(body?.error || "No se pudo guardar el fondo.");
    }
    setWallpaper("custom");
    setCustomUrl(body.url);
    setImageBroken(false);
    return {
      width: body.width,
      height: body.height,
      savedWidth: body.savedWidth ?? body.width,
      savedHeight: body.savedHeight ?? body.height,
    };
  }

  async function clearCustomWallpaper() {
    const response = await fetch("/api/desktop/wallpaper", { method: "DELETE" }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      wallpaper?: DesktopWallpaper;
    } | null;
    if (!response?.ok || !body?.ok || !body.wallpaper) throw new Error("wallpaper");
    setCustomUrl(null);
    setWallpaper(body.wallpaper);
    setImageBroken(false);
  }

  async function handleWallpaper() {
    try {
      const next = wallpaper === "custom" ? "mar" : nextWallpaper(wallpaper);
      await persistWallpaper(next);
    } catch {
      /* reintento en el siguiente ciclo */
    }
  }

  function openSheet(appId: MentorAppId, kind: Exclude<DesktopClick["kind"], "open" | "connect">) {
    setSendingRequest(false);
    setSheet({ appId, kind });
  }

  function beginOpen(
    appId: DockAppId,
    href: string,
    event: ReactMouseEvent<HTMLButtonElement>
  ) {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    if (prefersReducedMotion()) {
      window.location.assign(href);
      return;
    }
    const glyph = event.currentTarget.querySelector(".glyph");
    const rect = glyph?.getBoundingClientRect();
    if (!rect) {
      window.location.assign(href);
      return;
    }
    setShakeId(null);
    setLaunch({
      appId,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
    timerRef.current = window.setTimeout(() => {
      window.location.assign(href);
    }, 48);
  }

  function closeWindows() {
    setAjustesOpen(false);
    setClientesOpen(false);
    setSpaceAjustesOpen(false);
    setAccountOpen(false);
  }

  function openAccount() {
    setSheet(null);
    setSpaceListOpen(false);
    setAjustesOpen(false);
    setClientesOpen(false);
    setSpaceAjustesOpen(false);
    setAccountOpen((open) => !open);
  }

  function handleApp(appId: DockAppId, event?: ReactMouseEvent<HTMLButtonElement>) {
    if (launch || connectingRef.current) return;
    if (appId === "ajustes" && props.owner) {
      setSheet(null);
      setSpaceListOpen(false);
      setClientesOpen(false);
      setSpaceAjustesOpen(false);
      setAccountOpen(false);
      setAjustesOpen((open) => !open);
      return;
    }
    if (appId === "clientes" && props.owner) {
      setSheet(null);
      setSpaceListOpen(false);
      setAjustesOpen(false);
      setSpaceAjustesOpen(false);
      setAccountOpen(false);
      setClientesOpen((open) => !open);
      return;
    }
    if (appId === "ajustes") {
      if (!companySettings) return;
      setSheet(null);
      setSpaceListOpen(false);
      setAccountOpen(false);
      setSpaceAjustesOpen((open) => !open);
      return;
    }
    if (appId === "clientes") return;
    closeWindows();
    const action = desktopClick({
      appId,
      tenantId: props.activeTenantId,
      contracted: props.contracted,
      authorized: props.authorizedApps ?? null,
      aprendeHoyEntryUrl: props.aprendeHoyEntryUrl,
      cumpleOrigin: props.cumpleOrigin,
      rrhhOrigin: props.rrhhOrigin,
    });
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    if (action.kind === "connect") {
      void beginConnect(action.appId, event);
      return;
    }
    if (action.kind === "open") {
      if (event) beginOpen(appId, action.href, event);
      else window.location.assign(action.href);
      return;
    }
    if (!event || prefersReducedMotion()) {
      openSheet(appId, action.kind);
      return;
    }
    setShakeId(appId);
    timerRef.current = window.setTimeout(() => {
      setShakeId(null);
      openSheet(appId, action.kind);
    }, 420);
  }

  async function beginConnect(
    appId: "cumple" | "rrhh",
    event?: ReactMouseEvent<HTMLButtonElement>
  ) {
    if (connectingRef.current) return;
    connectingRef.current = true;
    const glyph = event?.currentTarget.querySelector(".glyph");
    const rect = glyph?.getBoundingClientRect();
    const transaction = createTransactionVerifier();
    const transactionHash = await hashTransactionVerifier(transaction);
    const response = await fetch("/api/connect/launch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId, transactionHash }),
      signal: AbortSignal.timeout(8_000),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      callback?: string;
      code?: string;
      reason?: string;
    } | null;
    const form =
      response?.ok && body?.ok && body.callback && body.code
        ? connectLaunchForm({
            callback: body.callback,
            code: body.code,
            transaction,
            deskOrigin: window.location.origin,
            rrhhOrigin: props.rrhhOrigin,
          })
        : null;
    if (!form?.ok) {
      connectingRef.current = false;
      setLaunch(null);
      const denied =
        body?.reason === "no_key" ||
        body?.reason === "no_plan" ||
        body?.reason === "no_membership";
      openSheet(appId, denied ? "unauthorized" : "disconnected");
      return;
    }
    if (rect) {
      setLaunch({
        appId,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        connectingRef.current = false;
        setLaunch(null);
        openSheet(appId, "disconnected");
      }, 8_000);
    }
    const element = document.createElement("form");
    element.method = form.method;
    element.action = form.action;
    element.referrerPolicy = form.referrerPolicy;
    const field = document.createElement("input");
    field.type = "hidden";
    field.name = "code";
    field.value = form.fields.code;
    const proof = document.createElement("input");
    proof.type = "hidden";
    proof.name = "transaction";
    proof.value = form.fields.transaction;
    element.append(field, proof);
    document.body.append(element);
    element.submit();
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
    if (tenantId === props.activeTenantId) {
      setSpaceListOpen(false);
      return;
    }
    // Dueño dentro de un cliente: la cookie debe seguir al Espacio nuevo.
    // Si no, al recargar la mesa vuelve al cliente anterior.
    if (props.canReturnToPlatform) {
      await enterClient(tenantId);
      return;
    }
    const opened = await openClient(tenantId);
    if (!opened) return;
    window.location.assign("/escritorio");
  }

  async function openClient(tenantId: string): Promise<boolean> {
    const target = props.spaces.find((space) => space.tenantId === tenantId);
    if (target?.needsAccess) {
      const granted = await fetch(
        `/api/platform/spaces/${encodeURIComponent(tenantId)}/access`,
        { method: "POST" }
      ).catch(() => null);
      const grantedBody = (await granted?.json().catch(() => null)) as { ok?: boolean } | null;
      if (!granted?.ok || !grantedBody?.ok) return false;
    }
    const response = await fetch("/api/identity/spaces/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as { ok?: boolean } | null;
    return Boolean(response?.ok && body?.ok);
  }

  async function enterClient(tenantId: string) {
    if (entering) return;
    setEntering(tenantId);
    const opened = await openClient(tenantId);
    if (!opened) {
      setEntering(null);
      return;
    }
    writeEnteredClientCookie(tenantId);
    window.location.assign("/escritorio");
  }

  function returnToPlatform() {
    writeEnteredClientCookie(null);
    window.location.assign("/escritorio");
  }

  async function logout() {
    writeEnteredClientCookie(null);
    await fetch("/api/identity/logout", { method: "POST" }).catch(() => null);
    window.location.assign("/login");
  }

  const sheetRequested = sheet ? requestedSet.has(sheet.appId) : false;
  const sheetKicker =
    sheet?.kind === "request"
      ? "No está en el plan"
      : sheet?.kind === "unauthorized"
        ? "No autorizado"
        : sheet?.kind === "later"
          ? "Llega después"
          : "Entrada no conectada";

  return (
    <main ref={deskRef} className="desk" style={deskStyle}>
      <img
        src={wallpaperUrl}
        alt=""
        hidden
        onLoad={() => setImageBroken(false)}
        onError={() => setImageBroken(true)}
      />

      <div className="bar">
        <div className="brand">
          <span className="brand-lockup">
            <img
              className="brand-wordmark"
              src={NELZURI_LOGO_ON_DARK}
              alt={`${NELZURI_NAME}. ${NELZURI_SLOGAN}`}
            />
            <img
              className="brand-mark"
              src={NELZURI_MARK}
              alt={`${NELZURI_NAME}. ${NELZURI_SLOGAN}. ${NELZURI_BACKING}`}
            />
            <small>{NELZURI_SLOGAN}</small>
          </span>
          <button type="button" className="fondo" onClick={handleWallpaper}>
            Fondo
          </button>
        </div>

        <DesktopFinder
          owner={owner}
          spaces={props.spaces}
          companySettings={companySettings}
          onOpenApp={(appId) => handleApp(appId)}
          onOpenSpace={(tenantId) => {
            if (owner || props.canReturnToPlatform) void enterClient(tenantId);
            else void switchSpace(tenantId);
          }}
        />

        <div className="meta">
          {props.canReturnToPlatform ? (
            <button type="button" className="fondo" onClick={returnToPlatform}>
              Plataforma
            </button>
          ) : null}
          {canSwitchSpace ? (
            <button type="button" className="fondo" onClick={() => setSpaceListOpen((open) => !open)}>
              {contextLabel}
            </button>
          ) : (
            <span>{contextLabel}</span>
          )}
          <span className="clock" suppressHydrationWarning>{timeText}</span>
          <button
            type="button"
            className="who"
            title={props.user.email}
            aria-haspopup="dialog"
            aria-expanded={accountOpen}
            onClick={openAccount}
          >
            <DesktopAvatar view={avatarView} />
            <span>{displayName}</span>
          </button>
          <span className="meta-actions">
            {owner || companySettings ? (
              <button type="button" className="fondo" onClick={() => handleApp("ajustes")}>
                Ajustes
              </button>
            ) : null}
            <button type="button" className="fondo" onClick={logout}>
              Salir
            </button>
          </span>
        </div>

        {canSwitchSpace && spaceListOpen && clientCount > 0 ? (
          <div className="client-panel" role="dialog" aria-label="Clientes">
            <header>
              <p>Clientes</p>
              <span>
                {clientCount === 1 ? "1 organización" : `${clientCount} organizaciones`}
              </span>
            </header>
            <ul>
              {props.spaces.map((space) => {
                const active = space.tenantId === props.activeTenantId;
                const initial = space.name.trim().charAt(0).toUpperCase() || "C";
                return (
                  <li key={space.tenantId}>
                    <button
                      type="button"
                      className={active ? "is-active" : undefined}
                      aria-current={active ? "true" : undefined}
                      onClick={() => void switchSpace(space.tenantId)}
                    >
                      <span className="client-mark" aria-hidden="true">
                        {initial}
                      </span>
                      <span className="client-copy">
                        <strong>{space.name}</strong>
                        <small>
                          {active
                            ? "Espacio activo"
                            : space.needsAccess
                              ? "Entrar como soporte"
                              : "Entrar"}
                        </small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="desk-icons">
        {icons.map((icon) => {
          const action = isMentorAppId(icon.appId)
            ? desktopClick({
                appId: icon.appId,
                tenantId: props.activeTenantId,
                contracted: props.contracted,
                authorized: props.authorizedApps ?? null,
                aprendeHoyEntryUrl: props.aprendeHoyEntryUrl,
                cumpleOrigin: props.cumpleOrigin,
              })
            : null;
          return (
            <button
              key={icon.appId}
              type="button"
              className="desk-icon"
              style={(() => {
                const pos = deskIconPixels(icon, deskSize);
                return {
                  left: pos.left,
                  top: pos.top,
                  visibility: ghost?.appId === icon.appId ? "hidden" : undefined,
                };
              })()}
              onPointerDown={(event) => beginDrag(icon.appId, event)}
              onClick={(event) => openIfStill(icon.appId, event)}
            >
              <span className={glyphClass(icon.appId)}>
                {renderGlyph(icon.appId)}
                {action?.kind === "request" ? renderLock() : null}
              </span>
              <small>{dockAppLabel(icon.appId)}</small>
            </button>
          );
        })}
      </div>

      <div
        className={`dock-wrap${launch ? " is-launching" : ""}`}
        onPointerMove={handleDockMove}
        onPointerLeave={releaseDock}
      >
        <div className="dock-runway" aria-hidden="true" />
        <div className="dock" ref={dockRef}>
          {dockApps.map((appId) => {
            const action = isMentorAppId(appId)
              ? desktopClick({
                  appId,
                  tenantId: props.activeTenantId,
                  contracted: props.contracted,
                  authorized: props.authorizedApps ?? null,
                  aprendeHoyEntryUrl: props.aprendeHoyEntryUrl,
                  cumpleOrigin: props.cumpleOrigin,
                })
              : null;
            const glyphState = [
              glyphClass(appId),
              pressedId === appId ? "is-pressed" : "",
              shakeId === appId ? "is-shaking" : "",
              launch?.appId === appId ? "is-opening" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={appId}
                type="button"
                className="app"
                onPointerDown={(event) => {
                  setPressedId(appId);
                  beginDrag(appId, event);
                }}
                onPointerUp={() => setPressedId(null)}
                onPointerCancel={() => setPressedId(null)}
                onClick={(event) => openIfStill(appId, event)}
              >
                <span className={glyphState}>
                  {renderGlyph(appId)}
                  {action?.kind === "request" ? renderLock() : null}
                </span>
                <small>{dockAppLabel(appId)}</small>
              </button>
            );
          })}
        </div>
      </div>

      <DesktopDay lines={props.dayLines ?? []} />

      {ghost ? (
        <div
          ref={ghostRef}
          className="desk-ghost is-lifted"
          style={{ left: ghostPos.current.x, top: ghostPos.current.y }}
          aria-hidden="true"
        >
          <span className={glyphClass(ghost.appId)}>{renderGlyph(ghost.appId)}</span>
        </div>
      ) : null}

      {ajustesOpen ? (
        <DesktopAjustes self={props.user} onClose={() => setAjustesOpen(false)} />
      ) : null}
      {clientesOpen ? (
        <DesktopClientes
          spaces={props.spaces}
          entering={entering}
          onClose={() => setClientesOpen(false)}
          onEnter={(tenantId) => void enterClient(tenantId)}
        />
      ) : null}
      {spaceAjustesOpen ? (
        <DesktopSpaceAjustes
          spaceName={props.spaceName}
          contractedApps={props.contracted}
          onClose={() => setSpaceAjustesOpen(false)}
        />
      ) : null}
      {accountOpen ? (
        <DesktopAccount
          wallpaper={wallpaper}
          customUrl={customUrl}
          onWallpaper={persistWallpaper}
          onUseCustom={useCustomWallpaper}
          onUploadWallpaper={uploadWallpaper}
          onClearCustom={clearCustomWallpaper}
          onProfileSaved={(user) => setDisplayName(user.displayName || props.user.email)}
          onAvatarChanged={(next) => setAvatarState(next)}
          onClose={() => setAccountOpen(false)}
        />
      ) : null}

      {launch ? (
        <div
          className={`launch ${toneClass(launch.appId)}`}
          style={
            {
              "--t": `${launch.top}px`,
              "--l": `${launch.left}px`,
              "--w": `${launch.width}px`,
              "--h": `${launch.height}px`,
            } as CSSProperties
          }
          aria-hidden="true"
        >
          <div className="launch-stage">
            <div className="launch-sigil">
              <span className="launch-ring" />
              <span className="launch-ring late" />
              <span className="launch-ring live" />
              <span className="launch-badge">{renderGlyph(launch.appId)}</span>
            </div>
            <strong>{dockAppLabel(launch.appId)}</strong>
            <span className="launch-line">{dockAppBlurb(launch.appId, Boolean(props.owner))}</span>
          </div>
        </div>
      ) : null}

      <div
        className={`sheet-back${sheet ? " show" : ""}`}
        onClick={() => setSheet(null)}
      >
        {sheet ? (
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="desktop-sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
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
