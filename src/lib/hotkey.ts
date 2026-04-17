// グローバルホットキーのフロント側ユーティリティ。
// 実際の登録は Rust 側 (tauri-plugin-global-shortcut) で行う。
// ここではホットキー文字列のフォーマット変換とバリデーションを提供する。

/** Tauri 形式 ("CommandOrControl+Shift+1") を表示用に変換 */
export function formatHotkey(accelerator: string | null): string {
  if (!accelerator) return "なし";

  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().includes("MAC");

  return accelerator
    .replace("CommandOrControl", isMac ? "⌘" : "Ctrl")
    .replace("Command", isMac ? "⌘" : "Ctrl")
    .replace("Control", "Ctrl")
    .replace("Shift", isMac ? "⇧" : "Shift")
    .replace("Alt", isMac ? "⌥" : "Alt")
    .replace(/\+/g, isMac ? "" : "+");
}

/** プリセット番号 (1-5) に対応するデフォルトホットキー */
export function defaultPresetHotkey(index: number): string {
  return `CommandOrControl+Shift+${index}`;
}
