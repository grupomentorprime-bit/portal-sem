import { createElement, type ComponentProps } from "react";
import { getNavIcon } from "@/components/admin/kit/navigation/sidebar-icons";

type NavIconProps = Omit<ComponentProps<"svg">, "ref"> & {
  icon?: string;
};

export function NavIcon({ icon, ...props }: NavIconProps) {
  return createElement(getNavIcon(icon), props);
}
