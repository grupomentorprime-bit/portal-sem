"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { MEDIA_TAG_SUGGESTIONS } from "@/lib/cms/media-hero";
import { cn } from "@/lib/utils";

interface MediaTagsEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  id?: string;
}

export function MediaTagsEditor({ tags, onChange, id = "media-tags" }: MediaTagsEditorProps) {
  const [input, setInput] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || tags.includes(tag)) {
      setInput("");
      return;
    }
    onChange([...tags, tag]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-medium text-foreground">
        Etiquetas
      </label>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-xs text-foreground"
          >
            {tag}
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
              aria-label={`Quitar etiqueta ${tag}`}
              onClick={() => removeTag(tag)}
            >
              <X size={12} aria-hidden />
            </button>
          </span>
        ))}
      </div>
      <input
        id={id}
        list={`${id}-suggestions`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(input);
          }
        }}
        onBlur={() => {
          if (input.trim()) addTag(input);
        }}
        placeholder="Escriba y Enter…"
        className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
      />
      <datalist id={`${id}-suggestions`}>
        {MEDIA_TAG_SUGGESTIONS.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
      <div className="flex flex-wrap gap-1">
        {MEDIA_TAG_SUGGESTIONS.filter((s) => !tags.includes(s))
          .slice(0, 6)
          .map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className={cn(
                "rounded border border-border px-2 py-0.5 text-[10px] text-muted",
                "hover:border-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
              )}
              onClick={() => addTag(suggestion)}
            >
              + {suggestion}
            </button>
          ))}
      </div>
    </div>
  );
}
