"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { dockAppLabel, type MentorAppId } from "@/lib/desktop/catalog";
import { dayNoticeKey, visibleDayNotices, type DesktopDayLine } from "@/lib/desktop/day";

const SWIPE = 72;

const TONE: Record<MentorAppId, string> = {
  "growth-os": "g-growth",
  cumple: "g-cumple",
  "aprende-hoy": "g-aprende",
  rrhh: "g-rrhh",
};

function mark(appId: MentorAppId): string {
  if (appId === "rrhh") return "RH";
  return dockAppLabel(appId).trim().charAt(0).toUpperCase() || "·";
}

export function DesktopDay(props: { lines: DesktopDayLine[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [drag, setDrag] = useState<{ key: string; x: number; origin: number } | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const swiped = useRef(false);

  if (props.lines.length === 0) return null;

  function close(line: DesktopDayLine) {
    const key = dayNoticeKey(line);
    if (leaving === key) return;
    setLeaving(key);
    window.setTimeout(() => {
      setDismissed((current) => (current.includes(key) ? current : [...current, key]));
      setLeaving((current) => (current === key ? null : current));
    }, 200);
  }

  function onPointerDown(line: DesktopDayLine, event: ReactPointerEvent<HTMLLIElement>) {
    if (event.button !== 0) return;
    const target = event.target;
    if (target instanceof Element && target.closest("button")) return;
    setDrag({ key: dayNoticeKey(line), x: 0, origin: event.clientX });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(line: DesktopDayLine, event: ReactPointerEvent<HTMLLIElement>) {
    if (!drag || drag.key !== dayNoticeKey(line)) return;
    setDrag({ ...drag, x: event.clientX - drag.origin });
  }

  function onPointerUp(line: DesktopDayLine) {
    if (!drag || drag.key !== dayNoticeKey(line)) return;
    const distance = drag.x;
    if (Math.abs(distance) > 8) swiped.current = true;
    setDrag(null);
    if (Math.abs(distance) >= SWIPE) close(line);
  }

  const shown = visibleDayNotices(props.lines, dismissed);
  if (shown.length === 0) return null;

  return (
    <section className="notices" aria-label="Notificaciones">
      <ul>
        {shown.map((line) => {
          const key = dayNoticeKey(line);
          const offset = drag?.key === key ? drag.x : 0;
          const gone = leaving === key;
          return (
            <li
              key={key}
              className={gone ? "is-leaving" : undefined}
              style={offset === 0 ? undefined : { transform: `translateX(${offset}px)` }}
              onPointerDown={(event) => onPointerDown(line, event)}
              onPointerMove={(event) => onPointerMove(line, event)}
              onPointerUp={() => onPointerUp(line)}
              onPointerCancel={() => setDrag(null)}
            >
              <a
                href={line.href}
                onClick={(event) => {
                  if (!swiped.current) return;
                  event.preventDefault();
                  swiped.current = false;
                }}
              >
                <span className={`day-mark ${TONE[line.appId]}`} aria-hidden="true">
                  {mark(line.appId)}
                </span>
                <span className="day-copy">
                  <small>
                    {dockAppLabel(line.appId)}
                    <span>ahora</span>
                  </small>
                  <strong>{line.text}</strong>
                </span>
              </a>
              <button type="button" aria-label="Cerrar" onClick={() => close(line)}>
                <span aria-hidden="true">×</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
