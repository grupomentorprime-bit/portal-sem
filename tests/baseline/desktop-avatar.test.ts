import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import sharp from "sharp";
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

  it("valida tipo, peso y medida mínima de la foto", () => {
    const {
      AVATAR_SIZE_HINT,
      avatarFileError,
      avatarDimensionError,
    } = require("../../src/lib/desktop/avatar-upload");

    assert.match(AVATAR_SIZE_HINT, /2 MB/);
    assert.notEqual(avatarFileError({ type: "image/gif", size: 100 }), null);
    assert.equal(avatarFileError({ type: "image/jpeg", size: 100 }), null);
    assert.match(avatarDimensionError(64, 64) ?? "", /64 × 64/);
    assert.equal(avatarDimensionError(256, 256), null);
  });

  it("guarda foto cuadrada webp y rechaza una demasiado chica", async () => {
    require("../../scripts/_stub-server-only.cjs");
    const {
      storeAvatarPhoto,
      readAvatarPhoto,
      deleteAvatarPhoto,
      AvatarUploadError,
    } = await import("../../src/lib/desktop/avatar-file");

    const userId = "avatar-upload-test-user";
    await deleteAvatarPhoto(userId);

    const ok = await sharp({
      create: { width: 400, height: 300, channels: 3, background: "#224466" },
    })
      .jpeg()
      .toBuffer();
    const saved = await storeAvatarPhoto(userId, ok, "image/jpeg");
    assert.equal(saved.savedWidth, 300);
    assert.equal(saved.savedHeight, 300);
    assert.ok(saved.savedWidth <= 512);
    assert.ok(await readAvatarPhoto(userId));

    const tiny = await sharp({
      create: { width: 80, height: 80, channels: 3, background: "#224466" },
    })
      .jpeg()
      .toBuffer();
    await assert.rejects(
      () => storeAvatarPhoto(userId, tiny, "image/jpeg"),
      (e: unknown) => e instanceof AvatarUploadError
    );

    await deleteAvatarPhoto(userId);
  });

  it("define rutas para preset, foto y lectura del avatar", () => {
    const route = readFileSync(
      resolve(process.cwd(), "src/app/api/desktop/avatar/route.ts"),
      "utf8"
    );
    assert.match(route, /parseAvatarPresetId/);
    assert.match(route, /multipart\/form-data/);
    assert.match(route, /clear/);

    const fileRoute = readFileSync(
      resolve(process.cwd(), "src/app/api/desktop/avatar/file/route.ts"),
      "utf8"
    );
    assert.match(fileRoute, /readAvatarPhoto/);
    assert.match(fileRoute, /userId/);
    assert.match(fileRoute, /listMembershipsByUser/);
  });

  it("expone la UI de avatar en Mi cuenta", () => {
    const account = readFileSync(
      resolve(process.cwd(), "src/components/desktop/DesktopAccount.tsx"),
      "utf8"
    );
    assert.match(account, /Subir foto/);
    assert.match(account, /Usar iniciales/);
    assert.doesNotMatch(account, /aún no está disponible/);
  });
});
