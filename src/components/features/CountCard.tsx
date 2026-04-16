// アイテム・素材・スキルの表示に共通で使うカード。
// 左にアイコン枠(将来の画像拡張に備える)、中央に名前、右に所持数。

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface CountCardProps {
  id: number;
  name: string;
  count: number;
  icon?: ReactNode;
  onClick?: () => void;
  actions?: ReactNode;
  tone?: "default" | "accent";
}

export function CountCard({
  id,
  name,
  count,
  icon,
  onClick,
  actions,
  tone = "default",
}: CountCardProps) {
  const interactive = !!onClick;
  const Comp = interactive ? motion.button : motion.div;
  const accent = tone === "accent";

  return (
    <Comp
      onClick={onClick}
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border px-3 py-3 text-left",
        "transition-colors",
        accent
          ? "border-ember-500/40 bg-ember-500/5"
          : "border-ink-700/70 bg-ink-800/40",
        interactive && "hover:border-ink-600 hover:bg-ink-800/70",
      )}
    >
      {/* アイコン枠 */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-[10px]",
          accent
            ? "bg-ember-500/15 text-ember-400"
            : "bg-ink-900/80 text-ink-500",
        )}
      >
        {icon ?? <span>#{id}</span>}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-body text-sm text-ink-100">{name}</div>
        <div className="font-mono text-[11px] text-ink-500">ID {id}</div>
      </div>

      {actions ? (
        <div className="flex items-center gap-1.5">{actions}</div>
      ) : (
        <div
          className={cn(
            "ml-2 rounded-lg px-2.5 py-1 font-mono text-sm font-bold tabular-nums",
            accent
              ? "bg-ember-500/20 text-ember-400"
              : "bg-ink-900/80 text-ink-100",
          )}
        >
          ×{count.toLocaleString()}
        </div>
      )}
    </Comp>
  );
}
