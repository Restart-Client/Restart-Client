// HUD ウィンドウのルートコンポーネント。
// Desk と同じ QueryClient 設定・認証処理を持ちつつ、HUD シェルを描画する。

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { listen } from "@tauri-apps/api/event";

import { useAuthStore } from "@/stores/auth";
import { usePresetStore } from "@/stores/presets";
import { useSettingsStore } from "@/stores/settings";
import { onAuthError, ApiError } from "@/api/client";
import { setupWindowSync } from "@/lib/window-sync";
import { useApplyPreset } from "@/hooks/mutations";
import { HudShell } from "./HudShell";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (error.isAuthError || error.isForbidden) return false;
          if (error.isRateLimited) return false;
        }
        return failureCount < 2;
      },
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});

export function HudApp() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const markExpired = useAuthStore((s) => s.markExpired);

  useEffect(() => {
    hydrate();
    usePresetStore.getState().load();
    useSettingsStore.getState().load();
  }, [hydrate]);

  useEffect(() => {
    const unsub = onAuthError((err) => {
      if (err.isAuthError || err.isForbidden) {
        markExpired(
          err.isAuthError
            ? "トークンの有効期限が切れました。Desk で再ログインしてください。"
            : "ブースター権限がありません。",
        );
        queryClient.cancelQueries();
      }
    });
    return unsub;
  }, [markExpired]);

  useEffect(() => {
    return setupWindowSync(queryClient);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast:
              "!bg-ink-800/90 !border-ink-700 !text-ink-50 !font-body !rounded-xl !backdrop-blur-xl",
            description: "!text-ink-300",
          },
        }}
      />
      <PresetHotkeyHandler />
      <HudShell />
    </QueryClientProvider>
  );
}

// Ctrl+Shift+1〜5 でプリセット適用
function PresetHotkeyHandler() {
  const applyPreset = useApplyPreset();
  const presets = usePresetStore((s) => s.presets);

  useEffect(() => {
    const unlisten = listen<number>("preset:apply", ({ payload: index }) => {
      const preset = presets[index - 1];
      if (preset) applyPreset.mutate(preset);
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [presets, applyPreset]);

  return null;
}
