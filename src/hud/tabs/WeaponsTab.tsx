// 武器タブ: カテゴリーアコーディオン + ワンクリック装備。

import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { useWeaponCategories, useWeaponsInCategory } from "@/hooks/queries";
import { useSetWeapon } from "@/hooks/mutations";
import { cn } from "@/lib/cn";
import { emitDataChanged } from "@/lib/window-sync";
import type { WeaponCategory } from "@/api/types";

export function WeaponsTab() {
  const [search, setSearch] = useState("");
  const { data } = useWeaponCategories();
  const categories = data?.weapon_categories ?? [];

  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  // 初回: 最初のカテゴリを展開
  useEffect(() => {
    if (categories.length > 0 && openIds.size === 0) {
      setOpenIds(new Set([categories[0].weapon_id]));
    }
  }, [categories]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = search
    ? categories.filter((c) =>
        c.weapon_name.toLowerCase().includes(search.toLowerCase()),
      )
    : categories;

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

      {/* カテゴリ一覧 */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {filtered.map((cat) => (
          <CategoryRow
            key={cat.weapon_id}
            category={cat}
            open={openIds.has(cat.weapon_id)}
            onToggle={() => toggle(cat.weapon_id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-ink-600 text-xs">
            見つかりません
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  open,
  onToggle,
}: {
  category: WeaponCategory;
  open: boolean;
  onToggle: () => void;
}) {
  const { data } = useWeaponsInCategory(open ? category.weapon_id : null);
  const weapons = data?.weapons ?? [];
  const hasEquipped = weapons.some((w) => w.is_equipped);

  return (
    <div className="rounded-lg overflow-hidden border border-ink-800/50">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2 px-2.5 py-2 text-left transition-colors",
          "hover:bg-ink-800/40",
          hasEquipped ? "bg-ember-500/10" : "bg-ink-900/50",
        )}
      >
        {open ? (
          <ChevronDown size={12} className="text-ink-500 shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-ink-500 shrink-0" />
        )}
        <span
          className={cn(
            "text-xs font-medium flex-1 truncate",
            hasEquipped ? "text-ember-300" : "text-ink-300",
          )}
        >
          {category.weapon_name}
        </span>
        <span className="text-[10px] font-mono text-ink-600 shrink-0">
          ({category.count})
        </span>
      </button>

      {open && (
        <div className="bg-ink-950/50 border-t border-ink-800/30">
          {weapons.length === 0 && (
            <div className="text-center py-3 text-ink-600 text-xs">loading…</div>
          )}
          {weapons.map((weapon) => (
            <WeaponRow
              key={weapon.weapon_number}
              weaponNumber={weapon.weapon_number}
              weaponName={weapon.weapon_name}
              proficiency={weapon.proficiency}
              enchantCount={weapon.enchant_count}
              isEquipped={weapon.is_equipped}
              categoryId={category.weapon_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WeaponRow({
  weaponNumber,
  weaponName,
  proficiency,
  enchantCount,
  isEquipped,
  categoryId,
}: {
  weaponNumber: number;
  weaponName: string;
  proficiency: number;
  enchantCount: number;
  isEquipped: boolean;
  categoryId: number;
}) {
  const { mutate, isPending } = useSetWeapon(categoryId);

  function handleEquip() {
    if (isEquipped) return;
    mutate(weaponNumber, {
      onSuccess: () => emitDataChanged("data:weapons:changed"),
    });
  }

  return (
    <button
      onClick={handleEquip}
      disabled={isPending || isEquipped}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
        "hover:bg-ink-800/40 border-b border-ink-800/20 last:border-0",
        isEquipped && "bg-ember-500/10 cursor-default",
        isPending && "opacity-50 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full shrink-0",
          isEquipped ? "bg-ember-400" : "bg-ink-700",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-ink-100 truncate">
          {weaponName}{" "}
          <span className="text-ink-600">#{weaponNumber}</span>
        </div>
        <div className="text-[10px] text-ink-600 mt-0.5">
          熟練度 {proficiency}
          {enchantCount > 0 ? ` · ✨${enchantCount}` : ""}
        </div>
      </div>
      {isEquipped && (
        <CheckCircle2 size={13} className="text-ember-400 shrink-0" />
      )}
    </button>
  );
}
