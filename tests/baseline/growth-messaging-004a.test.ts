/**
 * OT-GROWTH-MESSAGING-004A — refinamiento visual bandeja.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("OT-GROWTH-MESSAGING-004A — superficie", () => {
  it("marca selección, canal con icono y compositor asociado", () => {
    const ui = readSrc("src/components/admin/growth/MensajesInboxClient.tsx");
    assert.match(ui, /before:w-\[3px\].*before:bg-\[var\(--color-primary\)\]/);
    assert.match(ui, /WhatsAppMark|ChannelBadge/);
    assert.match(ui, /data-mensajes-composer/);
    assert.match(ui, /canSend/);
    assert.match(ui, /justify-end/);
    assert.match(ui, /max-md:hidden|compactMobileChat/);
    assert.doesNotMatch(ui, /unreadCount|escribiendo|doble check|online/i);
  });

  it("proyecta channel en la vista sin tocar el motor de mensajes", () => {
    const view = readSrc("src/lib/growth/mensajes-view.ts");
    assert.match(view, /channel: GrowthConversationChannel/);
    const read = readSrc("src/lib/growth/mensajes-read.ts");
    assert.match(read, /channel: conversation\.channel/);
    const inbound = readSrc(
      "src/core/growth/messaging/record-inbound-message.ts"
    );
    assert.doesNotMatch(inbound, /MensajesInbox|004A/);
  });

  it("entrega evidencia visual sin declarar APTO", () => {
    assert.equal(
      existsSync(
        resolve(
          process.cwd(),
          "docs/validation/OT-GROWTH-MESSAGING-004A/README.md"
        )
      ),
      true
    );
    const readme = readSrc("docs/validation/OT-GROWTH-MESSAGING-004A/README.md");
    assert.match(readme, /No declarar APTO VISUAL/);
    assert.match(readme, /admin-mensajes-desktop\.png/);
    assert.match(readme, /admin-mensajes-desktop-composer\.png/);
    assert.match(readme, /admin-mensajes-mobile-list\.png/);
    assert.match(readme, /admin-mensajes-mobile-chat\.png/);
  });
});
