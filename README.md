# CustardWeb

A Next.js-based visual editor for Custard keyboard layouts. Edit presets, preview interactions, and export JSON.

## Overview
- **Keyboard Preview**: Grid-accurate layout with uniform key sizing, flick variations, and dashed placeholders for empty keys. Click a key to see a cross-shaped focus with flick directions. Toggle between display and action modes to view key press/long-press actions.
- **JSON Editor**: Side-by-side editor with search (Cmd/Ctrl+F), match navigation, synced line numbers, and live validation. Collapsible panel with persist state. Includes clear JSON toggle for preview-only mode.
- **Properties Panel**: Enhanced key inspector with custom/system key type selection, duplicate/delete controls, and comprehensive flick variation editor with direction-specific settings.
- **Keyboard Settings**: New tabbed interface for comprehensive keyboard configuration including layout, themes, and advanced settings.
- **Resizable Panels**: Drag the vertical splitter to adjust Preview vs Properties vs JSON width. Layout persists per browser. Panels reordered to Preview | Properties | JSON for improved workflow.
- **Presets & Saving**: Presets come from `src/lib/templates/`. When a preset is changed, it auto-saves as a new local file (`Keyboard{n}`) in `localStorage`. Saved items can be opened or deleted.

### AIモード（Gemini）
- 右上の「🤖 AI」からAIパネルを開き、APIキーを設定して指示を入力します。
- モード:
  - アクション: GUI操作の列をAIが提案し、クライアント側で順次適用（推奨）。
  - JSON: 更新済みのキーボードJSON全体を受け取り、そのまま反映。
- 「接続テスト」でAPIキーとエンドポイントの到達性を検証できます。
- 仕様の詳細は `docs/ai-mode.md` を参照してください。

## Project Structure
- `src/app/`: Next.js App Router (pages, layouts, API).
- `src/components/`: UI components (e.g., `KeyboardDesigner`, `KeyboardPreview`, `JSONEditor`).
- `src/lib/`: Templates and helpers.
- `src/types/`: TypeScript types for Custard.
- `src/lib/templates/`: Built-in preset JSON files (independent from `docs/`).

## Development
- `npm run dev` — Start dev server.
- `npm run build` — Production build to `.next/`.
- `npm run start` — Start the built app.
- `npm run lint` — Lint with Next.js ESLint config.

Requirements: Node.js 18+ recommended. Do not commit `.next/` or `node_modules/`.

## Deploy to GitHub Pages
- This project is configured for static export (`output: 'export'`) so it can be deployed to GitHub Pages.
- Push to `main` (or `master`) to trigger the workflow `.github/workflows/pages.yml`.
- The site is exported to `out/` and deployed to GitHub Pages automatically.

Notes and limitations on Pages:
- API routes (e.g., `src/app/api/gemini/route.ts`) are not available on static hosting. The AI assistant panel requires a server; it is disabled by default and calls will fail on Pages.
- Preset templates are automatically loaded from bundled JSON files when the API route is not available, so the core designer works on Pages.
- For a fully dynamic experience with API routes, consider deploying to Vercel or another server platform.

## Usage Tips
- **Preset Select**: Choose between QWERTY and Japanese Flick (from `src/lib/templates/`).
- **Auto-Save**: First edit of a preset creates `Keyboard{n}`. Subsequent edits auto-save.
- **Saved List**: Open the dropdown in the header to re-open or delete local files.
- **Key Labels**: Long identifiers (e.g., `flick_abc_tab`) auto-wrap with underscores as break hints.
- **Export**: Use the header download button to save the current layout JSON. Supports AzooKey export normalization.
- **Key Editing**: 
  - Click empty cells in preview to add new custom keys at grid positions
  - Use Properties panel to configure key type (custom/system), labels, and actions
  - Edit flick variations per direction with enable/disable, labels, colors, and actions
  - Duplicate or delete keys directly from the Properties panel
- **Action Modes**: Toggle between 表示 (display) and アクション (action) modes to view key press and long-press actions with visual chips and icons.
- **JSON Editing**: Toggle clear JSON mode to focus on preview and properties only. Enhanced validation and error reporting.

## Contributing
See `AGENTS.md` for contributor guidelines (structure, commands, style, and PR conventions).
