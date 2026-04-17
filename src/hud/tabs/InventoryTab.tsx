// インベントリタブ: アイテム / 素材 サブタブ表示。

import { useState } from "react";
import { Search, Wrench } from "lucide-react";
import { useItems, useMaterials } from "@/hooks/queries";
import { useSetTool } from "@/hooks/mutations";
import { useSettingsStore } from "@/stores/settings";
import { cn } from "@/lib/cn";
import { emitDataChanged } from "@/lib/window-sync";

type SubTab = "items" | "materials";

export function InventoryTab() {
  const [subTab, setSubTab] = useState<SubTab>("items");
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col h-full">
      {/* サブタブ */}
      <div className="flex border-b border-ink-800/50 shrink-0">
        {(["items", "materials"] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              "flex-1 py-2 text-xs font-mono transition-colors border-b-2",
              subTab === t
                ? "border-ember-500 text-ember-400"
                : "border-transparent text-ink-500 hover:text-ink-300",
            )}
          >
            {t === "items" ? "アイテム" : "素材"}
          </button>
        ))}
      </div>

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

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto">
        {subTab === "items" ? (
          <ItemsList search={search} />
        ) : (
          <MaterialsList search={search} />
        )}
      </div>
    </div>
  );
}

function ItemsList({ search }: { search: string }) {
  const { data, isLoading } = useItems();
  const { mutate: setTool, isPending } = useSetTool();
  const toolHistory = useSettingsStore((s) => s.settings.toolHistory);
  const addToolHistory = useSettingsStore((s) => s.addToolHistory);
  const setLastTool = useSettingsStore((s) => s.setLastEquippedTool);

  const items = data?.items ?? [];
  const filtered = search
    ? items.filter(
        (i) =>
          i.item_name.toLowerCase().includes(search.toLowerCase()) ||
          String(i.item_id).includes(search),
      )
    : items;

  const sorted = [...filtered].sort((a, b) => b.count - a.count);

  function handleSetTool(itemId: number) {
    setTool(itemId, {
      onSuccess: () => {
        addToolHistory(itemId);
        setLastTool(itemId);
        emitDataChanged("data:items:changed");
      },
    });
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-ink-600 text-xs">loading…</div>
    );
  }

  return (
    <>
      {sorted.map((item) => (
        <div
          key={item.item_id}
          className="flex items-center gap-2 px-3 py-2 border-b border-ink-800/30 last:border-0"
        >
          <div className="flex-1 min-w-0">
            <div className="text-xs text-ink-100 truncate">{item.item_name}</div>
          </div>
          <span className="text-[10px] font-mono text-ink-500 shrink-0">
            ×{item.count}
          </span>
          {toolHistory.includes(item.item_id) && (
            <button
              onClick={() => handleSetTool(item.item_id)}
              disabled={isPending}
              className="p-1 rounded text-ink-500 hover:text-ember-400 transition-colors disabled:opacity-50"
              title="ツールとして装備"
            >
              <Wrench size={12} />
            </button>
          )}
        </div>
      ))}
      {sorted.length === 0 && (
        <div className="text-center py-8 text-ink-600 text-xs">
          見つかりません
        </div>
      )}
    </>
  );
}

function MaterialsList({ search }: { search: string }) {
  const { data, isLoading } = useMaterials();

  const materials = data?.materials ?? [];
  const filtered = search
    ? materials.filter((m) =>
        m.material_name.toLowerCase().includes(search.toLowerCase()),
      )
    : materials;

  const sorted = [...filtered].sort((a, b) => b.count - a.count);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-ink-600 text-xs">loading…</div>
    );
  }

  return (
    <>
      {sorted.map((mat) => (
        <div
          key={mat.material_id}
          className="flex items-center px-3 py-2 border-b border-ink-800/30 last:border-0"
        >
          <span className="flex-1 text-xs text-ink-100 truncate">
            {mat.material_name}
          </span>
          <span className="text-[10px] font-mono text-ink-500">
            ×{mat.count}
          </span>
        </div>
      ))}
      {sorted.length === 0 && (
        <div className="text-center py-8 text-ink-600 text-xs">
          見つかりません
        </div>
      )}
    </>
  );
}
