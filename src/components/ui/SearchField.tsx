import { Search, X } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export function SearchField({
  className,
  value,
  onClear,
  ...props
}: SearchFieldProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
      <input
        value={value}
        className={cn(
          "h-10 w-full rounded-xl border border-ink-700 bg-ink-900/60 pl-10 pr-9 text-[14px]",
          "text-ink-50 placeholder:text-ink-400/70 font-body",
          "outline-none transition-colors",
          "hover:border-ink-600",
          "focus:border-ember-500/70 focus:ring-2 focus:ring-ember-500/20",
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-500 hover:bg-ink-800 hover:text-ink-200"
          aria-label="クリア"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
