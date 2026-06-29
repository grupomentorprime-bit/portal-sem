import type { DispatchResult } from "@/types/events";

export function logDispatchMetrics(result: DispatchResult, eventType: string): void {
  if (process.env.NODE_ENV !== "development") return;
  console.info(
    `[events] ${eventType} → ${result.handlersExecuted.length} handlers in ${result.processingMs}ms` +
      (result.failedHandlers.length ? ` (failed: ${result.failedHandlers.join(", ")})` : "")
  );
}
