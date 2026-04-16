// ログイン後のメインレイアウト。
// - サイドバー + メインエリア
// - Cmd+K でコマンドパレット開閉 (グローバルショートカット)
// - ページ切替時の控えめなフェード

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import type { NavKey } from "@/components/layout/Sidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Dashboard } from "@/pages/Dashboard";
import { WeaponsPage } from "@/pages/WeaponsPage";
import { SkillsPage } from "@/pages/SkillsPage";
import { ItemsPage } from "@/pages/ItemsPage";
import { MaterialsPage } from "@/pages/MaterialsPage";
import { PetsPage } from "@/pages/PetsPage";

export function AppShell() {
  const [nav, setNav] = useState<NavKey>("dashboard");
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd/Ctrl + K でコマンドパレット
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleNavigate = useCallback((k: NavKey) => {
    setNav(k);
    // ページトップまで戻す (メインエリアが scroll 持ち)
    const main = document.getElementById("app-main");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink-950">
      {/* グローバル背景 */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.25]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 0% 0%, rgba(245,155,46,0.08), transparent 50%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(56,189,248,0.06), transparent 50%)",
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-grain opacity-20 mix-blend-overlay" />

      <div className="relative flex h-full w-full">
        <Sidebar
          current={nav}
          onChange={handleNavigate}
          onOpenCommandPalette={() => setPaletteOpen(true)}
        />

        <main
          id="app-main"
          data-tauri-drag-region
          className="relative flex-1 overflow-y-auto"
        >
          <div data-tauri-drag-region={false as unknown as string}>
            <AnimatePresence mode="wait">
              <motion.div
                key={nav}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {nav === "dashboard" && <Dashboard onNavigate={handleNavigate} />}
                {nav === "weapons" && <WeaponsPage />}
                {nav === "skills" && <SkillsPage />}
                {nav === "items" && <ItemsPage />}
                {nav === "materials" && <MaterialsPage />}
                {nav === "pets" && <PetsPage />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
