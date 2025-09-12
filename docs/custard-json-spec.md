# Custard JSON 仕様書

CustardWebで使用するキーボード定義JSONの完全な仕様とルールを説明します。

## 基本構造

```json
{
  "identifier": "unique_keyboard_id",
  "language": "ja_JP",
  "input_style": "direct",
  "metadata": {
    "custard_version": "1.0",
    "display_name": "キーボード名"
  },
  "interface": {
    "key_layout": {
      "type": "grid_fit",
      "row_count": 4,
      "column_count": 10
    },
    "key_style": "pc_style",
    "keys": []
  }
}
```

## プロパティ詳細

### ルートレベル

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `identifier` | string | ✅ | キーボードの一意識別子（英数字とアンダースコアのみ） |
| `language` | string | ✅ | 対象言語（例: "ja_JP", "en_US"） |
| `input_style` | string | ✅ | 入力方式（"direct", "roman2kana", "flick"など） |
| `metadata` | object | ✅ | メタデータ情報 |
| `interface` | object | ✅ | キーボードインターフェース定義 |

### メタデータ

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `custard_version` | string | ✅ | Custardフォーマットバージョン（現在は "1.0"） |
| `display_name` | string | ✅ | ユーザーに表示されるキーボード名 |

### インターフェース

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `key_layout` | object | ✅ | キーレイアウト設定 |
| `key_style` | string | ✅ | キースタイル（"pc_style", "tenkey_style"） |
| `keys` | array | ✅ | キー定義配列 |

### キーレイアウト

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `type` | string | ✅ | レイアウトタイプ（"grid_fit", "grid_scroll"） |
| `row_count` | number | ❌ | 行数（grid_fitの場合） |
| `column_count` | number | ❌ | 列数（grid_fitの場合） |

## キー定義

### 基本キー構造

```json
{
  "design": {
    "label": { "text": "あ" },
    "color": "normal"
  },
  "press_actions": [
    { "type": "input", "text": "あ" }
  ],
  "longpress_actions": {
    "start": [
      { "type": "input", "text": "ああ" }
    ]
  },
  "variations": [],
  "specifier": {
    "x": 0,
    "y": 0,
    "width": 1,
    "height": 1
  }
}
```

### ラベルデザイン

3つの形式をサポート：

#### 1. シンプルテキスト
```json
"label": { "text": "あ" }
```

#### 2. メイン・サブテキスト
```json
"label": {
  "main": { "text": "あ" },
  "sub": { "text": "ア" }
}
```

#### 3. システムイメージ
```json
"label": { "system_image": "delete.backward" }
```

### キーカラー

| 値 | 説明 | 用途 |
|-----|------|------|
| `normal` | 通常（白背景） | 文字キー |
| `special` | 特殊（グレー背景） | 機能キー |
| `selected` | 選択（青背景） | 実行・確定キー |
| `unimportant` | 重要度低（薄いグレー） | 補助キー |

### アクションタイプ

| タイプ | パラメータ | 説明 |
|--------|-----------|------|
| `input` | `text: string` | 文字入力 |
| `delete` | `count: number, direction?: string` | 文字削除 |
| `move_cursor` | `count: number, direction: string` | カーソル移動 |
| `complete` | なし | 入力確定 |
| `move_tab` | `tab_type: string` | タブ切り替え |
| `toggle_shift` | なし | シフト状態切り替え |

### フリック入力（variations）

フリック入力をサポートするキーは`variations`配列を使用：

```json
{
  "design": { "label": { "text": "あ" } },
  "press_actions": [{ "type": "input", "text": "あ" }],
  "variations": [
    {
      "design": { "label": { "text": "い" } },
      "press_actions": [{ "type": "input", "text": "い" }]
    },
    {
      "design": { "label": { "text": "う" } },
      "press_actions": [{ "type": "input", "text": "う" }]
    },
    {
      "design": { "label": { "text": "え" } },
      "press_actions": [{ "type": "input", "text": "え" }]
    },
    {
      "design": { "label": { "text": "お" } },
      "press_actions": [{ "type": "input", "text": "お" }]
    }
  ]
}
```

フリック方向の順序：
1. **右フリック** (index 0)
2. **上フリック** (index 1)  
3. **左フリック** (index 2)
4. **下フリック** (index 3)

### キーサイズ・位置指定

`specifier`でキーの詳細な配置を制御：

```json
"specifier": {
  "x": 0,        // X座標（0始まり）
  "y": 1,        // Y座標（0始まり）
  "width": 2,    // 幅（グリッド単位）
  "height": 1    // 高さ（グリッド単位）
}
```

## 入力スタイル

| スタイル | 説明 |
|---------|------|
| `direct` | 直接入力 |
| `roman2kana` | ローマ字→かな変換 |
| `flick` | フリック入力 |

## キースタイル

| スタイル | 説明 |
|---------|------|
| `pc_style` | PC風レイアウト（平べったいキー） |
| `tenkey_style` | テンキー風レイアウト（高さのあるキー） |

## 実装例

### 基本的なQWERTYキーボード
```json
{
  "identifier": "simple_qwerty",
  "language": "en_US",
  "input_style": "direct",
  "metadata": {
    "custard_version": "1.0",
    "display_name": "Simple QWERTY"
  },
  "interface": {
    "key_layout": {
      "type": "grid_fit",
      "row_count": 4,
      "column_count": 10
    },
    "key_style": "pc_style",
    "keys": [
      {
        "design": { "label": { "text": "Q" } },
        "press_actions": [{ "type": "input", "text": "q" }]
      }
    ]
  }
}
```

### フリック入力キーボード
```json
{
  "identifier": "japanese_flick",
  "language": "ja_JP", 
  "input_style": "flick",
  "metadata": {
    "custard_version": "1.0",
    "display_name": "日本語フリック"
  },
  "interface": {
    "key_layout": {
      "type": "grid_fit",
      "row_count": 4,
      "column_count": 3
    },
    "key_style": "tenkey_style",
    "keys": [
      {
        "design": { "label": { "text": "あ" } },
        "press_actions": [{ "type": "input", "text": "あ" }],
        "variations": [
          {
            "design": { "label": { "text": "い" } },
            "press_actions": [{ "type": "input", "text": "い" }]
          },
          {
            "design": { "label": { "text": "う" } },
            "press_actions": [{ "type": "input", "text": "う" }]
          },
          {
            "design": { "label": { "text": "え" } },
            "press_actions": [{ "type": "input", "text": "え" }]
          },
          {
            "design": { "label": { "text": "お" } },
            "press_actions": [{ "type": "input", "text": "お" }]
          }
        ]
      }
    ]
  }
}
```

## 検証ルール

1. **必須フィールド**: すべての必須プロパティが存在する
2. **一意識別子**: `identifier`は英数字とアンダースコアのみ
3. **キー配置**: `specifier`を使用する場合、重複や範囲外配置がない
4. **アクション形式**: 各アクションタイプに必要なパラメータが存在
5. **フリック順序**: `variations`配列は最大4要素（右、上、左、下の順）

## よくある間違い

1. **キーの重複配置**: 同じグリッド位置に複数キーを配置
2. **不正なアクション**: 存在しないアクションタイプや不足パラメータ
3. **範囲外座標**: `specifier`でグリッド範囲外を指定
4. **フリック順序**: `variations`の順序が間違っている
5. **文字エンコーディング**: 特殊文字が正しくエンコードされていない