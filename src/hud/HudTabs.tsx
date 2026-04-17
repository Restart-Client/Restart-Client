// HUD タブバー + コンテンツエリア。
// キー 1〜5 でタブ切替。

import { useState, useEffect, useCallback } from "react";
import { Zap, Sword, Sparkles, PawPrint, Package } from "lucide-react";
import { cn } from "@/lib/cn";
import type { HudTabId } from "./hud-types";
import { QuickTab } from "./tabs/QuickTab";
import { WeaponsTab } from "./tabs/WeaponsTab";
import { SkillsTab } from "./tabs/SkillsTab";
import { PetsTab } from "./tabs/PetsTab";
import { InventoryTab } from "./tabs/InventoryTab";

export type { HudTabId };

const TABS: {
  id: HudTabId;
  label: string;
  icon: React.ReactNode;
  key: string;
}[] = [
  { id: "quick", label: "クイック", icon: <Zap size={14} />, key: "1" },
  { id: "weapons", label: "武器", icon: <Sword size={14} />, key: "2" },
  { id: "skills", label: "スキル", icon: <Sparkles size={14} />, key: "3" },
  { id: "pets", label: "ペット", icon: <PawPrint size={14} />, key: "4" },
  { id: "inventory", label: "所持", icon: <Package size={14} />, key: "5" },
];

interface HudTabsProps {
  initialTab?: HudTabId;
}

export function HudTabs({ initialTab = "quick" }: HudTabsProps) {
  const [activeTab, setActiveTab] = useState<HudTabId>(initialTab);

  const goToTab = useCallback((id: HudTabId) => {
    setActiveTab(id);
  }, []);

  // 数字キーでタブ切替 (テキスト入力中は除外)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const tab = TABS.find((t) => t.key === e.key);
      if (tab) {
        e.preventDefault();
        setActiveTab(tab.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* タブバー */}
      <div className="flex shrink-0 border-b border-ink-800/50 bg-ink-950/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => goToTab(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-mono",
              "transition-colors border-b-2",
              activeTab === tab.id
                ? "border-ember-500 text-ember-400"
                : "border-transparent text-ink-500 hover:text-ink-300",
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {activeTab === "quick" && <QuickTab onNavigate={goToTab} />}
        {activeTab === "weapons" && <WeaponsTab />}
        {activeTab === "skills" && <SkillsTab />}
        {activeTab === "pets" && <PetsTab />}
        {activeTab === "inventory" && <InventoryTab />}
      </div>
    </div>
  );
}
