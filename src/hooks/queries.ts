// 全エンドポイントの Query フック。
// staleTime は比較的長め (5 分) に取り、レート制限を節約する。

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { qk } from "./keys";
import { useApi, useAuthed } from "./use-api";

const LONG_STALE = 5 * 60 * 1000;

export function useExp() {
  const api = useApi();
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.exp(),
    queryFn: () => api.exp(),
    enabled,
    staleTime: LONG_STALE,
  });
}

export function useItems() {
  const api = useApi();
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.items(),
    queryFn: () => api.items(),
    enabled,
    staleTime: LONG_STALE,
  });
}

export function useMaterials() {
  const api = useApi();
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.materials(),
    queryFn: () => api.materials(),
    enabled,
    staleTime: LONG_STALE,
    retry: (failureCount, error) => {
      // 認証・権限エラーはリトライしない
      if (error instanceof ApiError && (error.isAuthError || error.isForbidden)) return false;
      return failureCount < 3;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}

export function useSkills() {
  const api = useApi();
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.skills(),
    queryFn: () => api.skills(),
    enabled,
    staleTime: LONG_STALE,
  });
}

export function useWeaponCategories() {
  const api = useApi();
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.weaponCategories(),
    queryFn: () => api.weaponCategories(),
    enabled,
    staleTime: LONG_STALE,
  });
}

export function useWeaponsInCategory(weaponId: number | null) {
  const api = useApi();
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.weaponsInCategory(weaponId ?? -1),
    queryFn: () => api.weaponsInCategory(weaponId as number),
    enabled: enabled && weaponId !== null,
    staleTime: LONG_STALE,
  });
}

export function useWeapon(weaponNumber: number | null) {
  const api = useApi();
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.weapon(weaponNumber ?? -1),
    queryFn: () => api.weapon(weaponNumber as number),
    enabled: enabled && weaponNumber !== null,
    staleTime: LONG_STALE,
  });
}

export function usePets() {
  const api = useApi();
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.pets(),
    queryFn: () => api.pets(),
    enabled,
    staleTime: LONG_STALE,
  });
}

export function useBattlePets() {
  const api = useApi();
  const enabled = useAuthed();
  return useQuery({
    queryKey: qk.battlePets(),
    queryFn: () => api.battlePets(),
    enabled,
    staleTime: LONG_STALE,
  });
}
