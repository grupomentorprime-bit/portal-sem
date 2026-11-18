import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import sharp from "sharp";
import {
  WALLPAPER_SIZE_HINT,
  wallpaperDimensionError,
  wallpaperFileError,
  wallpaperLoadedText,
} from "../../src/lib/desktop/wallpaper-upload";

require("../../scripts/_stub-server-only.cjs");

describe("fondo propio del escritorio", () => {
  it("indica la medida recomendada y la medida real al cargar", () => {
    assert.match(WALLPAPER_SIZE_HINT, /1920 × 1080 px/);
    assert.notEqual(wallpaperFileError({ type: "image/gif", size: 100 }), null);
    assert.match(wallpaperFileError({ type: "image/gif", size: 100 }) ?? "", /1920 × 1080/);
    assert.equal(wallpaperFileError({ type: "image/jpeg", size: 100 }), null);
    assert.match(
      wallpaperDimensionError(400, 300) ?? "",
      /400 × 300 px/
    );
    assert.match(wallpaperDimensionError(400, 300) ?? "", /1920 × 1080 px/);
    assert.equal(wallpaperDimensionError(1920, 1080), null);
    assert.equal(
      wallpaperLoadedText({ width: 2400, height: 1600 }),
      "Tu imagen mide 2400 × 1600 px. Lo recomendado es 1920 × 1080 px."
    );
    assert.match(
      wallpaperLoadedText({
        width: 4000,
        height: 3000,
        savedWidth: 2560,
        savedHeight: 1920,
      }),
      /4000 × 3000 px/
    );

    const account = readFileSync(
      resolve(process.cwd(), "src/components/desktop/DesktopAccount.tsx"),
      "utf8"
    );
    assert.match(account, /WALLPAPER_SIZE_HINT/);
    assert.match(account, /wallpaperLoadedText/);
    assert.match(account, /Agregar mi fondo/);
    const route = readFileSync(
      resolve(process.cwd(), "src/app/api/desktop/wallpaper/route.ts"),
      "utf8"
    );
    assert.match(route, /parseWallpaper/);
    assert.match(route, /multipart\/form-data/);
  });

  it("guarda la imagen propia y rechaza una demasiado chica", async () => {
    const { storeCustomWallpaper, readCustomWallpaper, deleteCustomWallpaper, WallpaperUploadError } =
      await import("../../src/lib/desktop/wallpaper-file");
    const userId = "wallpaper-upload-test-user";
    await deleteCustomWallpaper(userId);

    const big = await sharp({
      create: { width: 2000, height: 1200, channels: 3, background: "#224466" },
    })
      .jpeg()
      .toBuffer();
    const saved = await storeCustomWallpaper(userId, big, "image/jpeg");
    assert.equal(saved.width, 2000);
    assert.equal(saved.height, 1200);
    assert.ok(saved.savedWidth <= 2560);
    assert.ok(saved.savedHeight <= 2560);
    const stored = await readCustomWallpaper(userId);
    assert.ok(stored && stored.length > 0);

    const tiny = await sharp({
      create: { width: 320, height: 200, channels: 3, background: "#224466" },
    })
      .jpeg()
      .toBuffer();
    await assert.rejects(
      () => storeCustomWallpaper(userId, tiny, "image/jpeg"),
      (error: unknown) => {
        assert.ok(error instanceof WallpaperUploadError);
        assert.match(error.message, /320 × 200 px/);
        assert.match(error.message, /1920 × 1080 px/);
        return true;
      }
    );

    await deleteCustomWallpaper(userId);
    assert.equal(await readCustomWallpaper(userId), null);
  });
});
