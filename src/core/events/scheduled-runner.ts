/**
 * OT-GROWTH-AUTOMATION-005 — despertador mínimo de core_scheduled_events.
 * No es un segundo scheduler: solo invoca flushScheduledEvents() periódicamente
 * o bajo demanda (API / script). Persistencia = Mongo; sobrevive reinicios.
 */

import "server-only";

let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

function resolvePollMs(): number {
  const raw = process.env.SCHEDULED_EVENTS_POLL_MS;
  if (!raw) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1000) return 0;
  return Math.min(n, 3_600_000);
}

/**
 * Arranca el poll in-process si SCHEDULED_EVENTS_POLL_MS ≥ 1000.
 * Seguro llamar múltiples veces. Sin env = solo API/script despiertan.
 */
export function ensureScheduledEventsRunner(): void {
  if (started) return;
  started = true;

  const ms = resolvePollMs();
  if (!ms) return;

  timer = setInterval(() => {
    void (async () => {
      try {
        const { flushScheduledEventsDetailed } = await import(
          "@/core/events/publisher"
        );
        await flushScheduledEventsDetailed({ limit: 20 });
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[scheduled-events] flush error", message);
        }
      }
    })();
  }, ms);

  if (process.env.NODE_ENV === "development") {
    console.info(
      `[scheduled-events] runner activo cada ${ms}ms (flushScheduledEvents)`
    );
  }
}

/** Solo tests. */
export function stopScheduledEventsRunnerForTests(): void {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
}

export function isScheduledEventsRunnerActiveForTests(): boolean {
  return timer != null;
}
