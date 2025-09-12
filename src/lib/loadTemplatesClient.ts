"use client"
import type { CustardKeyboard } from '@/types/custard'
// Static JSON imports for dev/webpack compatibility
import english_flick from './templates/english_flick.json'
import japanese_flick from './templates/japanese_flick.json'
import qwerty_en from './templates/qwerty_en.json'
import qwerty_ja from './templates/qwerty_ja.json'
import symbols_flick from './templates/symbols_flick.json'

// Load templates via API when available (dev/Vercel),
// and fall back to bundled JSON files for static export (GitHub Pages).
export async function loadTemplates(): Promise<Record<string, CustardKeyboard>> {
  try {
    const res = await fetch('/api/templates')
    if (res.ok) {
      const data = await res.json()
      if (data && data.templates) return data.templates as Record<string, CustardKeyboard>
    }
  } catch {}

  // Fallback: use statically imported JSON presets bundled with the app
  const templates: Record<string, CustardKeyboard> = {
    english_flick: english_flick as unknown as CustardKeyboard,
    japanese_flick: japanese_flick as unknown as CustardKeyboard,
    qwerty_en: qwerty_en as unknown as CustardKeyboard,
    qwerty_ja: qwerty_ja as unknown as CustardKeyboard,
    symbols_flick: symbols_flick as unknown as CustardKeyboard,
  }
  return templates
}
