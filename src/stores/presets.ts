// プリセット(装備セット)の永続化ストア。
// tauri-plugin-store を使って "presets.json" に保存する。

import { Store } from "@tauri-apps/plugin-store";
import { create } from "zustand";

export interface Preset {
  id: string;
  name: string;
  icon: string;            // lucide アイコン名
  color: string;           // ember / frost / life / ... のトークン名
  hotkey: string | null;   // "CommandOrControl+Shift+1" など
  weapon_number: number | null;
  skill_id: number | null;
  tool_id: number | null;  // 0 = 解除, null = 変更しない
  pet_ids: number[] | null;
  created_at: number;
  updated_at: number;
}

interface PresetState {
  presets: Preset[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (
    data: Omit<Preset, "id" | "created_at" | "updated_at">,
  ) => Promise<Preset>;
  update: (id: string, data: Partial<Omit<Preset, "id">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (ids: string[]) => Promise<void>;
}

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load("presets.json");
  }
  return store;
}

async function persist(presets: Preset[]) {
  const s = await getStore();
  await s.set("presets", presets);
  await s.save();
}

export const usePresetStore = create<PresetState>((set, get) => ({
  presets: [],
  loaded: false,

  async load() {
    try {
      const s = await getStore();
      const saved = await s.get<Preset[]>("presets");
      set({ presets: saved ?? [], loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  async add(data) {
    const now = Date.now();
    const preset: Preset = {
      id: crypto.randomUUID(),
      ...data,
      created_at: now,
      updated_at: now,
    };
    const presets = [...get().presets, preset];
    set({ presets });
    await persist(presets);
    return preset;
  },

  async update(id, data) {
    const presets = get().presets.map((p) =>
      p.id === id ? { ...p, ...data, updated_at: Date.now() } : p,
    );
    set({ presets });
    await persist(presets);
  },

  async remove(id) {
    const presets = get().presets.filter((p) => p.id !== id);
    set({ presets });
    await persist(presets);
  },

  async reorder(ids) {
    const map = new Map(get().presets.map((p) => [p.id, p]));
    const presets = ids.flatMap((id) => (map.has(id) ? [map.get(id)!] : []));
    set({ presets });
    await persist(presets);
  },
}));
