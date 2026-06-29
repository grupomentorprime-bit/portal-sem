import type { MenuItem, MenuTreeNode } from "@/types/menu";

export function generateMenuItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function computeItemLevels(items: MenuItem[]): MenuItem[] {
  const byId = new Map(items.map((item) => [item.id, item]));

  const resolveLevel = (item: MenuItem, visited = new Set<string>()): number => {
    if (!item.parent) return 0;
    if (visited.has(item.id)) return 0;
    visited.add(item.id);
    const parent = byId.get(item.parent);
    if (!parent) return 0;
    return resolveLevel(parent, visited) + 1;
  };

  return items.map((item) => ({
    ...item,
    level: resolveLevel(item),
  }));
}

export function sortMenuItems(items: MenuItem[]): MenuItem[] {
  return [...items].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    if (a.parent !== b.parent) {
      const parentA = a.parent ?? "";
      const parentB = b.parent ?? "";
      return parentA.localeCompare(parentB);
    }
    return a.order - b.order;
  });
}

export function buildMenuTree(items: MenuItem[]): MenuTreeNode[] {
  const visible = items.filter((item) => item.visible && item.active);
  const withLevels = computeItemLevels(visible);
  const sorted = sortMenuItems(withLevels);
  const map = new Map<string, MenuTreeNode>();
  const roots: MenuTreeNode[] = [];

  for (const item of sorted) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of sorted) {
    const node = map.get(item.id);
    if (!node) continue;

    if (item.parent && map.has(item.parent)) {
      map.get(item.parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function reorderMenuItems(
  items: MenuItem[],
  draggedId: string,
  targetId: string,
  position: "before" | "after"
): MenuItem[] {
  const dragged = items.find((item) => item.id === draggedId);
  const target = items.find((item) => item.id === targetId);

  if (!dragged || !target || dragged.id === target.id) {
    return items;
  }

  const parent = target.parent;
  const siblings = items
    .filter((item) => item.parent === parent && item.id !== draggedId)
    .sort((a, b) => a.order - b.order);

  const targetIndex = siblings.findIndex((item) => item.id === targetId);
  const insertIndex = position === "before" ? targetIndex : targetIndex + 1;

  siblings.splice(insertIndex, 0, { ...dragged, parent });

  const updatedSiblings = siblings.map((item, index) => ({
    ...item,
    order: index + 1,
  }));

  const siblingIds = new Set(updatedSiblings.map((item) => item.id));

  return items.map((item) => {
    if (item.id === draggedId) {
      const updated = updatedSiblings.find((s) => s.id === draggedId);
      return updated ?? item;
    }
    if (siblingIds.has(item.id)) {
      return updatedSiblings.find((s) => s.id === item.id) ?? item;
    }
    return item;
  });
}

export function resolveMenuItemHref(item: MenuItem): string {
  if (item.type === "external") {
    return item.url || item.slug;
  }

  if (item.slug.startsWith("/")) {
    return item.slug;
  }

  return `/${item.slug}`;
}

export function countVisibleItems(items: MenuItem[]): number {
  return items.filter((item) => item.visible && item.active).length;
}
