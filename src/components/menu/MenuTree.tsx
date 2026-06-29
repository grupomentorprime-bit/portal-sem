"use client";

import { MenuBadge } from "@/components/menu/MenuBadge";
import { MenuIcon } from "@/components/menu/menu-icons";
import { cn } from "@/lib/utils";
import type { MenuTreeNode } from "@/types/menu";

interface MenuTreeProps {
  nodes: MenuTreeNode[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  editable?: boolean;
}

export function MenuTree({
  nodes,
  onSelect,
  selectedId,
  editable = false,
}: MenuTreeProps) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <MenuTreeNodeItem
          key={node.id}
          node={node}
          onSelect={onSelect}
          selectedId={selectedId}
          editable={editable}
        />
      ))}
    </ul>
  );
}

function MenuTreeNodeItem({
  node,
  onSelect,
  selectedId,
  editable,
}: {
  node: MenuTreeNode;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  editable?: boolean;
}) {
  const isSelected = selectedId === node.id;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect?.(node.id)}
        disabled={!editable && !onSelect}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
          isSelected
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
          editable && "cursor-pointer"
        )}
      >
        <MenuIcon name={node.icon} />
        <span className="flex-1 font-medium">{node.title}</span>
        <MenuBadge label={node.badge} color={node.color} highlighted={node.highlighted} />
        {node.children.length > 0 ? (
          <span className="text-xs opacity-60">{node.children.length}</span>
        ) : null}
      </button>

      {node.children.length > 0 ? (
        <div className="ml-6 mt-1 border-l border-zinc-200 pl-3 dark:border-zinc-700">
          <MenuTree
            nodes={node.children}
            onSelect={onSelect}
            selectedId={selectedId}
            editable={editable}
          />
        </div>
      ) : null}
    </li>
  );
}
