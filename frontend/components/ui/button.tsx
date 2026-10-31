import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/classes";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function buttonStyles(variant: Variant = "primary", className?: string) {
  return cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
    variant === "primary" &&
      "bg-primary text-white shadow-xs hover:bg-primary-hover",
    variant === "secondary" &&
      "border border-line bg-white text-ink shadow-xs hover:bg-canvas",
    variant === "ghost" && "text-muted hover:bg-slate-100 hover:text-ink",
    variant === "danger" && "bg-red-700 text-white hover:bg-red-800",
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  pending?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  pending = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles(variant, className)}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
        />
      )}
      {children}
    </button>
  );
}
