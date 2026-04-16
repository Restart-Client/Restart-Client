// 武器画面: カテゴリー一覧 → 個体一覧 の 2 段階ビュー。
// 個体カードではエンチャントと熟練度を目立たせる。

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Gauge,
  Sparkle,
  Swords,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { SearchField } from "@/components/ui/SearchField";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { useWeapon, useWeaponCategories, useWeaponsInCategory } from "@/hooks/queries";
import { useSetWeapon } from "@/hooks/mutations";
import { ApiError } from "@/api/client";
import { cn } from "@/lib/cn";
import type { WeaponInstance } from "@/api/types";

export function WeaponsPage() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  return selectedCategory === null ? (
    <WeaponCategoryList onSelect={setSelectedCategory} />
  ) : (
    <WeaponInstanceList
      categoryId={selectedCategory}
      onBack={() => setSelectedCategory(null)}
    />
  );
}

// ────────────────────────────────────────────────────────
// カテゴリー一覧
// ────────────────────────────────────────────────────────

function WeaponCategoryList({ onSelect }: { onSelect: (id: number) => void }) {
  const { data, isLoading, isError, error, refetch } = useWeaponCategories();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const cats = data?.weapon_categories ?? [];
    const qq = q.trim().toLowerCase();
    return (
      qq
        ? cats.filter(
            (c) =>
              c.weapon_name.toLowerCase().includes(qq) ||
              String(c.weapon_id).includes(qq),
          )
        : cats
    ).slice();
  }, [data, q]);

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <PageHeader
        eyebrow="Arsenal"
        title="武器"
        description="武器はカテゴリーごとに管理されています。カテゴリーを選ぶと個体一覧が開きます。"
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SearchField
          placeholder="武器カテゴリー名で検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onClear={() => setQ("")}
          className="max-w-sm flex-1"
        />
        {data && (
          <div className="ml-auto font-mono text-xs text-ink-500">
            {filtered.length} / {data.weapon_categories.length} カテゴリー
          </div>
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px]" />
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
            icon={<Swords className="h-5 w-5" />}
            title={q ? "該当する武器がありません" : "武器を所持していません"}
          />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((c) => (
              <motion.button
                layout
                key={c.weapon_id}
                onClick={() => onSelect(c.weapon_id)}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="group flex items-center gap-3 rounded-xl border border-ink-700/70 bg-ink-800/40 px-4 py-3 text-left hover:border-ink-600 hover:bg-ink-800/70"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink-900/80 text-ink-400 group-hover:text-ember-400">
                  <Swords className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-[15px] text-ink-50">
                    {c.weapon_name}
                  </div>
                  <div className="font-mono text-[11px] text-ink-500">
                    ID {c.weapon_id} · {c.count} 個体
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-500 group-hover:text-ink-300" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// 個体一覧
// ────────────────────────────────────────────────────────

function WeaponInstanceList({
  categoryId,
  onBack,
}: {
  categoryId: number;
  onBack: () => void;
}) {
  const { data, isLoading, isError, error, refetch } =
    useWeaponsInCategory(categoryId);
  const setWeapon = useSetWeapon(categoryId);
  const [detailNumber, setDetailNumber] = useState<number | null>(null);

  const weapons = data?.weapons ?? [];
  const equipped = weapons.find((w) => w.is_equipped) ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <PageHeader
        eyebrow={`Arsenal · ID ${categoryId}`}
        title={weapons[0]?.weapon_name ?? "武器カテゴリー"}
        description={`${weapons.length} 個体を所持しています。カードをクリックで詳細、装備ボタンで即時切替。`}
        actions={
          <div className="flex items-center gap-2">
            {equipped && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<X className="h-3.5 w-3.5" />}
                onClick={() => setWeapon.mutate(0)}
                loading={setWeapon.isPending}
              >
                装備解除
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onBack}>
              ← カテゴリー一覧
            </Button>
          </div>
        }
      />

      <div className="mt-5">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[130px]" />
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
        ) : weapons.length === 0 ? (
          <EmptyState
            title="このカテゴリーに個体がありません"
            icon={<Swords className="h-5 w-5" />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {weapons.map((w) => (
              <WeaponInstanceCard
                key={w.weapon_number}
                weapon={w}
                onEquip={() => setWeapon.mutate(w.weapon_number)}
                onDetail={() => setDetailNumber(w.weapon_number)}
                pending={
                  setWeapon.isPending && setWeapon.variables === w.weapon_number
                }
              />
            ))}
          </div>
        )}
      </div>

      {detailNumber !== null && (
        <WeaponDetailDrawer
          weaponNumber={detailNumber}
          onClose={() => setDetailNumber(null)}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// 個体カード
// ────────────────────────────────────────────────────────

function WeaponInstanceCard({
  weapon,
  onEquip,
  onDetail,
  pending,
}: {
  weapon: WeaponInstance;
  onEquip: () => void;
  onDetail: () => void;
  pending: boolean;
}) {
  const { is_equipped: equipped } = weapon;

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "relative rounded-2xl border p-4",
        equipped
          ? "border-ember-500/50 bg-ember-500/[0.06] shadow-glow"
          : "border-ink-700/70 bg-ink-800/40 hover:border-ink-600",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
            equipped
              ? "bg-ember-500/20 text-ember-400"
              : "bg-ink-900/80 text-ink-400",
          )}
        >
          <Swords className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-display text-[17px] font-medium text-ink-50">
              {weapon.weapon_name}
            </div>
            {equipped && <Badge tone="ember">装備中</Badge>}
            {weapon.shortcut_id > 0 && (
              <Badge tone="frost">SC {weapon.shortcut_id}</Badge>
            )}
          </div>
          <div className="mt-1 font-mono text-[11px] text-ink-500">
            #{weapon.weapon_number}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-ink-300">
              <Gauge className="h-3.5 w-3.5 text-frost-400" />
              <span className="font-mono tabular-nums">
                熟練度 {weapon.proficiency.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-ink-300">
              <Sparkle className="h-3.5 w-3.5 text-ember-400" />
              <span className="font-mono tabular-nums">
                エンチャント {weapon.enchant_count}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          size="sm"
          variant={equipped ? "secondary" : "primary"}
          disabled={equipped}
          onClick={onEquip}
          loading={pending}
          className="flex-1"
        >
          {equipped ? "装備中" : "装備する"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDetail}>
          詳細
        </Button>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────
// 詳細ドロワー
// ────────────────────────────────────────────────────────

function WeaponDetailDrawer({
  weaponNumber,
  onClose,
}: {
  weaponNumber: number;
  onClose: () => void;
}) {
  const { data, isLoading, isError, error } = useWeapon(weaponNumber);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-end bg-ink-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto border-l border-ink-800 bg-ink-900/95 p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Weapon Detail
            </p>
            <h2 className="mt-1 font-display text-2xl font-light text-ink-50">
              #{weaponNumber}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink-400 hover:bg-ink-800 hover:text-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-20" />
            <Skeleton className="h-32" />
          </div>
        ) : isError ? (
          <ErrorState className="mt-6" message={humanize(error)} />
        ) : data ? (
          <div className="mt-6 space-y-6">
            <div>
              <div className="font-display text-xl text-ink-50">
                {data.weapon_name}
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {data.is_equipped && <Badge tone="ember">装備中</Badge>}
                <Badge>カテゴリー {data.weapon_id}</Badge>
                {data.shortcut_id > 0 && (
                  <Badge tone="frost">ショートカット {data.shortcut_id}</Badge>
                )}
              </div>
            </div>

            <StatGrid
              stats={[
                { label: "熟練度", value: data.proficiency.toLocaleString() },
                { label: "エンチャント数", value: String(data.enchant_count) },
              ]}
            />

            {data.enchantments.length > 0 && (
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  Enchantments
                </div>
                <div className="space-y-2">
                  {data.enchantments.map((id, i) => (
                    <div
                      key={`${id}-${i}`}
                      className="flex items-center justify-between rounded-lg border border-ink-700/60 bg-ink-800/40 px-3 py-2"
                    >
                      <span className="font-body text-sm text-ink-100">
                        {data.enchantments_names[i] ?? "unknown"}
                      </span>
                      <span className="font-mono text-[11px] text-ink-500">
                        ID {id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                NBT
              </div>
              <pre className="max-h-64 overflow-auto rounded-lg border border-ink-700/60 bg-ink-950 p-3 font-mono text-[11px] leading-relaxed text-ink-300">
                {prettyNbt(data.nbt)}
              </pre>
            </div>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

function StatGrid({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-ink-700/60 bg-ink-800/40 p-3"
        >
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
            {s.label}
          </div>
          <div className="mt-1 font-display text-xl text-ink-50">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function prettyNbt(nbt: string): string {
  if (!nbt) return "(empty)";
  // API ドキュメント例の nbt は JSON っぽいが一部不正 (e.g. "damage": 1,1) なので
  // パースを試みつつ失敗したらそのまま表示する。
  try {
    return JSON.stringify(JSON.parse(nbt), null, 2);
  } catch {
    return nbt;
  }
}

function humanize(e: unknown): string {
  if (e instanceof ApiError) return e.body.error ?? e.message;
  return e instanceof Error ? e.message : "不明なエラー";
}
