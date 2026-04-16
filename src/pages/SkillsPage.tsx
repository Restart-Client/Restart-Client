// スキル画面。
// 所持スキル一覧から「装備」ボタンでワンクリック装備。
// API 仕様上「現在装備中のスキル」を取得する手段がないため、
// 直近このセッションで装備したスキルIDを Zustand で記憶して UI 上でハイライトする。

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { useSkills } from "@/hooks/queries";
import { useSetSkill } from "@/hooks/mutations";
import { ApiError } from "@/api/client";
import { cn } from "@/lib/cn";
import { useEquippedSkillStore } from "@/stores/ui";

export function SkillsPage() {
  const { data, isLoading, isError, error, refetch } = useSkills();
  const [q, setQ] = useState("");
  const equipped = useEquippedSkillStore((s) => s.equippedSkillId);
  const setEquipped = useEquippedSkillStore((s) => s.setEquipped);
  const setSkill = useSetSkill();

  const filtered = useMemo(() => {
    const skills = data?.skills ?? [];
    const qq = q.trim().toLowerCase();
    return (
      qq
        ? skills.filter(
            (s) =>
              s.skill_name.toLowerCase().includes(qq) ||
              String(s.skill_id).includes(qq),
          )
        : skills
    ).slice();
  }, [data, q]);

  const onEquip = (skillId: number) => {
    setSkill.mutate(skillId, {
      onSuccess: () => setEquipped(skillId === 0 ? null : skillId),
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <PageHeader
        eyebrow="Abilities"
        title="スキル"
        description="装備するスキルを選択できます。0 を装備すると解除されます。"
        actions={
          equipped !== null ? (
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<X className="h-3.5 w-3.5" />}
              onClick={() => onEquip(0)}
              loading={setSkill.isPending}
            >
              解除
            </Button>
          ) : null
        }
      />

      {equipped !== null && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center gap-2 rounded-xl border border-ember-500/30 bg-ember-500/5 px-4 py-2.5"
        >
          <Sparkles className="h-4 w-4 text-ember-400" />
          <span className="font-body text-sm text-ink-200">
            このセッションで装備したスキル:
          </span>
          <Badge tone="ember">ID {equipped}</Badge>
        </motion.div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SearchField
          placeholder="スキル名または ID で検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onClear={() => setQ("")}
          className="max-w-sm flex-1"
        />
        {data && (
          <div className="ml-auto font-mono text-xs text-ink-500">
            {filtered.length} / {data.skills.length}
          </div>
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[84px]" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            message={humanize(error)}
            action={
              <Button size="sm" onClick={() => refetch()}>
                再試行
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-5 w-5" />}
            title={q ? "該当するスキルがありません" : "スキルを所持していません"}
          />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((s) => {
              const isEquipped = equipped === s.skill_id;
              return (
                <motion.div
                  layout
                  key={s.skill_id}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl border px-4 py-3",
                    isEquipped
                      ? "border-ember-500/50 bg-ember-500/10"
                      : "border-ink-700/70 bg-ink-800/40 hover:border-ink-600 hover:bg-ink-800/70",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                      isEquipped
                        ? "bg-ember-500/20 text-ember-400"
                        : "bg-ink-900/80 text-ink-400",
                    )}
                  >
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-body text-[15px] text-ink-50">
                        {s.skill_name}
                      </div>
                      {isEquipped && (
                        <Badge tone="ember" className="shrink-0">
                          装備中
                        </Badge>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-ink-500">
                      ID {s.skill_id} · 所持 ×{s.count.toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isEquipped ? "secondary" : "primary"}
                    disabled={isEquipped}
                    onClick={() => onEquip(s.skill_id)}
                    loading={setSkill.isPending && setSkill.variables === s.skill_id}
                  >
                    {isEquipped ? "装備中" : "装備"}
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function humanize(e: unknown): string {
  if (e instanceof ApiError) return e.body.error ?? e.message;
  return e instanceof Error ? e.message : "不明なエラー";
}
