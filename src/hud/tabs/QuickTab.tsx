// クイックタブ: 現在装備中のものを 1 画面に集約。

import { Sword, Sparkles, Wrench, PawPrint, ChevronRight } from "lucide-react";
import type { HudTabId } from "../hud-types";
import { useBattlePets } from "@/hooks/queries";
import { useSettingsStore } from "@/stores/settings";
import { cn } from "@/lib/cn";

interface QuickTabProps {
  onNavigate: (tab: HudTabId) => void;
}

export function QuickTab({ onNavigate }: QuickTabProps) {
  const { data: battleData } = useBattlePets();
  const lastEquipped = useSettingsStore((s) => s.settings.lastEquipped);

  const battlePets = battleData?.pets ?? [];

  return (
    <div className="p-3 space-y-3">
      {/* 武器 */}
      <Section
        icon={<Sword size={13} />}
        label="武器"
        onNavigate={() => onNavigate("weapons")}
      >
        <NavHint label="武器タブで確認・変更" />
      </Section>

      {/* スキル */}
      <Section
        icon={<Sparkles size={13} />}
        label="スキル"
        onNavigate={() => onNavigate("skills")}
      >
        {lastEquipped.skillId ? (
          <ItemRow
            name={`スキル ID: ${lastEquipped.skillId}`}
            equipped
          />
        ) : (
          <NavHint label="スキルタブで確認・変更" />
        )}
      </Section>

      {/* ツール */}
      <Section
        icon={<Wrench size={13} />}
        label="ツール"
        onNavigate={() => onNavigate("inventory")}
      >
        {lastEquipped.toolId ? (
          <ItemRow name={`ツール ID: ${lastEquipped.toolId}`} equipped />
        ) : (
          <NavHint label="所持タブで確認・変更" />
        )}
      </Section>

      {/* ペット */}
      <Section
        icon={<PawPrint size={13} />}
        label={`戦闘編成 (${battlePets.length}/3)`}
        onNavigate={() => onNavigate("pets")}
      >
        <div className="flex gap-1.5 mt-1">
          {[0, 1, 2].map((i) => {
            const pet = battlePets[i];
            return (
              <button
                key={i}
                onClick={() => onNavigate("pets")}
                className={cn(
                  "flex-1 h-11 rounded-lg border text-sm transition-colors",
                  "flex flex-col items-center justify-center gap-0.5",
                  pet
                    ? "border-ink-700 bg-ink-800/50 hover:bg-ink-700/50"
                    : "border-ink-800 border-dashed text-ink-600 hover:border-ink-600",
                )}
                title={pet?.name ?? "スロット空き"}
              >
                {pet ? (
                  <>
                    <span className="text-sm">🐾</span>
                    <span className="text-[9px] font-mono text-ink-400 truncate px-1 max-w-full">
                      {pet.name.slice(0, 6)}
                    </span>
                  </>
                ) : (
                  <span className="text-ink-700">+</span>
                )}
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon,
  label,
  onNavigate,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onNavigate}
        className="flex items-center gap-1.5 w-full mb-1 text-left group"
      >
        <span className="text-ink-500">{icon}</span>
        <span className="text-[11px] font-mono text-ink-400 group-hover:text-ink-300 transition-colors">
          {label}
        </span>
        <ChevronRight
          size={11}
          className="text-ink-700 group-hover:text-ink-500 ml-auto transition-colors"
        />
      </button>
      {children}
    </div>
  );
}

function ItemRow({
  name,
  sub,
  equipped,
}: {
  name: string;
  sub?: string;
  equipped?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-2.5 py-1.5 rounded-lg border",
        equipped
          ? "border-ember-500/30 bg-ember-500/10"
          : "border-ink-700/50 bg-ink-800/30",
      )}
    >
      <div className="text-xs text-ink-100 font-medium truncate">{name}</div>
      {sub && <div className="text-[10px] text-ink-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function NavHint({ label }: { label: string }) {
  return (
    <div className="px-2.5 py-1.5 rounded-lg border border-ink-800 border-dashed">
      <span className="text-[11px] text-ink-600">{label}</span>
    </div>
  );
}
