import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "ember" | "frost" | "life" | "danger";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  children: ReactNode;
}

const tones: Record<Tone, string> = {
  neutral: "bg-ink-700/80 text-ink-100 border-ink-600",
  ember: "bg-ember-500/15 text-ember-400 border-ember-500/30",
  frost: "bg-frost-500/15 text-frost-400 border-frost-500/30",
  life: "bg-life/15 text-life border-life/30",
  danger: "bg-danger/15 text-danger border-danger/30",
};

export function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5",
        "text-xs font-medium font-mono tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
