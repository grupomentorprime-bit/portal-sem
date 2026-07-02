"use client";

import { ArrowUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";

interface BackToTopProps {
  label: string;
}

export function BackToTop({ label }: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!label) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={label}
      className={cn(
        "portal-footer-premium__back-to-top",
        visible && "portal-footer-premium__back-to-top--visible",
        focusRing
      )}
    >
      <ArrowUp size={iconSizes.md} strokeWidth={2} aria-hidden />
      <span className="sr-only">{label}</span>
    </button>
  );
}
