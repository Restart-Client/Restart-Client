// Query / Mutation 内で使う RestartApi を供給するヘルパー。
// createApiClient は内部で useAuthStore から毎回トークンを取得するので、
// 毎 render 新しいインスタンスを作っても問題ない。

import { useMemo } from "react";
import { RestartApi } from "@/api/endpoints";
import { createApiClient, useAuthStore } from "@/stores/auth";

export function useApi() {
  return useMemo(() => new RestartApi(createApiClient()), []);
}

/** 認証済みのときだけ enabled にする簡易フラグ */
export function useAuthed() {
  return useAuthStore((s) => s.status === "authenticated");
}
