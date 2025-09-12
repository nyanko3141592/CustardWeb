import { CustardKeyboard, Key, KeyWrapper, FlickVariation } from '@/types/custard'

// 古いKey[]形式を新しいKeyWrapper[]形式に変換
function convertToKeyWrapper(key: Key, index: number): KeyWrapper {
  return {
    key_type: 'custom',
    specifier_type: 'grid_fit',
    specifier: key.specifier,
    key: {
      ...key,
      // 古い variations?: Key[] を新しい variations?: FlickVariation[] に変換
      variations: key.variations ? key.variations.map((variation, vIndex) => ({
        type: 'flick_variation',
        direction: ['left', 'top', 'right', 'bottom'][vIndex] as 'left' | 'top' | 'right' | 'bottom',
        key: variation as Key
      })) : undefined
    }
  }
}

export const templates: Record<string, CustardKeyboard> = {
  // デフォルトQWERTY
  default_qwerty: {
    identifier: 'default_qwerty_keyboard',
    language: 'en_US',
    input_style: 'direct',
    metadata: {
      custard_version: '1.2',
      display_name: 'QWERTY'
    },
    interface: {
      key_layout: {
        type: 'grid_fit',
        row_count: 4,
        column_count: 10
      },
      key_style: 'pc_style',
      keys: [
        // First row
        { design: { label: { text: 'Q' } }, press_actions: [{ type: 'input', text: 'q' }] },
        { design: { label: { text: 'W' } }, press_actions: [{ type: 'input', text: 'w' }] },
        { design: { label: { text: 'E' } }, press_actions: [{ type: 'input', text: 'e' }] },
        { design: { label: { text: 'R' } }, press_actions: [{ type: 'input', text: 'r' }] },
        { design: { label: { text: 'T' } }, press_actions: [{ type: 'input', text: 't' }] },
        { design: { label: { text: 'Y' } }, press_actions: [{ type: 'input', text: 'y' }] },
        { design: { label: { text: 'U' } }, press_actions: [{ type: 'input', text: 'u' }] },
        { design: { label: { text: 'I' } }, press_actions: [{ type: 'input', text: 'i' }] },
        { design: { label: { text: 'O' } }, press_actions: [{ type: 'input', text: 'o' }] },
        { design: { label: { text: 'P' } }, press_actions: [{ type: 'input', text: 'p' }] },
        // Second row
        { design: { label: { text: 'A' } }, press_actions: [{ type: 'input', text: 'a' }] },
        { design: { label: { text: 'S' } }, press_actions: [{ type: 'input', text: 's' }] },
        { design: { label: { text: 'D' } }, press_actions: [{ type: 'input', text: 'd' }] },
        { design: { label: { text: 'F' } }, press_actions: [{ type: 'input', text: 'f' }] },
        { design: { label: { text: 'G' } }, press_actions: [{ type: 'input', text: 'g' }] },
        { design: { label: { text: 'H' } }, press_actions: [{ type: 'input', text: 'h' }] },
        { design: { label: { text: 'J' } }, press_actions: [{ type: 'input', text: 'j' }] },
        { design: { label: { text: 'K' } }, press_actions: [{ type: 'input', text: 'k' }] },
        { design: { label: { text: 'L' } }, press_actions: [{ type: 'input', text: 'l' }] },
        { design: { label: { text: '⌫' }, color: 'special' }, press_actions: [{ type: 'delete', count: 1 }] },
        // Third row
        { design: { label: { text: '⇧' }, color: 'special' }, press_actions: [{ type: 'toggle_shift' }] },
        { design: { label: { text: 'Z' } }, press_actions: [{ type: 'input', text: 'z' }] },
        { design: { label: { text: 'X' } }, press_actions: [{ type: 'input', text: 'x' }] },
        { design: { label: { text: 'C' } }, press_actions: [{ type: 'input', text: 'c' }] },
        { design: { label: { text: 'V' } }, press_actions: [{ type: 'input', text: 'v' }] },
        { design: { label: { text: 'B' } }, press_actions: [{ type: 'input', text: 'b' }] },
        { design: { label: { text: 'N' } }, press_actions: [{ type: 'input', text: 'n' }] },
        { design: { label: { text: 'M' } }, press_actions: [{ type: 'input', text: 'm' }] },
        { design: { label: { text: ',' } }, press_actions: [{ type: 'input', text: ',' }] },
        { design: { label: { text: '.' } }, press_actions: [{ type: 'input', text: '.' }] },
        // Fourth row
        { design: { label: { text: '123' }, color: 'special' }, press_actions: [{ type: 'move_tab', tab_type: 'number' }] },
        { design: { label: { text: '←' }, color: 'special' }, press_actions: [{ type: 'move_cursor', count: 1, direction: 'backward' }] },
        { design: { label: { text: 'Space' } }, press_actions: [{ type: 'input', text: ' ' }], specifier: { width: 4 } },
        { design: { label: { text: '→' }, color: 'special' }, press_actions: [{ type: 'move_cursor', count: 1, direction: 'forward' }] },
        { design: { label: { text: '?' } }, press_actions: [{ type: 'input', text: '?' }] },
        { design: { label: { text: '↵' }, color: 'selected' }, press_actions: [{ type: 'complete' }] }
      ]
    }
  },

  // 日本語フリック
  japanese_flick: {
    identifier: 'japanese_flick',
    language: 'ja_JP',
    input_style: 'direct',
    metadata: {
      custard_version: '1.2',
      display_name: '日本語フリック'
    },
    interface: {
      key_layout: {
        type: 'grid_fit',
        row_count: 5,
        column_count: 5
      },
      key_style: 'tenkey_style',
      keys: [
        // 123タブ (0, 0)
        {
          design: { label: { text: '☆123' }, color: 'special' },
          press_actions: [{ type: 'move_tab', tab_type: 'number' }],
          specifier: { x: 0, y: 0, width: 1, height: 1 }
        },
        // あ段 (1, 0)
        {
          design: { label: { text: 'あ' } },
          press_actions: [{ type: 'input', text: 'あ' }],
          variations: [
            { design: { label: { text: 'い' } }, press_actions: [{ type: 'input', text: 'い' }] },
            { design: { label: { text: 'う' } }, press_actions: [{ type: 'input', text: 'う' }] },
            { design: { label: { text: 'え' } }, press_actions: [{ type: 'input', text: 'え' }] },
            { design: { label: { text: 'お' } }, press_actions: [{ type: 'input', text: 'お' }] }
          ],
          specifier: { x: 1, y: 0, width: 1, height: 1 }
        },
        // か段 (2, 0)
        {
          design: { label: { text: 'か' } },
          press_actions: [{ type: 'input', text: 'か' }],
          variations: [
            { design: { label: { text: 'き' } }, press_actions: [{ type: 'input', text: 'き' }] },
            { design: { label: { text: 'く' } }, press_actions: [{ type: 'input', text: 'く' }] },
            { design: { label: { text: 'け' } }, press_actions: [{ type: 'input', text: 'け' }] },
            { design: { label: { text: 'こ' } }, press_actions: [{ type: 'input', text: 'こ' }] }
          ],
          specifier: { x: 2, y: 0, width: 1, height: 1 }
        },
        // さ段 (3, 0)
        {
          design: { label: { text: 'さ' } },
          press_actions: [{ type: 'input', text: 'さ' }],
          variations: [
            { design: { label: { text: 'し' } }, press_actions: [{ type: 'input', text: 'し' }] },
            { design: { label: { text: 'す' } }, press_actions: [{ type: 'input', text: 'す' }] },
            { design: { label: { text: 'せ' } }, press_actions: [{ type: 'input', text: 'せ' }] },
            { design: { label: { text: 'そ' } }, press_actions: [{ type: 'input', text: 'そ' }] }
          ],
          specifier: { x: 3, y: 0, width: 1, height: 1 }
        },
        // バックスペース (4, 0)
        {
          design: { label: { system_image: 'delete.backward' }, color: 'special' },
          press_actions: [{ type: 'delete', count: 1 }],
          variations: [
            { design: { label: { system_image: 'xmark' } }, press_actions: [{ type: 'delete', count: -1 }] }
          ],
          specifier: { x: 4, y: 0, width: 1, height: 1 }
        },
        
        // Row 1
        { design: { label: { text: 'ABC' }, color: 'special' }, press_actions: [{ type: 'move_tab', tab_type: 'alphabet' }], specifier: { x: 0, y: 1, width: 1, height: 1 } },
        { design: { label: { text: 'た' } }, press_actions: [{ type: 'input', text: 'た' }], variations: [{ design: { label: { text: 'ち' } }, press_actions: [{ type: 'input', text: 'ち' }] }, { design: { label: { text: 'つ' } }, press_actions: [{ type: 'input', text: 'つ' }] }, { design: { label: { text: 'て' } }, press_actions: [{ type: 'input', text: 'て' }] }, { design: { label: { text: 'と' } }, press_actions: [{ type: 'input', text: 'と' }] }], specifier: { x: 1, y: 1, width: 1, height: 1 } },
        { design: { label: { text: 'な' } }, press_actions: [{ type: 'input', text: 'な' }], variations: [{ design: { label: { text: 'に' } }, press_actions: [{ type: 'input', text: 'に' }] }, { design: { label: { text: 'ぬ' } }, press_actions: [{ type: 'input', text: 'ぬ' }] }, { design: { label: { text: 'ね' } }, press_actions: [{ type: 'input', text: 'ね' }] }, { design: { label: { text: 'の' } }, press_actions: [{ type: 'input', text: 'の' }] }], specifier: { x: 2, y: 1, width: 1, height: 1 } },
        { design: { label: { text: 'は' } }, press_actions: [{ type: 'input', text: 'は' }], variations: [{ design: { label: { text: 'ひ' } }, press_actions: [{ type: 'input', text: 'ひ' }] }, { design: { label: { text: 'ふ' } }, press_actions: [{ type: 'input', text: 'ふ' }] }, { design: { label: { text: 'へ' } }, press_actions: [{ type: 'input', text: 'へ' }] }, { design: { label: { text: 'ほ' } }, press_actions: [{ type: 'input', text: 'ほ' }] }], specifier: { x: 3, y: 1, width: 1, height: 1 } },
        { design: { label: { text: '空白' }, color: 'special' }, press_actions: [{ type: 'input', text: ' ' }], specifier: { x: 4, y: 1, width: 1, height: 1 } },
        
        // Row 2
        { design: { label: { text: 'ひら' }, color: 'special' }, press_actions: [{ type: 'move_tab', tab_type: 'hiragana' }], specifier: { x: 0, y: 2, width: 1, height: 1 } },
        { design: { label: { text: 'ま' } }, press_actions: [{ type: 'input', text: 'ま' }], variations: [{ design: { label: { text: 'み' } }, press_actions: [{ type: 'input', text: 'み' }] }, { design: { label: { text: 'む' } }, press_actions: [{ type: 'input', text: 'む' }] }, { design: { label: { text: 'め' } }, press_actions: [{ type: 'input', text: 'め' }] }, { design: { label: { text: 'も' } }, press_actions: [{ type: 'input', text: 'も' }] }], specifier: { x: 1, y: 2, width: 1, height: 1 } },
        { design: { label: { text: 'や' } }, press_actions: [{ type: 'input', text: 'や' }], variations: [{ design: { label: { text: '「' } }, press_actions: [{ type: 'input', text: '「' }] }, { design: { label: { text: 'ゆ' } }, press_actions: [{ type: 'input', text: 'ゆ' }] }, { design: { label: { text: '」' } }, press_actions: [{ type: 'input', text: '」' }] }, { design: { label: { text: 'よ' } }, press_actions: [{ type: 'input', text: 'よ' }] }], specifier: { x: 2, y: 2, width: 1, height: 1 } },
        { design: { label: { text: 'ら' } }, press_actions: [{ type: 'input', text: 'ら' }], variations: [{ design: { label: { text: 'り' } }, press_actions: [{ type: 'input', text: 'り' }] }, { design: { label: { text: 'る' } }, press_actions: [{ type: 'input', text: 'る' }] }, { design: { label: { text: 'れ' } }, press_actions: [{ type: 'input', text: 'れ' }] }, { design: { label: { text: 'ろ' } }, press_actions: [{ type: 'input', text: 'ろ' }] }], specifier: { x: 3, y: 2, width: 1, height: 1 } },
        { design: { label: { system_image: 'return' }, color: 'selected' }, press_actions: [{ type: 'input', text: '\n' }], specifier: { x: 4, y: 2, width: 1, height: 2 } },
        
        // Row 3
        { design: { label: { text: '🌐' }, color: 'special' }, press_actions: [{ type: 'move_tab', tab_type: 'keyboard_change' }], specifier: { x: 0, y: 3, width: 1, height: 1 } },
        { design: { label: { text: '小゛゜' }, color: 'special' }, press_actions: [{ type: 'input', text: '゛' }], specifier: { x: 1, y: 3, width: 1, height: 1 } },
        { design: { label: { text: 'わ' } }, press_actions: [{ type: 'input', text: 'わ' }], variations: [{ design: { label: { text: 'を' } }, press_actions: [{ type: 'input', text: 'を' }] }, { design: { label: { text: 'ん' } }, press_actions: [{ type: 'input', text: 'ん' }] }, { design: { label: { text: 'ー' } }, press_actions: [{ type: 'input', text: 'ー' }] }], specifier: { x: 2, y: 3, width: 1, height: 1 } },
        { design: { label: { text: '、。' }, color: 'special' }, press_actions: [{ type: 'input', text: '、' }], variations: [{ design: { label: { text: '。' } }, press_actions: [{ type: 'input', text: '。' }] }, { design: { label: { text: '？' } }, press_actions: [{ type: 'input', text: '？' }] }, { design: { label: { text: '！' } }, press_actions: [{ type: 'input', text: '！' }] }], specifier: { x: 3, y: 3, width: 1, height: 1 } },
        
        // Row 4 - Space bar
        { design: { label: { text: 'space' }, color: 'special' }, press_actions: [{ type: 'input', text: ' ' }], specifier: { x: 1, y: 4, width: 3, height: 1 } }
      ]
    }
  },

  // 公式日本語フリック
  official_japanese_flick: {
    "identifier": "japanese_flick",
    "language": "ja_JP", 
    "input_style": "direct",
    "metadata": { "custard_version": "1.2", "display_name": "公式日本語フリック" },
    "interface": {
      "key_style": "tenkey_style",
      "key_layout": { "column_count": 5, "type": "grid_fit", "row_count": 4 },
      "keys": [
        {"key_type": "system", "specifier": {"y": 0, "x": 0, "width": 1, "height": 1}, "key": {"type": "flick_star123_tab"}, "specifier_type": "grid_fit"},
        {"key_type": "custom", "specifier": {"y": 0, "x": 1, "width": 1, "height": 1}, "key": {"design": {"label": {"text": "あ"}, "color": "normal"}, "press_actions": [{"type": "input", "text": "あ"}], "variations": [{"type": "flick_variation", "direction": "left", "key": {"design": {"label": {"text": "い"}}, "press_actions": [{"type": "input", "text": "い"}]}}, {"type": "flick_variation", "direction": "top", "key": {"design": {"label": {"text": "う"}}, "press_actions": [{"type": "input", "text": "う"}]}}, {"type": "flick_variation", "direction": "right", "key": {"design": {"label": {"text": "え"}}, "press_actions": [{"type": "input", "text": "え"}]}}, {"type": "flick_variation", "direction": "bottom", "key": {"design": {"label": {"text": "お"}}, "press_actions": [{"type": "input", "text": "お"}]}}]}, "specifier_type": "grid_fit"},
        {"key_type": "custom", "specifier": {"y": 0, "x": 2, "width": 1, "height": 1}, "key": {"design": {"label": {"text": "か"}, "color": "normal"}, "press_actions": [{"type": "input", "text": "か"}], "variations": [{"type": "flick_variation", "direction": "left", "key": {"design": {"label": {"text": "き"}}, "press_actions": [{"type": "input", "text": "き"}]}}, {"type": "flick_variation", "direction": "top", "key": {"design": {"label": {"text": "く"}}, "press_actions": [{"type": "input", "text": "く"}]}}, {"type": "flick_variation", "direction": "right", "key": {"design": {"label": {"text": "け"}}, "press_actions": [{"type": "input", "text": "け"}]}}, {"type": "flick_variation", "direction": "bottom", "key": {"design": {"label": {"text": "こ"}}, "press_actions": [{"type": "input", "text": "こ"}]}}]}, "specifier_type": "grid_fit"},
        {"key_type": "custom", "specifier": {"y": 0, "x": 3, "width": 1, "height": 1}, "key": {"design": {"label": {"text": "さ"}, "color": "normal"}, "press_actions": [{"type": "input", "text": "さ"}], "variations": [{"type": "flick_variation", "direction": "left", "key": {"design": {"label": {"text": "し"}}, "press_actions": [{"type": "input", "text": "し"}]}}, {"type": "flick_variation", "direction": "top", "key": {"design": {"label": {"text": "す"}}, "press_actions": [{"type": "input", "text": "す"}]}}, {"type": "flick_variation", "direction": "right", "key": {"design": {"label": {"text": "せ"}}, "press_actions": [{"type": "input", "text": "せ"}]}}, {"type": "flick_variation", "direction": "bottom", "key": {"design": {"label": {"text": "そ"}}, "press_actions": [{"type": "input", "text": "そ"}]}}]}, "specifier_type": "grid_fit"},
        {"key_type": "custom", "specifier": {"y": 0, "x": 4, "width": 1, "height": 1}, "key": {"design": {"label": {"system_image": "delete.left"}, "color": "special"}, "press_actions": [{"type": "delete", "count": 1}], "variations": [{"type": "flick_variation", "direction": "left", "key": {"design": {"label": {"system_image": "xmark"}}, "press_actions": [{"type": "smart_delete_default"}]}}], "longpress_actions": {"repeat": [{"type": "delete", "count": 1}]}}, "specifier_type": "grid_fit"},
        {"key_type": "system", "specifier": {"y": 1, "x": 0, "width": 1, "height": 1}, "key": {"type": "flick_abc_tab"}, "specifier_type": "grid_fit"},
        {"key_type": "custom", "specifier": {"y": 1, "x": 1, "width": 1, "height": 1}, "key": {"design": {"label": {"text": "た"}, "color": "normal"}, "press_actions": [{"type": "input", "text": "た"}], "variations": [{"type": "flick_variation", "direction": "left", "key": {"design": {"label": {"text": "ち"}}, "press_actions": [{"type": "input", "text": "ち"}]}}, {"type": "flick_variation", "direction": "top", "key": {"design": {"label": {"text": "つ"}}, "press_actions": [{"type": "input", "text": "つ"}]}}, {"type": "flick_variation", "direction": "right", "key": {"design": {"label": {"text": "て"}}, "press_actions": [{"type": "input", "text": "て"}]}}, {"type": "flick_variation", "direction": "bottom", "key": {"design": {"label": {"text": "と"}}, "press_actions": [{"type": "input", "text": "と"}]}}]}, "specifier_type": "grid_fit"},
        {"key_type": "custom", "specifier": {"y": 1, "x": 2, "width": 1, "height": 1}, "key": {"design": {"label": {"text": "な"}, "color": "normal"}, "press_actions": [{"type": "input", "text": "な"}], "variations": [{"type": "flick_variation", "direction": "left", "key": {"design": {"label": {"text": "に"}}, "press_actions": [{"type": "input", "text": "に"}]}}, {"type": "flick_variation", "direction": "top", "key": {"design": {"label": {"text": "ぬ"}}, "press_actions": [{"type": "input", "text": "ぬ"}]}}, {"type": "flick_variation", "direction": "right", "key": {"design": {"label": {"text": "ね"}}, "press_actions": [{"type": "input", "text": "ね"}]}}, {"type": "flick_variation", "direction": "bottom", "key": {"design": {"label": {"text": "の"}}, "press_actions": [{"type": "input", "text": "の"}]}}]}, "specifier_type": "grid_fit"},
        {"key_type": "custom", "specifier": {"y": 1, "x": 3, "width": 1, "height": 1}, "key": {"design": {"label": {"text": "は"}, "color": "normal"}, "press_actions": [{"type": "input", "text": "は"}], "variations": [{"type": "flick_variation", "direction": "left", "key": {"design": {"label": {"text": "ひ"}}, "press_actions": [{"type": "input", "text": "ひ"}]}}, {"type": "flick_variation", "direction": "top", "key": {"design": {"label": {"text": "ふ"}}, "press_actions": [{"type": "input", "text": "ふ"}]}}, {"type": "flick_variation", "direction": "right", "key": {"design": {"label": {"text": "へ"}}, "press_actions": [{"type": "input", "text": "へ"}]}}, {"type": "flick_variation", "direction": "bottom", "key": {"design": {"label": {"text": "ほ"}}, "press_actions": [{"type": "input", "text": "ほ"}]}}]}, "specifier_type": "grid_fit"},
        {"key_type": "custom", "specifier": {"y": 1, "x": 4, "width": 1, "height": 1}, "key": {"design": {"label": {"text": "空白"}, "color": "special"}, "press_actions": [{"type": "input", "text": " "}], "variations": [{"type": "flick_variation", "direction": "left", "key": {"design": {"label": {"text": "←"}}, "press_actions": [{"type": "move_cursor", "count": -1}]}}, {"type": "flick_variation", "direction": "top", "key": {"design": {"label": {"text": "全角"}}, "press_actions": [{"type": "input", "text": "　"}]}}, {"type": "flick_variation", "direction": "bottom", "key": {"design": {"label": {"text": "tab"}}, "press_actions": [{"type": "input", "text": "\t"}]}}], "longpress_actions": {"start": [{"type": "toggle_cursor_bar"}]}}, "specifier_type": "grid_fit"},
        {"key_type": "system", "specifier": {"y": 2, "x": 0, "width": 1, "height": 1}, "key": {"type": "flick_hira_tab"}, "specifier_type": "grid_fit"},
        {"key_type": "custom", "specifier": {"y": 2, "x": 1, "width": 1, "height": 1}, "key": {"design": {"label": {"text": "ま"}, "color": "normal"}, "press_actions": [{"type": "input", "text": "ま"}], "variations": [{"type": "flick_variation", "direction": "left", "key": {"design": {"label": {"text": "み"}}, "press_actions": [{"type": "input", "text": "み"}]}}, {"type": "flick_variation", "direction": "top", "key": {"design": {"label": {"text": "む"}}, "press_actions": [{"type": "input", "text": "む"}]}}, {"type": "flick_variation", "direction": "right", "key": {"design": {"label": {"text": "め"}}, "press_actions": [{"type": "input", "text": "め"}]}}, {"type": "flick_variation", "direction": "bottom", "key": {"design": {"label": {"text": "も"}}, "press_actions": [{"type": "input", "text": "も"}]}}]}, "specifier_type": "grid_fit"},
        {"key_type": "custom", "specifier": {"y": 2, "x": 2, "width": 1, "height": 1}, "key": {"design": {"label": {"text": "や"}, "color": "normal"}, "press_actions": [{"type": "input", "text": "や"}], "variations": [{"type": "flick_variation", "direction": "left", "key": {"design": {"label": {"text": "「"}}, "press_actions": [{"type": "input", "text": "「"}]}}, {"type": "flick_variation", "direction": "top", "key": {"design": {"label": {"text": "ゆ"}}, "press_actions": [{"type": "input", "text": "ゆ"}]}}, {"type": "flick_variation", "direction": "right", "key": {"design": {"label": {"text": "」"}}, "press_actions": [{"type": "input", "text": "」"}]}}, {"type": "flick_variation", "direction": "bottom", "key": {"design": {"label": {"text": "よ"}}, "press_actions": [{"type": "input", "text": "よ"}]}}]}, "specifier_type": "grid_fit"},
        {"key_type": "custom", "specifier": {"y": 2, "x": 3, "width": 1, "height": 1}, "key": {"design": {"label": {"text": "ら"}, "color": "normal"}, "press_actions": [{"type": "input", "text": "ら"}], "variations": [{"type": "flick_variation", "direction": "left", "key": {"design": {"label": {"text": "り"}}, "press_actions": [{"type": "input", "text": "り"}]}}, {"type": "flick_variation", "direction": "top", "key": {"design": {"label": {"text": "る"}}, "press_actions": [{"type": "input", "text": "る"}]}}, {"type": "flick_variation", "direction": "right", "key": {"design": {"label": {"text": "れ"}}, "press_actions": [{"type": "input", "text": "れ"}]}}, {"type": "flick_variation", "direction": "bottom", "key": {"design": {"label": {"text": "ろ"}}, "press_actions": [{"type": "input", "text": "ろ"}]}}]}, "specifier_type": "grid_fit"},
        {"key_type": "system", "specifier": {"y": 2, "x": 4, "width": 1, "height": 2}, "key": {"type": "enter"}, "specifier_type": "grid_fit"},
        {"key_type": "system", "specifier": {"y": 3, "x": 0, "width": 1, "height": 1}, "key": {"type": "change_keyboard"}, "specifier_type": "grid_fit"},
        {"key_type": "system", "specifier": {"y": 3, "x": 1, "width": 1, "height": 1}, "key": {"type": "flick_kogaki"}, "specifier_type": "grid_fit"},
        {"key_type": "custom", "specifier": {"y": 3, "x": 2, "width": 1, "height": 1}, "key": {"design": {"label": {"text": "わ"}, "color": "normal"}, "press_actions": [{"type": "input", "text": "わ"}], "variations": [{"type": "flick_variation", "direction": "left", "key": {"design": {"label": {"text": "を"}}, "press_actions": [{"type": "input", "text": "を"}]}}, {"type": "flick_variation", "direction": "top", "key": {"design": {"label": {"text": "ん"}}, "press_actions": [{"type": "input", "text": "ん"}]}}, {"type": "flick_variation", "direction": "right", "key": {"design": {"label": {"text": "ー"}}, "press_actions": [{"type": "input", "text": "ー"}]}}]}, "specifier_type": "grid_fit"},
        {"key_type": "system", "specifier": {"y": 3, "x": 3, "width": 1, "height": 1}, "key": {"type": "flick_kutoten"}, "specifier_type": "grid_fit"}
      ]
    }
  }
}