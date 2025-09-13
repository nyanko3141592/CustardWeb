import { CustardKeyboard, KeyWrapper } from '@/types/custard'

type FlickIn = 'left' | 'up' | 'right' | 'down' | 'top' | 'bottom'

export type AIAction =
  | { type: 'add_key'; x: number; y: number; width?: number; height?: number }
  | { type: 'remove_key'; index: number }
  | { type: 'move_key'; index: number; x: number; y: number }
  | { type: 'set_key_size'; index: number; width: number; height: number }
  | { type: 'set_key_label'; index: number; text: string }
  | { type: 'set_key_color'; index: number; color: string }
  | { type: 'set_press_input'; index: number; text: string }
  // Key label (main/sub) actions
  | { type: 'set_key_main_label'; index: number; text: string }
  | { type: 'set_key_sub_label'; index: number; text: string }
  | { type: 'set_key_label_main_sub'; index: number; main: string; sub?: string }
  | { type: 'set_keyboard_layout'; row_count: number; column_count: number }
  | { type: 'set_input_style'; input_style: CustardKeyboard['input_style'] }
  | { type: 'set_language'; language: CustardKeyboard['language'] }
  | { type: 'rename'; identifier?: string; display_name?: string }
  // Flick variation actions
  | { type: 'add_flick_variation'; index: number; direction: FlickIn }
  | { type: 'remove_flick_variation'; index: number; direction: FlickIn }
  | { type: 'set_flick_label'; index: number; direction: FlickIn; text: string }
  | { type: 'set_flick_input'; index: number; direction: FlickIn; text: string }
  | { type: 'set_flick_color'; index: number; direction: FlickIn; color: string }
  // Flick label (main/sub) actions
  | { type: 'set_flick_main_label'; index: number; direction: FlickIn; text: string }
  | { type: 'set_flick_sub_label'; index: number; direction: FlickIn; text: string }
  | { type: 'set_flick_label_main_sub'; index: number; direction: FlickIn; main: string; sub?: string }

export interface AIActionResult {
  keyboard: CustardKeyboard
  description: string
}

const ensureKeyboardShape = (kb: CustardKeyboard): CustardKeyboard => {
  if (!kb.interface) {
    kb.interface = { key_layout: { type: 'grid_fit', row_count: 4, column_count: 10 }, key_style: 'tenkey_style', keys: [] }
  }
  if (!kb.interface.key_layout) {
    kb.interface.key_layout = { type: 'grid_fit', row_count: 4, column_count: 10 }
  }
  if (!Array.isArray(kb.interface.keys)) {
    kb.interface.keys = []
  }
  if (!kb.metadata) {
    kb.metadata = { custard_version: '1.2', display_name: kb.identifier || 'キーボード' }
  }
  return kb
}

export function applyAiActions(original: CustardKeyboard, actions: AIAction[]): AIActionResult {
  let kb: CustardKeyboard = JSON.parse(JSON.stringify(original))
  kb = ensureKeyboardShape(kb)

  const summaries: string[] = []

  const getKeyAtIndex = (idx: number): { item: any; key: any } | null => {
    const item: any = kb.interface?.keys?.[idx]
    if (!item) return null
    const key = item.key_type ? item.key : item
    return { item, key }
  }

  const dirMap: Record<string, 'left'|'top'|'right'|'bottom'> = {
    left: 'left',
    up: 'top',
    right: 'right',
    down: 'bottom',
    top: 'top',
    bottom: 'bottom',
  }

  const ensureFlickObjects = (key: any) => {
    if (!Array.isArray(key.variations)) key.variations = []
    const first = key.variations[0]
    const isFlickObjects = first && typeof first === 'object' && 'direction' in first && 'key' in first
    if (!isFlickObjects && key.variations.length) {
      const legacy: any[] = key.variations as any[]
      const order: Array<'left'|'up'|'right'|'down'> = ['left','up','right','down']
      key.variations = order
        .map((d, i) => {
          const v = legacy[i]
          if (!v) return null
          const vk: any = { ...(v as any) }
          if (!vk.longpress_actions || typeof vk.longpress_actions !== 'object') {
            vk.longpress_actions = { duration: 'normal', start: [], repeat: [] }
          } else {
            vk.longpress_actions.start = Array.isArray(vk.longpress_actions.start) ? vk.longpress_actions.start : []
            vk.longpress_actions.repeat = Array.isArray(vk.longpress_actions.repeat) ? vk.longpress_actions.repeat : []
            vk.longpress_actions.duration = vk.longpress_actions.duration || 'normal'
          }
          return { type: 'flick_variation', direction: d === 'up' ? 'top' : d === 'down' ? 'bottom' : d, key: vk }
        })
        .filter(Boolean) as any
    }
  }

  const ensureDesign = (key: any) => {
    if (!key.design) key.design = { label: { text: '' }, color: 'normal' }
    if (!key.design.label) key.design.label = { text: '' }
  }

  const toMainSub = (key: any) => {
    ensureDesign(key)
    const label: any = key.design.label
    if (!('main' in label)) {
      const mainText = typeof label?.text === 'string' ? label.text : ''
      key.design.label = { main: { text: mainText } }
    }
  }

  const getOrCreateFlick = (key: any, directionIn: FlickIn, createIfMissing = false) => {
    ensureFlickObjects(key)
    const target = dirMap[directionIn]
    let entry = (key.variations as any[]).find((v: any) => v && v.direction === target)
    if (!entry && createIfMissing) {
      entry = {
        type: 'flick_variation',
        direction: target,
        key: {
          design: { label: { text: '' }, color: 'normal' },
          longpress_actions: { start: [], repeat: [], duration: 'normal' },
          press_actions: [],
          variations: []
        }
      }
      ;(key.variations as any[]).push(entry)
    }
    return entry
  }

  for (const a of actions) {
    switch (a.type) {
      case 'add_key': {
        const w = Math.max(1, Math.floor(a.width ?? 1))
        const h = Math.max(1, Math.floor(a.height ?? 1))
        const key: KeyWrapper = {
          key_type: 'custom',
          specifier_type: 'grid_fit',
          specifier: { x: a.x, y: a.y, width: w, height: h },
          key: {
            design: { label: { text: '' }, color: 'normal' },
            longpress_actions: { start: [], repeat: [], duration: 'normal' },
            press_actions: [],
            variations: []
          }
        }
        kb.interface.keys.push(key)
        summaries.push(`キーを追加 (${a.x}, ${a.y})`)
        break
      }
      case 'remove_key': {
        if (a.index >= 0 && a.index < kb.interface.keys.length) {
          kb.interface.keys.splice(a.index, 1)
          summaries.push(`キー#${a.index + 1} を削除`)
        }
        break
      }
      case 'move_key': {
        const item = kb.interface.keys[a.index] as any
        if (item && item.specifier) {
          item.specifier.x = a.x
          item.specifier.y = a.y
          summaries.push(`キー#${a.index + 1} を (${a.x}, ${a.y}) に移動`)
        }
        break
      }
      case 'set_key_size': {
        const item = kb.interface.keys[a.index] as any
        if (item && item.specifier) {
          item.specifier.width = Math.max(1, Math.floor(a.width))
          item.specifier.height = Math.max(1, Math.floor(a.height))
          summaries.push(`キー#${a.index + 1} のサイズを ${a.width}x${a.height} に変更`)
        }
        break
      }
      case 'set_key_label': {
        const pair = getKeyAtIndex(a.index)
        if (pair) {
          ensureDesign(pair.key)
          pair.key.design.label.text = a.text
          summaries.push(`キー#${a.index + 1} のラベルを「${a.text}」に`)
        }
        break
      }
      case 'set_key_main_label': {
        const pair = getKeyAtIndex(a.index)
        if (pair) {
          toMainSub(pair.key)
          ;(pair.key.design.label as any).main = { text: a.text }
          summaries.push(`キー#${a.index + 1} のメインラベルを「${a.text}」に`)
        }
        break
      }
      case 'set_key_sub_label': {
        const pair = getKeyAtIndex(a.index)
        if (pair) {
          toMainSub(pair.key)
          ;(pair.key.design.label as any).sub = { text: a.text }
          summaries.push(`キー#${a.index + 1} のサブラベルを「${a.text}」に`)
        }
        break
      }
      case 'set_key_label_main_sub': {
        const pair = getKeyAtIndex(a.index)
        if (pair) {
          toMainSub(pair.key)
          ;(pair.key.design.label as any).main = { text: a.main }
          if (typeof a.sub === 'string') {
            ;(pair.key.design.label as any).sub = { text: a.sub }
          }
          summaries.push(`キー#${a.index + 1} のラベル(main/sub)を設定`)
        }
        break
      }
      case 'set_key_color': {
        const pair = getKeyAtIndex(a.index)
        if (pair) {
          if (!pair.key.design) pair.key.design = { label: { text: '' }, color: 'normal' }
          pair.key.design.color = a.color
          summaries.push(`キー#${a.index + 1} の色を ${a.color} に`)
        }
        break
      }
      case 'set_press_input': {
        const pair = getKeyAtIndex(a.index)
        if (pair) {
          pair.key.press_actions = [{ type: 'input', text: a.text } as any]
          summaries.push(`キー#${a.index + 1} の入力を「${a.text}」に`)
        }
        break
      }
      case 'set_keyboard_layout': {
        const layout = kb.interface.key_layout as any
        if (layout && layout.type === 'grid_fit') {
          layout.row_count = Math.max(1, Math.floor(a.row_count))
          layout.column_count = Math.max(1, Math.floor(a.column_count))
          summaries.push(`レイアウトを ${a.row_count} 行 x ${a.column_count} 列 に`)
        }
        break
      }
      case 'set_input_style': {
        kb.input_style = a.input_style
        summaries.push(`入力スタイルを ${a.input_style} に`)
        break
      }
      case 'set_language': {
        kb.language = a.language
        summaries.push(`言語を ${a.language} に`)
        break
      }
      case 'rename': {
        if (a.identifier) kb.identifier = a.identifier
        if (a.display_name) {
          kb.metadata = kb.metadata || { custard_version: '1.2', display_name: '' }
          kb.metadata.display_name = a.display_name
        }
        summaries.push('名前を変更')
        break
      }
      case 'add_flick_variation': {
        const pair = getKeyAtIndex(a.index)
        if (pair) {
          const existed = getOrCreateFlick(pair.key, a.direction, false)
          if (!existed) {
            getOrCreateFlick(pair.key, a.direction, true)
            summaries.push(`キー#${a.index + 1} にフリック「${a.direction}」を追加`)
          }
        }
        break
      }
      case 'remove_flick_variation': {
        const pair = getKeyAtIndex(a.index)
        if (pair) {
          ensureFlickObjects(pair.key)
          const target = dirMap[a.direction]
          const arr: any[] = pair.key.variations
          const i = arr.findIndex((v: any) => v && v.direction === target)
          if (i >= 0) {
            arr.splice(i, 1)
            summaries.push(`キー#${a.index + 1} のフリック「${a.direction}」を削除`)
          }
        }
        break
      }
      case 'set_flick_label': {
        const pair = getKeyAtIndex(a.index)
        if (pair) {
          const entry = getOrCreateFlick(pair.key, a.direction, true)
          if (entry) {
            ensureDesign(entry.key)
            entry.key.design.label.text = a.text
            summaries.push(`キー#${a.index + 1} のフリック「${a.direction}」ラベルを「${a.text}」に`)
          }
        }
        break
      }
      case 'set_flick_main_label': {
        const pair = getKeyAtIndex(a.index)
        if (pair) {
          const entry = getOrCreateFlick(pair.key, a.direction, true)
          if (entry) {
            toMainSub(entry.key)
            ;(entry.key.design.label as any).main = { text: a.text }
            summaries.push(`キー#${a.index + 1} のフリック「${a.direction}」メインラベルを「${a.text}」に`)
          }
        }
        break
      }
      case 'set_flick_sub_label': {
        const pair = getKeyAtIndex(a.index)
        if (pair) {
          const entry = getOrCreateFlick(pair.key, a.direction, true)
          if (entry) {
            toMainSub(entry.key)
            ;(entry.key.design.label as any).sub = { text: a.text }
            summaries.push(`キー#${a.index + 1} のフリック「${a.direction}」サブラベルを「${a.text}」に`)
          }
        }
        break
      }
      case 'set_flick_label_main_sub': {
        const pair = getKeyAtIndex(a.index)
        if (pair) {
          const entry = getOrCreateFlick(pair.key, a.direction, true)
          if (entry) {
            toMainSub(entry.key)
            ;(entry.key.design.label as any).main = { text: a.main }
            if (typeof a.sub === 'string') {
              ;(entry.key.design.label as any).sub = { text: a.sub }
            }
            summaries.push(`キー#${a.index + 1} のフリック「${a.direction}」ラベル(main/sub)を設定`)
          }
        }
        break
      }
      case 'set_flick_input': {
        const pair = getKeyAtIndex(a.index)
        if (pair) {
          const entry = getOrCreateFlick(pair.key, a.direction, true)
          if (entry) {
            entry.key.press_actions = [{ type: 'input', text: a.text } as any]
            summaries.push(`キー#${a.index + 1} のフリック「${a.direction}」入力を「${a.text}」に`)
          }
        }
        break
      }
      case 'set_flick_color': {
        const pair = getKeyAtIndex(a.index)
        if (pair) {
          const entry = getOrCreateFlick(pair.key, a.direction, true)
          if (entry) {
            if (!entry.key.design) entry.key.design = { label: { text: '' }, color: 'normal' }
            entry.key.design.color = (a as any).color
            summaries.push(`キー#${a.index + 1} のフリック「${a.direction}」色を ${(a as any).color} に`)
          }
        }
        break
      }
      default:
        // Exhaustiveness guard
        summaries.push('未対応のアクションを受信')
    }
  }

  const description = summaries.length ? summaries.join(' / ') : 'AIアクションを適用'
  return { keyboard: kb, description }
}
