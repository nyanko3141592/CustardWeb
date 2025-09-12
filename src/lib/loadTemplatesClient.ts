"use client"
import type { CustardKeyboard } from '@/types/custard'

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

  // Try bundler glob import to include all JSON files under src/lib/templates
  // This picks up newly added presets without hardcoding filenames.
  try {
    // Turbopack/Webpack glob import
    const modules: Record<string, any> = (import.meta as any).glob('./templates/*.json', { eager: true })
    const collected: Record<string, CustardKeyboard> = {}
    for (const [filePath, mod] of Object.entries(modules)) {
      const name = filePath.split('/').pop()?.replace(/\.json$/i, '') || ''
      const data = (mod as any)?.default ?? mod
      if (name && data) collected[name] = data as CustardKeyboard
    }
    if (Object.keys(collected).length > 0) return collected
  } catch {}

  // Fallback: import static JSONs bundled with the app
  try {
    const [
      english_flick,
      japanese_flick,
      qwerty_en,
      qwerty_flick,
      qwerty_ja,
      symbols_flick,
    ] = await Promise.all([
      import('@/lib/templates/english_flick.json'),
      import('@/lib/templates/japanese_flick.json'),
      import('@/lib/templates/qwerty_en.json'),
      import('@/lib/templates/qwerty_flick.json'),
      import('@/lib/templates/qwerty_ja.json'),
      import('@/lib/templates/symbols_flick.json'),
    ])

    const templates: Record<string, CustardKeyboard> = {
      english_flick: english_flick.default as CustardKeyboard,
      japanese_flick: japanese_flick.default as CustardKeyboard,
      qwerty_en: qwerty_en.default as CustardKeyboard,
      qwerty_flick: qwerty_flick.default as CustardKeyboard,
      qwerty_ja: qwerty_ja.default as CustardKeyboard,
      symbols_flick: symbols_flick.default as CustardKeyboard,
    }
    return templates
  } catch {
    return {}
  }
}
