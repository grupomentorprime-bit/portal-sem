"use client";

import { Link2, Share2 } from "lucide-react";
import { useCallback, useState } from "react";
import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";

interface ShareBarProps {
  title: string;
  url?: string;
  className?: string;
}

export function ShareBar({ title, url, className }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [shareUrl, title]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-caption text-muted">Compartir</span>
      <button
        type="button"
        onClick={handleShare}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-caption font-medium text-foreground transition-colors hover:bg-background-soft",
          focusRing
        )}
      >
        {copied ? (
          <>
            <Link2 size={iconSizes.sm} strokeWidth={2} />
            Enlace copiado
          </>
        ) : (
          <>
            <Share2 size={iconSizes.sm} strokeWidth={2} />
            Compartir
          </>
        )}
      </button>
    </div>
  );
}
