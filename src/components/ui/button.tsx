import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, MouseEventHandler } from "react";
import { disabledStyles, focusRing } from "./shared";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  href?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-text-inverse hover:bg-secondary active:bg-primary",
  secondary: "border border-border bg-background text-foreground hover:bg-background-muted active:bg-background-soft",
  outline:
    "border border-border bg-background text-foreground hover:bg-background-muted active:bg-background-soft",
  ghost: "text-foreground hover:bg-background-muted active:bg-background-muted",
  danger:
    "bg-[var(--color-danger)] text-text-inverse hover:opacity-90 active:opacity-100",
  success:
    "bg-success text-[var(--sem-primary)] hover:opacity-90 active:opacity-100",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  type = "button",
  href,
  onClick,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition-[background-color,opacity,transform,box-shadow] duration-[var(--transition-fast)]",
    focusRing,
    disabledStyles,
    variants[variant],
    sizes[size],
    !disabled && !loading && "hover-lift press-scale",
    className
  );

  const content = loading ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
      <span>{children}</span>
    </>
  ) : (
    children
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        className={classes}
        onClick={onClick as MouseEventHandler<HTMLAnchorElement> | undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classes}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
}
