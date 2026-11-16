import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AVATAR_PRESETS,
  customAvatarUrl,
  desktopAvatarInitials,
  parseAvatarPresetId,
  resolveDesktopAvatar,
} from "../../src/lib/desktop/avatar-catalog";

describe("avatar del escritorio", () => {
  it("resuelve foto, preset e iniciales en ese orden", () => {
    assert.equal(AVATAR_PRESETS.length, 8);
    assert.equal(parseAvatarPresetId("aurora"), "aurora");
    assert.equal(parseAvatarPresetId("nope"), null);

    const photo = resolveDesktopAvatar({
      displayName: "Ana Pérez",
      email: "ana@ex.com",
      avatarPhoto: true,
      avatarPhotoUpdatedAt: "2026-11-16T00:00:00.000Z",
      avatarPresetId: "aurora",
    });
    assert.equal(photo.kind, "photo");
    if (photo.kind === "photo") {
      assert.equal(photo.url, customAvatarUrl(undefined, "2026-11-16T00:00:00.000Z"));
    }

    const preset = resolveDesktopAvatar({
      displayName: "Ana Pérez",
      email: "ana@ex.com",
      avatarPresetId: "aurora",
    });
    assert.equal(preset.kind, "preset");
    if (preset.kind === "preset") assert.equal(preset.id, "aurora");

    const initials = resolveDesktopAvatar({
      displayName: "Ana Pérez",
      email: "ana@ex.com",
      avatarPresetId: "nope",
    });
    assert.deepEqual(initials, { kind: "initials", text: "AP" });
  });

  it("usa el email para iniciales si el nombre solo tiene espacios", () => {
    assert.equal(desktopAvatarInitials("   ", "ana@ex.com"), "A");
  });
});