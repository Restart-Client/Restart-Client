// Desk モードのプリセット管理ページ

import { useState } from "react";
import { Plus } from "lucide-react";
import { usePresetStore, type Preset } from "@/stores/presets";
import { useApplyPreset } from "@/hooks/mutations";
import { PresetTile } from "@/components/preset/PresetTile";
import { PresetEditDialog } from "@/components/preset/PresetEditDialog";

export function PresetsPage() {
  const { presets, add, update, remove } = usePresetStore();
  const applyPreset = useApplyPreset();
  const [editTarget, setEditTarget] = useState<Preset | null | "new">(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function handleSave(
    data: Omit<Preset, "id" | "created_at" | "updated_at">,
  ) {
    if (editTarget === "new") {
      await add(data);
    } else if (editTarget) {
      await update(editTarget.id, data);
    }
    setEditTarget(null);
  }

  async function handleDuplicate(preset: Preset) {
    await add({
      name: `${preset.name} (コピー)`,
      icon: preset.icon,
      color: preset.color,
      hotkey: null,
      weapon_number: preset.weapon_number,
      skill_id: preset.skill_id,
      tool_id: preset.tool_id,
      pet_ids: preset.pet_ids,
    });
  }

  async function handleDelete(id: string) {
    await remove(id);
    setDeleteConfirm(null);
  }

  return (
    <div className="flex flex-col h-full">
      {/* ページヘッダー */}
      <div className="px-6 py-5 border-b border-ink-800/50">
        <h1 className="font-display font-bold text-xl text-ink-50">
          プリセット
        </h1>
        <p className="text-sm text-ink-500 mt-1">
          状況に応じた装備セットを保存して、1 クリックで切り替えられます。
        </p>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto p-6">
        {presets.length === 0 ? (
          <EmptyState onNew={() => setEditTarget("new")} />
        ) : (
          <div className="space-y-3 max-w-2xl">
            {presets.map((preset) => (
              <PresetTile
                key={preset.id}
                preset={preset}
                onApply={() => applyPreset.mutate(preset)}
                onEdit={() => setEditTarget(preset)}
                onDuplicate={() => handleDuplicate(preset)}
                onDelete={() => setDeleteConfirm(preset.id)}
                isApplying={applyPreset.isPending}
              />
            ))}
          </div>
        )}

        {/* 新規作成ボタン */}
        {presets.length > 0 && (
          <button
            onClick={() => setEditTarget("new")}
            className="mt-4 flex items-center gap-2 text-sm text-ink-400 hover:text-ink-200
                       hover:bg-ink-800 px-4 py-2.5 rounded-xl border border-ink-800
                       hover:border-ink-700 transition-all"
          >
            <Plus size={15} />
            現在の装備から新規作成
          </button>
        )}
      </div>

      {/* 編集ダイアログ */}
      {editTarget !== null && (
        <PresetEditDialog
          preset={editTarget === "new" ? undefined : editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* 削除確認ダイアログ */}
      {deleteConfirm && (
        <DeleteConfirmDialog
          presetName={
            presets.find((p) => p.id === deleteConfirm)?.name ?? ""
          }
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="text-4xl">⚔</div>
      <div>
        <p className="text-ink-300 font-medium">プリセットがありません</p>
        <p className="text-ink-500 text-sm mt-1">
          装備セットを保存して、ゲーム中に素早く切り替えられます。
        </p>
      </div>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ember-600
                   hover:bg-ember-500 text-ink-950 font-medium text-sm transition-colors"
      >
        <Plus size={15} />
        最初のプリセットを作成
      </button>
    </div>
  );
}

function DeleteConfirmDialog({
  presetName,
  onConfirm,
  onCancel,
}: {
  presetName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-ink-900 border border-ink-700 rounded-2xl shadow-2xl p-6">
        <h3 className="font-display font-bold text-ink-100 mb-2">
          プリセットを削除
        </h3>
        <p className="text-sm text-ink-400 mb-5">
          「{presetName}」を削除しますか？この操作は元に戻せません。
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-ink-400 hover:text-ink-200 hover:bg-ink-800 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
