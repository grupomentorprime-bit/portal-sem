"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteDomainAddressActions({
  href,
  host,
}: {
  href: string;
  host: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyHost() {
    try {
      await navigator.clipboard.writeText(host);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary px-4 text-sm font-medium text-text-inverse transition-colors hover:bg-secondary focus-visible:outline-none"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        Abrir sitio
      </a>
      <Button type="button" variant="outline" onClick={copyHost}>
        {copied ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : (
          <Copy className="h-4 w-4" aria-hidden />
        )}
        {copied ? "Copiada" : "Copiar dirección"}
      </Button>
    </div>
  );
}
