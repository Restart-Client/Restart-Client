import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-700 bg-ink-900/40 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-800 text-ink-400">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <h3 className="mt-4 font-display text-base font-medium text-ink-100">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm font-body text-sm text-ink-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "読み込みに失敗しました",
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-danger/30 bg-danger/5 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/15 text-danger">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-base font-medium text-ink-100">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md font-body text-sm text-ink-300">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
