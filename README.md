<div align="center">

# Re'start Client

Discord Bot **[Re'start](https://restart2.restart-reboot.com/)** のデスクトップクライアント。  
武器・スキル・アイテム・素材・ペット・プリセットをウィンドウひとつで管理できます。

**ブースター専用** — Re'start の API はサーバーブースターのみ利用できます。

[ダウンロード](#ダウンロード) · [使い方](#使い方) · [開発者向け](#開発者向け)

</div>

---

## スクリーンショット

| ダッシュボード | 武器 |
|---|---|
| ![Dashboard](https://github.com/Restart-Client/Restart-Client/releases/download/v1.0.0/dashboard.png) | ![Weapons](https://github.com/Restart-Client/Restart-Client/releases/download/v1.0.0/weapons.png) |

| スキル | ペット |
|---|---|
| ![Skills](https://github.com/Restart-Client/Restart-Client/releases/download/v1.0.0/skills.png) | ![Pets](https://github.com/Restart-Client/Restart-Client/releases/download/v1.0.0/pets.png) |

| プリセット | HUD |
|---|---|
| ![Presets](https://github.com/Restart-Client/Restart-Client/releases/download/v1.0.0/presets.png) | ![HUD](https://github.com/Restart-Client/Restart-Client/releases/download/v1.0.0/hud.png) |

---

## 機能

### Desk（メインウィンドウ）
- **ダッシュボード** — レベル・EXP・進捗バー・戦闘編成・所持数を一画面で確認
- **武器** — カテゴリー → 個体の 2 段階ビュー、エンチャント詳細、装備切替
- **スキル** — ワンクリックで装備、直近装備のハイライト
- **アイテム / 素材** — 検索 + ソート、ツール装備のインラインパネル
- **ペット** — 最大 3 体の戦闘スロット、トグル装備・全解除
- **プリセット** — 武器・スキル・ペット構成を保存してワンクリック切替（最大 5 件）
- **コマンドパレット** — `Ctrl+K` で全カテゴリー横断検索
- **レート制限インジケーター** — 右下常時表示 (30req/60s)

### HUD（オーバーレイ）
- ゲーム中に邪魔にならないサイドパネル
- `Ctrl+Shift+R` でトグル表示
- プリセット即時切替バー
- フォーカスアウト時に自動で半透明化（設定で調整可）
- タブ切替でスキル・武器・インベントリ・ペットを確認

### グローバルショートカット

| キー | 動作 |
|---|---|
| `Ctrl+Shift+R` | HUD 表示 / 非表示 |
| `Ctrl+Shift+1〜5` | プリセット 1〜5 を即時適用 |

---

## ダウンロード

[Releases ページ](https://github.com/Restart-Client/Restart-Client/releases/latest) から最新版をダウンロードしてください。

| OS | ファイル |
|---|---|
| Windows | `.msi` インストーラー |
| macOS (Apple Silicon) | `aarch64.dmg` |
| macOS (Intel) | `x86_64.dmg` |
| Linux | `.deb` / `.AppImage` |

---

## 使い方

### 1. ログイン

1. アプリを起動して「**Discord でログイン**」をクリック
2. ブラウザで Discord 認証 → レスポンスの JSON が表示される
3. JSON 全体 **または** `access_token` の値をアプリに貼り付け
4. 認証完了 — トークンは OS のセキュアストレージに保存されます

### 2. プリセットを作る

1. サイドバーの「プリセット」ページを開く
2. 「＋ 新規プリセット」で名前を付けて保存
3. 武器・スキル・ペットを好みの構成に変更後「更新」
4. HUD または `Ctrl+Shift+1〜5` でいつでも切替

### 3. HUD を使う

1. ゲーム中に `Ctrl+Shift+R` を押す
2. 画面右端にパネルがスライドイン
3. プリセットバーで構成を即切替、タブで各ステータスを確認

---

## セキュリティ

トークンはあなた本人として API を操作する権限を持ちます。このアプリは以下を守ります。

- トークンは **OS のセキュアストレージのみ** に保存（macOS Keychain / Windows Credential Manager / Linux Secret Service）
- 外部サーバーへトークンを送信するロジックなし
- 通信先は CSP で `restart2api.restart-reboot.com` に制限
- ログアウト時は `POST /public/auth/logout` でサーバー側も無効化
- OSS として公開し、クライアントの透明性を担保

---

## 開発者向け

### 必要なもの

- Node.js 20+、pnpm 9+、Rust (stable)
- Tauri 必須ツール → [tauri.app/start/prerequisites](https://tauri.app/start/prerequisites/)

### セットアップ

```bash
pnpm install
pnpm tauri dev
```

### スクリプト

```bash
pnpm dev          # Vite 開発サーバー（ブラウザ確認用）
pnpm tauri dev    # Tauri 開発ビルド
pnpm tauri build  # リリースビルド
pnpm typecheck    # 型チェック
```

### 技術スタック

Tauri v2 · React 18 + TypeScript · Tailwind CSS · Zustand · TanStack Query v5 · Framer Motion

---

## ライセンス

MIT
