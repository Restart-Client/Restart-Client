// HUD の半透明コンテナ + スライドイン/アウトアニメーション。
// 'hud:toggle' イベントで開閉する。閉じアニメ完了後に Tauri ウィンドウを hide。
// フォーカスアウト時は autoDim 設定に従い半透明化する。

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { HudHeader } from "./HudHeader";
import { HudTabs } from "./HudTabs";
import { HudPresetBar } from "./HudPresetBar";

type AuthStatus = "loading" | "unauthenticated" | "authenticated" | "expired";

export function HudShell() {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(true);
  const status = useAuthStore((s) => s.status) as AuthStatus;
  const autoDim = useSettingsStore((s) => s.settings.hud.autoDim);
  const autoDimOpacity = useSettingsStore((s) => s.settings.hud.autoDimOpacity);
  const containerRef = useRef<HTMLDivElement>(null);

  // hud:toggle イベントをリッスン
  useEffect(() => {
    const unlisten = listen<void>("hud:toggle", () => {
      setOpen((v) => !v);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // ウィンドウフォーカス変化を監視
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
      getCurrentWindow()
        .onFocusChanged(({ payload: isFocused }) => {
          setFocused(isFocused);
        })
        .then((fn) => {
          cleanup = fn;
        });
    });
    return () => {
      cleanup?.();
    };
  }, []);

  // Esc キーで閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // 外側クリックで閉じる (HUD の外 = 透明領域)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const opacity = !focused && autoDim ? autoDimOpacity : 1;

  return (
    // 画面全体を覆う透明なオーバーレイ (クリック判定用)
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <motion.div
        ref={containerRef}
        className="absolute inset-y-0 right-0 w-[360px] flex flex-col pointer-events-auto
                   bg-ink-950/90 backdrop-blur-2xl border-l border-ink-800/50 shadow-2xl"
        initial={{ x: 400 }}
        animate={{ x: open ? 0 : 400, opacity }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onAnimationComplete={() => {
          if (!open) {
            invoke("hide_hud").catch(() => {});
          }
        }}
      >
        {/* ドラッグハンドル */}
        <div
          className="flex items-center justify-center h-6 cursor-ns-resize select-none shrink-0"
          data-tauri-drag-region
        >
          <div className="w-8 h-1 rounded-full bg-ink-700" />
        </div>

        {/* ヘッダー: Lv / EXP / トークン残り時間 */}
        <HudHeader onClose={() => setOpen(false)} />

        {/* タブバー + コンテンツ */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {status === "authenticated" ? (
            <HudTabs />
          ) : (
            <UnauthenticatedView status={status} />
          )}
        </div>

        {/* プリセットバー (常時表示) */}
        {status === "authenticated" && <HudPresetBar />}
      </motion.div>
    </div>
  );
}

function UnauthenticatedView({ status }: { status: AuthStatus }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
      {status === "loading" ? (
        <div className="text-ink-400 text-sm font-mono">loading…</div>
      ) : (
        <>
          <div className="text-ember-400 text-2xl">🔐</div>
          <p className="text-ink-300 text-sm leading-relaxed">
            Desk モードからログインしてください。
          </p>
          <p className="text-ink-500 text-xs">
            トレイアイコン → 「Desk を開く」
          </p>
        </>
      )}
    </div>
  );
}
