import { CustardKeyboard, Key, KeyWrapper, FlickVariation, SystemKey, LabelDesign } from '@/types/custard'

// Decode common C-style escapes (\\t, \\n, \\r, \\uXXXX, \\\) in text fields
function decodeEscapes(input: any): any {
  if (typeof input !== 'string') return input
  return input.replace(/\\(u[0-9a-fA-F]{4}|n|t|r|\\)/g, (_m, g1) => {
    if (g1 === 'n') return '\n'
    if (g1 === 't') return '\t'
    if (g1 === 'r') return '\r'
    if (g1 === '\\') return '\\'
    if (g1 && g1.startsWith('u')) {
      try {
        const code = parseInt(g1.slice(1), 16)
        return String.fromCharCode(code)
      } catch {
        return input
      }
    }
    return input
  })
}

// Normalize label to explicit type form required by azooKey
function normalizeLabel(label: any): any /* LabelDesign (minimal keys for azooKey) */ | undefined {
  if (!label) return undefined
  // Prefer minimal form: azooKey references often omit type for text/system_image
  if (typeof label.system_image === 'string') {
    return { system_image: label.system_image }
  }
  if (typeof label.text === 'string') {
    return { text: label.text }
  }
  const main = (label.main && (typeof label.main === 'string' ? label.main : label.main.text)) || undefined
  const sub = (label.sub && (typeof label.sub === 'string' ? label.sub : label.sub.text)) || undefined
  if (main || sub !== undefined) {
    return { type: 'main_and_sub', main: main || '', sub: sub ?? '' }
  }
  return undefined
}

// Normalize a Key (custom key content)
function normalizeKey(key: any): Key {
  const k: any = { ...key }

  // Ensure design and label shape
  if (!k.design) k.design = {}
  if (k.design.label) {
    const nl = normalizeLabel(k.design.label)
    if (nl) k.design.label = nl
  }

  // Ensure press_actions: if missing/empty, infer from label text
  const hasPressList = Array.isArray(k.press_actions) && k.press_actions.length > 0
  if (!hasPressList) {
    let inferred: string | undefined
    const lb: any = k.design?.label
    if (lb) {
      if (typeof lb.text === 'string' && lb.text) inferred = lb.text
      else if (typeof lb.main === 'string' && lb.main) inferred = lb.main
    }
    if (inferred) {
      k.press_actions = [{ type: 'input', text: inferred }]
    } else if (Array.isArray(k.press_actions) && k.press_actions.length === 0) {
      // Drop empty array to avoid azooKey rejecting empty press_actions
      delete k.press_actions
    }
  }
  // Decode escapes in press_actions text
  if (Array.isArray(k.press_actions)) {
    k.press_actions = k.press_actions.map((a: any) => {
      if (a && a.type === 'input' && typeof a.text === 'string') {
        return { ...a, text: decodeEscapes(a.text) }
      }
      return a
    })
  }

  // Ensure longpress structure exists (CustardKit references expect it)
  if (!k.longpress_actions) {
    k.longpress_actions = { start: [], repeat: [], duration: 'normal' }
  }
  if (k.longpress_actions) {
    const lp = k.longpress_actions
    if (!Array.isArray(lp.start)) lp.start = Array.isArray(lp.start) ? lp.start : []
    if (!Array.isArray(lp.repeat)) lp.repeat = Array.isArray(lp.repeat) ? lp.repeat : []
    if (!lp.duration) lp.duration = 'normal'
    // Decode escapes in longpress actions
    lp.start = (lp.start || []).map((a: any) => a && a.type === 'input' && typeof a.text === 'string' ? { ...a, text: decodeEscapes(a.text) } : a)
    lp.repeat = (lp.repeat || []).map((a: any) => a && a.type === 'input' && typeof a.text === 'string' ? { ...a, text: decodeEscapes(a.text) } : a)
  }

  // Normalize variations: support either FlickVariation[] or Key[] in order [left, top, right, bottom]
  if (Array.isArray(k.variations) && k.variations.length > 0) {
    const first = k.variations[0]
    if (!first || typeof (first as any).type !== 'string' || (first as any).type !== 'flick_variation') {
      // Treat as Key[] form
      const order: Array<'left' | 'top' | 'right' | 'bottom'> = ['left', 'top', 'right', 'bottom']
      k.variations = (k.variations as any[]).slice(0, 4).map((v, i) => ({
        type: 'flick_variation',
        direction: order[i],
        key: normalizeKey(v as Key)
      } as FlickVariation))
    } else {
      // Already FlickVariation[]; normalize inner key and coerce direction names
      k.variations = (k.variations as any[]).map((v) => {
        const dirRaw = (v as any).direction
        const direction = dirRaw === 'up' ? 'top' : dirRaw === 'down' ? 'bottom' : dirRaw
        return {
          type: 'flick_variation',
          direction,
          key: normalizeKey((v as any).key)
        } as FlickVariation
      })
    }
    // Keep empty variations array if present (references allow it)
  }
  // Keep empty variations if present

  // Remove specifier from inner key if present; it belongs to wrapper
  if (k.specifier) {
    delete k.specifier
  }

  return k as Key
}

// Wrap either a Key or an existing KeyWrapper into a normalized KeyWrapper
function normalizeKeyItem(item: any): KeyWrapper {
  // Already a wrapper
  if (item && item.key_type) {
    const wrapped: any = { ...item }
    // Ensure specifier_type is present for consistency with references
    if (!wrapped.specifier_type) wrapped.specifier_type = 'grid_fit'
    if (wrapped.specifier) {
      wrapped.specifier = {
        x: Math.max(0, Number(wrapped.specifier.x ?? 0)),
        y: Math.max(0, Number(wrapped.specifier.y ?? 0)),
        width: Math.max(1, Number(wrapped.specifier.width ?? 1)),
        height: Math.max(1, Number(wrapped.specifier.height ?? 1))
      }
    }
    // Normalize custom key content
    if (wrapped.key_type === 'custom') {
      wrapped.key = normalizeKey(wrapped.key as Key)
    } else if (wrapped.key_type === 'system') {
      // System key: ensure minimal shape
      wrapped.key = { type: (wrapped.key as SystemKey)?.type || '' }
    }
    return wrapped as KeyWrapper
  }

  // Plain Key -> wrap as custom
  const key = normalizeKey(item as Key)
  let specifier = (item as any)?.specifier || undefined
  if (specifier) {
    // Fill defaults similar to references
    specifier = {
      x: Math.max(0, Number(specifier.x ?? 0)),
      y: Math.max(0, Number(specifier.y ?? 0)),
      width: Math.max(1, Number(specifier.width ?? 1)),
      height: Math.max(1, Number(specifier.height ?? 1))
    }
  }
  const wrapped: KeyWrapper = {
    key_type: 'custom',
    ...(specifier ? { specifier_type: 'grid_fit', specifier } : {}),
    key
  }
  return wrapped
}

// Determine if a normalized label is effectively empty
function isEmptyLabelNormalized(label: any): boolean {
  if (!label) return true
  if (typeof label.system_image === 'string') return false
  if (typeof label.text === 'string') return label.text.trim() === ''
  // main_and_sub form
  const main = typeof label.main === 'string' ? label.main : (label.main?.text ?? '')
  const sub = label.sub == null ? '' : (typeof label.sub === 'string' ? label.sub : (label.sub?.text ?? ''))
  return String(main).trim() === '' && String(sub).trim() === ''
}

// Determine if a normalized key is an "unset" placeholder (no label, no actions, and no meaningful variations)
function isUnsetKeyNormalized(key: any): boolean {
  const noPress = !Array.isArray(key?.press_actions) || key.press_actions.length === 0
  const emptyLabel = isEmptyLabelNormalized(key?.design?.label)
  const vars: any[] = Array.isArray(key?.variations) ? key.variations : []
  // Consider a variation meaningful if its inner key has label or press_actions
  const hasMeaningfulVariation = vars.some((v: any) => {
    const vk = v?.key ?? v
    const vNoPress = !Array.isArray(vk?.press_actions) || vk.press_actions.length === 0
    const vEmptyLabel = isEmptyLabelNormalized(vk?.design?.label)
    return !(vNoPress && vEmptyLabel)
  })
  return noPress && emptyLabel && !hasMeaningfulVariation
}

export function normalizeForAzooKey(keyboard: CustardKeyboard): CustardKeyboard {
  const kb: CustardKeyboard = JSON.parse(JSON.stringify(keyboard))

  // Ensure metadata and version
  if (!kb.metadata) {
    ;(kb as any).metadata = { custard_version: '1.2', display_name: kb.identifier }
  } else {
    kb.metadata.custard_version = kb.metadata.custard_version || '1.2'
    kb.metadata.display_name = kb.metadata.display_name || kb.identifier
  }

  // Normalize keys to KeyWrapper[]
  const keys = kb.interface.keys || []
  let wrapped = keys.map((it: any) => normalizeKeyItem(it))

  // Filter out unset flick variations and drop entirely unset custom keys
  wrapped = wrapped.map((w) => {
    if ((w as any).key_type === 'custom') {
      const wk: any = (w as any).key
      if (Array.isArray(wk.variations) && wk.variations.length > 0) {
        wk.variations = wk.variations.filter((v: any) => !isUnsetKeyNormalized(v?.key ?? v))
      }
      ;(w as any).key = wk
    }
    return w
  }).filter((w) => {
    if ((w as any).key_type === 'system') return true
    const wk: any = (w as any).key
    return !isUnsetKeyNormalized(wk)
  })

  kb.interface.keys = wrapped

  // If any flick usage is detected, set input_style to 'flick'
  /* Keep original input_style; some official presets mark flick layouts as 'direct'.
     Only adjust if clearly invalid and no value set. */
  /* const usesFlick = (kb.interface.keys as any[]).some((it: any) => {
    if (it.key_type === 'system' && typeof it.key?.type === 'string' && it.key.type.startsWith('flick_')) return true
    if (it.key_type === 'custom' && Array.isArray(it.key?.variations) && it.key.variations.length > 0) return true
    return false
  })
  if (usesFlick) {
    kb.input_style = 'flick'
  } */

  return kb
}
