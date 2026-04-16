# アイコン生成について

`icon.svg` をマスターソースとして、Tauri CLI で各プラットフォーム用のアイコンを生成してください。

```bash
# まず SVG を 1024x1024 の PNG に変換 (rsvg-convert, ImageMagick, Figma などで)
# 例: rsvg-convert -w 1024 -h 1024 icon.svg -o icon.png

# その後 Tauri CLI で全サイズ一括生成
pnpm tauri icon icon.png
```

これで以下が自動生成されます:

- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)
- `StoreLogo.png` など
