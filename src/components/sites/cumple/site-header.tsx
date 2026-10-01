"use client";

import { useEffect, useState } from "react";
import { menus, type CardItem, type MenuEntry } from "@/sites/cumple/content";
import { Icon } from "@/components/sites/cumple/icons";
import { Logo } from "@/components/sites/cumple/logo";
import { ThemeToggle } from "@/components/sites/cumple/theme-toggle";

const tones: Record<CardItem["tone"], string> = {
  ink: "bg-[#e8efff] text-[#2f5bff]",
  sand: "bg-[#efe9ff] text-[#6a45f5]",
  hot: "bg-[#e5f8ff] text-[#0c86c9]",
};

function canHover() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function panelItems(menu: MenuEntry): readonly CardItem[] | null {
  return "items" in menu ? menu.items : null;
}

function MenuCards({ items }: { items: readonly CardItem[] }) {
  const columns = items.length > 4 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";

  return (
    <div className={`grid gap-3 ${columns}`}>
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="flex gap-3 rounded-2xl border border-cline bg-ccard p-4 transition hover:border-caccent/40 hover:bg-csand"
        >
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tones[item.tone]}`}>
            <Icon name={item.icon} />
          </span>
          <span>
            <span className="block font-cdisplay text-sm font-bold text-cink">{item.title}</span>
            <span className="mt-1 block text-sm leading-5 text-cmuted">{item.description}</span>
          </span>
        </a>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const active = menus.find((menu) => menu.id === open);
  const activeItems = active ? panelItems(active) : null;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(null);
        setMobileOpen(false);
      }
    }

    function onPointer(event: PointerEvent) {
      if (canHover()) return;
      const header = document.querySelector("header");
      if (header && !header.contains(event.target as Node)) setOpen(null);
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  function closeAll() {
    setOpen(null);
    setMobileOpen(false);
    setMobileSection(null);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-cline bg-cpaper/90 text-cink backdrop-blur-xl">
      <div
        className="relative mx-auto max-w-6xl px-6"
        onMouseLeave={() => {
          if (canHover()) setOpen(null);
        }}
      >
        <div className="flex h-16 items-center justify-between gap-3 sm:h-[4.25rem]">
          <Logo onClick={closeAll} />

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Principal">
            {menus.map((menu) => {
              const items = panelItems(menu);
              if (!items && "href" in menu) {
                return (
                  <a
                    key={menu.id}
                    href={menu.href}
                    className="rounded-full px-3 py-2 text-sm font-semibold text-cmuted hover:bg-csand hover:text-cink"
                    onMouseEnter={() => {
                      if (canHover()) setOpen(null);
                    }}
                  >
                    {menu.label}
                  </a>
                );
              }
              const isOpen = open === menu.id;
              return (
                <button
                  key={menu.id}
                  type="button"
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                    isOpen ? "bg-csand text-cink" : "text-cmuted hover:bg-csand hover:text-cink"
                  }`}
                  aria-expanded={isOpen}
                  aria-controls={`panel-${menu.id}`}
                  onMouseEnter={() => {
                    if (canHover()) setOpen(menu.id);
                  }}
                  onClick={(event) => {
                    if (canHover() && event.detail > 0) return;
                    setOpen((current) => (current === menu.id ? null : menu.id));
                  }}
                >
                  {menu.label}
                  <Icon
                    name="chevron"
                    className={`size-4 transition ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <a
              href="/evaluar"
              className="glow-btn hidden rounded-full px-4 py-2 text-sm font-bold leading-none text-white transition sm:inline-flex sm:items-center"
            >
              Evaluar mi empresa →
            </a>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-cline text-cink lg:hidden"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => {
                setOpen(null);
                setMobileOpen((value) => !value);
              }}
            >
              <Icon name={mobileOpen ? "x" : "menu"} />
            </button>
          </div>
        </div>

        {active && activeItems ? (
          <div
            id={`panel-${active.id}`}
            className="absolute inset-x-0 top-full z-50 hidden px-6 pt-3 lg:block"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setOpen(null);
            }}
          >
            <div className="rounded-3xl border border-cline bg-ccard p-3 shadow-[0_28px_70px_-28px_rgba(20,40,120,0.45)]">
              <MenuCards items={activeItems} />
            </div>
          </div>
        ) : null}
      </div>

      {mobileOpen ? (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-cline bg-cpaper lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Móvil">
            {menus.map((menu) => {
              const items = panelItems(menu);
              if (!items && "href" in menu) {
                return (
                  <a
                    key={menu.id}
                    href={menu.href}
                    className="rounded-2xl px-3 py-3 text-sm font-semibold text-cink"
                    onClick={closeAll}
                  >
                    {menu.label}
                  </a>
                );
              }
              const isOpen = mobileSection === menu.id;
              return (
                <div key={menu.id} className="rounded-2xl">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-semibold text-cink"
                    aria-expanded={isOpen}
                    onClick={() => setMobileSection(isOpen ? null : menu.id)}
                  >
                    {menu.label}
                    <Icon name="chevron" className={`size-4 transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && items ? (
                    <div className="px-1 pb-2" onClick={closeAll}>
                      <MenuCards items={items} />
                    </div>
                  ) : null}
                </div>
              );
            })}
            <a
              href="/evaluar"
              className="glow-btn mt-2 rounded-full px-4 py-3 text-center text-sm font-bold text-white"
              onClick={closeAll}
            >
              Evaluar mi empresa →
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
