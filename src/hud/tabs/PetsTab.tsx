// ペットタブ: 戦闘スロット + 所持ペット一覧。

import { useState } from "react";
import { Search } from "lucide-react";
import { usePets, useBattlePets } from "@/hooks/queries";
import { useTogglePet } from "@/hooks/mutations";
import { cn } from "@/lib/cn";
import { emitDataChanged } from "@/lib/window-sync";
import type { Pet } from "@/api/types";

export function PetsTab() {
  const [search, setSearch] = useState("");
  const { data: allData, isLoading } = usePets();
  const { data: battleData } = useBattlePets();
  const { mutate: togglePet, isPending } = useTogglePet();

  const pets = allData?.pets ?? [];
  const battlePets = battleData?.pets ?? pets.filter((p) => p.battle);

  const filtered = search
    ? pets.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          String(p.pet_id).includes(search),
      )
    : pets;

  function handleToggle(petId: number) {
    togglePet(petId, {
      onSuccess: () => emitDataChanged("data:pets:changed"),
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* 戦闘スロット */}
      <div className="p-2.5 border-b border-ink-800/50 shrink-0">
        <div className="text-[11px] font-mono text-ink-500 mb-2">
          戦闘編成 ({battlePets.length}/3)
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => {
            const pet = battlePets[i];
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 h-12 rounded-lg border flex flex-col items-center justify-center",
                  pet
                    ? "border-ember-500/30 bg-ember-500/10"
                    : "border-ink-800 border-dashed",
                )}
                title={pet?.name}
              >
                {pet ? (
                  <>
                    <span className="text-base">🐾</span>
                    <span className="text-[9px] font-mono text-ink-400 truncate px-1 max-w-full">
                      {pet.name.slice(0, 6)}
                    </span>
                  </>
                ) : (
                  <span className="text-ink-700 text-xs">+</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 検索 */}
      <div className="px-2 py-1.5 border-b border-ink-800/50 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono text-ink-500">
            所持 {pets.length}
          </span>
        </div>
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
            className="w-full bg-ink-800/50 border border-ink-700/50 rounded-lg pl-7 pr-3 py-1
                       text-xs text-ink-100 placeholder:text-ink-600 outline-none
                       focus:border-ember-500/50 transition-colors"
          />
        </div>
      </div>

      {/* ペット一覧 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-ink-600 text-xs">loading…</div>
        ) : (
          filtered.map((pet) => (
            <PetRow
              key={pet.pet_id}
              pet={pet}
              onToggle={() => handleToggle(pet.pet_id)}
              disabled={isPending || (!pet.battle && battlePets.length >= 3)}
            />
          ))
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-8 text-ink-600 text-xs">
            見つかりません
          </div>
        )}
      </div>
    </div>
  );
}

function PetRow({
  pet,
  onToggle,
  disabled,
}: {
  pet: Pet;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2.5 text-left",
        "border-b border-ink-800/30 last:border-0 transition-colors",
        "hover:bg-ink-800/40",
        pet.battle && "bg-ember-500/10",
        disabled && !pet.battle && "opacity-40 cursor-not-allowed",
      )}
    >
      <span className="text-base shrink-0">🐾</span>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-xs font-medium truncate",
            pet.battle ? "text-ember-200" : "text-ink-100",
          )}
        >
          {pet.name}
        </div>
        <div className="text-[10px] text-ink-600 mt-0.5">
          ATK {pet.atk_percent}%
          {pet.ability_name ? ` · ${pet.ability_name}` : ""}
        </div>
      </div>
      {pet.battle && (
        <span className="text-[10px] font-mono text-ember-400 shrink-0">
          戦闘中
        </span>
      )}
    </button>
  );
}
