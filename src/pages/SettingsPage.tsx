// 設定画面: HUD 設定 / ホットキー / 起動設定

import { useSettingsStore } from "@/stores/settings";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "@/lib/cn";

export function SettingsPage() {
  const { settings, update } = useSettingsStore();

  async function toggleAutoLaunch(enabled: boolean) {
    try {
      await invoke("set_autostart", { enable: enabled });
      await update({ startup: { autoLaunch: enabled } });
    } catch {
      // autostart 未対応環境では無視
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-ink-800/50">
        <h1 className="font-display font-bold text-xl text-ink-50">設定</h1>
        <p className="text-sm text-ink-500 mt-1">
          アプリの動作をカスタマイズします。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-xl">
        {/* HUD 設定 */}
        <Section title="HUD">
          <ToggleRow
            label="フォーカスアウト時に半透明化"
            description="HUD からフォーカスが外れたとき画面を暗くします"
            checked={settings.hud.autoDim}
            onChange={(v) => update({ hud: { autoDim: v } })}
          />
          {settings.hud.autoDim && (
            <div className="mt-3 ml-1">
              <label className="block text-xs font-medium text-ink-400 mb-2">
                半透明度: {Math.round(settings.hud.autoDimOpacity * 100)}%
              </label>
              <input
                type="range"
                min={20}
                max={90}
                step={5}
                value={Math.round(settings.hud.autoDimOpacity * 100)}
                onChange={(e) =>
                  update({ hud: { autoDimOpacity: Number(e.target.value) / 100 } })
                }
                className="w-full accent-ember-500"
              />
              <div className="flex justify-between text-[10px] text-ink-600 mt-1">
                <span>20%</span>
                <span>90%</span>
              </div>
            </div>
          )}
        </Section>

        {/* ホットキー */}
        <Section title="ホットキー">
          <HotkeyRow label="HUD 呼び出し" value={settings.hotkeys.toggleHud} />
          <HotkeyRow label="プリセット 1" value={settings.hotkeys.preset1 ?? "未設定"} />
          <HotkeyRow label="プリセット 2" value={settings.hotkeys.preset2 ?? "未設定"} />
          <HotkeyRow label="プリセット 3" value={settings.hotkeys.preset3 ?? "未設定"} />
          <HotkeyRow label="プリセット 4" value={settings.hotkeys.preset4 ?? "未設定"} />
          <HotkeyRow label="プリセット 5" value={settings.hotkeys.preset5 ?? "未設定"} />
          <p className="text-[11px] text-ink-600 mt-2">
            ホットキーの変更はアプリ再起動後に反映されます。
          </p>
        </Section>

        {/* 起動設定 */}
        <Section title="起動">
          <ToggleRow
            label="OS 起動時に自動起動"
            description="ログイン時にバックグラウンドで起動します"
            checked={settings.startup.autoLaunch}
            onChange={toggleAutoLaunch}
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-mono uppercase tracking-widest text-ink-500 mb-3">
        {title}
      </h2>
      <div className="rounded-xl border border-ink-800 bg-ink-900/40 divide-y divide-ink-800/60">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div>
        <div className="text-sm text-ink-100">{label}</div>
        {description && (
          <div className="text-xs text-ink-500 mt-0.5">{description}</div>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-10 h-5 rounded-full transition-colors shrink-0",
          checked ? "bg-ember-500" : "bg-ink-700",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

function HotkeyRow({ label, value }: { label: string; value: string }) {
  const display = value
    .replace("CommandOrControl", "Ctrl")
    .replace("Shift", "Shift")
    .replace(/\+/g, " + ");

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-sm text-ink-300">{label}</span>
      <kbd className="font-mono text-[11px] text-ink-400 bg-ink-800 border border-ink-700 px-2 py-0.5 rounded">
        {display}
      </kbd>
    </div>
  );
}
