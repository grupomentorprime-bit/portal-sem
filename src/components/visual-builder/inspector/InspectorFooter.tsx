import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { inspectorStyles } from "./inspector-styles";

interface InspectorFooterProps {
  children: ReactNode;
  className?: string;
}

export function InspectorFooter({ children, className }: InspectorFooterProps) {
  return (
    <div className={cn(inspectorStyles.panelFooter, className)}>{children}</div>
  );
}
