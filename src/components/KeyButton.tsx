import React, { useMemo } from 'react'
import { Key } from '@/types/custard'

interface KeyButtonProps {
  keyData: Key
  keyStyle?: string
  flickDirection?: 'center' | 'left' | 'up' | 'right' | 'down'
  onSelect?: (key: Key) => void
  displayMode?: 'appearance' | 'actions'
  hideLPBadge?: boolean
  isSelected?: boolean
  onCreateFlickVariation?: () => void
}

const getKeyLabel = (label: any): { main: string; sub?: string; isSystemImage: boolean } => {
  try {
    if (!label) return { main: '', isSystemImage: false }
    
    // デバッグログ（開発時のみ）
    if (process.env.NODE_ENV === 'development' && label.system_image) {
      console.log('System Image Debug:', { label, system_image: label.system_image })
    }
    
    // Simple text form
    if (typeof label.text === 'string') {
      return { main: label.text, isSystemImage: false }
    }
    // System image form
    if (typeof label.system_image === 'string') {
      return { main: label.system_image, isSystemImage: true }
    }
    // Structured main/sub with text fields
    if (label.main && typeof label.main === 'object' && typeof label.main.text === 'string') {
      return { main: label.main.text, sub: label.sub?.text, isSystemImage: false }
    }
    // Variant where main/sub are plain strings (e.g., { type: 'main_and_sub', main: 'E', sub: '3' })
    if (typeof label.main === 'string') {
      return { main: label.main, sub: typeof label.sub === 'string' ? label.sub : undefined, isSystemImage: false }
    }
    // Fallback
    return { main: '', isSystemImage: false }
  } catch {
    return { main: '', isSystemImage: false }
  }
}

const getSFSymbolIcon = (symbolName: string): React.JSX.Element | null => {
  const iconMap: Record<string, React.JSX.Element> = {
    'delete.backward': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM19 15.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"/>
      </svg>
    ),
    'delete.left': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM19 15.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"/>
      </svg>
    ),
    'return': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7z"/>
      </svg>
    ),
    'xmark': (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    ),
    'space': (
      <svg className="w-8 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
      </svg>
    ),
    'arrow.left': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
      </svg>
    ),
    'arrow.right': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
      </svg>
    ),
    'chevron.left': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    ),
    'chevron.right': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    ),
    'globe': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" strokeWidth={2} />
        <path strokeWidth={2} d="M3 12h18M12 3c3 4 3 14 0 18M12 3c-3 4-3 14 0 18" />
      </svg>
    ),
    'mic': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z"/>
        <path fillRule="evenodd" d="M5 11a1 1 0 112 0 5 5 0 0010 0 1 1 0 112 0 7 7 0 01-6 6.93V21a1 1 0 11-2 0v-3.07A7 7 0 015 11z" clipRule="evenodd"/>
      </svg>
    ),
    'ellipsis': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/>
      </svg>
    ),
    'gearshape': (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14 12.94a7.96 7.96 0 000-1.88l2.03-1.58a.5.5 0 00.12-.65l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.94 7.94 0 00-1.63-.95l-.36-2.54a.5.5 0 00-.5-.42h-3.84a.5.5 0 00-.5.42l-.36 2.54c-.57.23-1.11.53-1.63.95l-2.39-.96a.5.5 0 00-.6.22L2.7 8.83a.5.5 0 00.12.65l2.03 1.58a7.96 7.96 0 000 1.88L2.82 14.5a.5.5 0 00-.12.65l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.42 1.05.76 1.63.99l.36 2.54c.05.24.26.41.5.41h3.84c.24 0 .45-.17.5-.41l.36-2.54c.58-.23 1.13-.57 1.63-.99l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 00-.12-.65l-2.02-1.56zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/>
      </svg>
    ),
    'square.and.arrow.up': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0-12l-4 4m4-4l4 4"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"/>
      </svg>
    ),
    'hand.tap': (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 11V7a2 2 0 114 0v4m-4 0l-.5-.5a2.5 2.5 0 10-3.5 3.5L9 20h6l1.5-3"/>
      </svg>
    )
  }
  
  return iconMap[symbolName] || null
}

const getKeyStyle = (color?: string, keyStyle?: string): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    height: keyStyle === 'tenkey_style' ? '50px' : '42px',
    fontSize: keyStyle === 'tenkey_style' ? '16px' : '14px',
    width: '100%', // グリッドサイズに完全に従う
    minWidth: 'auto',
    maxWidth: 'none',
  }
  
  switch (color) {
    case 'special':
      return {
        ...baseStyle,
        backgroundColor: '#C8C7CC',
        color: '#000000',
        borderColor: '#B0AFB4',
      }
    case 'selected':
      return {
        ...baseStyle,
        backgroundColor: '#007AFF',
        color: '#FFFFFF',
        borderColor: '#0051D5',
      }
    case 'unimportant':
      return {
        ...baseStyle,
        backgroundColor: '#D1D0D6',
        color: '#8E8D93',
        borderColor: '#B8B7BD',
      }
    default:
      return {
        ...baseStyle,
        backgroundColor: '#FFFFFF',
        color: '#000000',
        borderColor: '#D1D0D6',
      }
  }
}

const getFlickKey = (keyData: Key, direction: string): Key | null => {
  if (!keyData.variations || direction === 'center') {
    return keyData
  }
  
  // variations が FlickVariation[] か Key[] かを判定
  const firstVariation = keyData.variations[0]
  
  if (firstVariation && 'direction' in firstVariation && 'key' in firstVariation) {
    // 公式データのFlickVariation[]構造
    // 方向のマッピング: UI表示 -> JSON内のdirection値
    const directionMapping: Record<string, string> = {
      'up': 'top',
      'down': 'bottom', 
      'left': 'left',
      'right': 'right'
    }
    
    const targetDirection = directionMapping[direction] || direction
    const flickVariation = keyData.variations.find((variation: any) => 
      variation.direction === targetDirection
    )
    
    if (flickVariation && (flickVariation as any).key) {
      return (flickVariation as any).key
    }
  } else {
    // 既存テンプレートのKey[]構造（インデックスベース）
    const directionIndex = {
      'left': 0,
      'up': 1,
      'right': 2,
      'down': 3
    }[direction]
    
    if (directionIndex !== undefined && keyData.variations[directionIndex]) {
      return keyData.variations[directionIndex] as Key
    }
  }
  
  // フリック方向に対応するvariationが存在しない場合はnullを返す
  return null
}

export default function KeyButton({ keyData, keyStyle, flickDirection = 'center', onSelect, displayMode = 'appearance', hideLPBadge = false, isSelected = false, onCreateFlickVariation }: KeyButtonProps) {
  // useMemoでflickDirectionが変わるたびに再計算
  const flickKey = useMemo(() => {
    const result = getFlickKey(keyData, flickDirection)
    
    // デバッグ用ログ（開発時のみ）
    if (process.env.NODE_ENV === 'development' && flickDirection !== 'center' && keyData.variations && keyData.variations.length > 0) {
      const hasVariations = keyData.variations.find((v: any) => v.direction && v.key)
      if (hasVariations) {
        console.log('Flick Debug:', {
          flickDirection,
          keyVariations: keyData.variations.map((v: any) => v.direction),
          originalLabel: keyData.design?.label,
          flickKeyLabel: result?.design?.label,
          foundVariation: result !== keyData,
          hasResult: result !== null
        })
      }
    }
    
    return result
  }, [keyData, flickDirection])
  
  // フリック方向に対応するvariationがない場合は追加可能なプレースホルダーを表示
  if (flickKey === null) {
    const style = getKeyStyle('unimportant', keyStyle)
    const isFlickLayer = flickDirection !== 'center'
    return (
      <button
        className={`relative flex flex-col items-center justify-center px-2 py-1 border-2 rounded-lg ${
          isFlickLayer
            ? 'border-dashed text-blue-600 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400'
            : 'opacity-50 text-gray-400'
        }`}
        style={{
          ...style,
          width: '100%',
          height: '100%',
          minWidth: 0,
          minHeight: 0
        }}
        type="button"
        onClick={() => {
          if (isFlickLayer && onCreateFlickVariation) onCreateFlickVariation()
        }}
        disabled={!isFlickLayer || !onCreateFlickVariation}
        title={isFlickLayer ? 'この方向にフリックを追加' : '未対応のフリック'}
      >
        {isFlickLayer ? (
          <span className="text-xs font-medium">+ Key</span>
        ) : (
          <div className="text-sm opacity-60">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        )}
      </button>
    )
  }
  
  const renderPlaceholder = (style: React.CSSProperties, isSelected?: boolean) => (
    <button
      className={`relative flex flex-col items-center justify-center px-2 py-1 border-2 border-dashed rounded-lg bg-transparent hover:border-blue-400 hover:bg-blue-50 transition-colors ${
        isSelected ? 'border-blue-500 bg-blue-100' : 'border-gray-400'
      }`}
      style={{
        ...style,
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0
      }}
      type="button"
      onClick={() => onSelect && onSelect(flickKey || keyData)}
    >
      <div className={`text-xs ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
        未設定
      </div>
    </button>
  )
  // design と label の存在確認（プレースホルダー表示）
  if (!flickKey.design || !flickKey.design.label) {
    const style = getKeyStyle(flickKey.design?.color || keyData.design?.color, keyStyle)
    return renderPlaceholder(style, isSelected)
  }
  
  const { main, sub, isSystemImage } = getKeyLabel((flickKey as any)?.design?.label)
  // 長い識別子系(flick_...など)は自動改行のヒントとして _ を改行に変換
  const rawMain = typeof main === 'string' ? main : ''
  const displayMain = rawMain.includes('_') ? rawMain.replace(/_/g, '\n') : rawMain
  const longestLine = displayMain.split('\n').reduce((max, line) => Math.max(max, line.length), 0)
  const lineCount = displayMain.split('\n').length
  const computedFontSize = (() => {
    if (lineCount >= 3 || longestLine > 10) return '0.70em'
    if (longestLine > 6) return '0.80em'
    if (longestLine > 3) return '0.90em'
    return '1em'
  })()
  const style = getKeyStyle(flickKey.design.color || keyData.design?.color, keyStyle)
  
  const hasVariations = keyData.variations && keyData.variations.length > 0
  const isFlickActive = flickDirection !== 'center' && hasVariations
  
  const sfSymbolIcon = isSystemImage ? getSFSymbolIcon(main) : null
  
  // 中身のないキーは破線枠で表示のみ
  if (!isSystemImage && rawMain.trim() === '') {
    return renderPlaceholder(style, isSelected)
  }

  const hasLongPress = !!(flickKey.longpress_actions && ((flickKey.longpress_actions.start && flickKey.longpress_actions.start.length) || (flickKey.longpress_actions.repeat && flickKey.longpress_actions.repeat.length)))

  const summarizeAction = (a: any): string => {
    if (!a || typeof a !== 'object') return ''
    switch (a.type) {
      case 'input':
        return `input:"${(a.text ?? '').toString().slice(0,6)}"`
      case 'delete':
        return `delete x${a.count ?? 1}`
      case 'complete':
        return 'complete'
      case 'move_cursor':
        return `cursor ${a.count ?? 0}`
      case 'move_tab':
        return `tab:${a.tab_type ?? ''}`
      case 'smart_delete_default':
        return 'smart_delete'
      default:
        return String(a.type || '').slice(0,16)
    }
  }

  const actionSummary = (() => {
    const pa: any[] = (flickKey as any).press_actions || []
    if (!pa.length) return '—'
    const first = summarizeAction(pa[0])
    const second = pa[1] ? `, ${summarizeAction(pa[1])}` : ''
    return (first + second).slice(0, 24)
  })()
  
  const actionIconLabel = (a: any): { icon: string; label: string; title: string } => {
    if (!a) return { icon: '', label: '', title: '' }
    switch (a.type) {
      case 'input':
        return { icon: '⌨', label: (a.text ?? '').toString().slice(0,6) || '␣', title: `input: ${a.text ?? ''}` }
      case 'delete':
        return { icon: '⌫', label: `x${a.count ?? 1}`, title: `delete ${a.count ?? 1}` }
      case 'complete':
        return { icon: '↵', label: '', title: 'complete' }
      case 'move_cursor': {
        const c = a.count ?? 0
        return { icon: c < 0 ? '←' : '→', label: `${Math.abs(c)}`, title: `move_cursor ${c}` }
      }
      case 'move_tab':
        return { icon: '⇥', label: String(a.tab_type ?? '').slice(0,6), title: `move_tab: ${a.tab_type ?? ''}` }
      case 'smart_delete_default':
        return { icon: '⚙', label: 'smart-del', title: 'smart_delete_default' }
      default:
        return { icon: '∙', label: String(a.type || '').slice(0,8), title: a.type || '' }
    }
  }

  const renderActionChips = () => {
    const pa: any[] = (flickKey as any).press_actions || []
    const chips = pa.slice(0, 3).map((a, i) => {
      const { icon, label, title } = actionIconLabel(a)
      return (
        <span key={i} title={title} className="inline-flex items-center max-w-[80px] px-1 py-0.5 mr-1 mb-1 rounded border bg-white/80 text-gray-800 border-gray-300 text-[10px]">
          <span className="mr-0.5 opacity-80">{icon}</span>
          <span className="truncate">{label}</span>
        </span>
      )
    })
    const more = pa.length - 3
    if (more > 0) {
      chips.push(
        <span key="more" title={`${more} more actions`} className="inline-flex items-center px-1 py-0.5 mr-1 mb-1 rounded border bg-gray-50 text-gray-600 border-gray-200 text-[10px]">+{more}</span>
      )
    }
    if (hasLongPress) {
      const ls = (flickKey.longpress_actions?.start?.length ?? 0)
      const lr = (flickKey.longpress_actions?.repeat?.length ?? 0)
      if (ls > 0)
        chips.push(<span key="lp-s" title={`long press start: ${ls}`} className="inline-flex items-center px-1 py-0.5 mr-1 mb-1 rounded border bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px]">LP:S{ls}</span>)
      if (lr > 0)
        chips.push(<span key="lp-r" title={`long press repeat: ${lr}`} className="inline-flex items-center px-1 py-0.5 mr-1 mb-1 rounded border bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px]">LP:R{lr}</span>)
    }
    return (
      <div className="flex flex-wrap items-center justify-center w-full px-1">
        {chips}
      </div>
    )
  }
  
  return (
    <button
      className={`relative flex flex-col items-center justify-center px-2 py-1 border rounded-lg transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md overflow-hidden ${
        isFlickActive ? 'ring-2 ring-blue-300 ring-opacity-50' : ''
      } ${
        isSelected ? 'ring-2 ring-blue-500 ring-opacity-75 border-blue-500' : ''
      }`}
      style={{
        ...style,
        width: '100%',
        height: '100%',
        minWidth: 0, // flex-shrinkを可能にする
        minHeight: 0
      }}
      onClick={() => onSelect && onSelect(flickKey)}
      type="button"
    >
      {/* フリック方向インジケーター */}
      {isFlickActive && (
        <div className="absolute top-0.5 right-0.5">
          <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm animate-pulse"></div>
        </div>
      )}
      
      {displayMode === 'appearance' && sub && (
        <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] opacity-60 max-w-[90%] truncate">
          {sub}
        </span>
      )}
      {hasLongPress && !hideLPBadge && (
        <span className="absolute bottom-1 left-1 text-[9px] px-1 py-0.5 rounded bg-yellow-100 text-yellow-700 border border-yellow-200">LP</span>
      )}
      <div className="flex items-center justify-center flex-1 w-full min-w-0">
        {displayMode === 'appearance' ? (
          sfSymbolIcon ? sfSymbolIcon : isSystemImage ? (
            // system_imageが見つからない場合のフォールバック
            <span className="text-xs font-mono bg-gray-100 px-1 py-0.5 rounded border" title={`System image: ${main}`}>
              {main}
            </span>
          ) : (
            <span 
              className="font-medium text-center leading-tight select-none max-w-full w-full px-1 whitespace-pre-wrap break-words"
              style={{ 
                fontSize: computedFontSize,
                lineHeight: lineCount > 1 ? '1.05' : '1.1',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere'
              }}
            >
              {displayMain}
            </span>
          )
        ) : (
          renderActionChips()
        )}
      </div>
      
      {/* フリック対応キーの小さなインジケーター (centerの時のみ) */}
      {hasVariations && flickDirection === 'center' && (
        <div className="absolute bottom-1 right-1 flex space-x-0.5">
          {keyData.variations?.slice(0, 4).map((variation, index) => 
            variation ? (
              <div key={index} className="w-1 h-1 bg-gray-400 rounded-full opacity-40"></div>
            ) : null
          )}
        </div>
      )}
      {/* セレクト */}
      <span className="sr-only">select</span>
    </button>
  )
}
