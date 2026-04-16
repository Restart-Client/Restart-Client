// 右下常時表示のレート制限ゲージ。
// 30 req / 60s のうち、クライアント側で記録したぶんを視覚化する。

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gauge } from "lucide-react";
import { RATE_LIMIT_CONFIG, useRateLimitStore } from "@/api/rate-limit";
import { cn } from "@/lib/cn";

export function RateLimitIndicator() {
  const snapshot = useRateLimitStore((s) => s.snapshot);
  const [, tick] = useState(0);

  // 1 秒ごとに再描画してリセットカウントダウンを進める
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { used, remaining, resetInMs } = snapshot();
  const ratio = used / RATE_LIMIT_CONFIG.LIMIT;

  const tone =
    ratio >= 0.9 ? "danger" : ratio >= 0.6 ? "warn" : "ok";

  const toneClasses = {
    ok: "text-life",
    warn: "text-ember-400",
    danger: "text-danger",
  }[tone];

  const barColor = {
    ok: "bg-life",
    warn: "bg-ember-500",
    danger: "bg-danger",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pointer-events-none fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-xl border border-ink-700/60 bg-ink-900/80 px-3.5 py-2 text-xs backdrop-blur-md"
    >
      <Gauge className={cn("h-3.5 w-3.5", toneClasses)} />
      <div className="flex items-center gap-2 font-mono">
        <span className="text-ink-400">API</span>
        <span className="text-ink-100">
          {used}/{RATE_LIMIT_CONFIG.LIMIT}
        </span>
      </div>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-ink-700">
        <motion.div
          animate={{ width: `${Math.min(100, ratio * 100)}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className={cn("h-full rounded-full", barColor)}
        />
      </div>
      {resetInMs > 0 && (
        <span className="font-mono text-[10px] tabular-nums text-ink-500">
          reset {Math.ceil(resetInMs / 1000)}s
        </span>
      )}
      <span className="sr-only">
        残り {remaining} リクエスト
      </span>
    </motion.div>
  );
}
