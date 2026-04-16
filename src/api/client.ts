// Re'start API の fetch ラッパー。
// 役割:
//   - Authorization ヘッダーの自動付与
//   - クライアント側レート制限記録
//   - 429 のハンドリング (retry_after_seconds を尊重)
//   - 401/403 時のイベント発火 (ログアウト導線に使う)
//   - エラーの正規化

import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { useRateLimitStore } from "./rate-limit";
import type { ApiErrorBody, RateLimitErrorBody } from "./types";

// Tauri 環境では plugin-http の fetch を使う (CORS 回避)。
// ブラウザ開発時はネイティブ fetch にフォールバック。
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
const fetchFn: typeof globalThis.fetch = isTauri()
  ? (tauriFetch as unknown as typeof globalThis.fetch)
  : globalThis.fetch.bind(globalThis);

export const API_BASE_URL = "https://restart2api.restart-reboot.com";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
    message?: string,
  ) {
    super(message ?? body.error ?? `HTTP ${status}`);
    this.name = "ApiError";
  }

  /** トークン期限切れ・無効 */
  get isAuthError() {
    return this.status === 401;
  }
  /** ブースター権限なし */
  get isForbidden() {
    return this.status === 403;
  }
  /** レート制限超過 */
  get isRateLimited() {
    return this.status === 429;
  }

  get retryAfterSeconds(): number | null {
    if (!this.isRateLimited) return null;
    const body = this.body as RateLimitErrorBody;
    return body.retry_after_seconds ?? null;
  }
}

// 認証エラーを受け取ったときに発火する軽量イベントバス
type AuthErrorListener = (err: ApiError) => void;
const authErrorListeners = new Set<AuthErrorListener>();

export function onAuthError(listener: AuthErrorListener): () => void {
  authErrorListeners.add(listener);
  return () => authErrorListeners.delete(listener);
}

export interface ApiClientOptions {
  /** 現在のアクセストークン。null なら未ログイン扱い */
  getToken: () => string | null;
}

export class ApiClient {
  constructor(private options: ApiClientOptions) {}

  async request<T>(
    path: string,
    init: RequestInit = {},
    { requireAuth = true }: { requireAuth?: boolean } = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);

    if (requireAuth) {
      const token = this.options.getToken();
      if (!token) {
        throw new ApiError(401, { error: "missing bearer token" });
      }
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // クライアント側で送信を記録 (429を未然に避ける・UI表示のため)
    useRateLimitStore.getState().record();

    const url = `${API_BASE_URL}${path}`;
    console.debug(`[api] ${init.method ?? "GET"} ${url}`);
    console.debug(`[api] isTauri=${isTauri()}, fetchFn=${fetchFn.name || "anonymous"}`);

    let res: Response;
    try {
      res = await fetchFn(url, {
        ...init,
        headers,
      });
      console.debug(`[api] response status=${res.status}`);
    } catch (e) {
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.error(`[api] fetch threw:`, e);
      throw new ApiError(0, { error: "network error" }, msg);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    // body を一度 text で読み、Discord の 64bit user_id を文字列化してから parse する。
    // (JSON.parse は大きな整数を float に丸めて精度を失うため)
    const rawText = await res.text().catch(() => "");
    console.debug(`[api] raw body:`, rawText.slice(0, 200));

    let body: ApiErrorBody | T;
    try {
      const fixed = rawText.replace(/"user_id"\s*:\s*(\d+)/g, '"user_id":"$1"');
      body = JSON.parse(fixed) as ApiErrorBody | T;
    } catch {
      console.error(`[api] non-JSON response (HTTP ${res.status}):`, rawText);
      throw new ApiError(res.status, { error: `HTTP ${res.status}` });
    }

    if (!res.ok) {
      const err = new ApiError(res.status, body as ApiErrorBody);
      if (err.isAuthError || err.isForbidden) {
        for (const l of authErrorListeners) l(err);
      }
      throw err;
    }

    return body as T;
  }

  get<T>(path: string, opts?: { requireAuth?: boolean }) {
    return this.request<T>(path, { method: "GET" }, opts);
  }
  post<T>(path: string, body?: unknown, opts?: { requireAuth?: boolean }) {
    return this.request<T>(
      path,
      {
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      opts,
    );
  }
}
