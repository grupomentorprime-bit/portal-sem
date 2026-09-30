import type { ReactNode } from "react";

export function SupportHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-x-hidden bg-[#071a45] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(640px_420px_at_72%_40%,rgba(61,107,255,0.42),transparent_68%)]" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#6d4dff]/30 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-14 lg:py-20">
        <div className="rise max-w-3xl">
          <p className="font-cdisplay text-xs font-bold uppercase tracking-[0.2em] text-white/80">{eyebrow}</p>
          <h1 className="mt-3 font-cdisplay text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-[2.75rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">{lead}</p>
          {children ? <div className="mt-6">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function EvaluarCta({ title, text, label }: { title: string; text: string; label: string }) {
  return (
    <section className="px-6 py-10">
      <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1a237e] via-[#3a46d6] to-[#5b4bff] px-6 py-10 text-white sm:px-10 lg:flex-row lg:items-center">
        <div className="orb orb-a opacity-40" />
        <div className="relative max-w-2xl">
          <h2 className="font-cdisplay text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
          <p className="mt-3 text-base leading-7 text-white/80">{text}</p>
        </div>
        <a
          href="/evaluar"
          className="relative inline-flex shrink-0 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#1a237e] transition hover:bg-white/90"
        >
          {label} →
        </a>
      </div>
    </section>
  );
}

export const HERO_CTA_CLASS = "glow-btn inline-flex justify-center rounded-full px-6 py-3.5 text-sm font-bold text-white";