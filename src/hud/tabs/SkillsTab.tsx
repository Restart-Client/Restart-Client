// スキルタブ: 一覧表示 + ワンクリック装備/解除。

import { useState } from "react";
import { Search, CheckCircle2, XCircle } from "lucide-react";
import { useSkills } from "@/hooks/queries";
import { useSetSkill } from "@/hooks/mutations";
import { useSettingsStore } from "@/stores/settings";
import { cn } from "@/lib/cn";
import { emitDataChanged } from "@/lib/window-sync";

export function SkillsTab() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useSkills();
  const { mutate: setSkill, isPending } = useSetSkill();
  const lastEquippedSkillId = useSettingsStore(
    (s) => s.settings.lastEquipped.skillId,
  );
  const setLastSkill = useSettingsStore((s) => s.setLastEquippedSkill);

  const skills = data?.skills ?? [];
  const filtered = search
    ? skills.filter(
        (s) =>
          s.skill_name.toLowerCase().includes(search.toLowerCase()) ||
          String(s.skill_id).includes(search),
      )
    : skills;

  // 装備中スキルを先頭に
  const sorted = [
    ...filtered.filter((s) => s.skill_id === lastEquippedSkillId),
    ...filtered.filter((s) => s.skill_id !== lastEquippedSkillId),
  ];

  function handleEquip(skillId: number) {
    setSkill(skillId, {
      onSuccess: () => {
        setLastSkill(skillId);
        emitDataChanged("data:skills:changed");
      },
    });
  }

  function handleUnequip() {
    setSkill(0, {
      onSuccess: () => {
        setLastSkill(null);
        emitDataChanged("data:skills:changed");
      },
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* 検索 */}
      <div className="p-2 border-b border-ink-800/50 shrink-0">
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500"
          />
          <input
            type="text"
            placeholder="検索…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-ink-800/50 border border-ink-700/50 rounded-lg pl-7 pr-3 py-1.5
                       text-xs text-ink-100 placeholder:text-ink-600 outline-none
                       focus:border-ember-500/50 transition-colors"
          />
        </div>
      </div>

      {/* スキル一覧 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-ink-600 text-xs">loading…</div>
        ) : (
          sorted.map((skill) => {
            const equipped = skill.skill_id === lastEquippedSkillId;
            return (
              <button
                key={skill.skill_id}
                onClick={() =>
                  equipped ? handleUnequip() : handleEquip(skill.skill_id)
                }
                disabled={isPending}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 text-left",
                  "border-b border-ink-800/30 last:border-0 transition-colors",
                  "hover:bg-ink-800/40",
                  equipped && "bg-ember-500/10",
                  isPending && "opacity-50 cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    equipped ? "bg-ember-400" : "bg-ink-700",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-xs font-medium truncate",
                      equipped ? "text-ember-200" : "text-ink-100",
                    )}
                  >
                    {skill.skill_name}
                  </div>
                  <div className="text-[10px] text-ink-600 mt-0.5">
                    ID {skill.skill_id} · ×{skill.count}
                  </div>
                </div>
                {equipped && (
                  <CheckCircle2 size={13} className="text-ember-400 shrink-0" />
                )}
              </button>
            );
          })
        )}
        {!isLoading && sorted.length === 0 && (
          <div className="text-center py-8 text-ink-600 text-xs">
            見つかりません
          </div>
        )}
      </div>

      {/* 装備解除ボタン */}
      {lastEquippedSkillId !== null && (
        <div className="shrink-0 p-2 border-t border-ink-800/50">
          <button
            onClick={handleUnequip}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg
                       border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10
                       transition-colors disabled:opacity-50"
          >
            <XCircle size={12} />
            装備解除
          </button>
        </div>
      )}
    </div>
  );
}
