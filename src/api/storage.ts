// Tauri Rust 側で実装したトークンストレージコマンドのラッパー。
// Web (非Tauri) 環境でも壊れないように、invoke が使えない場合は sessionStorage に
// フォールバックする (開発用途のみ)。

import type { TokenMeta } from "./types";

export interface StoredToken {
  access_token: string;
  meta: TokenMeta;
}

type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

let invoke: InvokeFn | null = null;

async function getInvoke(): Promise<InvokeFn | null> {
  if (invoke) return invoke;
  try {
    const mod = await import("@tauri-apps/api/core");
    invoke = mod.invoke as InvokeFn;
    return invoke;
  } catch {
    return null;
  }
}

const FALLBACK_KEY = "__restart_dev_token__";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function saveToken(
  accessToken: string,
  userId: string,
  expiresAt: number,
): Promise<void> {
  if (isTauri()) {
    const inv = await getInvoke();
    if (inv) {
      await inv<void>("save_token", {
        accessToken,
        userId,
        expiresAt,
      });
      return;
    }
  }
  // 開発時 (ブラウザで vite) 用フォールバック。
  // 本番ビルドでは必ず Tauri 側が使われる。
  sessionStorage.setItem(
    FALLBACK_KEY,
    JSON.stringify({
      access_token: accessToken,
      meta: { user_id: userId, expires_at: expiresAt },
    }),
  );
}

export async function loadToken(): Promise<StoredToken | null> {
  if (isTauri()) {
    const inv = await getInvoke();
    if (inv) {
      return await inv<StoredToken | null>("load_token");
    }
  }
  const raw = sessionStorage.getItem(FALLBACK_KEY);
  return raw ? (JSON.parse(raw) as StoredToken) : null;
}

export async function clearToken(): Promise<void> {
  if (isTauri()) {
    const inv = await getInvoke();
    if (inv) {
      await inv<void>("clear_token");
      return;
    }
  }
  sessionStorage.removeItem(FALLBACK_KEY);
}
