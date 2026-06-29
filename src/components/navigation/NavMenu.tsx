import Link from "next/link";
import { MenuBadge } from "@/components/menu/MenuBadge";
import { MenuIcon } from "@/components/menu/menu-icons";
import { buildMenuTree, resolveMenuItemHref } from "@/lib/cms/menu-utils";
import { cn } from "@/lib/utils";
import type { MenuItem, MenuTreeNode } from "@/types/menu";

interface NavMenuProps {
  items: MenuItem[];
  variant?: "header" | "footer" | "mobile";
  className?: string;
}

export function NavMenu({ items, variant = "header", className }: NavMenuProps) {
  const tree = buildMenuTree(items);

  if (tree.length === 0) return null;

  if (variant === "footer") {
    return (
      <nav className={cn("flex flex-wrap gap-x-6 gap-y-2", className)}>
        {tree.map((node) => (
          <NavLink key={node.id} item={node} variant="footer" />
        ))}
      </nav>
    );
  }

  if (variant === "mobile") {
    return (
      <nav className={cn("flex flex-col gap-1", className)}>
        {tree.map((node) => (
          <MobileNavItem key={node.id} node={node} />
        ))}
      </nav>
    );
  }

  return (
    <nav className={cn("hidden items-center gap-1 md:flex", className)}>
      {tree.map((node) => (
        <HeaderNavItem key={node.id} node={node} />
      ))}
    </nav>
  );
}

function HeaderNavItem({ node }: { node: MenuTreeNode }) {
  const hasChildren = node.children.length > 0;

  if (hasChildren) {
    return (
      <div className="group relative">
        <NavLink item={node} variant="header" />
        <div className="invisible absolute left-0 top-full z-50 min-w-48 rounded-lg border border-zinc-200 bg-white py-1 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 dark:border-zinc-800 dark:bg-zinc-950">
          {node.children.map((child) => (
            <NavLink key={child.id} item={child} variant="dropdown" />
          ))}
        </div>
      </div>
    );
  }

  return <NavLink item={node} variant="header" />;
}

function MobileNavItem({ node, depth = 0 }: { node: MenuTreeNode; depth?: number }) {
  return (
    <div style={{ paddingLeft: `${depth * 12}px` }}>
      <NavLink item={node} variant="mobile" />
      {node.children.map((child) => (
        <MobileNavItem key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function NavLink({
  item,
  variant,
}: {
  item: MenuItem;
  variant: "header" | "footer" | "mobile" | "dropdown";
}) {
  const href = resolveMenuItemHref(item);
  const isExternal = item.type === "external";

  const className = cn(
    "inline-flex items-center gap-1.5 transition",
    variant === "header" &&
      "rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
    variant === "footer" && "text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
    variant === "mobile" &&
      "w-full rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800",
    variant === "dropdown" &&
      "block w-full px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800",
    item.highlighted && "font-semibold"
  );

  const content = (
    <>
      {variant !== "footer" ? <MenuIcon name={item.icon} className="h-4 w-4" /> : null}
      {item.title}
      <MenuBadge label={item.badge} color={item.color} highlighted={item.highlighted} />
    </>
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target={item.target}
        rel={item.nofollow ? "nofollow noopener noreferrer" : "noopener noreferrer"}
        className={className}
        style={item.color ? { color: item.color } : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      target={item.target}
      rel={item.nofollow ? "nofollow" : undefined}
      className={className}
      style={item.color ? { color: item.color } : undefined}
    >
      {content}
    </Link>
  );
}
