// Playwright でモックデータを注入してスクリーンショットを生成するスクリプト。
// 使い方: node scripts/screenshot.mjs

import { chromium } from "playwright";
import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "docs/screenshots");

// ── モックデータ ─────────────────────────────────────────────────
const USER_ID = "987654321";
const MOCK_TOKEN = "mock_access_token_12345";

const MOCK = {
  exp: { user_id: USER_ID, exp: 4830, level: 35 },
  items: {
    user_id: USER_ID,
    items: [
      { item_id: 1, item_name: "エリクサー", count: 12 },
      { item_id: 2, item_name: "神聖水", count: 5 },
      { item_id: 3, item_name: "スタミナ薬", count: 30 },
      { item_id: 4, item_name: "回復ポーション", count: 8 },
      { item_id: 5, item_name: "魔力の結晶", count: 3 },
    ],
  },
  materials: {
    user_id: USER_ID,
    materials: [
      { material_id: 1, material_name: "鉄鉱石", count: 128 },
      { material_id: 2, material_name: "魔晶石", count: 44 },
      { material_id: 3, material_name: "竜の鱗", count: 7 },
      { material_id: 4, material_name: "精霊の羽根", count: 15 },
      { material_id: 5, material_name: "幻の糸", count: 2 },
    ],
  },
  skills: {
    user_id: USER_ID,
    skills: [
      { skill_id: 1, skill_name: "剣士の構え", count: 3 },
      { skill_id: 2, skill_name: "炎の魔法 Lv.5", count: 1 },
      { skill_id: 3, skill_name: "鉄壁の守り", count: 2 },
      { skill_id: 4, skill_name: "迅速な回避", count: 4 },
      { skill_id: 5, skill_name: "魔力増幅", count: 1 },
      { skill_id: 6, skill_name: "光の癒し", count: 2 },
      { skill_id: 7, skill_name: "神速の刃", count: 1 },
      { skill_id: 8, skill_name: "大地の守護", count: 3 },
    ],
  },
  weaponCategories: {
    user_id: USER_ID,
    weapon_categories: [
      { weapon_id: 1, weapon_name: "片手剣", count: 3 },
      { weapon_id: 2, weapon_name: "両手剣", count: 1 },
      { weapon_id: 3, weapon_name: "弓", count: 2 },
      { weapon_id: 4, weapon_name: "魔法杖", count: 2 },
      { weapon_id: 5, weapon_name: "短剣", count: 4 },
    ],
  },
  weaponCategory1: {
    user_id: USER_ID,
    weapons: [
      {
        weapon_number: 101, weapon_name: "炎剣・紅蓮",
        is_equipped: true, proficiency: 87, nbt: "{}", shortcut_id: 1, enchant_count: 3,
      },
      {
        weapon_number: 102, weapon_name: "聖剣・ホーリィブレード",
        is_equipped: false, proficiency: 62, nbt: "{}", shortcut_id: 2, enchant_count: 5,
      },
      {
        weapon_number: 103, weapon_name: "魔剣・ダークブレード",
        is_equipped: false, proficiency: 45, nbt: "{}", shortcut_id: 3, enchant_count: 2,
      },
    ],
  },
  pets: {
    user_id: USER_ID,
    pets: [
      {
        pet_id: 1, enemy_id: 10, ability_id: 5, atk_percent: 42.5, experience: 8400,
        battle: true, nbt: "{}", img: "", name: "フェンリル",
        ability_name: "氷牙の咆哮",
        skills: [
          { id: 1, percent: 25, name: "氷結爪", description: "氷属性ダメージ" },
          { id: 2, percent: 15, name: "凍える吠え声", description: "移動速度低下" },
        ],
      },
      {
        pet_id: 2, enemy_id: 20, ability_id: 12, atk_percent: 38.0, experience: 5200,
        battle: true, nbt: "{}", img: "", name: "炎竜",
        ability_name: "業火の息吹",
        skills: [
          { id: 3, percent: 30, name: "火炎放射", description: "炎属性範囲ダメージ" },
          { id: 4, percent: 18, name: "灼熱の羽ばたき", description: "広範囲攻撃" },
        ],
      },
      {
        pet_id: 3, enemy_id: 30, ability_id: 8, atk_percent: 33.2, experience: 3100,
        battle: false, nbt: "{}", img: "", name: "雷鳥",
        ability_name: "迅雷の翼",
        skills: [
          { id: 5, percent: 20, name: "稲妻の嘴", description: "電撃属性ダメージ" },
        ],
      },
    ],
  },
  battlePets: {
    user_id: USER_ID,
    pets: [
      {
        pet_id: 1, enemy_id: 10, ability_id: 5, atk_percent: 42.5, experience: 8400,
        battle: true, nbt: "{}", img: "", name: "フェンリル", ability_name: "氷牙の咆哮",
        skills: [{ id: 1, percent: 25, name: "氷結爪" }],
      },
      {
        pet_id: 2, enemy_id: 20, ability_id: 12, atk_percent: 38.0, experience: 5200,
        battle: true, nbt: "{}", img: "", name: "炎竜", ability_name: "業火の息吹",
        skills: [{ id: 3, percent: 30, name: "火炎放射" }],
      },
    ],
  },
};

// settings と presets のモックデータ
const MOCK_SETTINGS = {
  hud: { position: "right", width: 360, autoDim: true, autoDimOpacity: 0.6 },
  hotkeys: {
    toggleHud: "CommandOrControl+Shift+R",
    preset1: "CommandOrControl+Shift+1",
    preset2: "CommandOrControl+Shift+2",
    preset3: "CommandOrControl+Shift+3",
    preset4: "CommandOrControl+Shift+4",
    preset5: "CommandOrControl+Shift+5",
  },
  startup: { autoLaunch: false },
  lastEquipped: { skillId: 1, toolId: null },
  toolHistory: [],
};

const MOCK_PRESETS = [
  {
    id: "preset-1", name: "ボス戦", icon: "Swords", color: "ember",
    hotkey: "CommandOrControl+Shift+1",
    weapon_number: 101, skill_id: 7, tool_id: null, pet_ids: [1, 2],
    created_at: Date.now() - 86400000, updated_at: Date.now() - 3600000,
  },
  {
    id: "preset-2", name: "採掘", icon: "Pickaxe", color: "frost",
    hotkey: "CommandOrControl+Shift+2",
    weapon_number: null, skill_id: 8, tool_id: 3, pet_ids: [],
    created_at: Date.now() - 72000000, updated_at: Date.now() - 7200000,
  },
  {
    id: "preset-3", name: "探索", icon: "Footprints", color: "life",
    hotkey: "CommandOrControl+Shift+3",
    weapon_number: 102, skill_id: 4, tool_id: null, pet_ids: [3],
    created_at: Date.now() - 48000000, updated_at: Date.now() - 14400000,
  },
];

// ── Tauri IPC モックコード (addInitScript で注入) ────────────────
function buildTauriMockScript() {
  // storeデータを文字列化してスクリプト内に埋め込む
  const mockToken = JSON.stringify({ access_token: MOCK_TOKEN, meta: { user_id: USER_ID, expires_at: Math.floor(Date.now() / 1000) + 86400 } });
  const mockSettings = JSON.stringify(MOCK_SETTINGS);
  const mockPresets = JSON.stringify(MOCK_PRESETS);

  return `
(function () {
  // ── mockIPC (tauri-apps/api/mocks のロジックをインライン化) ──
  window.__TAURI_INTERNALS__ = window.__TAURI_INTERNALS__ || {};
  window.__TAURI_EVENT_PLUGIN_INTERNALS__ = window.__TAURI_EVENT_PLUGIN_INTERNALS__ || {};

  const callbacks = new Map();

  function registerCallback(callback, once = false) {
    const id = window.crypto.getRandomValues(new Uint32Array(1))[0];
    callbacks.set(id, (data) => {
      if (once) callbacks.delete(id);
      callback && callback(data);
    });
    return id;
  }

  function runCallback(id, data) {
    const cb = callbacks.get(id);
    if (cb) cb(data);
  }

  // ── HTTP モック状態 ──
  let ridCounter = 1;
  const pendingRequests = new Map();  // rid → { url, method }
  const pendingBodies   = new Map();  // responseRid → { bytes, sent }

  // URL → JSON レスポンス
  const API_MOCKS = {
    '/public/me/exp': ${JSON.stringify(MOCK.exp)},
    '/public/me/items': ${JSON.stringify(MOCK.items)},
    '/public/me/materials': ${JSON.stringify(MOCK.materials)},
    '/public/me/skills': ${JSON.stringify(MOCK.skills)},
    '/public/me/weapon_categories': ${JSON.stringify(MOCK.weaponCategories)},
    '/public/me/weapon_categories/1': ${JSON.stringify(MOCK.weaponCategory1)},
    '/public/me/weapon_categories/2': ${JSON.stringify(MOCK.weaponCategory1)},
    '/public/me/weapon_categories/3': ${JSON.stringify(MOCK.weaponCategory1)},
    '/public/me/weapon_categories/4': ${JSON.stringify(MOCK.weaponCategory1)},
    '/public/me/weapon_categories/5': ${JSON.stringify(MOCK.weaponCategory1)},
    '/public/me/pets': ${JSON.stringify(MOCK.pets)},
    '/public/me/pets/battle': ${JSON.stringify(MOCK.battlePets)},
    '/public/auth/logout': { status: 'ok' },
  };

  function getMockBody(url) {
    try {
      const path = new URL(url).pathname;
      const data = API_MOCKS[path] || { status: 'ok' };
      return new TextEncoder().encode(JSON.stringify(data));
    } catch {
      return new TextEncoder().encode('{}');
    }
  }

  // ── Store モック状態 ──
  const storeData = {
    1: { settings: ${mockSettings} },
    2: { presets: ${mockPresets} },
  };
  let nextRid = 10;
  const storeRidMap = new Map(); // path → rid

  // ── メインの IPC ハンドラ ──
  window.__TAURI_INTERNALS__.invoke = async function (cmd, args) {
    // Auth commands
    if (cmd === 'load_token') return ${mockToken};
    if (cmd === 'save_token' || cmd === 'clear_token') return null;
    if (cmd === 'get_autostart') return false;
    if (cmd === 'set_autostart') return null;
    if (cmd === 'show_hud' || cmd === 'hide_hud' || cmd === 'show_desk') return null;

    // plugin:store
    if (cmd === 'plugin:store|load') {
      const path = args && args.path;
      if (!storeRidMap.has(path)) {
        const rid = nextRid++;
        storeRidMap.set(path, rid);
        // プリセット vs 設定で分ける
        if (path && path.includes('presets')) {
          storeData[rid] = { presets: ${mockPresets} };
        } else {
          storeData[rid] = { settings: ${mockSettings} };
        }
      }
      return storeRidMap.get(path);
    }
    if (cmd === 'plugin:store|get') {
      const rid = args && args.rid;
      const key = args && args.key;
      const store = storeData[rid] || {};
      const value = store[key];
      return value !== undefined ? [value, true] : [null, false];
    }
    if (cmd === 'plugin:store|set' || cmd === 'plugin:store|save' ||
        cmd === 'plugin:store|delete' || cmd === 'plugin:store|clear' ||
        cmd === 'plugin:store|reset' || cmd === 'plugin:store|reload' ||
        cmd === 'plugin:store|close') return null;
    if (cmd === 'plugin:store|has') return [false, false];
    if (cmd === 'plugin:store|keys') return [];
    if (cmd === 'plugin:store|values') return [];
    if (cmd === 'plugin:store|entries') return [];
    if (cmd === 'plugin:store|length') return 0;

    // plugin:http
    if (cmd === 'plugin:http|fetch') {
      const rid = ridCounter++;
      const url = args && args.clientConfig && args.clientConfig.url;
      pendingRequests.set(rid, { url: url || '' });
      return rid;
    }
    if (cmd === 'plugin:http|fetch_send') {
      const rid = args && args.rid;
      const req = pendingRequests.get(rid) || {};
      const responseRid = ridCounter++;
      const bodyBytes = getMockBody(req.url);
      pendingBodies.set(responseRid, { bytes: bodyBytes, sent: false });
      return {
        status: 200, statusText: 'OK',
        url: req.url || '',
        headers: [['content-type', 'application/json']],
        rid: responseRid,
      };
    }
    if (cmd === 'plugin:http|fetch_read_body') {
      const rid = args && args.rid;
      const state = pendingBodies.get(rid);
      if (!state) return new Uint8Array([1]);
      if (!state.sent) {
        state.sent = true;
        const result = new Uint8Array(state.bytes.length + 1);
        result.set(state.bytes, 0);
        result[state.bytes.length] = 0; // not done yet
        return result;
      } else {
        pendingBodies.delete(rid);
        return new Uint8Array([1]); // done
      }
    }
    if (cmd === 'plugin:http|fetch_cancel' ||
        cmd === 'plugin:http|fetch_cancel_body') return null;

    // plugin:event
    if (cmd === 'plugin:event|listen') {
      const event = args && args.event;
      const handler = args && args.handler;
      if (event != null && handler != null) {
        if (!window.__tauriEvents__) window.__tauriEvents__ = {};
        if (!window.__tauriEvents__[event]) window.__tauriEvents__[event] = [];
        window.__tauriEvents__[event].push(handler);
      }
      return handler || 0;
    }
    if (cmd === 'plugin:event|unlisten' || cmd === 'plugin:event|emit' ||
        cmd === 'plugin:event|emit_to') return null;

    // window commands
    if (cmd === 'plugin:window|is_focused' || cmd === 'plugin:webview-window|is_focused') return true;
    if (cmd === 'plugin:event|listen_to') return 0;

    console.log('[TAURI MOCK] unhandled:', cmd, args);
    return null;
  };

  window.__TAURI_INTERNALS__.transformCallback = registerCallback;
  window.__TAURI_INTERNALS__.runCallback = runCallback;
  window.__TAURI_INTERNALS__.unregisterCallback = (id) => callbacks.delete(id);
  window.__TAURI_INTERNALS__.callbacks = callbacks;

  // getCurrentWindow mock
  window.__TAURI_INTERNALS__.metadata = {
    currentWindow: { label: 'desk' },
    currentWebview: { windowLabel: 'desk', label: 'desk' },
  };

  window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener = () => {};

  // イベント emit ヘルパー (Playwright から呼び出す用)
  window.__emitTauriEvent__ = (eventName, payload) => {
    const handlers = window.__tauriEvents__?.[eventName] || [];
    const internals = window.__TAURI_INTERNALS__;
    for (const handlerId of handlers) {
      internals.runCallback(handlerId, { event: eventName, id: 1, payload: payload ?? null });
    }
    return handlers.length;
  };

  console.log('[TAURI MOCK] initialized');
})();
`;
}

// ── dev サーバー起動 ──────────────────────────────────────────────
function startDevServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn("pnpm", ["dev"], {
      cwd: ROOT,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let ready = false;
    proc.stdout.on("data", (data) => {
      const text = data.toString();
      if (!ready && (text.includes("localhost:1420") || text.includes("ready"))) {
        ready = true;
        resolve(proc);
      }
    });
    proc.stderr.on("data", () => {});
    proc.on("error", reject);

    setTimeout(() => {
      if (!ready) { ready = true; resolve(proc); }
    }, 8000);
  });
}

// ── スクリーンショット撮影 ────────────────────────────────────────
async function takeScreenshot(page, name, width = 1280, height = 800) {
  const path = resolve(OUT, `${name}.png`);
  await page.setViewportSize({ width, height });
  await page.screenshot({ path, fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

async function waitForContent(page) {
  // スケルトンが消えるまで待機
  await page.waitForFunction(() => {
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    return skeletons.length === 0;
  }, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(600);
}

// ── メイン ───────────────────────────────────────────────────────
async function main() {
  await mkdir(OUT, { recursive: true });

  console.log("🚀 dev サーバーを起動中...");
  const devServer = await startDevServer();
  await new Promise((r) => setTimeout(r, 3000)); // Vite が完全起動するまで待つ

  const browser = await chromium.launch({ headless: true });
  const mockScript = buildTauriMockScript();

  try {
    // ── Desk スクリーンショット ──────────────────────────
    console.log("\n📸 Desk 画面...");
    const deskContext = await browser.newContext();
    await deskContext.addInitScript({ content: mockScript });
    const desk = await deskContext.newPage();

    await desk.goto("http://localhost:1420/desk.html");
    // サイドバーのナビが出るまで待機 = 認証済みかつ AppShell がマウントされた状態
    await desk.waitForSelector('aside nav button', { timeout: 15000 });
    await waitForContent(desk);

    // Dashboard
    await takeScreenshot(desk, "dashboard");

    // 各ページを Sidebar クリックで遷移
    const navItems = [
      { label: "武器", file: "weapons" },
      { label: "スキル", file: "skills" },
      { label: "アイテム", file: "items" },
      { label: "素材", file: "materials" },
      { label: "ペット", file: "pets" },
      { label: "プリセット", file: "presets" },
      { label: "設定", file: "settings" },
    ];

    for (const { label, file } of navItems) {
      // サイドバー内のナビボタンを確実にクリック
      await desk.locator('aside nav button').filter({ hasText: label }).click();
      await waitForContent(desk);
      await takeScreenshot(desk, file);
    }

    await deskContext.close();

    // ── HUD スクリーンショット ──────────────────────────
    console.log("\n📸 HUD 画面...");
    // viewport を先に 360px に設定。reducedMotion でアニメーションをスキップ
    const hudContext = await browser.newContext({
      viewport: { width: 360, height: 800 },
      reducedMotion: 'reduce',
    });
    const hudMockScript = mockScript.replace(
      "label: 'desk'",
      "label: 'hud'"
    ).replace(
      "windowLabel: 'desk', label: 'desk'",
      "windowLabel: 'hud', label: 'hud'"
    );
    await hudContext.addInitScript({ content: hudMockScript });
    const hud = await hudContext.newPage();
    await hud.setViewportSize({ width: 360, height: 800 });

    await hud.goto("http://localhost:1420/hud.html");
    await hud.waitForTimeout(3000);
    await waitForContent(hud);

    // hud:toggle イベントを発火してパネルを表示
    await hud.evaluate(() => window.__emitTauriEvent__('hud:toggle', null));
    await hud.waitForTimeout(500);
    // CSS で強制的にパネルを表示位置に固定 (headless でのアニメーション問題を回避)
    await hud.evaluate(() => {
      const panel = document.querySelector('.absolute.inset-y-0.right-0');
      if (panel) {
        panel.style.transform = 'translateX(0px)';
        panel.style.opacity = '1';
      }
    });
    await hud.waitForTimeout(300);
    await hud.screenshot({ path: resolve(OUT, "hud.png") });
    console.log("  ✓ hud.png");

    await hudContext.close();

  } finally {
    await browser.close();
    devServer.kill();
    console.log("\n✅ 完了! docs/screenshots/ に保存しました");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
