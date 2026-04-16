import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-ink-700 bg-ink-900/60 px-4 text-[15px]",
      "text-ink-50 placeholder:text-ink-400/70 font-body",
      "outline-none transition-colors",
      "hover:border-ink-600",
      "focus:border-ember-500/70 focus:ring-2 focus:ring-ember-500/20",
      "disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl border border-ink-700 bg-ink-900/60 px-4 py-3 text-[14px]",
      "text-ink-50 placeholder:text-ink-400/70 font-mono leading-relaxed",
      "outline-none transition-colors resize-none",
      "hover:border-ink-600",
      "focus:border-ember-500/70 focus:ring-2 focus:ring-ember-500/20",
      "disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
