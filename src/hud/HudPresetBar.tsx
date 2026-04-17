// HUD 下部のプリセットバー。プリセットを 1 クリックで適用できる。

import { Plus, Settings } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

import { usePresetStore } from "@/stores/presets";
import { useApplyPreset } from "@/hooks/mutations";
import { cn } from "@/lib/cn";

const ICON_COLORS: Record<string, string> = {
  ember: "bg-ember-500/20 text-ember-400 border-ember-500/30",
  frost: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  life: "bg-green-500/20 text-green-400 border-green-500/30",
  gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  violet: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

export function HudPresetBar() {
  const presets = usePresetStore((s) => s.presets);
  const applyPreset = useApplyPreset();

  function handleApply(presetId: string) {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    applyPreset.mutate(preset);
  }

  function handleOpenDeskPresets() {
    invoke("show_desk").catch(() => {});
  }

  return (
    <div className="shrink-0 border-t border-ink-800/50 bg-ink-950/70 px-2 py-2">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {presets.slice(0, 8).map((preset) => {
          const colorClass =
            ICON_COLORS[preset.color] ?? ICON_COLORS.ember;
          return (
            <button
              key={preset.id}
              onClick={() => handleApply(preset.id)}
              disabled={applyPreset.isPending}
              className={cn(
                "flex flex-col items-center gap-0.5 p-1.5 rounded-lg border min-w-[44px]",
                "transition-all hover:scale-105 active:scale-95",
                colorClass,
                applyPreset.isPending && "opacity-50 cursor-not-allowed",
              )}
              title={preset.name}
            >
              <span className="text-base leading-none">{preset.icon}</span>
              <span className="text-[8px] font-mono leading-none truncate max-w-[36px]">
                {preset.name.slice(0, 4)}
              </span>
            </button>
          );
        })}

        {/* 新規作成 */}
        <button
          className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg border border-ink-700/50
                     text-ink-500 hover:text-ink-300 hover:border-ink-600 min-w-[44px] transition-colors"
          title="現在の装備からプリセット作成"
        >
          <Plus size={14} />
          <span className="text-[8px] font-mono">追加</span>
        </button>

        {/* プリセット管理 (Desk へ) */}
        <button
          onClick={handleOpenDeskPresets}
          className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg border border-ink-700/50
                     text-ink-500 hover:text-ink-300 hover:border-ink-600 min-w-[44px] transition-colors"
          title="プリセット管理を開く"
        >
          <Settings size={14} />
          <span className="text-[8px] font-mono">管理</span>
        </button>
      </div>
    </div>
  );
}
