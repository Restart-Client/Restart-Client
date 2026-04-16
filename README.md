# Re'start Client

Discord Bot の [Re'start](https://restart2.restart-reboot.com/) を、デスクトップから快適に操作するためのクライアントアプリです。武器・スキル・アイテム・素材・ペットを一画面で管理できます。

> **ブースター専用**
> 本アプリは Re'start の公開 API を利用します。API はサーバーブースターのみが利用できます。

## スクリーンショットで見るポイント

- **ダッシュボード**: レベル・EXP・次レベルまでの進捗バー・戦闘編成・各カテゴリーの所持数を一画面に集約
- **武器**: カテゴリー → 個体の 2 段階ビュー、エンチャント詳細ドロワー、nbt の JSON 整形表示
- **スキル**: ワンクリック装備、直近装備スキルのハイライト
- **ペット**: 最大 3 体の戦闘スロット、画像付きカード、トグル装備、全解除
- **アイテム/素材**: 検索 + ソート、ツール装備のインラインパネル
- **コマンドパレット**: `⌘K` / `Ctrl+K` で全カテゴリー横断検索
- **レート制限インジケーター**: 右下常時表示、30req/60s の残量をビジュアル化

## 技術スタック

| レイヤ | 技術 | 採用理由 |
| --- | --- | --- |
| シェル | **Tauri v2** | 軽量ネイティブ。トークンを OS キーチェーンに保存するために Rust 側を活用 |
| UI | React 18 + TypeScript | 情報密度の高いダッシュボードに強い |
| スタイル | Tailwind CSS | 独自カラートークン(ink/ember/frost)で一貫性 |
| 状態 | Zustand | 認証・UI 状態を軽量に管理 |
| データ | TanStack Query v5 | キャッシュ、楽観的更新、自動再取得 |
| アニメ | Framer Motion | 微細な気持ちよさのための演出 |
| フォント | Unbounded + Zen Kaku Gothic New + JetBrains Mono | AI っぽくないキャラクターのある書体 |
| トークン保存 | `keyring` (Rust) | macOS Keychain / Windows Credential Manager / Linux Secret Service |

## 開発

### 前提

- Node.js 20+
- pnpm 9+
- Rust (stable)
- 各 OS の Tauri 必須ツール ([docs](https://tauri.app/start/prerequisites/))

### セットアップ

```bash
pnpm install
pnpm tauri dev
```

初回は Rust クレートのビルドに数分かかります。

### スクリプト

- `pnpm dev` — Vite 開発サーバー (ブラウザでの確認用)
- `pnpm tauri:dev` — Tauri 開発ビルド
- `pnpm tauri:build` — リリースビルド
- `pnpm typecheck` — 型チェック

## セキュリティ

公式ドキュメントにある通り、アクセストークンは **あなた本人として API を操作する権限** を持ちます。本クライアントは以下のポリシーを守ります。

- トークンは OS のセキュアストレージ (Keychain / Credential Manager / Secret Service) **のみ** に保存
- 外部サーバーへトークンを送信するロジックは存在しない
- 通信先は CSP で `restart2api.restart-reboot.com` に制限
- ログアウト時は必ず `POST /public/auth/logout` を呼び、サーバー側でも無効化
- OSS として公開し、クライアントの透明性を担保

## 認証フロー

1. アプリが「Discord でログイン」をクリック → OS デフォルトブラウザで `/public/auth/discord/login` を開く
2. Discord で認可 → ブラウザに JSON レスポンスが表示される
3. JSON 全体、または `access_token` の値をアプリに貼り付け
4. アプリが `/public/me/exp` を叩いて有効性を検証
5. OS キーチェーンに保存、以降のリクエストに自動付与

## レート制限対応

Re'start API は 30 req / 60 秒の制限があります。このアプリは:

- ほぼ全データを起動時に一括取得しクライアントキャッシュ (TanStack Query) に保持
- 装備変更後は関連キャッシュのみ invalidate
- 楽観的更新で体感レスポンスを実質 0ms に
- 右下のインジケーターでウィンドウ内使用量を常時表示
- 429 発生時は `retry_after_seconds` を尊重してトースト通知

## ロードマップ

### v0.2 (現在)
- [x] 全データ読み取り、全装備操作
- [x] コマンドパレット
- [x] レート制限ビジュアル化

### v0.3 予定
- [ ] 装備プリセット (ボス戦用 / 採掘用などを保存、ワンクリック切替)
- [ ] ペット編成のドラッグ&ドロップ
- [ ] 差分ビュー (前回起動との所持数変化)

### v0.4 予定
- [ ] アプリアイコンと自動アップデート
- [ ] i18n (英語)
- [ ] マルチウィンドウ (ペット詳細を別窓で開く)

## ライセンス

MIT
