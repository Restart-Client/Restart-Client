import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b border-ink-800 pb-6",
        className,
      )}
    >
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-display text-[32px] font-light tracking-tight text-ink-50">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl font-body text-sm text-ink-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
