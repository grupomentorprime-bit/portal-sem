import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HOME_HERO_PHOTO_LIMIT,
  isHomeHeroPhotograph,
  normalizeHomeHeroPhotos,
  publishedHomeHeroPhotos,
} from "../../src/lib/cms/home-hero-photos";

describe("fotografías del hero del inicio", () => {
  it("conserva solo ids de biblioteca, sin repetir, con tope", () => {
    const photos = normalizeHomeHeroPhotos([
      { mediaId: "media-1", published: true },
      { mediaId: " media-1 ", published: false },
      { mediaId: "https://example.com/a.jpg", published: true },
      { mediaId: "media-2", published: false },
      null,
      { mediaId: "media-3", published: true },
    ]);

    assert.deepEqual(photos, [
      { mediaId: "media-1", published: true },
      { mediaId: "media-2", published: false },
      { mediaId: "media-3", published: true },
    ]);
    assert.ok(photos.length <= HOME_HERO_PHOTO_LIMIT);
  });

  it("publica solo las marcadas y activas como fotografía", () => {
    assert.deepEqual(
      publishedHomeHeroPhotos([
        { mediaId: "media-1", published: true },
        { mediaId: "media-2", published: false },
        { mediaId: "media-3", published: true },
      ]).map((photo) => photo.mediaId),
      ["media-1", "media-3"]
    );

    assert.equal(
      isHomeHeroPhotograph({ category: "Imagen", mimeType: "image/jpeg", status: "active" }),
      true
    );
    assert.equal(
      isHomeHeroPhotograph({ category: "Imagen", mimeType: "image/jpeg", status: "archived" }),
      false
    );
    assert.equal(
      isHomeHeroPhotograph({ category: "SVG", mimeType: "image/svg+xml", status: "active" }),
      false
    );
  });
});
