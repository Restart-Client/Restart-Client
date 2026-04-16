// アプリのルート。
// - 起動時にキーチェーンからトークン復元
// - 認証状態に応じて Login / AppShell を出し分け
// - 401/403 をグローバルに監視してログアウト

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

import { useAuthStore } from "@/stores/auth";
import { onAuthError, ApiError } from "@/api/client";
import { LoginScreen } from "@/pages/LoginScreen";
import { AppShell } from "@/components/layout/AppShell";
import { RateLimitIndicator } from "@/components/layout/RateLimitIndicator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          // 認証系・権限系はリトライしない
          if (error.isAuthError || error.isForbidden) return false;
          // レート制限もクエリ側ではリトライしない (ユーザーに待ってもらう)
          if (error.isRateLimited) return false;
        }
        return failureCount < 2;
      },
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export function App() {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const markExpired = useAuthStore((s) => s.markExpired);

  // 起動時のトークン復元
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // グローバル認証エラーハンドラ
  useEffect(() => {
    const unsub = onAuthError((err) => {
      if (err.isAuthError) {
        markExpired("トークンの有効期限が切れました。再ログインしてください。");
        queryClient.cancelQueries();
      } else if (err.isForbidden) {
        markExpired(
          "ブースター権限がありません。Discord でブースターになってから再度お試しください。",
        );
        queryClient.cancelQueries();
      }
    });
    return unsub;
  }, [markExpired]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              "!bg-ink-800 !border-ink-700 !text-ink-50 !font-body !rounded-xl",
            description: "!text-ink-300",
            actionButton: "!bg-ember-500 !text-ink-950",
          },
        }}
      />

      <AnimatePresence mode="wait">
        {status === "loading" && <HydrationSplash key="splash" />}
        {(status === "unauthenticated" || status === "expired") && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LoginScreen />
          </motion.div>
        )}
        {status === "authenticated" && (
          <motion.div
            key="shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AppShell />
            <RateLimitIndicator />
          </motion.div>
        )}
      </AnimatePresence>

      {import.meta.env.DEV && (
        <ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

function HydrationSplash() {
  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-screen w-screen items-center justify-center bg-ink-950"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-ember-400 to-ember-600">
          <div className="absolute inset-[2px] rounded-[10px] bg-ink-950" />
          <div className="absolute inset-0 flex items-center justify-center font-display text-xl font-black text-ember-400">
            R
          </div>
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-ink-500">
          loading…
        </div>
      </div>
    </motion.div>
  );
}
