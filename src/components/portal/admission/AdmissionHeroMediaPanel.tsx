import { InstitutionalImage } from "@/components/portal/media/InstitutionalImage";
import { ClosingMediaImage } from "@/components/portal/admission/closing/ClosingMediaImage";
import {
  heroMediaObjectPosition,
  sortVisibleHeroItems,
} from "@/lib/portal/admission-hero-utils";
import type { AdmissionHeroContent } from "@/types/admission";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { iconSizes } from "@/design";
import { cn } from "@/lib/utils";

interface AdmissionHeroMediaPanelProps {
  content: AdmissionHeroContent;
  tenant: string;
}

export async function AdmissionHeroMediaPanel({
  content,
  tenant,
}: AdmissionHeroMediaPanelProps) {
  const media = content.media;
  const editorialCard = content.editorialCard;
  const quote = content.quote;
  const cardRows = sortVisibleHeroItems(editorialCard?.rows);
  const darkening = media.darkening ?? 0;
  const blurPx = media.blur ?? 0;
  const overlayOpacity = media.overlayOpacity ?? 0.45;
  const gradientOpacity = media.gradientOpacity ?? 0.28;
  const hasMobile = Boolean(media.mobileMediaId || media.mobileImageAssetId);
  const objectPosition = heroMediaObjectPosition(media);
  const hoverElevation = content.animations?.hoverElevation !== false;
  const desktopImageClass = hasMobile
    ? "admission-hero__image admission-hero__image--desktop h-full w-full object-cover"
    : "admission-hero__image h-full w-full object-cover";

  const imageStyle = { objectPosition };

  return (
    <div
      className={cn(
        "admission-hero__media",
        hoverElevation && "admission-hero__media--elevated"
      )}
    >
      <div className="admission-hero__media-frame">
        <div
          className="admission-hero__media-visual"
          style={blurPx > 0 ? { filter: `blur(${blurPx}px)` } : undefined}
        >
          {media.type === "video" && media.videoMediaId ? (
            <ClosingMediaImage
              tenant={tenant}
              mediaId={media.videoMediaId}
              alt={media.alt ?? content.title}
              className="admission-hero__image h-full w-full object-cover"
              imageClassName="object-cover"
              objectPosition={objectPosition}
              priority
            />
          ) : media.mediaId ? (
            <>
              <ClosingMediaImage
                tenant={tenant}
                mediaId={media.mediaId}
                alt={media.alt ?? content.title}
                className={desktopImageClass}
                imageClassName="object-cover"
                objectPosition={objectPosition}
                priority
              />
              {hasMobile && media.mobileMediaId ? (
                <ClosingMediaImage
                  tenant={tenant}
                  mediaId={media.mobileMediaId}
                  alt={media.alt ?? content.title}
                  className="admission-hero__image admission-hero__image--mobile h-full w-full object-cover"
                  imageClassName="object-cover"
                  objectPosition={objectPosition}
                  priority
                />
              ) : null}
            </>
          ) : (
            <>
              <InstitutionalImage
                assetId={media.imageAssetId}
                alt={media.alt ?? content.title}
                variant="hero"
                priority
                overlay={false}
                className={
                  hasMobile ? "admission-hero__image admission-hero__image--desktop" : "admission-hero__image"
                }
                imageClassName="object-cover"
              />
              {hasMobile && media.mobileImageAssetId ? (
                <InstitutionalImage
                  assetId={media.mobileImageAssetId}
                  alt={media.alt ?? content.title}
                  variant="hero"
                  priority
                  overlay={false}
                  className="admission-hero__image admission-hero__image--mobile"
                  imageClassName="object-cover"
                />
              ) : null}
            </>
          )}
        </div>

        {darkening > 0 ? (
          <div
            className="admission-hero__media-darkening"
            style={{ opacity: darkening }}
            aria-hidden
          />
        ) : null}

        {media.overlay !== false ? (
          <div
            className="admission-hero__media-overlay admission-hero__media-overlay--brand"
            style={{ opacity: overlayOpacity }}
            aria-hidden
          />
        ) : null}

        {media.gradient !== false ? (
          <div
            className="admission-hero__media-gradient"
            style={{ opacity: gradientOpacity }}
            aria-hidden
          />
        ) : null}

        <div className="admission-hero__media-texture" aria-hidden />

        {quote?.visible && quote.text ? (
          <blockquote className="admission-hero__quote">
            <p className="admission-hero__quote-text">&ldquo;{quote.text}&rdquo;</p>
            {quote.reference ? (
              <cite className="admission-hero__quote-ref">{quote.reference}</cite>
            ) : null}
          </blockquote>
        ) : null}

        {editorialCard?.visible && editorialCard.title ? (
          <aside
            className={cn(
              "admission-hero__editorial-card",
              hoverElevation && "admission-hero__editorial-card--elevated"
            )}
          >
            <p className="admission-hero__editorial-card-title">{editorialCard.title}</p>
            {cardRows.length > 0 ? (
              <dl className="admission-hero__editorial-card-rows">
                {cardRows.map((row) => (
                  <div key={row.id} className="admission-hero__editorial-card-row">
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {editorialCard.calendarLink?.visible && editorialCard.calendarLink.href ? (
              <Link
                href={editorialCard.calendarLink.href}
                className="admission-hero__editorial-card-link"
              >
                {editorialCard.calendarLink.label}
                <ArrowRight size={iconSizes.sm} strokeWidth={2} aria-hidden />
              </Link>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
