"use client";

import { Info } from "lucide-react";
import { getPickerContextHint } from "@/lib/cms/media-folder-hints";

interface MediaContextBannerProps {
  pickerContext?: string;
  defaultFolder?: string;
}

export function MediaContextBanner({ pickerContext, defaultFolder }: MediaContextBannerProps) {
  const hint = getPickerContextHint(pickerContext, defaultFolder);
  if (!hint) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3 text-sm"
      role="note"
    >
      <Info size={18} className="mt-0.5 shrink-0 text-secondary" aria-hidden />
      <div>
        <p className="font-medium text-foreground">{hint.label}</p>
        <p className="text-muted">{hint.detail}</p>
      </div>
    </div>
  );
}
