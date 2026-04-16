import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: [
    "bg-gradient-to-b from-ember-500 to-ember-600 text-ink-950",
    "border border-ember-400/40 shadow-glow",
    "hover:from-ember-400 hover:to-ember-500 hover:shadow-[0_0_50px_-8px_rgba(245,155,46,0.6)]",
    "active:scale-[0.98]",
  ].join(" "),
  secondary: [
    "bg-ink-700/60 text-ink-50 border border-ink-600/80",
    "hover:bg-ink-700 hover:border-ink-500",
    "active:scale-[0.98]",
  ].join(" "),
  ghost: [
    "bg-transparent text-ink-200 border border-transparent",
    "hover:bg-ink-800/60 hover:text-ink-50",
  ].join(" "),
  danger: [
    "bg-danger/90 text-white border border-danger/50",
    "hover:bg-danger",
    "active:scale-[0.98]",
  ].join(" "),
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-[15px] gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium tracking-wide",
          "transition-all duration-200 outline-none select-none",
          "focus-visible:ring-2 focus-visible:ring-ember-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!loading && rightIcon}
      </button>
    );
  },
);
Button.displayName = "Button";
