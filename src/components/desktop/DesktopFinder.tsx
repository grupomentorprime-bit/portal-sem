"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { DockAppId } from "@/lib/desktop/catalog";
import { desktopSearch, type DesktopSearchHit } from "@/lib/desktop/search";

const TONE: Record<DockAppId, string> = {
  "growth-os": "g-growth",
  cumple: "g-cumple",
  "aprende-hoy": "g-aprende",
  rrhh: "g-rrhh",
  ajustes: "g-ajustes",
  mensajes: "g-mensajes",
  envivo: "g-envivo",
  clientes: "g-clientes",
};

function mark(title: string): string {
  if (title === "RR.HH.") return "RH";
  const letter = title.trim().charAt(0).toUpperCase();
  return letter || "·";
}

export function DesktopFinder(props: {
  owner: boolean;
  spaces: { tenantId: string; name: string }[];
  companySettings?: boolean;
  onOpenApp: (appId: DockAppId) => void;
  onOpenSpace: (tenantId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hits = useMemo(
    () =>
      desktopSearch({
        query,
        owner: props.owner,
        spaces: props.spaces,
        companySettings: props.companySettings,
      }),
    [query, props.owner, props.spaces, props.companySettings]
  );
  const active = hits.length === 0 ? 0 : Math.min(index, hits.length - 1);

  function writeQuery(value: string) {
    setQuery(value);
    setIndex(0);
  }

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target !== inputRef.current &&
        (target.isContentEditable || target.matches("input, textarea, select"))
      ) {
        return;
      }
      event.preventDefault();
      setOpen(true);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function choose(hit: DesktopSearchHit) {
    setOpen(false);
    setQuery("");
    if (hit.kind === "app") props.onOpenApp(hit.id);
    else props.onOpenSpace(hit.id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      event.currentTarget.blur();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      if (hits.length === 0) return;
      setIndex((current) => (Math.min(current, hits.length - 1) + 1) % hits.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (hits.length === 0) return;
      setIndex((current) => (Math.min(current, hits.length - 1) - 1 + hits.length) % hits.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[active];
      if (hit) choose(hit);
    }
  }

  let cursor = 0;

  return (
    <div
      className="finder"
      ref={rootRef}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && rootRef.current?.contains(next)) return;
        setOpen(false);
      }}
    >
      <label className="finder-field">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="11" cy="11" r="6" />
          <path d="M16 16l4 4" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="desktop-finder-list"
          aria-activedescendant={open && hits[active] ? `desktop-finder-${active}` : undefined}
          aria-label="Buscar aplicaciones y organizaciones"
          placeholder="Buscar"
          value={query}
          onChange={(event) => {
            writeQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </label>
      {open ? (
        <div className="finder-panel" id="desktop-finder-list" role="listbox" aria-label="Resultados">
          {hits.length === 0 ? (
            <p className="finder-empty">Nada coincide.</p>
          ) : (
            (["app", "space"] as const).map((kind) => {
              const group = hits.filter((hit) => hit.kind === kind);
              if (group.length === 0) return null;
              return (
                <section key={kind}>
                  <p>{kind === "app" ? "Aplicaciones" : "Organizaciones"}</p>
                  <ul>
                    {group.map((hit) => {
                      const position = cursor;
                      cursor += 1;
                      const selected = position === active;
                      return (
                        <li key={`${hit.kind}-${hit.id}`}>
                          <button
                            type="button"
                            id={`desktop-finder-${position}`}
                            role="option"
                            aria-selected={selected}
                            className={selected ? "is-active" : undefined}
                            onMouseEnter={() => setIndex(position)}
                            onClick={() => choose(hit)}
                          >
                            <span
                              className={
                                hit.kind === "app"
                                  ? `finder-mark ${TONE[hit.id]}`
                                  : "finder-mark finder-space"
                              }
                              aria-hidden="true"
                            >
                              {mark(hit.title)}
                            </span>
                            <span className="finder-copy">
                              <strong>{hit.title}</strong>
                              <small>{hit.detail}</small>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
