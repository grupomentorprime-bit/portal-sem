/**
 * Despierta core_scheduled_events vencidos (OT-GROWTH-AUTOMATION-005).
 *
 *   node --require ./scripts/_stub-server-only.cjs ./node_modules/tsx/dist/cli.mjs --env-file=.env scripts/flush-scheduled-events.ts
 */
import { flushScheduledEventsDetailed } from "../src/core/events/publisher";

async function main() {
  const result = await flushScheduledEventsDetailed({ limit: 50 });
  console.log(
    JSON.stringify(
      {
        ok: true,
        published: result.published,
        failed: result.failed,
        errors: result.errors,
      },
      null,
      2
    )
  );
  if (result.failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
