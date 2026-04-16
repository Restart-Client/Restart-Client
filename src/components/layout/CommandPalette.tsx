// Cmd+K (macOS) / Ctrl+K (Win/Linux) で開くコマンドパレット。
// - キャッシュ済みの全データから横断検索
// - ナビゲーションショートカット
// - 結果クリックで対応画面に遷移 + プリセレクト

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Backpack,
  Blocks,
  PawPrint,
  Search,
  Sparkles,
  Swords,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { qk } from "@/hooks/keys";
import { cn } from "@/lib/cn";
import type {
  ItemsResponse,
  MaterialsResponse,
  PetsResponse,
  SkillsResponse,
  WeaponCategoriesResponse,
} from "@/api/types";
import type { NavKey } from "@/components/layout/Sidebar";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (k: NavKey) => void;
}

type ResultKind = "nav" | "item" | "material" | "skill" | "weapon" | "pet";

interface Result {
  kind: ResultKind;
  id: string;
  label: string;
  sub?: string;
  icon: LucideIcon;
  nav: NavKey;
  score: number;
}

const KIND_LABEL: Record<ResultKind, string> = {
  nav: "ページ",
  item: "アイテム",
  material: "素材",
  skill: "スキル",
  weapon: "武器",
  pet: "ペット",
};

const KIND_ICON: Record<ResultKind, LucideIcon> = {
  nav: Search,
  item: Backpack,
  material: Blocks,
  skill: Sparkles,
  weapon: Swords,
  pet: PawPrint,
};

// 単純な部分一致スコア (名前ヒットを優先)
function score(text: string, q: string): number {
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 50;
  return 0;
}

export function CommandPalette({
  open,
  onClose,
  onNavigate,
}: CommandPaletteProps) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  // キャッシュから同期的に取得 (fetch はしない)
  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();

    const navResults: Result[] = [
      {
        kind: "nav",
        id: "nav:dashboard",
        label: "ダッシュボード",
        icon: Search,
        nav: "dashboard",
        score: term ? score("ダッシュボード dashboard", term) : 1,
      },
      {
        kind: "nav",
        id: "nav:weapons",
        label: "武器",
        icon: Swords,
        nav: "weapons",
        score: term ? score("武器 weapons", term) : 1,
      },
      {
        kind: "nav",
        id: "nav:skills",
        label: "スキル",
        icon: Sparkles,
        nav: "skills",
        score: term ? score("スキル skills", term) : 1,
      },
      {
        kind: "nav",
        id: "nav:items",
        label: "アイテム",
        icon: Backpack,
        nav: "items",
        score: term ? score("アイテム items", term) : 1,
      },
      {
        kind: "nav",
        id: "nav:materials",
        label: "素材",
        icon: Blocks,
        nav: "materials",
        score: term ? score("素材 materials", term) : 1,
      },
      {
        kind: "nav",
        id: "nav:pets",
        label: "ペット",
        icon: PawPrint,
        nav: "pets",
        score: term ? score("ペット pets", term) : 1,
      },
    ];

    if (!term) {
      // 空のときはナビだけ
      return navResults;
    }

    const items = qc.getQueryData<ItemsResponse>(qk.items());
    const mats = qc.getQueryData<MaterialsResponse>(qk.materials());
    const skills = qc.getQueryData<SkillsResponse>(qk.skills());
    const cats = qc.getQueryData<WeaponCategoriesResponse>(qk.weaponCategories());
    const pets = qc.getQueryData<PetsResponse>(qk.pets());

    const itemResults: Result[] =
      items?.items.map((it) => ({
        kind: "item",
        id: `item:${it.item_id}`,
        label: it.item_name,
        sub: `ID ${it.item_id} · ×${it.count}`,
        icon: Backpack,
        nav: "items",
        score: score(`${it.item_name} ${it.item_id}`, term),
      })) ?? [];

    const matResults: Result[] =
      mats?.materials.map((m) => ({
        kind: "material",
        id: `mat:${m.material_id}`,
        label: m.material_name,
        sub: `ID ${m.material_id} · ×${m.count}`,
        icon: Blocks,
        nav: "materials",
        score: score(`${m.material_name} ${m.material_id}`, term),
      })) ?? [];

    const skillResults: Result[] =
      skills?.skills.map((s) => ({
        kind: "skill",
        id: `skill:${s.skill_id}`,
        label: s.skill_name,
        sub: `ID ${s.skill_id} · ×${s.count}`,
        icon: Sparkles,
        nav: "skills",
        score: score(`${s.skill_name} ${s.skill_id}`, term),
      })) ?? [];

    const weaponResults: Result[] =
      cats?.weapon_categories.map((c) => ({
        kind: "weapon",
        id: `weapon:${c.weapon_id}`,
        label: c.weapon_name,
        sub: `ID ${c.weapon_id} · ${c.count}個体`,
        icon: Swords,
        nav: "weapons",
        score: score(`${c.weapon_name} ${c.weapon_id}`, term),
      })) ?? [];

    const petResults: Result[] =
      pets?.pets.map((p) => ({
        kind: "pet",
        id: `pet:${p.pet_id}`,
        label: p.name,
        sub: `${p.ability_name} · Lv ${Math.floor(Math.sqrt(p.experience))}`,
        icon: PawPrint,
        nav: "pets",
        score: score(`${p.name} ${p.ability_name}`, term),
      })) ?? [];

    return [
      ...navResults,
      ...itemResults,
      ...matResults,
      ...skillResults,
      ...weaponResults,
      ...petResults,
    ]
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
  }, [q, qc]);

  const grouped = useMemo(() => {
    const m = new Map<ResultKind, Result[]>();
    for (const r of results) {
      const arr = m.get(r.kind) ?? [];
      arr.push(r);
      m.set(r.kind, arr);
    }
    return m;
  }, [results]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) {
        onNavigate(r.nav);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  let runningIdx = 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-start justify-center bg-ink-950/70 pt-[12vh] backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/95 shadow-card backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 border-b border-ink-800 px-4">
            <Search className="h-4 w-4 text-ink-500" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleKey}
              placeholder="アイテム・ペット・ページ名で検索…"
              className="h-12 flex-1 bg-transparent font-body text-[15px] text-ink-50 placeholder:text-ink-500 focus:outline-none"
            />
            <kbd className="rounded border border-ink-700 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-ink-400">
              ESC
            </kbd>
          </div>
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {results.length === 0 ? (
              <div className="px-5 py-12 text-center font-body text-sm text-ink-500">
                該当する結果がありません
              </div>
            ) : (
              Array.from(grouped.entries()).map(([kind, arr]) => (
                <div key={kind} className="py-1">
                  <div className="px-5 pb-1.5 pt-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    {KIND_LABEL[kind]}
                  </div>
                  {arr.map((r) => {
                    const Icon = r.icon ?? KIND_ICON[r.kind];
                    const isActive = runningIdx === active;
                    const myIdx = runningIdx;
                    runningIdx++;
                    return (
                      <button
                        key={r.id}
                        onMouseEnter={() => setActive(myIdx)}
                        onClick={() => {
                          onNavigate(r.nav);
                          onClose();
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 px-5 py-2 text-left transition-colors",
                          isActive
                            ? "bg-ember-500/10 text-ink-50"
                            : "text-ink-200 hover:bg-ink-800/60",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive ? "text-ember-400" : "text-ink-500",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-body text-[14px]">
                            {r.label}
                          </div>
                          {r.sub && (
                            <div className="truncate font-mono text-[10px] text-ink-500">
                              {r.sub}
                            </div>
                          )}
                        </div>
                        {isActive && (
                          <kbd className="rounded border border-ink-700 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-ink-400">
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-between border-t border-ink-800 px-4 py-2 font-mono text-[10px] text-ink-500">
            <div className="flex items-center gap-2">
              <kbd className="rounded border border-ink-700 bg-ink-800 px-1.5 py-0.5">
                ↑↓
              </kbd>
              <span>移動</span>
              <kbd className="rounded border border-ink-700 bg-ink-800 px-1.5 py-0.5">
                ↵
              </kbd>
              <span>開く</span>
            </div>
            <div>{results.length} 件</div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
