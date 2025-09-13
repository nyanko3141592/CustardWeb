# AIモード仕様

## 目的
GUIで可能な編集操作をAIに指示して自動適用できるようにし、
安全で一貫したキーボード編集体験を提供します。

## モード概要
- アクションモード: モデルから「GUI 操作の列（actions）」を受け取り、クライアントで逐次適用します。
- JSONモード: モデルから「更新済みのキーボード JSON」全体を受け取り、そのまま反映します。

アクションモードは局所的・安全に適用できるため推奨です。JSONモードは一括変更向けです。

## クライアント → サーバー
- エンドポイント: `/api/gemini` (Next.js API Route)
- メソッド: `POST`
- ペイロード:
  - `apiKey`: Gemini API Key（ブラウザで入力）
  - `prompt`: ユーザー指示（例: "スペースキーを大きくして"）
  - `currentKeyboard`: 現在のCustardキーボードJSON
  - `messages`: 画面上の会話履歴（現状はプロンプトに未連結）
  - `mode`: `"actions" | "keyboard"`

例:
```json
{
  "apiKey": "AIza...",
  "prompt": "スペースキーを大きくして",
  "currentKeyboard": { "identifier": "...", "interface": { ... } },
  "messages": [],
  "mode": "actions"
}
```

## サーバー → Gemini
- URL: `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  - 既定 `GEMINI_MODEL = 'gemini-2.5-flash'`
  - 環境変数 `GEMINI_MODEL` で変更可能
- ヘッダー: `Content-Type: application/json`
- ボディ:
  - `contents: [{ parts: [{ text: systemPrompt }] }]`
  - `generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }`

`systemPrompt` には現在のキーボードJSONと指示、出力フォーマットの制約を含みます。

## 応答形式
サーバーはGeminiのテキスト応答から最初のJSONオブジェクトを抽出し返却します。

- アクションモード:
```json
{
  "actions": [ { "type": "add_key", "x": 0, "y": 0 } ],
  "message": "変更内容の説明"
}
```

- JSONモード:
```json
{
  "keyboard": { /* 更新されたCustardKeyboard */ },
  "message": "変更内容の説明"
}
```

HTTPエラー時は `{ message, detail }` をステータス付きで返します。

## サポートされるアクション
`src/lib/aiActions.ts` の `AIAction` と一致します。

- `add_key { x, y, width?, height? }`
- `remove_key { index }`
- `move_key { index, x, y }`
- `set_key_size { index, width, height }`
- `set_key_label { index, text }`
- `set_key_main_label { index, text }`
- `set_key_sub_label { index, text }`
- `set_key_label_main_sub { index, main, sub? }`
- `set_key_color { index, color }`
- `set_press_input { index, text }`（押下アクションを input に設定）
- `set_keyboard_layout { row_count, column_count }`
- `set_input_style { input_style }`
- `set_language { language }`
- `rename { identifier?, display_name? }`
// Flick variations
- `add_flick_variation { index, direction }`
- `remove_flick_variation { index, direction }`
- `set_flick_label { index, direction, text }`
- `set_flick_main_label { index, direction, text }`
- `set_flick_sub_label { index, direction, text }`
- `set_flick_label_main_sub { index, direction, main, sub? }`
- `set_flick_input { index, direction, text }`
- `set_flick_color { index, direction, color }`

注意:
- `index` は 0 始まり。存在しない index を出力しないこと。
- `direction` は `left | up | right | down` のいずれか（内部では `up→top` / `down→bottom` に正規化）。
- `x, y` は `grid_fit` のセル座標。
- 論理的整合性を保ち、最小限のアクション列にすること。

## UIの使い方（AIAssistant）
- 右上の「🤖 AI」でパネルを開閉。
- APIキーを入力して「設定」。キーは `localStorage` に保存されます（`custard:geminiApiKey`）。
- 「モード」で「アクション / JSON」を切替。
- 「接続テスト」でキーとエンドポイントの到達性を検証（編集は行いません）。
- プロンプト送信で応答を適用。
  - アクション: クライアントで `applyAiActions` が順次適用。履歴に「AI編集」として記録。
  - JSON: 受け取ったキーボードをそのまま反映。

## モデルと環境変数
- 既定モデル: `gemini-2.5-flash`
- 変更方法: デプロイ環境で `GEMINI_MODEL` を設定
- APIバージョン: `v1beta` を使用

## エラーハンドリング
- サーバーはGeminiエラーを `{ message, detail }` として返却。
- クライアントは失敗時にHTTPステータス・本文をメッセージに表示。
- 「接続テスト」で事前に鍵の有効性や到達性を確認可能。

## セキュリティ
- APIキーはブラウザの `localStorage` に保存され、サーバー側に永続保存されません。
- リポジトリに秘密情報は含めないでください。

## 静的ホスティングでの制限
- GitHub Pagesなど静的エクスポートでは API Route は動作しません。
- AIパネルはサーバー環境（Vercel など）で利用してください。
