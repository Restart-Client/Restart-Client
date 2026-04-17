// ログイン後の左サイドバー。v0.2 で全タブを有効化。

import { motion } from "framer-motion";
import {
  Backpack,
  Blocks,
  Command,
  LayoutGrid,
  LogOut,
  PawPrint,
  Search,
  Settings,
  Sparkles,
  Swords,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

export type NavKey =
  | "dashboard"
  | "weapons"
  | "skills"
  | "items"
  | "materials"
  | "pets"
  | "presets"
  | "settings";

interface NavItem {
  key: NavKey;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { key: "dashboard", label: "ダッシュボード", icon: LayoutGrid },
  { key: "weapons", label: "武器", icon: Swords },
  { key: "skills", label: "スキル", icon: Sparkles },
  { key: "items", label: "アイテム", icon: Backpack },
  { key: "materials", label: "素材", icon: Blocks },
  { key: "pets", label: "ペット", icon: PawPrint },
  { key: "presets", label: "プリセット", icon: Layers },
  { key: "settings", label: "設定", icon: Settings },
];

interface SidebarProps {
  current: NavKey;
  onChange: (k: NavKey) => void;
  onOpenCommandPalette: () => void;
}

export function Sidebar({
  current,
  onChange,
  onOpenCommandPalette,
}: SidebarProps) {
  const logout = useAuthStore((s) => s.logout);
  const userId = useAuthStore((s) => s.userId);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-ink-800/80 bg-ink-900/60 backdrop-blur-sm">
      {/* ロゴ */}
      <div
        data-tauri-drag-region
        className="flex items-center gap-2.5 px-5 pb-4 pt-6 select-none"
      >
        <div className="relative h-7 w-7 rounded-lg bg-gradient-to-br from-ember-400 to-ember-600">
          <div className="absolute inset-[2px] rounded-[6px] bg-ink-950" />
          <div className="absolute inset-0 flex items-center justify-center font-display text-sm font-black text-ember-400">
            R
          </div>
        </div>
        <div>
          <div className="font-display text-[13px] font-medium tracking-[0.18em] text-ink-100">
            RE&apos;START
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-500">
            v0.2.0
          </div>
        </div>
      </div>

      {/* 検索トリガ */}
      <div className="px-3 pb-2">
        <button
          onClick={onOpenCommandPalette}
          className="group flex w-full items-center gap-2 rounded-lg border border-ink-700/60 bg-ink-800/50 px-3 py-2 text-left transition-colors hover:border-ink-600 hover:bg-ink-800"
        >
          <Search className="h-3.5 w-3.5 text-ink-500 group-hover:text-ink-300" />
          <span className="flex-1 font-body text-[12px] text-ink-500 group-hover:text-ink-300">
            検索…
          </span>
          <kbd className="flex items-center gap-0.5 rounded border border-ink-700 bg-ink-900 px-1 py-0.5 font-mono text-[9px] text-ink-400">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>
      </div>

      <div className="mx-5 my-2 h-px bg-ink-800" />

      {/* ナビ */}
      <nav className="flex-1 px-3 py-3">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = current === item.key;
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <button
                  onClick={() => onChange(item.key)}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                    "font-body text-sm transition-colors",
                    active
                      ? "text-ink-50"
                      : "text-ink-400 hover:bg-ink-800/60 hover:text-ink-100",
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-ember-500/10 ring-1 ring-ember-500/25"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 32,
                      }}
                    />
                  )}
                  <Icon
                    className={cn(
                      "relative z-10 h-4 w-4 shrink-0",
                      active && "text-ember-400",
                    )}
                  />
                  <span className="relative z-10">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mx-5 h-px bg-ink-800" />

      {/* フッター */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-800 font-mono text-[11px] text-ink-300">
            {userId ? String(userId).slice(-2) : "??"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-mono text-[11px] text-ink-300">
              {userId ?? "----"}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-ink-600">
              Booster
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            logout().then(() => toast.success("ログアウトしました"));
          }}
          className={cn(
            "mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2",
            "font-body text-sm text-ink-400 transition-colors",
            "hover:bg-danger/10 hover:text-danger",
          )}
        >
          <LogOut className="h-4 w-4" />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
}
