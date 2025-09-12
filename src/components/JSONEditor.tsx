'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { CustardKeyboard } from '@/types/custard'

interface JSONEditorProps {
  keyboard: CustardKeyboard
  onUpdate: (keyboard: CustardKeyboard, message?: string) => void
}

export default function JSONEditor({ keyboard, onUpdate }: JSONEditorProps) {
  const [jsonText, setJsonText] = useState(() => {
    try {
      return keyboard ? JSON.stringify(keyboard, null, 2) : ''
    } catch {
      return ''
    }
  })
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentMatch, setCurrentMatch] = useState(0)

  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const prevJsonRef = useRef<string>('')
  const [highlightRange, setHighlightRange] = useState<{ start: number; end: number } | null>(null)
  const [overlayMarker, setOverlayMarker] = useState<{ top: number; height: number } | null>(null)
  const highlightTimerRef = useRef<number | null>(null)
  
  useEffect(() => {
    if (!isUpdating && keyboard) {
      try {
        const jsonString = JSON.stringify(keyboard, null, 2)
        setJsonText(jsonString)
        // Diff previous JSON and current to detect GUI-driven change region
        try {
          const prev = prevJsonRef.current
          if (prev && prev !== jsonString) {
            const prevLines = prev.split('\n')
            const nextLines = jsonString.split('\n')
            let s = 0
            const minLen = Math.min(prevLines.length, nextLines.length)
            while (s < minLen && prevLines[s] === nextLines[s]) s++
            let ePrev = prevLines.length - 1
            let eNext = nextLines.length - 1
            while (ePrev >= s && eNext >= s && prevLines[ePrev] === nextLines[eNext]) { ePrev--; eNext--; }
            const changedStart = Math.max(0, s)
            const changedEnd = Math.max(changedStart, eNext)
            // Scroll to the first changed line (do not move caret)
            if (textAreaRef.current) {
              const ta = textAreaRef.current
              const lineHeightPx = 13 * 1.6
              const targetTop = Math.max(0, changedStart * lineHeightPx - (ta.clientHeight * 0.35))
              ta.scrollTop = targetTop
              if (gutterRef.current) gutterRef.current.scrollTop = targetTop
              // Place a thin overlay marker at the left edge of the content for extra visibility
              const contentTop = changedStart * lineHeightPx - ta.scrollTop + 16 /* textarea padding-top */
              const contentHeight = Math.max(lineHeightPx, (changedEnd - changedStart + 1) * lineHeightPx)
              setOverlayMarker({ top: Math.max(0, contentTop), height: contentHeight })
            }
            // Highlight changed line range briefly
            setHighlightRange({ start: changedStart, end: changedEnd })
            if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current)
            highlightTimerRef.current = window.setTimeout(() => { setHighlightRange(null); setOverlayMarker(null) }, 1500)
          }
          prevJsonRef.current = jsonString
        } catch {}
        // Live validate even for GUI-driven updates
        try {
          const ok = validateKeyboard(keyboard)
          if (!ok) {
            setError('❌ GUI変更により無効なCustard構造が検出されました（デバッグ用）。')
            if (process.env.NODE_ENV !== 'production') {
              // Helpful console dump for debugging invalid state
              // eslint-disable-next-line no-console
              console.warn('[Custard Live Validation] Invalid keyboard state from GUI update', keyboard)
            }
          } else {
            setError(null)
          }
        } catch {
          setError('❌ GUI変更の検証でエラーが発生しました')
        }
      } catch (err) {
        setError('キーボードデータの初期化に失敗しました')
        setJsonText('')
      }
    }
  }, [keyboard, isUpdating])

  // 検索マッチを計算
  const matches = useMemo(() => {
    if (!searchQuery) return [] as Array<{ start: number; end: number }>
    const res: Array<{ start: number; end: number }> = []
    const q = searchQuery
    let idx = 0
    while (true) {
      const found = jsonText.indexOf(q, idx)
      if (found === -1) break
      res.push({ start: found, end: found + q.length })
      idx = found + Math.max(1, q.length)
    }
    return res
  }, [jsonText, searchQuery])

  // 現在のマッチに移動
  const goToMatch = useCallback((index: number) => {
    if (!textAreaRef.current || matches.length === 0) return
    const i = ((index % matches.length) + matches.length) % matches.length
    const m = matches[i]
    setCurrentMatch(i)
    // Do NOT move the editor caret; only scroll to show the match
    // Ensure the selection is scrolled into view in both editor and gutter
    try {
      const ta = textAreaRef.current
      const before = jsonText.slice(0, m.start)
      const lineIndex = (before.match(/\n/g)?.length || 0)
      // Based on editor style: fontSize 13px, lineHeight 1.6
      const lineHeightPx = 13 * 1.6
      const targetTop = Math.max(0, lineIndex * lineHeightPx - (ta.clientHeight * 0.35))
      ta.scrollTop = targetTop
      if (gutterRef.current) gutterRef.current.scrollTop = targetTop
    } catch {}
  }, [matches])

  const findNext = useCallback(() => {
    if (matches.length === 0) return
    goToMatch(currentMatch + 1)
  }, [currentMatch, matches, goToMatch])

  const findPrev = useCallback(() => {
    if (matches.length === 0) return
    goToMatch(currentMatch - 1)
  }, [currentMatch, matches, goToMatch])

  // Ctrl/Cmd+F で検索欄へ
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isFind = (e.key === 'f' || e.key === 'F') && (e.ctrlKey || e.metaKey)
      if (isFind) {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
      if (e.key === 'Enter' && document.activeElement === searchInputRef.current) {
        e.preventDefault()
        if (e.shiftKey) {
          findPrev()
        } else {
          findNext()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [findNext, findPrev])

  // スクロール同期（行番号側に反映）
  const onScrollEditor = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = (e.target as HTMLTextAreaElement).scrollTop
    }
  }
  
  const validateKeyboard = (data: any): data is CustardKeyboard => {
    try {
      // Helper: decode escapes (\\t, \\n, \\r, \\uXXXX)
      const decodeEscapes = (input: any) => {
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
            } catch { return input }
          }
          return input
        })
      }
      // Note: AzooKey accepts inputs that may be represented by multiple code points
      // (e.g., emoji or symbols with variation selectors). We do NOT hard-reject
      // multi-codepoint inputs here. Keep checks permissive to mirror AzooKey.
      // 緩やかな基本構造チェック（参照JSONを許容）
      if (!data || typeof data.identifier !== 'string') return false
      if (typeof data.language !== 'string') return false
      if (typeof data.input_style !== 'string') return false
      if (!data.interface || !data.interface.key_layout || typeof data.interface.key_style !== 'string') return false
      if (!Array.isArray(data.interface.keys)) return false

      // metadata は必須（CustardKit準拠）。custard_version/display_name が string
      if (!data.metadata || typeof data.metadata.custard_version !== 'string' || typeof data.metadata.display_name !== 'string') return false

      // key_layout の type は string ならOK（row/column は任意）
      if (typeof data.interface.key_layout.type !== 'string') return false

      for (const item of data.interface.keys) {
        const isWrapper = !!(item as any).key_type
        const keyType = isWrapper ? (item as any).key_type : 'custom'
        const k = isWrapper ? (item as any).key : (item as any)

        // System key: only require a string type
        if (keyType === 'system') {
          if (!k || typeof (k as any).type !== 'string') return false
          continue
        }

        // Custom key: require design
        if (!k || !k.design) return false

        // ラベルは {text} / {system_image} / {main, sub?}（文字列または{text}）を許容
        const lb = k.design.label
        if (lb) {
          const okText = typeof lb.text === 'string'
          const okSys = typeof lb.system_image === 'string'
          const mainOk = typeof lb.main === 'string' || (lb.main && typeof lb.main.text === 'string')
          const subOk = lb.sub === undefined || typeof lb.sub === 'string' || (lb.sub && typeof lb.sub.text === 'string')
          if (!(okText || okSys || (mainOk && subOk))) return false
        }

        // actions
        if (k.press_actions && !Array.isArray(k.press_actions)) return false
        // CustardKit requires longpress_actions and variations to be present
        if (typeof k.longpress_actions !== 'object') return false
        if (!Array.isArray(k.variations)) return false

        // Wrapper の specifier/specifier_type は任意（参照が省略するケースに対応）
      }

      return true
    } catch {
      return false
    }
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setJsonText(value)
    
    // 空の文字列の場合はエラーを表示しない
    if (!value.trim()) {
      setError('JSONを入力してください')
      return
    }
    
    try {
      const parsed = JSON.parse(value) as CustardKeyboard
      
      if (!validateKeyboard(parsed)) {
        setError('無効なキーボード定義です。Custard形式のJSONファイルを確認してください')
        return
      }
      
      setError(null)
      setIsUpdating(true)
      onUpdate(parsed, 'JSONから更新')
      
      // 短時間後にisUpdatingをfalseに戻す
      setTimeout(() => setIsUpdating(false), 100)
      
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('JSON形式が正しくありません')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('予期しないエラーが発生しました')
      }
    }
  }
  
  const formatJSON = () => {
    if (!jsonText.trim()) {
      setError('JSONが入力されていません')
      return
    }
    
    try {
      const parsed = JSON.parse(jsonText)
      setJsonText(JSON.stringify(parsed, null, 2))
      setError(null)
    } catch (err) {
      setError('JSON形式が正しくないため、フォーマットできません')
    }
  }
  
  const validateJSON = () => {
    if (!jsonText.trim()) {
      setError('JSONが入力されていません')
      return
    }
    
    try {
      const parsed = JSON.parse(jsonText)
      if (validateKeyboard(parsed)) {
        setError(null)
        alert('✅ 有効なCustardキーボード定義です')
      } else {
        setError('❌ Custard形式として無効な構造です')
      }
    } catch (err) {
      setError('❌ JSON形式が正しくありません')
    }
  }
  
  return (
    <div className="flex flex-col h-full json-editor">
      {/* Toolbar - Compact */}
      <div className="px-2 py-0.5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={formatJSON}
              className="px-2 py-0.5 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              整形
            </button>
            <button
              onClick={validateJSON}
              className="px-2 py-0.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
            >
              検証
            </button>
            {/* 検索 - Compact */}
            <div className="ml-2 flex items-center space-x-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentMatch(0); }}
                placeholder="検索"
                className="px-1.5 py-0.5 text-xs border rounded w-32"
              />
              <span className="text-[10px] text-gray-500 w-12 text-right">
                {matches.length > 0 ? `${currentMatch + 1}/${matches.length}` : '0/0'}
              </span>
              <button
                onClick={findPrev}
                className="px-1 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 rounded"
                title="前へ"
              >↑</button>
              <button
                onClick={findNext}
                className="px-1 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 rounded"
                title="次へ"
              >↓</button>
            </div>
          </div>
          <div className="text-[10px] text-gray-500">
            自動更新
          </div>
        </div>
      </div>
      
      {/* Editor */}
      <div className="flex-1 relative">
      <div className={`absolute inset-0 flex ${error ? 'bg-red-50' : 'bg-white'}`}>
          {/* Thin overlay marker at left of content area */}
          {overlayMarker && (
            <div
              className="pointer-events-none absolute"
              style={{ left: 40 /* gutter w-10 */, top: overlayMarker.top, width: 3, height: overlayMarker.height, background: 'rgba(245, 158, 11, 0.55)', borderRadius: 2 }}
            />
          )}
          {/* 行番号ガター */}
          <div
            ref={gutterRef}
            className="w-10 border-r border-gray-200 text-xs text-gray-400 font-mono overflow-hidden select-none line-numbers"
            style={{ paddingTop: '16px' }}
          >
            <div className="px-2">
              {jsonText.split('\n').map((_, index) => {
                const inHL = highlightRange && index >= highlightRange.start && index <= highlightRange.end
                return (
                  <div
                    key={index}
                    style={{ lineHeight: '1.4', height: '1.4em' }}
                    className={inHL ? 'bg-yellow-100 text-yellow-800 rounded-sm -mx-1 px-1' : ''}
                  >
                    {index + 1}
                  </div>
                )
              })}
            </div>
          </div>
          {/* テキストエリア */}
          <textarea
            ref={textAreaRef}
            value={jsonText}
            onChange={handleChange}
            onScroll={onScrollEditor}
            className={`flex-1 h-full p-4 font-mono text-sm resize-none focus:outline-none ${
              error ? 'bg-red-50 border-red-200' : 'bg-white'
            }`}
            style={{
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", consolas, "source-code-pro", monospace',
              fontSize: '13px',
              lineHeight: '1.6',
              tabSize: 2,
              background: `
                linear-gradient(to right, transparent 0px, rgba(59, 130, 246, 0.25) 1px, transparent 1px),
                linear-gradient(to right, transparent 32px, rgba(59, 130, 246, 0.25) 1px, transparent 1px),
                linear-gradient(to right, transparent 48px, rgba(59, 130, 246, 0.25) 1px, transparent 1px),
                linear-gradient(to right, transparent 64px, rgba(59, 130, 246, 0.25) 1px, transparent 1px),
                linear-gradient(to right, transparent 80px, rgba(59, 130, 246, 0.25) 1px, transparent 1px),
                linear-gradient(to right, transparent 96px, rgba(59, 130, 246, 0.25) 1px, transparent 1px)
              `,
              backgroundSize: '16px 100%',
              letterSpacing: '0.02em'
            }}
            spellCheck={false}
            placeholder="Custard形式のJSONを入力または編集してください..."
          />
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="px-3 py-1 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          {error ? (
            <div className="flex items-center space-x-2">
              <span className="text-red-500 text-sm">❌</span>
              <span className="text-sm text-red-600">{error}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-green-500 text-sm">✅</span>
              <span className="text-sm text-green-600">有効なJSON</span>
            </div>
          )}
          <div className="text-xs text-gray-500">
            {jsonText.split('\n').length} 行 • {jsonText.length} 文字
          </div>
        </div>
      </div>
      
      {/* Help Text removed to maximize space */}
      
      <style jsx global>{`
        /* Enhanced JSON Editor Styles for Better Readability */
        
        /* Alternating line background for better row separation */
        .json-editor textarea:focus {
          background: 
            /* Indentation guide lines */
            linear-gradient(to right, transparent 0px, rgba(59, 130, 246, 0.4) 1px, transparent 1px),
            linear-gradient(to right, transparent 32px, rgba(59, 130, 246, 0.4) 1px, transparent 1px),
            linear-gradient(to right, transparent 48px, rgba(59, 130, 246, 0.4) 1px, transparent 1px),
            linear-gradient(to right, transparent 64px, rgba(59, 130, 246, 0.4) 1px, transparent 1px),
            linear-gradient(to right, transparent 80px, rgba(59, 130, 246, 0.4) 1px, transparent 1px),
            linear-gradient(to right, transparent 96px, rgba(59, 130, 246, 0.4) 1px, transparent 1px) !important;
          background-size: 16px 100%, 16px 100%, 16px 100%, 16px 100%, 16px 100%, 16px 100%;
        }
        
        /* Enhanced gutter styling */
        .json-editor .line-numbers {
          background: linear-gradient(to right, 
            rgba(229, 231, 235, 0.5) 0%, 
            rgba(229, 231, 235, 0.8) 100%
          );
        }
        
        /* Better hover and selection styles */
        .json-editor textarea::selection {
          background: rgba(59, 130, 246, 0.2);
        }
        
        /* Improved focus styles */
        .json-editor textarea:focus {
          box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  )
}
