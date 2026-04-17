// プリセット作成・編集ダイアログ

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Preset } from "@/stores/presets";

const ICONS = ["⚔", "⛏", "🎣", "🏹", "🛡", "🗡", "🪄", "🏃", "🐉", "💎"];
const COLORS: { id: string; label: string; cls: string }[] = [
  { id: "ember", label: "琥珀", cls: "bg-ember-500" },
  { id: "frost", label: "青", cls: "bg-blue-500" },
  { id: "life", label: "緑", cls: "bg-green-500" },
  { id: "gold", label: "金", cls: "bg-yellow-500" },
  { id: "violet", label: "紫", cls: "bg-violet-500" },
];
const HOTKEY_OPTIONS = [
  { label: "なし", value: null },
  { label: "Ctrl+Shift+1", value: "CommandOrControl+Shift+1" },
  { label: "Ctrl+Shift+2", value: "CommandOrControl+Shift+2" },
  { label: "Ctrl+Shift+3", value: "CommandOrControl+Shift+3" },
  { label: "Ctrl+Shift+4", value: "CommandOrControl+Shift+4" },
  { label: "Ctrl+Shift+5", value: "CommandOrControl+Shift+5" },
];

type FormData = {
  name: string;
  icon: string;
  color: string;
  hotkey: string | null;
  useWeapon: boolean;
  weapon_number: number | null;
  useSkill: boolean;
  skill_id: number | null;
  useTool: boolean;
  tool_id: number | null;  // 0 = 解除
  usePets: boolean;
  pet_ids: number[] | null;
};

function presetToForm(preset?: Partial<Preset>): FormData {
  return {
    name: preset?.name ?? "",
    icon: preset?.icon ?? "⚔",
    color: preset?.color ?? "ember",
    hotkey: preset?.hotkey ?? null,
    useWeapon: preset?.weapon_number != null,
    weapon_number: preset?.weapon_number ?? null,
    useSkill: preset?.skill_id != null,
    skill_id: preset?.skill_id ?? null,
    useTool: preset?.tool_id != null,
    tool_id: preset?.tool_id ?? null,
    usePets: preset?.pet_ids != null,
    pet_ids: preset?.pet_ids ?? null,
  };
}

interface PresetEditDialogProps {
  preset?: Preset;
  onSave: (data: Omit<Preset, "id" | "created_at" | "updated_at">) => void;
  onClose: () => void;
}

export function PresetEditDialog({
  preset,
  onSave,
  onClose,
}: PresetEditDialogProps) {
  const [form, setForm] = useState<FormData>(() => presetToForm(preset));

  useEffect(() => {
    setForm(presetToForm(preset));
  }, [preset]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(),
      icon: form.icon,
      color: form.color,
      hotkey: form.hotkey,
      weapon_number: form.useWeapon ? form.weapon_number : null,
      skill_id: form.useSkill ? form.skill_id : null,
      tool_id: form.useTool ? form.tool_id : null,
      pet_ids: form.usePets ? form.pet_ids : null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-ink-900 border border-ink-700 rounded-2xl shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800">
          <h2 className="font-display font-bold text-ink-100">
            {preset ? "プリセットを編集" : "プリセットを作成"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-500 hover:text-ink-300 hover:bg-ink-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 名前 */}
          <div>
            <label className="block text-xs font-medium text-ink-400 mb-1">
              名前
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="例: ボス戦"
              className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2
                         text-sm text-ink-100 placeholder:text-ink-600 outline-none
                         focus:border-ember-500/70 transition-colors"
            />
          </div>

          {/* アイコン + カラー */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-ink-400 mb-1">
                アイコン
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => set("icon", icon)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-colors",
                      form.icon === icon
                        ? "bg-ember-500/20 border border-ember-500/50"
                        : "bg-ink-800 border border-ink-700 hover:bg-ink-700",
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-400 mb-1">
                カラー
              </label>
              <div className="flex flex-col gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => set("color", c.id)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-colors",
                      form.color === c.id
                        ? "bg-ink-700 text-ink-100"
                        : "text-ink-500 hover:bg-ink-800",
                    )}
                  >
                    <span className={cn("w-3 h-3 rounded-full shrink-0", c.cls)} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ホットキー */}
          <div>
            <label className="block text-xs font-medium text-ink-400 mb-1">
              ホットキー
            </label>
            <select
              value={form.hotkey ?? ""}
              onChange={(e) =>
                set("hotkey", e.target.value === "" ? null : e.target.value)
              }
              className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2
                         text-sm text-ink-100 outline-none focus:border-ember-500/70 transition-colors"
            >
              {HOTKEY_OPTIONS.map((o) => (
                <option key={o.label} value={o.value ?? ""}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* 含める装備 */}
          <div>
            <label className="block text-xs font-medium text-ink-400 mb-2">
              含める装備
            </label>
            <div className="space-y-2">
              <EquipRow
                label="武器"
                checked={form.useWeapon}
                onToggle={(v) => set("useWeapon", v)}
              >
                {form.useWeapon && (
                  <NumberInput
                    label="#"
                    value={form.weapon_number}
                    onChange={(v) => set("weapon_number", v)}
                    placeholder="番号"
                  />
                )}
              </EquipRow>

              <EquipRow
                label="スキル"
                checked={form.useSkill}
                onToggle={(v) => set("useSkill", v)}
              >
                {form.useSkill && (
                  <NumberInput
                    label="ID"
                    value={form.skill_id}
                    onChange={(v) => set("skill_id", v)}
                    placeholder="ID"
                  />
                )}
              </EquipRow>

              <EquipRow
                label="ツール"
                checked={form.useTool}
                onToggle={(v) => set("useTool", v)}
              >
                {form.useTool && (
                  <NumberInput
                    label="ID (0=解除)"
                    value={form.tool_id}
                    onChange={(v) => set("tool_id", v)}
                    placeholder="ID"
                  />
                )}
              </EquipRow>

              <EquipRow
                label="ペット"
                checked={form.usePets}
                onToggle={(v) => set("usePets", v)}
              >
                {form.usePets && (
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="ID をカンマ区切りで (例: 1,2,3)"
                      value={form.pet_ids?.join(",") ?? ""}
                      onChange={(e) => {
                        const ids = e.target.value
                          .split(",")
                          .map((s) => parseInt(s.trim(), 10))
                          .filter((n) => !isNaN(n));
                        set("pet_ids", ids.length > 0 ? ids : null);
                      }}
                      className="w-full bg-ink-800 border border-ink-700 rounded-lg px-2.5 py-1.5
                                 text-xs text-ink-100 placeholder:text-ink-600 outline-none
                                 focus:border-ember-500/70 transition-colors"
                    />
                  </div>
                )}
              </EquipRow>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-ink-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-ink-400 hover:text-ink-200 hover:bg-ink-800 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                       bg-ember-600 hover:bg-ember-500 text-ink-950 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={14} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function EquipRow({
  label,
  checked,
  onToggle,
  children,
}: {
  label: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 cursor-pointer shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 rounded accent-ember-500"
        />
        <span className="text-xs text-ink-300 w-12">{label}</span>
      </label>
      {checked ? children : (
        <span className="text-xs text-ink-600 italic">変更しない</span>
      )}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-1">
      <span className="text-[10px] text-ink-600 shrink-0">{label}</span>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(isNaN(n) ? null : n);
        }}
        placeholder={placeholder}
        className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-2.5 py-1.5
                   text-xs text-ink-100 placeholder:text-ink-600 outline-none
                   focus:border-ember-500/70 transition-colors"
      />
    </div>
  );
}
