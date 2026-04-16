// UI 専用のセッション状態。
// API 上「現在装備中のスキル」を取得できないため、クライアント側で
// 「このセッションで最後に装備操作したスキル」を記憶し、UI でハイライトする。

import { create } from "zustand";

interface EquippedSkillState {
  equippedSkillId: number | null;
  setEquipped: (id: number | null) => void;
}

export const useEquippedSkillStore = create<EquippedSkillState>((set) => ({
  equippedSkillId: null,
  setEquipped: (id) => set({ equippedSkillId: id }),
}));
