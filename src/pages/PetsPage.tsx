// ペット画面。
// 上部に「戦闘編成」(最大3体 = 現行API上限) のスロット表示、
// 下部に所持ペット全リスト。クリックで戦闘参加トグル、
// 一括セット・一括解除ボタンも用意。

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Filter,
  Flame,
  PawPrint,
  Plus,
  Search,
  Sword,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { SearchField } from "@/components/ui/SearchField";
import { usePets } from "@/hooks/queries";
import {
  useRemoveAllBattlePets,
  useSetBattlePets,
  useTogglePet,
} from "@/hooks/mutations";
import { ApiError } from "@/api/client";
import { cn } from "@/lib/cn";
import type { Pet } from "@/api/types";

const MAX_BATTLE_SLOTS = 3; // API ドキュメント準拠

export function PetsPage() {
  const { data, isLoading, isError, error, refetch } = usePets();
  const togglePet = useTogglePet();
  const setBattlePets = useSetBattlePets();
  const removeAll = useRemoveAllBattlePets();

  const [q, setQ] = useState("");
  const [onlyBattle, setOnlyBattle] = useState(false);
  const [detailPet, setDetailPet] = useState<Pet | null>(null);

  const pets = data?.pets ?? [];
  const battlePets = useMemo(() => pets.filter((p) => p.battle), [pets]);
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return pets
      .filter((p) => (onlyBattle ? p.battle : true))
      .filter((p) =>
        qq
          ? p.name.toLowerCase().includes(qq) ||
            p.ability_name.toLowerCase().includes(qq) ||
            String(p.pet_id).includes(qq)
          : true,
      );
  }, [pets, q, onlyBattle]);

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <PageHeader
        eyebrow="Companions"
        title="ペット"
        description={`戦闘スロットは最大 ${MAX_BATTLE_SLOTS} 体。カードをクリックで参加/解除を切り替えられます。`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              disabled={battlePets.length === 0}
              loading={removeAll.isPending}
              onClick={() => removeAll.mutate()}
            >
              全解除
            </Button>
          </div>
        }
      />

      {/* 戦闘スロット */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-ember-400" />
          <h2 className="font-display text-sm font-medium tracking-wide text-ink-100">
            戦闘編成
          </h2>
          <Badge tone={battlePets.length >= MAX_BATTLE_SLOTS ? "ember" : "neutral"}>
            {battlePets.length} / {MAX_BATTLE_SLOTS}
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: MAX_BATTLE_SLOTS }).map((_, i) => {
            const pet = battlePets[i];
            return (
              <BattleSlot
                key={i}
                pet={pet}
                onRemove={() => pet && togglePet.mutate(pet.pet_id)}
                onOpenDetail={() => pet && setDetailPet(pet)}
              />
            );
          })}
        </div>
      </div>

      {/* フィルタ */}
      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-ink-800 pt-6">
        <SearchField
          placeholder="名前・特性・ID で検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onClear={() => setQ("")}
          className="max-w-sm flex-1"
        />
        <Button
          size="sm"
          variant={onlyBattle ? "primary" : "ghost"}
          leftIcon={<Filter className="h-3.5 w-3.5" />}
          onClick={() => setOnlyBattle((v) => !v)}
        >
          戦闘中のみ
        </Button>
        <div className="ml-auto font-mono text-xs text-ink-500">
          {filtered.length} / {pets.length}
        </div>
      </div>

      {/* ペット一覧 */}
      <div className="mt-5">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px]" />
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
            icon={<Search className="h-5 w-5" />}
            title={
              q
                ? "該当するペットがいません"
                : onlyBattle
                  ? "戦闘参加中のペットはいません"
                  : "ペットを所持していません"
            }
          />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence>
              {filtered.map((p) => {
                const full =
                  battlePets.length >= MAX_BATTLE_SLOTS && !p.battle;
                return (
                  <PetCard
                    key={p.pet_id}
                    pet={p}
                    onToggle={() => togglePet.mutate(p.pet_id)}
                    onDetail={() => setDetailPet(p)}
                    disabled={full}
                    pending={
                      togglePet.isPending && togglePet.variables === p.pet_id
                    }
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {detailPet && (
          <PetDetailDrawer pet={detailPet} onClose={() => setDetailPet(null)} />
        )}
      </AnimatePresence>

      {/* 一括セットツールチップ (将来のプリセット機能への布石) */}
      {setBattlePets.isPending && (
        <div className="pointer-events-none fixed bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-ink-800 px-4 py-2 text-sm text-ink-100 shadow-card">
          編成を反映中…
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// 戦闘スロット
// ────────────────────────────────────────────────────────

function BattleSlot({
  pet,
  onRemove,
  onOpenDetail,
}: {
  pet: Pet | undefined;
  onRemove: () => void;
  onOpenDetail: () => void;
}) {
  if (!pet) {
    return (
      <div className="flex h-[96px] items-center justify-center rounded-2xl border border-dashed border-ink-700/60 bg-ink-900/30 text-ink-500">
        <div className="flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" />
          空きスロット
        </div>
      </div>
    );
  }
  return (
    <motion.div
      layoutId={`slot-${pet.pet_id}`}
      className="group relative flex h-[96px] items-center gap-3 overflow-hidden rounded-2xl border border-ember-500/40 bg-gradient-to-br from-ember-500/[0.08] to-transparent px-3"
    >
      <PetAvatar pet={pet} size={64} />
      <button
        onClick={onOpenDetail}
        className="min-w-0 flex-1 text-left focus:outline-none"
      >
        <div className="truncate font-display text-[15px] font-medium text-ink-50">
          {pet.name}
        </div>
        <div className="truncate font-mono text-[10px] text-ink-500">
          Lv {Math.floor(Math.sqrt(pet.experience))}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-frost-400" />
          <span className="truncate font-body text-[11px] text-ink-300">
            {pet.ability_name}
          </span>
        </div>
      </button>
      <button
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-md p-1 text-ink-500 opacity-0 transition-opacity hover:bg-ink-800 hover:text-ink-100 group-hover:opacity-100"
        aria-label="解除"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────
// ペットカード
// ────────────────────────────────────────────────────────

function PetCard({
  pet,
  onToggle,
  onDetail,
  disabled,
  pending,
}: {
  pet: Pet;
  onToggle: () => void;
  onDetail: () => void;
  disabled: boolean;
  pending: boolean;
}) {
  const level = Math.floor(Math.sqrt(pet.experience));
  return (
    <motion.div
      layout
      layoutId={pet.battle ? undefined : `card-${pet.pet_id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border",
        pet.battle
          ? "border-ember-500/45 bg-ember-500/[0.04]"
          : "border-ink-700/70 bg-ink-800/40 hover:border-ink-600",
      )}
    >
      {pet.battle && (
        <div className="absolute left-3 top-3 z-10">
          <Badge tone="ember">
            <Flame className="h-3 w-3" /> 戦闘中
          </Badge>
        </div>
      )}

      <button
        onClick={onDetail}
        className="flex items-center justify-center bg-ink-950/40 py-5 focus:outline-none"
      >
        <PetAvatar pet={pet} size={96} />
      </button>

      <div className="border-t border-ink-800/80 p-4">
        <div className="flex items-center gap-2">
          <div className="truncate font-display text-[16px] font-medium text-ink-50">
            {pet.name}
          </div>
          <Badge>Lv {level}</Badge>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-frost-400" />
          <span className="truncate font-body text-[12px] text-ink-300">
            {pet.ability_name}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <Sword className="h-3 w-3 text-ember-400" />
          <span className="font-mono text-[11px] text-ink-400">
            ATK {pet.atk_percent}%
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            variant={pet.battle ? "secondary" : "primary"}
            onClick={onToggle}
            disabled={disabled}
            loading={pending}
            className="flex-1"
          >
            {pet.battle ? "編成から外す" : disabled ? "スロット満杯" : "編成に入れる"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onDetail}>
            詳細
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────
// ペットアバター (画像 or フォールバック)
// ────────────────────────────────────────────────────────

function PetAvatar({ pet, size }: { pet: Pet; size: number }) {
  const [error, setError] = useState(false);
  if (error || !pet.img) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-ink-800 text-ink-400"
        style={{ width: size, height: size }}
      >
        <PawPrint className="h-1/2 w-1/2" />
      </div>
    );
  }
  return (
    <img
      src={pet.img}
      alt={pet.name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setError(true)}
      className="rounded-full object-cover ring-2 ring-ink-800"
      style={{ width: size, height: size }}
    />
  );
}

// ────────────────────────────────────────────────────────
// ペット詳細ドロワー
// ────────────────────────────────────────────────────────

function PetDetailDrawer({
  pet,
  onClose,
}: {
  pet: Pet;
  onClose: () => void;
}) {
  const level = Math.floor(Math.sqrt(pet.experience));
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
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Pet Detail
            </p>
            <h2 className="mt-1 font-display text-2xl font-light text-ink-50">
              {pet.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink-400 hover:bg-ink-800 hover:text-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <PetAvatar pet={pet} size={96} />
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {pet.battle && <Badge tone="ember">戦闘中</Badge>}
              <Badge>Lv {level}</Badge>
              <Badge tone="frost">ATK {pet.atk_percent}%</Badge>
            </div>
            <div className="font-mono text-[11px] text-ink-500">
              #{pet.pet_id} · enemy {pet.enemy_id}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
            Ability
          </div>
          <div className="rounded-xl border border-ink-700/60 bg-ink-800/40 p-3">
            <div className="font-body text-sm text-ink-100">
              {pet.ability_name}
            </div>
            <div className="mt-1 font-mono text-[11px] text-ink-500">
              ID {pet.ability_id}
            </div>
          </div>
        </div>

        {pet.skills.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Skills
            </div>
            <div className="space-y-2">
              {pet.skills.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-ink-700/60 bg-ink-800/40 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-body text-sm text-ink-100">
                      {s.name}
                    </span>
                    <span className="font-mono text-[11px] text-ink-400">
                      {(s.percent * 100).toFixed(1)}%
                    </span>
                  </div>
                  {s.description && (
                    <p className="mt-1 font-body text-xs leading-relaxed text-ink-400">
                      {s.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
            Experience
          </div>
          <div className="rounded-xl border border-ink-700/60 bg-ink-800/40 p-3 font-mono text-sm text-ink-100">
            {pet.experience.toLocaleString()} exp
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function humanize(e: unknown): string {
  if (e instanceof ApiError) return e.body.error ?? e.message;
  return e instanceof Error ? e.message : "不明なエラー";
}
