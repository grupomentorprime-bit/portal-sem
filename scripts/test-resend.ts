import { PLATFORM_DISPLAY_NAME } from "../src/core/branding/display";
import { formatFromHeader, resolveSendingMailbox } from "../src/lib/notifications/transport";

async function main() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = formatFromHeader(
    PLATFORM_DISPLAY_NAME,
    resolveSendingMailbox({ tenantId: "", siteId: "", domains: [] })
  );
  const to = process.argv[2]?.trim() || "marco@semipn.cl";

  if (!apiKey) {
    console.error("RESEND_API_KEY missing");
    process.exit(1);
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: `Prueba de transporte — ${PLATFORM_DISPLAY_NAME}`,
    html: "<p>Prueba de envío desde scripts/test-resend.ts</p>",
  });

  console.log(JSON.stringify({ from, to, ok: !error, data, error }, null, 2));
  process.exit(error ? 1 : 0);
}

void main();
