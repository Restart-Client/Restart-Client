// OS のデフォルトブラウザで URL を開く。
// Tauri 環境では opener プラグイン経由、それ以外は window.open。

export async function openExternal(url: string): Promise<void> {
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
      return;
    } catch {
      // フォールバック
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
