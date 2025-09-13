'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { CustardKeyboard, Key, KeyWrapper } from '@/types/custard'
import { normalizeForAzooKey } from '@/lib/normalize'
import { useFileManagement } from '@/hooks/useFileManagement'
import { Clock, RotateCcw } from 'lucide-react'
// Presets are loaded dynamically from API or bundled JSON fallback
import KeyboardPreview from './KeyboardPreview'
import KeyInspector from './KeyInspector'
import KeyboardSettings from './KeyboardSettings'
import AIAssistant from './AIAssistant'
import FileManager from './FileManager'
import JSONEditor from './JSONEditor'
import KeyFocus from './KeyFocus'
import { loadTemplates } from '@/lib/loadTemplatesClient'

// Dynamic presets loaded with fallback for static export
const useDynamicPresets = () => {
  const [presets, setPresets] = useState<Record<string, CustardKeyboard>>({})
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const loaded = await loadTemplates()
      if (!mounted) return
      setPresets(loaded)
    })()
    return () => { mounted = false }
  }, [])
  return presets
}

// Create an empty keyboard as initial state instead of preset
const emptyInitialKeyboard: CustardKeyboard = {
  identifier: 'new_keyboard',
  language: 'none',
  input_style: 'direct',
  metadata: {
    custard_version: '1.2',
    display_name: '新規キーボード'
  },
  interface: {
    key_layout: {
      type: 'grid_fit',
      row_count: 4,
      column_count: 10
    },
    key_style: 'tenkey_style',
    keys: []
  }
} as CustardKeyboard

export default function KeyboardDesignerV2() {
  const presets = useDynamicPresets()
  const fileManager = useFileManagement(emptyInitialKeyboard)
  const [showFileManager, setShowFileManager] = useState(true)
  const [jsonCollapsed, setJsonCollapsed] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [selectedKey, setSelectedKey] = useState<Key | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'key' | 'keyboard'>('keyboard')
  const [leftRatio, setLeftRatio] = useState<number>(0.5)
  const [propWidth, setPropWidth] = useState<number>(420)
  const [aiWidth, setAiWidth] = useState<number>(360)
  const [hasMounted, setHasMounted] = useState(false)
  const splitRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const rightDraggingRef = useRef<null | 'prop-json' | 'json-ai'>(null)
  const lastXRef = useRef<number>(0)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Handle resizing
  const startDrag = (e: React.MouseEvent) => {
    draggingRef.current = true
    e.preventDefault()
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    // Left (Preview | Rest) splitter
    if (draggingRef.current && splitRef.current) {
      const rect = splitRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const ratio = Math.min(0.85, Math.max(0.15, x / rect.width))
      setLeftRatio(ratio)
    }
    // Right side splitters (Properties | JSON | AI)
    if (rightDraggingRef.current) {
      const dx = e.clientX - (lastXRef.current || e.clientX)
      lastXRef.current = e.clientX
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
      if (rightDraggingRef.current === 'prop-json') {
        setPropWidth(prev => clamp(prev + dx, 240, 720))
      } else if (rightDraggingRef.current === 'json-ai') {
        setAiWidth(prev => clamp(prev + dx, 260, 640))
      }
    }
  }, [])

  // Clear selection when a different keyboard/file is loaded so preview and properties reflect new data
  useEffect(() => {
    setSelectedIndex(null)
    setSelectedKey(null)
  }, [fileManager.currentFileName, fileManager.currentKeyboard?.identifier])

  const onMouseUp = useCallback(() => {
    if (draggingRef.current) {
      draggingRef.current = false
      try { localStorage.setItem('custard:leftRatio', String(leftRatio)) } catch {}
    }
    if (rightDraggingRef.current) {
      rightDraggingRef.current = null
      try {
        localStorage.setItem('custard:propWidth', String(propWidth))
        localStorage.setItem('custard:aiWidth', String(aiWidth))
      } catch {}
    }
  }, [leftRatio])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  // Load persisted settings
  useEffect(() => {
    try {
      const ratio = Number(localStorage.getItem('custard:leftRatio'))
      if (Number.isFinite(ratio) && ratio > 0.1 && ratio < 0.9) setLeftRatio(ratio)
      
      const jsonState = localStorage.getItem('custard:jsonCollapsed')
      if (jsonState === '1') setJsonCollapsed(true)
      
      const fileManagerState = localStorage.getItem('custard:showFileManager')
      if (fileManagerState === '0') setShowFileManager(false)

      const pw = Number(localStorage.getItem('custard:propWidth'))
      if (Number.isFinite(pw) && pw >= 200) setPropWidth(pw)
      const aw = Number(localStorage.getItem('custard:aiWidth'))
      if (Number.isFinite(aw) && aw >= 200) setAiWidth(aw)
    } catch {}
  }, [])

  // Clear selection when a different file/keyboard is loaded
  useEffect(() => {
    console.log(`File/keyboard changed: ${fileManager.currentFileName}, ${fileManager.currentKeyboard?.identifier}`)
    setSelectedIndex(null)
    setSelectedKey(null)
  }, [fileManager.currentFileName, fileManager.currentKeyboard?.identifier])

  // Keep a stable key during content edits to avoid remounting preview
  // Remount only when switching files/identifiers so UI state (e.g., flick layer) persists across edits
  const forceKey = `${fileManager.currentFileName || 'new'}-${fileManager.currentKeyboard?.identifier || 'default'}`

  // Derive selectedKey when selectedIndex or keyboard changes
  useEffect(() => {
    if (selectedIndex != null) {
      try {
        const item: any = fileManager.currentKeyboard.interface.keys[selectedIndex]
        const key = item?.key_type ? item.key : item
        setSelectedKey(key || null)
      } catch {
        setSelectedKey(null)
      }
    } else {
      setSelectedKey(null)
    }
  }, [selectedIndex, fileManager.currentKeyboard])

  const toggleJsonCollapsed = () => {
    setJsonCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem('custard:jsonCollapsed', next ? '1' : '0') } catch {}
      return next
    })
  }

  const toggleFileManager = () => {
    setShowFileManager((prev) => {
      const next = !prev
      try { localStorage.setItem('custard:showFileManager', next ? '1' : '0') } catch {}
      return next
    })
  }

  const handlePresetLoad = (presetKey: string) => {
    const preset = presets[presetKey]
    if (preset) {
      // Create a deep copy of the preset
      const newKeyboard = JSON.parse(JSON.stringify(preset))
      const name = fileManager.generateNewName(preset.metadata?.display_name || presetKey)
      newKeyboard.identifier = name
      
      console.log(`Loading preset ${presetKey} as ${name}:`, newKeyboard)
      console.log(`Preset has ${newKeyboard.interface?.keys?.length || 0} keys`)
      
      // First update the keyboard state
      fileManager.updateKeyboard(newKeyboard, `プリセット「${preset.metadata?.display_name || presetKey}」から作成`)
      
      // Clear selection
      setSelectedIndex(null)
      setSelectedKey(null)
      
      // Save the new keyboard using the fresh object to avoid state race
      const saved = fileManager.save(name, newKeyboard)
      if (saved) {
        console.log(`Successfully saved preset ${presetKey} as ${name}`)
      } else {
        console.error(`Failed to save preset ${presetKey} as ${name}`)
      }
    }
  }

  const handleImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const keyboard = JSON.parse(e.target?.result as string) as CustardKeyboard
        const name = fileManager.generateNewName(
          file.name.replace('.json', '') || keyboard.metadata?.display_name || 'インポート'
        )
        keyboard.identifier = name
        fileManager.updateKeyboard(keyboard, `${file.name} をインポート`)
        setSelectedIndex(null)
        setSelectedKey(null)
        // Save the imported keyboard using the fresh object to avoid state race
        fileManager.save(name, keyboard)
      } catch (error) {
        alert('JSONファイルの読み込みに失敗しました')
      }
    }
    reader.readAsText(file)
  }

  const handleExport = () => {
    const keyboard = fileManager.currentKeyboard
    const sanitizedKeyboard = normalizeForAzooKey(keyboard)
    const dataStr = JSON.stringify(sanitizedKeyboard, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const fileName = fileManager.currentFileName || `${keyboard.identifier || 'keyboard'}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', fileName)
    linkElement.click()
  }

  const createKeyAt = (x: number, y: number) => {
    // Deep copy current keyboard to avoid state mutation issues
    const kb = JSON.parse(JSON.stringify(fileManager.currentKeyboard)) as CustardKeyboard

    // Create an "unset" custom key at the specified grid cell
    const newKey: KeyWrapper = {
      key_type: 'custom',
      specifier_type: 'grid_fit',
      specifier: { x, y, width: 1, height: 1 },
      key: {
        design: { label: { text: '' }, color: 'normal' },
        longpress_actions: { start: [], repeat: [], duration: 'normal' },
        press_actions: [],
        variations: []
      }
    }

    if (!kb.interface) kb.interface = { key_layout: { type: 'grid_fit', row_count: 4, column_count: 10 }, key_style: 'tenkey_style', keys: [] }
    if (!kb.interface.keys) kb.interface.keys = []

    kb.interface.keys.push(newKey)
    const idx = kb.interface.keys.length - 1

    fileManager.updateKeyboard(kb, `新しいキーを追加 (${x}, ${y})`)
    setSelectedIndex(idx)
    setSelectedKey((newKey as any).key)
  }

  const createFlickVariationAt = (index: number, direction: 'center' | 'left' | 'up' | 'right' | 'down') => {
    if (direction === 'center') return
    const kb = JSON.parse(JSON.stringify(fileManager.currentKeyboard)) as CustardKeyboard
    const item: any = kb.interface?.keys?.[index]
    if (!item) return
    const key: any = item.key_type ? item.key : item

    // Determine variation format and direction mapping
    const dirMap: Record<string, string> = { up: 'top', down: 'bottom', left: 'left', right: 'right' }
    const targetDirection = dirMap[direction] || direction

    // Ensure variations array exists
    if (!Array.isArray(key.variations)) key.variations = []

    const first = key.variations[0]
    const isFlickObjects = first && typeof first === 'object' && 'direction' in first && 'key' in first

    // If legacy array format is detected, convert to FlickVariation[] first for consistency
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

    // Now ensure we use FlickVariation[] consistently
    const exists = (key.variations as any[]).some((v: any) => v && v.direction === targetDirection)
    if (exists) return
    ;(key.variations as any[]).push({
      type: 'flick_variation',
      direction: targetDirection,
      key: {
        design: { label: { text: '' }, color: 'normal' },
        longpress_actions: { start: [], repeat: [], duration: 'normal' },
        press_actions: [],
        variations: []
      }
    })

    fileManager.updateKeyboard(kb, `フリック「${direction}」を追加 (キー#${index + 1})`)
    setSelectedIndex(index)
    try {
      const updatedItem: any = kb.interface.keys[index]
      setSelectedKey(updatedItem.key_type ? updatedItem.key : updatedItem)
    } catch {}
  }



  return (
    <div className="h-screen flex bg-gray-50">
      {/* File Manager Sidebar */}
      {showFileManager && (
        <FileManager
          currentKeyboard={fileManager.currentKeyboard}
          currentFileName={fileManager.currentFileName}
          savedNames={fileManager.savedNames}
          historyStack={fileManager.historyStack}
          currentHistoryIndex={fileManager.currentHistoryIndex}
          onSave={() => fileManager.save()}
          onSaveAs={() => fileManager.saveAs()}
          onOpen={(name) => fileManager.open(name)}
          onDelete={(name) => fileManager.deleteFile(name)}
          onBatchDelete={(names) => fileManager.batchDelete(names)}
          onBatchExport={(names) => fileManager.batchExport(names)}
          onRename={(oldName, newName) => fileManager.renameFile(oldName, newName)}
          onNewFile={() => fileManager.newFile()}
          onDuplicate={() => fileManager.duplicate()}
          onExport={handleExport}
          onImport={handleImport}
          onHistoryJump={(index) => fileManager.jumpToHistory(index)}
          onUndo={() => fileManager.undo()}
          onRedo={() => fileManager.redo()}
          hasUnsavedChanges={fileManager.hasUnsavedChanges}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleFileManager}
                className="p-1.5 hover:bg-gray-100 rounded"
                title={showFileManager ? 'ファイル管理を隠す' : 'ファイル管理を表示'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={showFileManager ? "M4 6h16M4 12h16M4 18h16" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
              
              <h1 className="text-lg font-bold text-gray-900">CustardWeb</h1>
              
              {/* Current file indicator */}
              <div className="flex items-center space-x-2 px-3 py-1 rounded bg-gray-50 border">
                <span className={`w-2 h-2 rounded-full ${
                  fileManager.hasUnsavedChanges ? 'bg-orange-400' : 'bg-green-400'
                }`} />
                <span className="text-sm font-medium">
                  {fileManager.currentFileName || '無題'}
                </span>
                {fileManager.hasUnsavedChanges && (
                  <span className="text-xs text-orange-600">*</span>
                )}
              </div>

              {/* Quick actions */}
              <div className="flex items-center space-x-2 border-l pl-3">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handlePresetLoad(e.target.value)
                      // Reset the select value so it can be selected again
                      e.target.value = ""
                    }
                  }}
                  className="text-sm border rounded px-3 py-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <option value="">📋 プリセットから新規作成...</option>
                  {Object.entries(presets).map(([key, kb]) => (
                    <option key={key} value={key}>
                      {kb.metadata?.display_name || key}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => fileManager.newFile()}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded"
                  title="空のキーボードから開始"
                >
                  📝 空から作成
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleJsonCollapsed}
                className={`px-3 py-1 rounded text-sm border ${
                  jsonCollapsed ? 'bg-gray-50 text-gray-700 border-gray-300' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                JSON: {jsonCollapsed ? 'OFF' : 'ON'}
              </button>

              <button
                onClick={() => setShowAI((v) => !v)}
                className={`px-3 py-1 rounded text-sm border ${
                  showAI ? 'bg-purple-500 text-white border-purple-500' : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}
                title={showAI ? 'AIパネルを隠す' : 'AIパネルを表示'}
              >
                🤖 AI
              </button>
              
              <button
                onClick={() => fileManager.save()}
                disabled={!fileManager.hasUnsavedChanges}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存 (Cmd+S)
              </button>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            <div ref={splitRef} className="flex flex-1 overflow-hidden">
              {/* Preview Panel */}
              <div
                className="flex flex-col bg-white border-r border-gray-200"
                style={{ flex: `0 0 ${Math.round(leftRatio * 100)}%` }}
              >
                <div className="flex-1 overflow-y-auto p-4">
                  <KeyboardPreview
                    key={forceKey}
                    keyboard={fileManager.currentKeyboard}
                    onSelectKey={(key, index) => {
                      setSelectedKey(key)
                      setSelectedIndex(index)
                    }}
                    selectedKey={selectedKey}
                    onCreateKey={createKeyAt}
                    onCreateFlickVariation={createFlickVariationAt}
                  />
                </div>
              </div>

              {/* Resizer */}
              <div
                onMouseDown={startDrag}
                className="w-1 cursor-col-resize bg-gray-200 hover:bg-gray-300 active:bg-gray-400"
              />

              {/* Properties Panel */}
              <div className="flex flex-col bg-white border-r border-gray-200" 
                   style={{ width: jsonCollapsed ? 'auto' : `${propWidth}px`, flex: jsonCollapsed ? '1' : undefined }}>
                <div className="px-3 py-2 border-b border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setActiveTab('keyboard')}
                      className={`px-3 py-1 text-sm rounded ${
                        activeTab === 'keyboard' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      キーボード設定
                    </button>
                    <button
                      onClick={() => setActiveTab('key')}
                      className={`px-3 py-1 text-sm rounded ${
                        activeTab === 'key' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      キー設定
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {activeTab === 'keyboard' ? (
                    <KeyboardSettings
                      key={`props:keyboard:${fileManager.currentFileName || ''}:${fileManager.currentKeyboard.identifier}`}
                      keyboard={fileManager.currentKeyboard}
                      onChange={(kb) => fileManager.updateKeyboard(kb, 'キーボード設定を変更')}
                    />
                  ) : (
                    <KeyInspector
                      key={`props:key:${fileManager.currentFileName || ''}:${fileManager.currentKeyboard.identifier}:${selectedIndex ?? 'none'}`}
                      keyboard={fileManager.currentKeyboard}
                      selectedIndex={selectedIndex}
                      onChange={(kb) => fileManager.updateKeyboard(kb, 'キー編集')}
                    />
                  )}
                </div>
              </div>

              {/* Resizer between Properties and JSON */}
              {!jsonCollapsed && (
                <div
                  onMouseDown={(e) => { rightDraggingRef.current = 'prop-json'; lastXRef.current = e.clientX; e.preventDefault() }}
                  className="w-1 cursor-col-resize bg-gray-200 hover:bg-gray-300 active:bg-gray-400"
                  title="ドラッグして幅を調整"
                />
              )}

              {/* JSON Editor Panel */}
              {!jsonCollapsed && (
                <div className="flex-1 flex flex-col bg-white border-r border-gray-200">
                  <JSONEditor
                    key={forceKey}
                    keyboard={fileManager.currentKeyboard}
                    onUpdate={(kb, msg) => fileManager.updateKeyboard(kb, msg || 'JSON編集')}
                  />
                </div>
              )}
            </div>

            {/* Resizer between JSON and AI */}
            {showAI && !jsonCollapsed && (
              <div
                onMouseDown={(e) => { rightDraggingRef.current = 'json-ai'; lastXRef.current = e.clientX; e.preventDefault() }}
                className="w-1 cursor-col-resize bg-gray-200 hover:bg-gray-300 active:bg-gray-400"
                title="ドラッグして幅を調整"
              />
            )}

            {showAI && (
              <div className="border-l border-gray-200 bg-white flex flex-col" style={{ width: `${aiWidth}px`, minWidth: 280 }}>
                <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">AIアシスタント</div>
                <div className="flex-1 overflow-hidden">
                  <AIAssistant
                    keyboard={fileManager.currentKeyboard}
                    onUpdate={(kb, msg) => fileManager.updateKeyboard(kb, msg || 'AI編集')}
                  />
                </div>
              </div>
            )}
          </div>

          {/* History Timeline at Bottom */}
          <div className="bg-white border-t border-gray-200 px-3 py-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">デザイン履歴</span>
                <span className="text-xs text-gray-500">({fileManager.currentHistoryIndex + 1}/{fileManager.historyStack.length})</span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => fileManager.undo()}
                  disabled={fileManager.currentHistoryIndex === 0}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="元に戻す (Cmd+Z)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => fileManager.redo()}
                  disabled={fileManager.currentHistoryIndex >= fileManager.historyStack.length - 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="やり直し (Cmd+Y)"
                >
                  <RotateCcw className="w-3.5 h-3.5 scale-x-[-1]" />
                </button>
              </div>
            </div>
            
            {/* Timeline */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1">
              {fileManager.historyStack.map((entry, index) => {
                const isCurrent = index === fileManager.currentHistoryIndex
                const isPast = index < fileManager.currentHistoryIndex
                const isFuture = index > fileManager.currentHistoryIndex
                
                const getActionEmoji = (description: string) => {
                  const desc = description.toLowerCase()
                  if (desc.includes('初期') || desc.includes('作成') || desc.includes('新規')) return '🎯'
                  if (desc.includes('キー') && desc.includes('追加')) return '➕'
                  if (desc.includes('キー') && desc.includes('削除')) return '🗑️'
                  if (desc.includes('キー') && (desc.includes('編集') || desc.includes('変更'))) return '✏️'
                  if (desc.includes('設定') || desc.includes('キーボード')) return '⚙️'
                  if (desc.includes('プリセット')) return '📋'
                  if (desc.includes('インポート')) return '📥'
                  if (desc.includes('エクスポート')) return '📤'
                  if (desc.includes('保存')) return '💾'
                  if (desc.includes('開きました') || desc.includes('読み込み')) return '📂'
                  if (desc.includes('複製')) return '📄'
                  if (desc.includes('json')) return '🔧'
                  return '📝'
                }
                
                return (
                  <div key={index} className="flex flex-col items-center group">
                    <button
                      onClick={() => fileManager.jumpToHistory(index)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 transition-all duration-200 hover:scale-110 ${
                        isCurrent 
                          ? 'bg-blue-500 border-blue-500 text-white shadow-lg animate-pulse' 
                          : isPast
                          ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={hasMounted ? `${entry.description}\n${entry.timestamp.toISOString().slice(0, 19).replace('T', ' ')}` : entry.description}
                    >
                      {getActionEmoji(entry.description)}
                    </button>
                    <span className="text-[10px] text-gray-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">{index + 1}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
