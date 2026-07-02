"use client";

import { MenuBadge } from "@/components/menu/MenuBadge";
import { MenuIcon } from "@/components/menu/menu-icons";
import { MenuTree } from "@/components/menu/MenuTree";
import { buildMenuTree } from "@/lib/cms/menu-utils";
import type { MenuItem } from "@/types/menu";

interface MenuPreviewProps {
  items: MenuItem[];
  title?: string;
}

export function MenuPreview({ items, title = "Vista previa" }: MenuPreviewProps) {
  const tree = buildMenuTree(items);

  return (
    <div className="rounded-xl border border-border bg-background-soft p-4 dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
        {title}
      </p>

      {tree.length === 0 ? (
        <p className="text-sm text-gray-400">Sin ítems visibles.</p>
      ) : (
        <nav>
          <ul className="flex flex-wrap gap-2">
            {tree.map((node) => (
              <li key={node.id}>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900">
                  <MenuIcon name={node.icon} />
                  {node.title}
                  <MenuBadge
                    label={node.badge}
                    color={node.color}
                    highlighted={node.highlighted}
                  />
                </span>
              </li>
            ))}
          </ul>
          {tree.some((n) => n.children.length > 0) ? (
            <div className="mt-4 border-t border-border pt-4 dark:border-gray-700">
              <MenuTree nodes={tree} />
            </div>
          ) : null}
        </nav>
      )}
    </div>
  );
}
