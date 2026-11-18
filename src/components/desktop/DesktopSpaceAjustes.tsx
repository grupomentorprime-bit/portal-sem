"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DesktopSpacePresence } from "@/components/desktop/DesktopSpacePresence";
import { DesktopSpaceProfiles } from "@/components/desktop/DesktopSpaceProfiles";
import { DesktopSpaceTeam } from "@/components/desktop/DesktopSpaceTeam";
import type { MentorAppId } from "@/lib/desktop/catalog";
import {
  filterSpaceSettingGroups,
  type SpacePanelId,
  type SpacePresencePanelId,
  type SpaceSettingGroup,
  type SpaceSettingItem,
} from "@/lib/desktop/space-settings";

const COMMON = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  "aria-hidden": true as const,
};

function SpaceMark({ name }: { name: string }) {
  if (name === "empresa") {
    return (
      <svg {...COMMON}>
        <path d="M4 19.5h16" />
        <path d="M6.5 19.5V8.8l5-3.3 5 3.3V19.5" strokeLinejoin="round" />
        <path d="M10 19.5v-4.2h3.2V19.5" />
        <path d="M9.2 11.2h1.2M12.8 11.2h1.2M9.2 14h1.2M12.8 14h1.2" />
      </svg>
    );
  }
  if (name === "sitio") {
    return (
      <svg {...COMMON}>
        <circle cx="12" cy="12" r="8" />
        <path d="M4 12h16M12 4c2.2 2.4 3.3 5.1 3.3 8s-1.1 5.6-3.3 8c-2.2-2.4-3.3-5.1-3.3-8s1.1-5.6 3.3-8z" />
      </svg>
    );
  }
  if (name === "marca") {
    return (
      <svg {...COMMON}>
        <path d="M12 3.4l1.3 4.2 4.3.2-3.4 2.7 1.2 4.2L12 12.2 8.6 14.7l1.2-4.2L6.4 7.8l4.3-.2L12 3.4z" strokeLinejoin="round" />
        <path d="M6 19.2h12" />
      </svg>
    );
  }
  if (name === "equipo") {
    return (
      <svg {...COMMON}>
        <circle cx="9" cy="9" r="3" />
        <circle cx="16" cy="10" r="2.3" />
        <path d="M4 19c.6-2.6 2.6-4 5-4s4.4 1.4 5 4" />
        <path d="M14.2 15.2c1.1-.4 2.3-.5 3.4-.1 1.1.7 1.7 1.8 1.9 3.4" />
      </svg>
    );
  }
  if (name === "roles") {
    return (
      <svg {...COMMON}>
        <circle cx="9" cy="12" r="3.2" />
        <path d="M12.2 12H20" />
        <path d="M17 12v2.4M19.4 12v1.6" />
      </svg>
    );
  }
  if (name === "canales") {
    return (
      <svg {...COMMON}>
        <path d="M5 7.5h10.5A2.5 2.5 0 0 1 18 10v4.2a2.5 2.5 0 0 1-2.5 2.5H11l-3.2 2.6v-2.6H7.2A2.2 2.2 0 0 1 5 14.5V7.5z" strokeLinejoin="round" />
        <path d="M8 11h6" />
      </svg>
    );
  }
  return (
    <svg {...COMMON}>
      <path d="M9 8.5 7.2 6.7a2.2 2.2 0 0 0-3.1 3.1L6.4 12" strokeLinejoin="round" />
      <path d="M15 15.5l1.8 1.8a2.2 2.2 0 0 0 3.1-3.1L17.6 12" strokeLinejoin="round" />
      <path d="M8.5 13.2l5-5" />
    </svg>
  );
}

function Chevron(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function firstPanel(groups: SpaceSettingGroup[]): SpacePanelId | null {
  for (const group of groups) {
    for (const item of group.items) {
      if (item.kind === "panel") return item.panel;
    }
  }
  return null;
}

function panelCopy(panel: SpacePanelId | null): { title: string; lead: string } {
  if (panel === "empresa") {
    return {
      title: "Mi empresa",
      lead: "Información general de este Espacio.",
    };
  }
  if (panel === "marca") {
    return {
      title: "Marca",
      lead: "Identidad visual de la organización.",
    };
  }
  if (panel === "sitio") {
    return {
      title: "Sitio web",
      lead: "Presencia pública, cuando el plan la incluye.",
    };
  }
  if (panel === "equipo") {
    return {
      title: "Equipo",
      lead: "Personas, invitaciones y llaves de este Espacio.",
    };
  }
  if (panel === "roles") {
    return {
      title: "Perfiles",
      lead: "Perfiles de la empresa. El plan y los permisos internos de cada aplicación no se editan aquí.",
    };
  }
  if (panel === "canales") {
    return {
      title: "Canales",
      lead: "Contactos y redes con los que se atiende en este Espacio.",
    };
  }
  return {
    title: "Ajustes",
    lead: "Solo de este cliente. Las cuentas del administrador de la plataforma no están aquí.",
  };
}

function NavItem({
  item,
  active,
  onOpenPanel,
}: {
  item: SpaceSettingItem;
  active: boolean;
  onOpenPanel: (panel: SpacePanelId) => void;
}) {
  const body = (
    <>
      <span className={`space-mark ${item.tone}`}>
        <SpaceMark name={item.mark} />
      </span>
      <span className="space-copy">
        <strong>{item.label}</strong>
        <span>{item.text}</span>
      </span>
      {item.kind === "link" ? (
        <span className="space-go">
          <Chevron />
        </span>
      ) : null}
    </>
  );

  if (item.kind === "panel") {
    return (
      <button
        type="button"
        className={`space-row${active ? " is-on" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => onOpenPanel(item.panel)}
      >
        {body}
      </button>
    );
  }

  return (
    <a href={item.href} className="space-row">
      {body}
    </a>
  );
}

export function DesktopSpaceAjustes({
  spaceName,
  contractedApps,
  onClose,
}: {
  spaceName: string;
  contractedApps: readonly MentorAppId[];
  onClose: () => void;
}) {
  const [groups, setGroups] = useState<SpaceSettingGroup[] | null>(null);
  const [error, setError] = useState("");
  const [panel, setPanel] = useState<SpacePanelId | null>(null);
  const [sectionDirty, setSectionDirty] = useState(false);
  const [canConnectChannels, setCanConnectChannels] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const presencePanel =
    panel === "empresa" || panel === "marca" || panel === "sitio" || panel === "canales"
      ? (panel as SpacePresencePanelId)
      : null;
  const heading = panelCopy(panel);

  const requestClose = useCallback(() => {
    if (sectionDirty) {
      const leave = window.confirm(
        "Hay cambios sin guardar. ¿Salir y descartarlos?"
      );
      if (!leave) return;
    }
    onClose();
  }, [onClose, sectionDirty]);

  const selectPanel = useCallback(
    (next: SpacePanelId) => {
      if (next === panel) return;
      if (sectionDirty) {
        const leave = window.confirm(
          "Hay cambios sin guardar. ¿Cambiar de sección y descartarlos?"
        );
        if (!leave) return;
      }
      setSectionDirty(false);
      setPanel(next);
    },
    [panel, sectionDirty]
  );

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLElement>(".ajustes-head .ghost")?.focus();
    return () => opener?.focus();
  }, []);

  useEffect(() => {
    function focusable(): HTMLElement[] {
      const node = dialogRef.current;
      if (!node) return [];
      return [...node.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea")].filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1 && !el.closest("[hidden]")
      );
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && dialogRef.current?.contains(active);
      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const response = await fetch("/api/identity/me").catch(() => null);
        const body = (await response?.json().catch(() => null)) as {
          ok?: boolean;
          permissions?: string[];
          error?: string;
        } | null;
        if (cancelled) return;
        if (!response?.ok || !body?.ok) {
          setError(body?.error || "No se pudieron cargar los ajustes.");
          setGroups([]);
          return;
        }
        setError("");
        setCanConnectChannels((body.permissions ?? []).includes("settings.integrations"));
        const nextGroups = filterSpaceSettingGroups(
          body.permissions ?? [],
          undefined,
          contractedApps
        );
        setGroups(nextGroups);
        setPanel((current) => current ?? firstPanel(nextGroups));
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [contractedApps]);

  const hasPanels = useMemo(
    () => Boolean(groups?.some((group) => group.items.some((item) => item.kind === "panel"))),
    [groups]
  );

  return (
    <div className="ajustes-back" onClick={requestClose}>
      <div
        ref={dialogRef}
        className="ajustes-window is-space is-settings-surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby="space-ajustes-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ajustes-head">
          <div>
            <p className="kicker">{spaceName}</p>
            <h2 id="space-ajustes-title">{heading.title}</h2>
            <p>{heading.lead}</p>
          </div>
          <button type="button" className="ghost" onClick={requestClose}>
            Cerrar
          </button>
        </header>

        {groups === null ? <p className="ajustes-wait">Cargando ajustes…</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        {groups && groups.length === 0 && !error ? (
          <p className="ajustes-wait">
            En este Espacio no tienes ajustes de empresa. Tu cuenta y preferencias están en tu
            nombre.
          </p>
        ) : null}

        {groups && groups.length > 0 ? (
          <div className={`settings-surface${hasPanels ? "" : " is-links-only"}`}>
            <nav className="settings-nav" aria-label="Secciones de ajustes">
              {groups.map((group) => (
                <section key={group.title} aria-label={group.title}>
                  <h3>{group.title}</h3>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <NavItem
                          item={item}
                          active={item.kind === "panel" && item.panel === panel}
                          onOpenPanel={selectPanel}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </nav>

            <div className="settings-main">
              {presencePanel ? (
                <DesktopSpacePresence
                  panel={presencePanel}
                  onDirtyChange={setSectionDirty}
                  growthOs={contractedApps.includes("growth-os")}
                  canConnectChannels={canConnectChannels}
                />
              ) : null}
              {panel === "equipo" ? (
                <DesktopSpaceTeam
                  contractedApps={contractedApps}
                  onDirtyChange={setSectionDirty}
                />
              ) : null}
              {panel === "roles" ? (
                <DesktopSpaceProfiles onDirtyChange={setSectionDirty} />
              ) : null}
              {!panel ? (
                <p className="ajustes-wait">
                  Elige una sección a la izquierda para consultar o editar.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
