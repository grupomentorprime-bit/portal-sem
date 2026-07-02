import Image from "next/image";
import { resolveMediaRef } from "@/core/media";
import { cn } from "@/lib/utils";

interface ClosingMediaImageProps {
  tenant: string;
  mediaId?: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  objectPosition?: string;
  priority?: boolean;
}

export async function ClosingMediaImage({
  tenant,
  mediaId,
  alt,
  className,
  imageClassName,
  objectPosition,
  priority = false,
}: ClosingMediaImageProps) {
  if (!mediaId?.trim()) return null;

  const resolved = await resolveMediaRef(tenant, { mediaId }, "w1920");
  if (!resolved) return null;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={resolved}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        className={cn("object-cover", imageClassName)}
        style={objectPosition ? { objectPosition } : undefined}
      />
    </div>
  );
}
