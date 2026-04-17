// プリセット一覧の各カード

import { Edit2, Copy, Trash2, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatHotkey } from "@/lib/hotkey";
import type { Preset } from "@/stores/presets";

const COLOR_CLASSES: Record<string, string> = {
  ember: "border-ember-500/40 bg-ember-500/5",
  frost: "border-blue-500/40 bg-blue-500/5",
  life: "border-green-500/40 bg-green-500/5",
  gold: "border-yellow-500/40 bg-yellow-500/5",
  violet: "border-violet-500/40 bg-violet-500/5",
};
const ICON_COLOR: Record<string, string> = {
  ember: "text-ember-400",
  frost: "text-blue-400",
  life: "text-green-400",
  gold: "text-yellow-400",
  violet: "text-violet-400",
};

interface PresetTileProps {
  preset: Preset;
  onApply: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isApplying?: boolean;
}

export function PresetTile({
  preset,
  onApply,
  onEdit,
  onDuplicate,
  onDelete,
  isApplying,
}: PresetTileProps) {
  const border = COLOR_CLASSES[preset.color] ?? COLOR_CLASSES.ember;
  const iconColor = ICON_COLOR[preset.color] ?? ICON_COLOR.ember;

  return (
    <div className={cn("rounded-xl border p-4", border)}>
      <div className="flex items-start gap-3">
        {/* アイコン */}
        <span className={cn("text-2xl shrink-0", iconColor)}>
          {preset.icon}
        </span>

        {/* 情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-ink-100 truncate">{preset.name}</h3>
            {preset.hotkey && (
              <span className="text-[10px] font-mono text-ink-600 bg-ink-800 px-1.5 py-0.5 rounded shrink-0">
                {formatHotkey(preset.hotkey)}
              </span>
            )}
          </div>

          {/* 内容サマリー */}
          <div className="space-y-0.5 text-xs text-ink-500">
            {preset.weapon_number !== null && (
              <div>武器: #{preset.weapon_number}</div>
            )}
            {preset.skill_id !== null && (
              <div>スキル: ID {preset.skill_id}</div>
            )}
            {preset.tool_id !== null && (
              <div>
                ツール:{" "}
                {preset.tool_id === 0 ? "解除" : `ID ${preset.tool_id}`}
              </div>
            )}
            {preset.pet_ids !== null && (
              <div>ペット: {preset.pet_ids.length} 体</div>
            )}
          </div>
        </div>

        {/* アクション */}
        <div className="flex items-center gap-1 shrink-0">
          <IconButton
            icon={<Edit2 size={13} />}
            label="編集"
            onClick={onEdit}
          />
          <IconButton
            icon={<Copy size={13} />}
            label="複製"
            onClick={onDuplicate}
          />
          <IconButton
            icon={<Trash2 size={13} />}
            label="削除"
            onClick={onDelete}
            variant="danger"
          />
        </div>
      </div>

      {/* 適用ボタン */}
      <button
        onClick={onApply}
        disabled={isApplying}
        className={cn(
          "mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg",
          "text-xs font-medium transition-colors",
          "border border-ink-700 text-ink-300 hover:bg-ink-800 hover:text-ink-100",
          isApplying && "opacity-50 cursor-not-allowed",
        )}
      >
        <Play size={11} />
        このプリセットを適用
      </button>
    </div>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "p-1.5 rounded-lg transition-colors",
        variant === "danger"
          ? "text-ink-600 hover:text-red-400 hover:bg-red-500/10"
          : "text-ink-600 hover:text-ink-300 hover:bg-ink-800",
      )}
    >
      {icon}
    </button>
  );
}
