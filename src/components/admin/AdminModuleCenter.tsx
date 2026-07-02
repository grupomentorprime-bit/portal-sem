import type { LucideIcon } from "lucide-react";
import type { AdminPanelMeta } from "@/lib/admin/module-panels";
import { cn } from "@/lib/utils";

export type AdminModuleStatTone = "total" | "active" | "published" | "neutral";

export interface AdminModuleStatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: AdminModuleStatTone;
}

export function AdminModuleCenter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("admin-module-center", className)}>{children}</div>;
}

export function AdminModuleHero({ eyebrow, heroTitle, heroDescription }: AdminPanelMeta) {
  return (
    <div className="admin-module-center__hero">
      <div className="admin-module-center__hero-inner">
        <div className="admin-module-center__hero-text">
          <p className="admin-module-center__hero-eyebrow">{eyebrow}</p>
          <h2 className="admin-module-center__hero-title">{heroTitle}</h2>
          <p className="admin-module-center__hero-desc">{heroDescription}</p>
        </div>
      </div>
    </div>
  );
}

export function AdminModuleStats({ items }: { items: AdminModuleStatItem[] }) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "admin-module-center__stats",
        items.length === 4 && "admin-module-center__stats--quad"
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={cn(
              "admin-module-center__stat",
              item.tone ? `admin-module-center__stat--${item.tone}` : "admin-module-center__stat--neutral"
            )}
          >
            <span className="admin-module-center__stat-icon" aria-hidden="true">
              <Icon />
            </span>
            <p className="admin-module-center__stat-value">{item.value}</p>
            <p className="admin-module-center__stat-label">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}

export function AdminModuleSectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="admin-module-center__section-header">
      <span className="admin-module-center__section-icon" aria-hidden="true">
        <Icon />
      </span>
      <div>
        <h2 className="admin-module-center__section-title">{title}</h2>
        {description ? (
          <p className="admin-module-center__section-desc">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
