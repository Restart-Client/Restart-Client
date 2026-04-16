// 認証状態を一元管理する Zustand ストア。
// - OS キーチェーンとの読み書きを担う
// - 残り有効期限を計算
// - アプリ起動時の復元を担う

import { create } from "zustand";
import {
  clearToken as clearStorage,
  loadToken,
  saveToken,
} from "@/api/storage";
import { ApiClient } from "@/api/client";
import { RestartApi } from "@/api/endpoints";
import { useEquippedSkillStore } from "@/stores/ui";

export type AuthStatus =
  | "loading" // 起動直後、ストレージ確認中
  | "unauthenticated" // トークンなし
  | "authenticated" // トークンあり・有効
  | "expired"; // 期限切れまたは 401

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  userId: string | null;
  /** Unix 秒 */
  expiresAt: number | null;
  /** 直近の認証エラーメッセージ (UI表示用) */
  lastError: string | null;

  /** アプリ起動時: キーチェーンから復元 */
  hydrate: () => Promise<void>;
  /** トークンを受け取って保存 */
  setToken: (token: {
    access_token: string;
    user_id: string;
    expires_in: number;
  }) => Promise<void>;
  /** サーバーに logout を投げた上でローカル削除 */
  logout: () => Promise<void>;
  /** 認証エラー発生時にローカル状態だけ落とす */
  markExpired: (message?: string) => Promise<void>;
  /** 手動エラークリア */
  clearError: () => void;
  /** 残り有効期限(ms) */
  msUntilExpiry: () => number | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  accessToken: null,
  userId: null,
  expiresAt: null,
  lastError: null,

  hydrate: async () => {
    try {
      const stored = await loadToken();
      if (!stored) {
        set({ status: "unauthenticated" });
        return;
      }
      const nowSec = Math.floor(Date.now() / 1000);
      if (stored.meta.expires_at <= nowSec) {
        await clearStorage();
        set({
          status: "expired",
          accessToken: null,
          userId: null,
          expiresAt: null,
          lastError: "トークンの有効期限が切れています。再ログインしてください。",
        });
        return;
      }
      set({
        status: "authenticated",
        accessToken: stored.access_token,
        userId: stored.meta.user_id,
        expiresAt: stored.meta.expires_at,
      });
    } catch (e) {
      set({
        status: "unauthenticated",
        lastError:
          e instanceof Error ? e.message : "トークン読み出しに失敗しました",
      });
    }
  },

  setToken: async ({ access_token, user_id, expires_in }) => {
    const expiresAt = Math.floor(Date.now() / 1000) + expires_in;
    await saveToken(access_token, user_id, expiresAt);
    set({
      status: "authenticated",
      accessToken: access_token,
      userId: user_id,
      expiresAt,
      lastError: null,
    });
  },

  logout: async () => {
    const token = get().accessToken;
    // サーバーにトークン無効化を依頼 (ベストエフォート)
    if (token) {
      try {
        const client = new ApiClient({ getToken: () => token });
        const api = new RestartApi(client);
        await api.logout();
      } catch {
        // 失効済み等は無視
      }
    }
    await clearStorage();
    // UI セッション状態もリセット
    useEquippedSkillStore.getState().setEquipped(null);
    set({
      status: "unauthenticated",
      accessToken: null,
      userId: null,
      expiresAt: null,
      lastError: null,
    });
  },

  markExpired: async (message) => {
    await clearStorage();
    useEquippedSkillStore.getState().setEquipped(null);
    set({
      status: "expired",
      accessToken: null,
      userId: null,
      expiresAt: null,
      lastError:
        message ?? "認証が切れました。再度ログインしてください。",
    });
  },

  clearError: () => set({ lastError: null }),

  msUntilExpiry: () => {
    const exp = get().expiresAt;
    if (!exp) return null;
    return exp * 1000 - Date.now();
  },
}));

/**
 * ApiClient を生成するヘルパー。
 * useAuthStore からトークンを動的に取得するので、
 * ログイン/ログアウトで自動的に追従する。
 */
export function createApiClient(): ApiClient {
  return new ApiClient({
    getToken: () => useAuthStore.getState().accessToken,
  });
}
