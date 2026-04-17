// アプリ設定の永続化ストア。
// tauri-plugin-store を使って "settings.json" に保存する。

import { Store } from "@tauri-apps/plugin-store";
import { create } from "zustand";

export interface AppSettings {
  hud: {
    position: "right" | "left" | "bottom";
    width: number;
    autoDim: boolean;
    autoDimOpacity: number;
  };
  hotkeys: {
    toggleHud: string;
    preset1: string | null;
    preset2: string | null;
    preset3: string | null;
    preset4: string | null;
    preset5: string | null;
  };
  startup: {
    autoLaunch: boolean;
  };
  lastEquipped: {
    skillId: number | null;
    toolId: number | null;
  };
  toolHistory: number[];
}

const DEFAULT_SETTINGS: AppSettings = {
  hud: {
    position: "right",
    width: 360,
    autoDim: true,
    autoDimOpacity: 0.6,
  },
  hotkeys: {
    toggleHud: "CommandOrControl+Shift+R",
    preset1: "CommandOrControl+Shift+1",
    preset2: "CommandOrControl+Shift+2",
    preset3: "CommandOrControl+Shift+3",
    preset4: "CommandOrControl+Shift+4",
    preset5: "CommandOrControl+Shift+5",
  },
  startup: {
    autoLaunch: false,
  },
  lastEquipped: {
    skillId: null,
    toolId: null,
  },
  toolHistory: [],
};

interface SettingsState {
  settings: AppSettings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: DeepPartial<AppSettings>) => Promise<void>;
  setLastEquippedSkill: (skillId: number | null) => Promise<void>;
  setLastEquippedTool: (toolId: number | null) => Promise<void>;
  addToolHistory: (itemId: number) => Promise<void>;
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load("settings.json");
  }
  return store;
}

function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  const result = { ...base };
  for (const key in patch) {
    const pv = patch[key];
    const bv = base[key];
    if (pv !== undefined) {
      if (
        pv !== null &&
        typeof pv === "object" &&
        !Array.isArray(pv) &&
        bv !== null &&
        typeof bv === "object" &&
        !Array.isArray(bv)
      ) {
        (result as Record<string, unknown>)[key] = deepMerge(
          bv as object,
          pv as DeepPartial<object>,
        );
      } else {
        (result as Record<string, unknown>)[key] = pv;
      }
    }
  }
  return result;
}

async function persist(settings: AppSettings) {
  const s = await getStore();
  await s.set("settings", settings);
  await s.save();
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  async load() {
    try {
      const s = await getStore();
      const saved = await s.get<AppSettings>("settings");
      const settings = saved
        ? deepMerge(DEFAULT_SETTINGS, saved as DeepPartial<AppSettings>)
        : DEFAULT_SETTINGS;
      set({ settings, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  async update(patch) {
    const settings = deepMerge(get().settings, patch);
    set({ settings });
    await persist(settings);
  },

  async setLastEquippedSkill(skillId) {
    await get().update({ lastEquipped: { skillId } });
  },

  async setLastEquippedTool(toolId) {
    await get().update({ lastEquipped: { toolId } });
  },

  async addToolHistory(itemId) {
    const current = get().settings.toolHistory;
    if (current.includes(itemId)) return;
    await get().update({ toolHistory: [...current, itemId] });
  },
}));
