import Image from "next/image";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/lib/institutional/home-content";

interface InstitutionalGalleryProps {
  items: GalleryItem[];
  className?: string;
}

export function InstitutionalGallery({ items, className }: InstitutionalGalleryProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 md:grid-cols-4",
        className
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "institutional-card relative aspect-square overflow-hidden p-0 animate-scale-in",
            index === 0 && "col-span-2 row-span-2 aspect-auto min-h-[280px] md:min-h-[360px]"
          )}
        >
          <Image
            src={item.src}
            alt={item.alt}
            fill
            className="object-cover transition-transform duration-[var(--transition-slow)] hover:scale-[1.02]"
            sizes={index === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
            loading="lazy"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/80 to-transparent p-4">
            <p className="text-caption font-medium text-text-inverse">{item.alt}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
