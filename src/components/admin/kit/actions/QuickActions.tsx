import { ContentGrid } from "@/components/admin/kit/layout/ContentGrid";
import {
  SummaryCard,
  type SummaryCardPriority,
} from "@/components/admin/kit/dashboard/SummaryCard";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface QuickActionItem {
  id: string;
  title: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  priority?: SummaryCardPriority;
}

export interface QuickActionsProps {
  items: QuickActionItem[];
  cols?: 2 | 3 | 4;
  className?: string;
  /** Fila desplazable horizontalmente en móvil */
  scrollOnMobile?: boolean;
  /** Prioridad por defecto si el ítem no la define */
  defaultPriority?: SummaryCardPriority;
}

/** Grid de accesos rápidos en hubs. */
export function QuickActions({
  items,
  cols = 3,
  className,
  scrollOnMobile = false,
  defaultPriority = "secondary",
}: QuickActionsProps) {
  const grid = (
    <ContentGrid cols={cols} className={scrollOnMobile ? "min-w-[640px] sm:min-w-0" : undefined}>
      {items.map((item) => (
        <SummaryCard
          key={item.id}
          title={item.title}
          description={item.description}
          href={item.href}
          onClick={item.onClick}
          icon={item.icon}
          priority={item.priority ?? defaultPriority}
        />
      ))}
    </ContentGrid>
  );

  if (scrollOnMobile) {
    return (
      <div className={cn("-mx-1 overflow-x-auto px-1 pb-1 md:overflow-visible", className)}>
        {grid}
      </div>
    );
  }

  return <div className={className}>{grid}</div>;
}
