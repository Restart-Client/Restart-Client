// ログイン後のトップ画面。
// 起動時にほぼ全データを並列取得し、各カテゴリーの要約を一画面に集約する。
// カードをクリックするとその画面に遷移する。

import { motion } from "framer-motion";
import {
  ArrowRight,
  Backpack,
  Blocks,
  Flame,
  PawPrint,
  RefreshCw,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useBattlePets,
  useExp,
  useItems,
  useMaterials,
  usePets,
  useSkills,
  useWeaponCategories,
} from "@/hooks/queries";
import { useAuthStore } from "@/stores/auth";
import { ApiError } from "@/api/client";
import { cn } from "@/lib/cn";
import type { NavKey } from "@/components/layout/Sidebar";
import { useQueryClient } from "@tanstack/react-query";

interface DashboardProps {
  onNavigate: (k: NavKey) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const userId = useAuthStore((s) => s.userId);
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const qc = useQueryClient();

  const exp = useExp();
  const items = useItems();
  const materials = useMaterials();
  const skills = useSkills();
  const weaponCats = useWeaponCategories();
  const pets = usePets();
  const battle = useBattlePets();

  const anyFetching =
    exp.isFetching ||
    items.isFetching ||
    materials.isFetching ||
    skills.isFetching ||
    weaponCats.isFetching ||
    pets.isFetching ||
    battle.isFetching;

  const expiresInHours = expiresAt
    ? Math.max(0, Math.floor((expiresAt * 1000 - Date.now()) / 3600_000))
    : null;

  const level = exp.data?.level ?? null;
  const expValue = exp.data?.exp ?? null;

  // 次のレベルまでに必要な経験値 (exp = level^2 の関係を仮定)
  const expProgress = ((): { to: number; pct: number } | null => {
    if (level === null || expValue === null) return null;
    const curBase = level * level;
    const nextBase = (level + 1) * (level + 1);
    const pct = Math.min(
      100,
      Math.max(0, ((expValue - curBase) / (nextBase - curBase)) * 100),
    );
    return { to: nextBase - expValue, pct };
  })();

  const handleRefreshAll = () => {
    qc.invalidateQueries();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      {/* ヘッダー */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-end justify-between gap-4"
      >
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-500">
            Dashboard
          </p>
          <h1 className="mt-1 font-display text-[34px] font-light tracking-tight text-ink-50">
            ようこそ、
            <span className="font-black text-ember-400">{userId ?? "…"}</span>{" "}
            さん
          </h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshAll}
          leftIcon={
            <RefreshCw
              className={cn("h-3.5 w-3.5", anyFetching && "animate-spin")}
            />
          }
        >
          すべて更新
        </Button>
      </motion.div>

      {/* メインステータス */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="md:col-span-2"
        >
          <Card className="relative overflow-hidden p-7">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(ellipse 50% 70% at 95% 30%, rgba(245,155,46,0.18), transparent 60%)",
              }}
            />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    Level
                  </div>
                  {exp.isLoading ? (
                    <Skeleton className="mt-2 h-20 w-48" />
                  ) : exp.isError ? (
                    <ErrorInline error={exp.error} />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-3">
                      <span className="font-display text-[80px] font-black leading-none text-ink-50">
                        {level}
                      </span>
                      <Badge tone="ember">
                        EXP {expValue?.toLocaleString() ?? "?"}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ember-500/10 ring-1 ring-ember-500/25">
                  <Trophy className="h-5 w-5 text-ember-400" />
                </div>
              </div>

              {/* EXPバー */}
              {expProgress && (
                <div className="mt-5">
                  <div className="flex items-center justify-between font-mono text-[11px] text-ink-500">
                    <span>NEXT LV {level! + 1}</span>
                    <span className="text-ink-300">
                      あと {expProgress.to.toLocaleString()} exp
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${expProgress.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full rounded-full bg-gradient-to-r from-ember-500 to-ember-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="p-7">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Session
            </div>
            <div className="mt-1 font-display text-[48px] font-light leading-none text-ink-50">
              {expiresInHours ?? "—"}
              <span className="ml-1 font-mono text-sm text-ink-400">h</span>
            </div>
            <p className="mt-3 font-body text-sm text-ink-400">
              トークン有効期限まで
            </p>
            <div className="mt-6 h-px bg-ink-800" />
            <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Booster
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-life shadow-[0_0_8px_#4ade80]" />
              <span className="font-body text-sm text-ink-100">アクティブ</span>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* 戦闘ペット */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-6"
      >
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-ember-400" />
              <h2 className="font-display text-sm font-medium tracking-wide text-ink-100">
                戦闘編成
              </h2>
              <Badge>
                {battle.data?.pets.length ?? 0} / 3
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("pets")}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              管理
            </Button>
          </div>

          {battle.isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[72px]" />
              ))}
            </div>
          ) : battle.data && battle.data.pets.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {battle.data.pets.slice(0, 3).map((p) => (
                <div
                  key={p.pet_id}
                  className="flex items-center gap-3 rounded-xl border border-ember-500/30 bg-ember-500/[0.04] p-3"
                >
                  <img
                    src={p.img}
                    alt={p.name}
                    width={44}
                    height={44}
                    loading="lazy"
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-ink-800"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-body text-sm text-ink-50">
                      {p.name}
                    </div>
                    <div className="truncate font-mono text-[10px] text-ink-500">
                      Lv {Math.floor(Math.sqrt(p.experience))} · ATK{" "}
                      {p.atk_percent}%
                    </div>
                  </div>
                </div>
              ))}
              {Array.from({
                length: Math.max(0, 3 - battle.data.pets.length),
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex h-[68px] items-center justify-center rounded-xl border border-dashed border-ink-700/60 text-sm text-ink-500"
                >
                  空きスロット
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-ink-700/60 px-4 py-6 text-center text-sm text-ink-500">
              戦闘参加中のペットはいません
            </div>
          )}
        </Card>
      </motion.div>

      {/* カテゴリー別カウント */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <CategoryCard
          icon={<Swords className="h-4 w-4" />}
          label="武器カテゴリー"
          value={weaponCats.data?.weapon_categories.length}
          loading={weaponCats.isLoading}
          delay={0.2}
          onClick={() => onNavigate("weapons")}
        />
        <CategoryCard
          icon={<Sparkles className="h-4 w-4" />}
          label="スキル"
          value={skills.data?.skills.length}
          loading={skills.isLoading}
          delay={0.25}
          onClick={() => onNavigate("skills")}
        />
        <CategoryCard
          icon={<Backpack className="h-4 w-4" />}
          label="アイテム"
          value={items.data?.items.length}
          loading={items.isLoading}
          delay={0.3}
          onClick={() => onNavigate("items")}
        />
        <CategoryCard
          icon={<Blocks className="h-4 w-4" />}
          label="素材"
          value={materials.data?.materials.length}
          loading={materials.isLoading}
          delay={0.35}
          onClick={() => onNavigate("materials")}
        />
      </div>

      {/* フッター: ペット総数 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-6"
      >
        <button
          onClick={() => onNavigate("pets")}
          className="group flex w-full items-center justify-between rounded-2xl border border-ink-700/70 bg-ink-800/40 p-5 transition-colors hover:border-ink-600 hover:bg-ink-800/70"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-ink-300">
              <PawPrint className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                Pet Collection
              </div>
              <div className="font-display text-lg text-ink-50">
                {pets.isLoading
                  ? "..."
                  : `${pets.data?.pets.length ?? 0} 体のペット`}
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-ink-500 group-hover:text-ink-100" />
        </button>
      </motion.div>
    </div>
  );
}

// ────────────────────────────────────────────────────────

function CategoryCard({
  icon,
  label,
  value,
  loading,
  delay,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  loading: boolean;
  delay: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-ink-700/70 bg-ink-800/40 p-5 text-left transition-colors hover:border-ink-600"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900/80 text-ink-400 group-hover:text-ember-400">
          {icon}
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-ink-600 group-hover:text-ink-300" />
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-10 w-20" />
      ) : (
        <div className="mt-3 font-display text-[36px] font-light leading-none text-ink-50 tabular-nums">
          {value ?? 0}
        </div>
      )}
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
        {label}
      </div>
    </motion.button>
  );
}

function ErrorInline({ error }: { error: unknown }) {
  const msg =
    error instanceof ApiError
      ? (error.body.error ?? error.message)
      : error instanceof Error
        ? error.message
        : "不明なエラー";
  return (
    <div className="mt-2 text-sm text-danger">エラー: {msg}</div>
  );
}
