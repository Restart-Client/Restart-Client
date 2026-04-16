import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-2xl border border-ink-700/60 bg-ink-800/50 shadow-card",
        "backdrop-blur-sm",
        // 上端の薄い光沢
        "before:pointer-events-none before:absolute before:inset-x-4 before:top-0 before:h-px",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";
