import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-ink-800/60",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-shimmer before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)]",
        "before:bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
