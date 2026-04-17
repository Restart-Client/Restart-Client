// HUD ヘッダー: Lv バッジ / EXP / トークン残り時間 / ピン / 閉じるボタン

import { useState } from "react";
import { Pin, PinOff, X } from "lucide-react";

import { useAuthStore } from "@/stores/auth";
import { useExp } from "@/hooks/queries";
import { cn } from "@/lib/cn";

interface HudHeaderProps {
  onClose: () => void;
}

export function HudHeader({ onClose }: HudHeaderProps) {
  const { data: exp } = useExp();
  const msUntilExpiry = useAuthStore((s) => s.msUntilExpiry);
  const userId = useAuthStore((s) => s.userId);
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);

  const remaining = msUntilExpiry();
  const hoursLeft = remaining !== null ? Math.floor(remaining / 3_600_000) : null;
  const minutesLeft =
    remaining !== null ? Math.floor((remaining % 3_600_000) / 60_000) : null;

  const timeColor =
    hoursLeft !== null && hoursLeft < 1
      ? "text-red-400"
      : hoursLeft !== null && hoursLeft < 2
        ? "text-amber-400"
        : "text-ink-400";

  async function toggleAlwaysOnTop() {
    const next = !alwaysOnTop;
    setAlwaysOnTop(next);
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setAlwaysOnTop(next);
    } catch {}
  }

  return (
    <div className="px-3 py-2 border-b border-ink-800/50 shrink-0">
      <div className="flex items-center gap-2">
        {/* Lv バッジ */}
        <div
          className="relative flex items-center justify-center w-9 h-9 rounded-lg
                       bg-gradient-to-br from-ember-500 to-ember-700 shrink-0 cursor-default"
          title={`ユーザー ID: ${userId ?? "?"}`}
        >
          <span className="font-display font-black text-xs text-ink-950 leading-none">
            {exp?.level ?? "?"}
          </span>
        </div>

        {/* EXP */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-ink-200">
              Lv {exp?.level ?? "–"}
            </span>
            {hoursLeft !== null && (
              <span className={cn("text-[10px] font-mono", timeColor)}>
                {hoursLeft > 0 ? `${hoursLeft}h` : `${minutesLeft}m`}
              </span>
            )}
          </div>
          {exp && (
            <div className="text-[9px] font-mono text-ink-600 mt-0.5">
              EXP {exp.exp.toLocaleString()}
            </div>
          )}
        </div>

        {/* ピン (Always-on-Top) */}
        <button
          onClick={toggleAlwaysOnTop}
          className={cn(
            "p-1 rounded-md transition-colors",
            alwaysOnTop
              ? "text-ember-400 hover:text-ember-300"
              : "text-ink-600 hover:text-ink-400",
          )}
          title={alwaysOnTop ? "常に最前面: ON" : "常に最前面: OFF"}
        >
          {alwaysOnTop ? <Pin size={14} /> : <PinOff size={14} />}
        </button>

        {/* 閉じる */}
        <button
          onClick={onClose}
          className="p-1 rounded-md text-ink-600 hover:text-ink-300 transition-colors"
          title="HUD を閉じる (Esc)"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
