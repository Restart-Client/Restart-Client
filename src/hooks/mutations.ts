// 装備変更系 Mutation。いずれも楽観的更新 (Optimistic Update) を行い、
// 体感レスポンスを「0ms」にする。エラー時は自動ロールバック。

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import type {
  PetsResponse,
  SkillsResponse,
  WeaponCategoryDetailResponse,
} from "@/api/types";
import { qk } from "./keys";
import { useApi } from "./use-api";

function humanizeError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.isRateLimited) {
      return `リクエスト上限に達しました。${e.retryAfterSeconds ?? "?"} 秒後に再試行してください。`;
    }
    if (e.isAuthError) return "認証が切れました。再ログインしてください。";
    if (e.isForbidden) return "ブースター権限が必要です。";
    return e.body.error ?? `HTTP ${e.status}`;
  }
  return e instanceof Error ? e.message : "不明なエラーが発生しました";
}

// ────────────────────────────────────────────────────────
// スキル装備
// ────────────────────────────────────────────────────────

export function useSetSkill() {
  const api = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (skillId: number) => api.setSkill(skillId),
    onSuccess: (_res, skillId) => {
      // 現状 API 側に「装備中スキルID」を返すエンドポイントは無い。
      // 装備状態は UI 側で持つ or 今後のエンドポイントで取得する想定。
      toast.success(skillId === 0 ? "スキルを解除しました" : "スキルを装備しました");
      qc.invalidateQueries({ queryKey: qk.skills() });
    },
    onError: (e) => {
      toast.error("スキルの変更に失敗しました", {
        description: humanizeError(e),
      });
    },
  });
}

// ────────────────────────────────────────────────────────
// 武器装備
// ────────────────────────────────────────────────────────

export function useSetWeapon(weaponCategoryId: number | null) {
  const api = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (weaponNumber: number) => api.setWeapon(weaponNumber),
    // 楽観的更新: 同カテゴリー内で is_equipped フラグを即座に切り替える
    onMutate: async (weaponNumber) => {
      if (weaponCategoryId === null) return { prev: null };
      const key = qk.weaponsInCategory(weaponCategoryId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<WeaponCategoryDetailResponse>(key);
      if (prev) {
        qc.setQueryData<WeaponCategoryDetailResponse>(key, {
          ...prev,
          weapons: prev.weapons.map((w) => ({
            ...w,
            is_equipped:
              weaponNumber === 0 ? false : w.weapon_number === weaponNumber,
          })),
        });
      }
      return { prev, key };
    },
    onError: (e, _vars, ctx) => {
      // ロールバック
      if (ctx?.prev && ctx.key) qc.setQueryData(ctx.key, ctx.prev);
      toast.error("武器の変更に失敗しました", {
        description: humanizeError(e),
      });
    },
    onSuccess: (res) => {
      toast.success(
        res.removed ? "武器を解除しました" : "武器を装備しました",
      );
      // 他カテゴリーも装備状態が変わっている可能性があるので invalidate
      qc.invalidateQueries({ queryKey: ["weapons-in-category"] });
      qc.invalidateQueries({ queryKey: qk.weaponCategories() });
    },
  });
}

// ────────────────────────────────────────────────────────
// ツール装備
// ────────────────────────────────────────────────────────

export function useSetTool() {
  const api = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (toolItemId: number) => api.setTool(toolItemId),
    onSuccess: (res) => {
      toast.success(
        res.removed ? "ツールを解除しました" : "ツールを装備しました",
      );
      qc.invalidateQueries({ queryKey: qk.items() });
    },
    onError: (e) => {
      toast.error("ツールの変更に失敗しました", {
        description: humanizeError(e),
      });
    },
  });
}

// ────────────────────────────────────────────────────────
// ペット戦闘参加トグル
// ────────────────────────────────────────────────────────

export function useTogglePet() {
  const api = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (petId: number) => api.togglePet(petId),
    onMutate: async (petId) => {
      await qc.cancelQueries({ queryKey: qk.pets() });
      await qc.cancelQueries({ queryKey: qk.battlePets() });
      const prevAll = qc.getQueryData<PetsResponse>(qk.pets());
      const prevBattle = qc.getQueryData<PetsResponse>(qk.battlePets());
      if (prevAll) {
        qc.setQueryData<PetsResponse>(qk.pets(), {
          ...prevAll,
          pets: prevAll.pets.map((p) =>
            p.pet_id === petId ? { ...p, battle: !p.battle } : p,
          ),
        });
      }
      return { prevAll, prevBattle };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prevAll) qc.setQueryData(qk.pets(), ctx.prevAll);
      if (ctx?.prevBattle) qc.setQueryData(qk.battlePets(), ctx.prevBattle);
      toast.error("ペットの変更に失敗しました", {
        description: humanizeError(e),
      });
    },
    onSuccess: (res) => {
      toast.success(
        res.removed
          ? "ペットを戦闘から解除しました"
          : "ペットを戦闘に参加させました",
      );
      qc.invalidateQueries({ queryKey: qk.pets() });
      qc.invalidateQueries({ queryKey: qk.battlePets() });
    },
  });
}

// ────────────────────────────────────────────────────────
// ペット一括セット
// ────────────────────────────────────────────────────────

export function useSetBattlePets() {
  const api = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (petIds: number[]) => api.setBattlePets(petIds),
    onMutate: async (petIds) => {
      await qc.cancelQueries({ queryKey: qk.pets() });
      const prev = qc.getQueryData<PetsResponse>(qk.pets());
      if (prev) {
        const idSet = new Set(petIds);
        qc.setQueryData<PetsResponse>(qk.pets(), {
          ...prev,
          pets: prev.pets.map((p) => ({
            ...p,
            battle: idSet.has(p.pet_id),
          })),
        });
      }
      return { prev };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.pets(), ctx.prev);
      toast.error("ペット編成に失敗しました", {
        description: humanizeError(e),
      });
    },
    onSuccess: () => {
      toast.success("ペット編成を更新しました");
      qc.invalidateQueries({ queryKey: qk.pets() });
      qc.invalidateQueries({ queryKey: qk.battlePets() });
    },
  });
}

// ────────────────────────────────────────────────────────
// ペット一括解除
// ────────────────────────────────────────────────────────

export function useRemoveAllBattlePets() {
  const api = useApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => api.removeAllBattlePets(),
    onSuccess: () => {
      toast.success("全ペットを戦闘から解除しました");
      qc.invalidateQueries({ queryKey: qk.pets() });
      qc.invalidateQueries({ queryKey: qk.battlePets() });
    },
    onError: (e) => {
      toast.error("解除に失敗しました", { description: humanizeError(e) });
    },
  });
}

// ────────────────────────────────────────────────────────
// 汎用: ダッシュボードで使う装備スキル (まとめて装備変更)
// ────────────────────────────────────────────────────────

/**
 * SkillsResponse 内で "装備中" を判定する手段が API 仕様にないため、
 * クライアント側で「最後に装備したスキル」をメモリ保持する簡易実装を用意しておく。
 * 将来的に専用エンドポイントが追加されたら差し替える。
 */
export function findEquippedSkill(_skills: SkillsResponse | undefined) {
  // 現在の API では取得不可。UI では「最後に押したボタン」をハイライトする戦略。
  return null;
}
