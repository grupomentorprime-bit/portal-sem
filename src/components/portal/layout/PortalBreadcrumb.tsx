"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PortalContainer } from "./PortalContainer";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PortalBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function PortalBreadcrumb({ items }: PortalBreadcrumbProps) {
  return (
    <PortalContainer className="py-4">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1">
                {index > 0 ? (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
                ) : null}
                {item.href && !isLast ? (
                  <Link href={item.href} className="hover:text-secondary">
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? "font-medium text-foreground" : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </PortalContainer>
  );
}
