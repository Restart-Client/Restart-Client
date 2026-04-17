// Desk ↔ HUD ウィンドウ間のデータ同期。
// 片方で装備変更したときにもう片方のキャッシュを invalidate する。

import { emit, listen } from "@tauri-apps/api/event";
import type { QueryClient } from "@tanstack/react-query";
import { qk } from "@/hooks/keys";

export type DataSyncEvent =
  | "data:exp:changed"
  | "data:weapons:changed"
  | "data:skills:changed"
  | "data:pets:changed"
  | "data:items:changed"
  | "data:materials:changed";

export function emitDataChanged(event: DataSyncEvent): void {
  emit(event, null).catch(() => {});
}

export function setupWindowSync(queryClient: QueryClient): () => void {
  const unlisteners: Promise<() => void>[] = [
    listen("data:exp:changed", () => {
      queryClient.invalidateQueries({ queryKey: qk.exp() });
    }),
    listen("data:weapons:changed", () => {
      queryClient.invalidateQueries({ queryKey: qk.weaponCategories() });
      queryClient.invalidateQueries({ queryKey: ["weapons-in-category"] });
    }),
    listen("data:skills:changed", () => {
      queryClient.invalidateQueries({ queryKey: qk.skills() });
    }),
    listen("data:pets:changed", () => {
      queryClient.invalidateQueries({ queryKey: qk.pets() });
      queryClient.invalidateQueries({ queryKey: qk.battlePets() });
    }),
    listen("data:items:changed", () => {
      queryClient.invalidateQueries({ queryKey: qk.items() });
    }),
    listen("data:materials:changed", () => {
      queryClient.invalidateQueries({ queryKey: qk.materials() });
    }),
  ];

  return () => {
    unlisteners.forEach((p) => p.then((fn) => fn()));
  };
}
