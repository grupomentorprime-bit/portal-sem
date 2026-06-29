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
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {title}
      </p>

      {tree.length === 0 ? (
        <p className="text-sm text-zinc-400">Sin ítems visibles.</p>
      ) : (
        <nav>
          <ul className="flex flex-wrap gap-2">
            {tree.map((node) => (
              <li key={node.id}>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950">
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
            <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
              <MenuTree nodes={tree} />
            </div>
          ) : null}
        </nav>
      )}
    </div>
  );
}
