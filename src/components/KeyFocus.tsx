import React from 'react'
import { Key, FlickVariation } from '@/types/custard'
import KeyButton from './KeyButton'

interface KeyFocusProps {
  keyData: Key
  keyStyle?: 'tenkey_style' | 'pc_style' | string
  displayMode?: 'appearance' | 'actions'
}

function getVariationKey(keyData: Key, dir: 'left' | 'up' | 'right' | 'down'): Key | null {
  if (!keyData.variations || keyData.variations.length === 0) return null

  const first = keyData.variations[0] as any
  if (first && 'type' in first && first.type === 'flick_variation') {
    const map: Record<'left' | 'up' | 'right' | 'down', 'left' | 'top' | 'right' | 'bottom'> = {
      left: 'left',
      up: 'top',
      right: 'right',
      down: 'bottom'
    }
    const target = (keyData.variations as FlickVariation[]).find(v => v.direction === map[dir])
    return target ? target.key : null
  } else {
    const idxMap: Record<'left' | 'up' | 'right' | 'down', number> = {
      left: 0,
      up: 1,
      right: 2,
      down: 3
    }
    const idx = idxMap[dir]
    return (keyData.variations[idx] as Key) || null
  }
}

export default function KeyFocus({ keyData, keyStyle, displayMode = 'appearance' }: KeyFocusProps) {
  const leftKey = getVariationKey(keyData, 'left')
  const upKey = getVariationKey(keyData, 'up')
  const rightKey = getVariationKey(keyData, 'right')
  const downKey = getVariationKey(keyData, 'down')

  // サイズを固定して見やすく
  const cellSize = 56

  return (
    <div className="relative rounded-xl shadow-xl border border-gray-200 bg-white p-3">
      {(keyData.longpress_actions && ((keyData.longpress_actions.start && keyData.longpress_actions.start.length) || (keyData.longpress_actions.repeat && keyData.longpress_actions.repeat.length))) && (
        <span className="absolute -top-2 -right-2 text-[10px] px-1 py-0.5 rounded bg-yellow-100 text-yellow-700 border border-yellow-200">LP</span>
      )}
      <div className="grid grid-cols-3 grid-rows-3 gap-2">
        <div style={{ width: cellSize, height: cellSize }}></div>
        <div style={{ width: cellSize, height: cellSize }}>
            {upKey && (
              <KeyButton keyData={upKey} keyStyle={keyStyle} flickDirection="center" displayMode={displayMode} hideLPBadge />
            )}
        </div>
          <div style={{ width: cellSize, height: cellSize }}></div>

          <div style={{ width: cellSize, height: cellSize }}>
            {leftKey && (
              <KeyButton keyData={leftKey} keyStyle={keyStyle} flickDirection="center" displayMode={displayMode} hideLPBadge />
            )}
          </div>
          <div style={{ width: cellSize, height: cellSize }}>
            <KeyButton keyData={keyData} keyStyle={keyStyle} flickDirection="center" displayMode={displayMode} hideLPBadge />
          </div>
          <div style={{ width: cellSize, height: cellSize }}>
            {rightKey && (
              <KeyButton keyData={rightKey} keyStyle={keyStyle} flickDirection="center" displayMode={displayMode} hideLPBadge />
            )}
          </div>

          <div style={{ width: cellSize, height: cellSize }}></div>
          <div style={{ width: cellSize, height: cellSize }}>
            {downKey && (
              <KeyButton keyData={downKey} keyStyle={keyStyle} flickDirection="center" displayMode={displayMode} hideLPBadge />
            )}
          </div>
          <div style={{ width: cellSize, height: cellSize }}></div>
      </div>
    </div>
  )
}
