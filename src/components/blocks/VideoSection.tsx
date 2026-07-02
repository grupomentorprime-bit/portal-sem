/**
 * @deprecated
 *
 * Reemplazado por:
 * GenericContentBlockSection
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import Image from "next/image";
import { Container, Section, Stack } from "@/components/layout";
import { SectionTitle } from "@/components/institutional";
import { asString } from "@/lib/cms/block-utils";

interface VideoSectionProps {
  settings: Record<string, unknown>;
}

export function VideoSection({ settings }: VideoSectionProps) {
  const videoUrl = asString(settings.videoUrl);
  const poster = asString(settings.poster);
  const title = asString(settings.title);
  const description = asString(settings.description);

  if (!videoUrl) return null;

  const isEmbed =
    videoUrl.includes("youtube.com") ||
    videoUrl.includes("youtu.be") ||
    videoUrl.includes("vimeo.com");

  return (
    <Section padding="lg">
      <Container size="md">
        <Stack gap={8}>
          {(title || description) && (
            <SectionTitle
              title={title || "Video"}
              description={description || undefined}
              align="center"
              className="mx-auto"
            />
          )}
          <div className="institutional-card relative aspect-video overflow-hidden">
            {isEmbed ? (
              <iframe
                src={videoUrl}
                title={title || "Video institucional"}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : poster ? (
              <Image src={poster} alt="" fill className="object-cover" />
            ) : (
              <video src={videoUrl} controls className="h-full w-full" />
            )}
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
