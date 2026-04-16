// サーバー側のレート制限 (30 req / 60 秒) をクライアント側でも追跡する。
// これにより UI 上に残リクエスト数を表示したり、429 を未然に避けたりできる。

import { create } from "zustand";

const WINDOW_MS = 60_000;
const LIMIT = 30;

interface RateLimitState {
  timestamps: number[];
  record: () => void;
  /** 現在のウィンドウ内での使用状況 */
  snapshot: () => {
    used: number;
    remaining: number;
    resetInMs: number;
  };
  /** 安全にリクエストできるか (満杯でないか) */
  canRequest: () => boolean;
}

export const useRateLimitStore = create<RateLimitState>((set, get) => ({
  timestamps: [],
  record: () => {
    const now = Date.now();
    set((s) => ({
      timestamps: [...s.timestamps.filter((t) => now - t < WINDOW_MS), now],
    }));
  },
  snapshot: () => {
    const now = Date.now();
    const active = get().timestamps.filter((t) => now - t < WINDOW_MS);
    const oldest = active[0];
    return {
      used: active.length,
      remaining: Math.max(0, LIMIT - active.length),
      resetInMs: oldest ? WINDOW_MS - (now - oldest) : 0,
    };
  },
  canRequest: () => {
    const now = Date.now();
    const active = get().timestamps.filter((t) => now - t < WINDOW_MS);
    return active.length < LIMIT;
  },
}));

export const RATE_LIMIT_CONFIG = {
  WINDOW_MS,
  LIMIT,
} as const;
