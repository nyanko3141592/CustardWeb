import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'src', 'lib', 'templates')
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const templates: Record<string, any> = {}

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const filePath = path.join(dir, entry.name)
        const raw = await fs.readFile(filePath, 'utf8')
        try {
          const data = JSON.parse(raw)
          const key = entry.name.replace(/\.json$/i, '')
          templates[key] = data
        } catch {
          // Skip invalid JSON files silently
        }
      }
    }

    // Sort keys for stable order (japanese_flick first if present)
    const sorted = Object.fromEntries(
      Object.entries(templates).sort((a, b) => {
        const nameA = a[0]
        const nameB = b[0]
        if (nameA === 'japanese_flick') return -1
        if (nameB === 'japanese_flick') return 1
        return nameA.localeCompare(nameB)
      })
    )

    return NextResponse.json({ templates: sorted })
  } catch (e) {
    return NextResponse.json({ templates: {} }, { status: 200 })
  }
}

