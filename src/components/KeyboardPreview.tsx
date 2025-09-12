import React, { useState, useEffect } from 'react'
import { CustardKeyboard, Key, KeyWrapper } from '@/types/custard'
import KeyButton from './KeyButton'
import KeyFocus from './KeyFocus'

interface KeyboardPreviewProps {
  keyboard: CustardKeyboard
  onSelectKey?: (key: Key, index: number) => void
  selectedKey?: Key | null
  onCreateKey?: (x: number, y: number) => void
  onCreateFlickVariation?: (index: number, direction: 'center' | 'left' | 'up' | 'right' | 'down') => void
}

interface LayoutKey {
  key: Key
  x: number
  y: number
  width: number
  height: number
}

type FlickDirection = 'center' | 'left' | 'up' | 'right' | 'down'

export default function KeyboardPreview({ keyboard, onSelectKey, selectedKey, onCreateKey, onCreateFlickVariation }: KeyboardPreviewProps) {
  const [flickDirection, setFlickDirection] = useState<FlickDirection>('center')
  const [displayMode, setDisplayMode] = useState<'appearance'|'actions'>('appearance')
  
  // Reset preview UI only when a different keyboard is loaded
  useEffect(() => {
    console.log(`KeyboardPreview received new keyboard:`, keyboard.identifier)
    console.log(`Keyboard interface:`, keyboard.interface)
    console.log(`Number of keys:`, keyboard.interface?.keys?.length || 0)
    setFlickDirection('center')
    setDisplayMode('appearance')
  }, [keyboard.identifier])
  
  const { key_layout, keys, key_style } = keyboard.interface
  // 公式JSONは用語が逆: column_count = Y軸(縦), row_count = X軸(横)
  const columnsSpecRaw = key_layout.row_count || 10    // 実際のX軸(横)はrow_count
  const rowsSpecRaw = key_layout.column_count || 4     // 実際のY軸(縦)はcolumn_count
  
  // 公式仕様: 設定値を優先（実データよりも設定を重視）
  const columns = columnsSpecRaw || 10
  const rows = rowsSpecRaw || 4
  
  // キーの配置を計算（specifierを考慮し、重複を避ける）
  const layoutKeys: LayoutKey[] = []
  const occupiedCells = new Set<string>() // "x,y" 形式で占有セルを管理
  let currentX = 0
  let currentY = 0
  
  let maxCol = 0
  let maxRow = 0

  keys.forEach((item, index) => {
    let key: Key
    let specifier: any = null
    
    // KeyWrapper形式かKey形式かを判定
    if ('key_type' in item && 'key' in item) {
      // KeyWrapper形式（公式データ）
      const keyWrapper = item as KeyWrapper
      if (keyWrapper.key_type === 'system') {
        // System keyを疑似的にCustom keyとして表示
        const systemKey = keyWrapper.key as any
        key = {
          design: {
            label: { type: 'text', text: systemKey.type || 'SYS' },
            color: 'special'
          },
          press_actions: [{ type: 'input', text: `[${systemKey.type || 'system'}]` }]
        } as Key
        specifier = keyWrapper.specifier
      } else {
        key = keyWrapper.key as Key
        specifier = keyWrapper.specifier
      }
    } else {
      // Key形式（既存テンプレート）
      key = item as Key
      specifier = key.specifier
    }
    
    let keyX, keyY, keyWidth, keyHeight
    
    if (specifier) {
      // specifierが指定されている場合はそれを使用
      keyX = specifier.x ?? currentX
      keyY = specifier.y ?? currentY
      keyWidth = specifier.width ?? 1
      keyHeight = specifier.height ?? 1
    } else {
      // 通常のグリッド配置（占有セルをスキップ）
      while (occupiedCells.has(`${currentX},${currentY}`)) {
        currentX++
        if (currentX >= columns) {
          currentX = 0
          currentY++
        }
      }
      
      keyX = currentX
      keyY = currentY
      keyWidth = 1
      keyHeight = 1
    }
    
    // キーを配置
    layoutKeys.push({
      key,
      x: keyX,
      y: keyY,
      width: keyWidth,
      height: keyHeight
    })

    // 最大行・列の算出（0-index 基準のため + width/height）
    maxCol = Math.max(maxCol, (keyX ?? 0) + (keyWidth ?? 1))
    maxRow = Math.max(maxRow, (keyY ?? 0) + (keyHeight ?? 1))
    
    // 占有セルをマーク
    for (let dx = 0; dx < keyWidth; dx++) {
      for (let dy = 0; dy < keyHeight; dy++) {
        occupiedCells.add(`${keyX + dx},${keyY + dy}`)
      }
    }
    
    // 次の位置を計算（specifierがない場合のみ）
    if (!specifier) {
      currentX += keyWidth
      if (currentX >= columns) {
        currentX = 0
        currentY++
      }
    }
  })
  
  // デバッグログ（開発時のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('Grid Debug (公式用語逆転):', {
      'JSON column_count (実際は縦)': key_layout.column_count,
      'JSON row_count (実際は横)': key_layout.row_count,
      'maxCol (実データX軸)': maxCol,
      'maxRow (実データY軸)': maxRow,
      'finalColumns (横グリッド数)': columns,
      'finalRows (縦グリッド数)': rows,
      'occupiedCells': Array.from(occupiedCells),
      'totalKeys': layoutKeys.length
    })
  }

  return (
    <div className="flex justify-center items-center h-full space-x-8">
      {/* 縦持ちiPhone風のフレーム */}
      <div className="bg-black rounded-[32px] p-2 shadow-2xl" style={{ width: '420px' }}>
        <div className="bg-white rounded-[28px] overflow-hidden">
          {/* ノッチ */}
          <div className="relative bg-black h-6">
            <div className="absolute inset-x-0 top-0 flex justify-center">
              <div className="bg-black rounded-b-2xl w-40 h-6"></div>
            </div>
          </div>
          
          {/* ステータスバー */}
          <div className="bg-white px-6 py-1 flex justify-between items-center text-xs">
            <span className="font-medium">9:41</span>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48 1.3-.75-.85-1.48H7v-1.5H5.3l.85-1.48L4.85 7 4 8.47 3.15 7l-1.3.75.85 1.48H1v1.5h1.7l-.85 1.48 1.3.75zm6.7-.75l1.48.85 1.48-.85-.85-1.48H14v-1.5h-2.05l.85-1.48-1.48-.85L10 8.47 8.68 7l-1.48.85.85 1.48H6v1.5h2.05l-.85 1.48zm8 0l1.48.85 1.48-.85-.85-1.48H22v-1.5h-2.05l.85-1.48-1.48-.85L18 8.47 16.68 7l-1.48.85.85 1.48H14v1.5h2.05l-.85 1.48z"/>
              </svg>
              <svg className="w-4 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48 1.3-.75-.85-1.48H7v-1.5H5.3l.85-1.48L4.85 7 4 8.47 3.15 7l-1.3.75.85 1.48H1v1.5h1.7l-.85 1.48 1.3.75zm6.7-.75l1.48.85 1.48-.85-.85-1.48H14v-1.5h-2.05l.85-1.48-1.48-.85L10 8.47 8.68 7l-1.48.85.85 1.48H6v1.5h2.05l-.85 1.48zm8 0l1.48.85 1.48-.85-.85-1.48H22v-1.5h-2.05l.85-1.48-1.48-.85L18 8.47 16.68 7l-1.48.85.85 1.48H14v1.5h2.05l-.85 1.48z"/>
              </svg>
              <svg className="w-6 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
              </svg>
            </div>
          </div>
          
          {/* アプリコンテンツエリア（キーボードを大きくするため控えめに） */}
          <div className="bg-gray-50 h-40 flex items-end">
            <div className="w-full">
              {/* チャット風の表示 */}
              <div className="px-4 pb-2 space-y-2">
                <div className="flex justify-start">
                  <div className="bg-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 max-w-[70%]">
                    <span className="text-sm">キーボードのプレビューです</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-blue-500 text-white rounded-2xl rounded-br-sm px-3 py-2 max-w-[70%]">
                    <span className="text-sm">カスタマイズ中...</span>
                  </div>
                </div>
              </div>
              
              {/* テキストフィールド */}
              <div className="bg-white px-3 py-2 border-t border-gray-200">
                <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center">
                  <span className="text-gray-400 text-sm flex-1">メッセージ</span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* キーボードエリア（表示最大化） */}
          <div className="bg-[#D1D3D9] px-1 py-2">
            <div 
              className="relative"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                gridAutoColumns: 'minmax(0, 1fr)',
                gridAutoRows: 'minmax(0, 1fr)',
                gap: '2px',
                height: '360px', // 余白を圧縮しキーボードを大きく表示
                width: '100%'
              }}
            >
              {layoutKeys.map((layoutKey, index) => (
                <div
                  key={index}
                  className="flex min-w-0 min-h-0"
                  style={{
                    gridColumn: `${layoutKey.x + 1} / span ${layoutKey.width}`,
                    gridRow: `${layoutKey.y + 1} / span ${layoutKey.height}`,
                  }}
                >
                  <KeyButton 
                    keyData={layoutKey.key} 
                    keyStyle={key_style} 
                    flickDirection={flickDirection}
                    onSelect={(k) => onSelectKey && onSelectKey(k, index)}
                    displayMode={displayMode}
                    isSelected={selectedKey === layoutKey.key}
                    onCreateFlickVariation={
                      flickDirection !== 'center'
                        ? () => onCreateFlickVariation && onCreateFlickVariation(index, flickDirection)
                        : undefined
                    }
                  />
                </div>
              ))}
              {/* empty cell creators */}
              {Array.from({ length: rows }).map((_, ry) => (
                Array.from({ length: columns }).map((_, rx) => {
                  const keyStr = `${rx},${ry}`
                  if (occupiedCells.has(keyStr)) return null
                  return (
                    <div
                      key={`empty-${rx}-${ry}`}
                      className="flex"
                      style={{
                        gridColumn: `${rx + 1} / span 1`,
                        gridRow: `${ry + 1} / span 1`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          console.log('+ Key clicked at:', rx, ry, 'onCreateKey:', onCreateKey)
                          onCreateKey && onCreateKey(rx, ry)
                        }}
                        className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg text-[10px] text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-400 transition-colors"
                        title={`Add key at (${rx},${ry})`}
                      >
                        + Key
                      </button>
                    </div>
                  )
                })
              ))}
            </div>
            
            {/* 下部のツールバー */}
            <div className="mt-2 pt-2 border-t border-gray-300 flex justify-between items-center px-2">
              <div className="flex items-center space-x-2">
                <button className="p-1.5 rounded-lg bg-white/50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </button>
                <button className="p-1.5 rounded-lg bg-white/50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <button className="p-1.5 rounded-lg bg-white/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* ホームインジケーター */}
          <div className="bg-white pb-2 pt-1">
            <div className="mx-auto w-32 h-1 bg-black rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* フリックコントロール - 十字キー */}
      <div className="flex flex-col items-center space-y-4">
        {/* 表示モード切り替え */}
        <div className="flex items-center space-x-1">
          <button onClick={()=>setDisplayMode('appearance')} className={`px-2 py-1 text-xs rounded ${displayMode==='appearance'?'bg-blue-500 text-white':'bg-gray-100 text-gray-700'}`}>表示</button>
          <button onClick={()=>setDisplayMode('actions')} className={`px-2 py-1 text-xs rounded ${displayMode==='actions'?'bg-blue-500 text-white':'bg-gray-100 text-gray-700'}`}>アクション</button>
        </div>
        {/* 選択キーのフォーカスを見出しより上に表示 */}
        {selectedKey && (
          <KeyFocus 
            keyData={selectedKey}
            keyStyle={key_style}
            displayMode={displayMode}
          />
        )}
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-700 mb-2">フリック方向</h3>
          <p className="text-xs text-gray-500">
            現在: {flickDirection === 'center' ? '通常' : flickDirection === 'up' ? '上' : 
                   flickDirection === 'down' ? '下' : flickDirection === 'left' ? '左' : '右'}
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-1" style={{ width: '120px', height: '120px' }}>
          {/* 空のセル */}
          <div></div>
          {/* 上 */}
          <button
            onClick={() => setFlickDirection('up')}
            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
              flickDirection === 'up'
                ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          {/* 空のセル */}
          <div></div>
          
          {/* 左 */}
          <button
            onClick={() => setFlickDirection('left')}
            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
              flickDirection === 'left'
                ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {/* 中央 */}
          <button
            onClick={() => setFlickDirection('center')}
            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
              flickDirection === 'center'
                ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          {/* 右 */}
          <button
            onClick={() => setFlickDirection('right')}
            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
              flickDirection === 'right'
                ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* 空のセル */}
          <div></div>
          {/* 下 */}
          <button
            onClick={() => setFlickDirection('down')}
            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
              flickDirection === 'down'
                ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {/* 空のセル */}
          <div></div>
        </div>
        
        <div className="text-xs text-gray-500 max-w-[120px] text-center">
          <p>フリック対応キーの表示を切り替えます</p>
        </div>
      </div>
    </div>
  )
}
