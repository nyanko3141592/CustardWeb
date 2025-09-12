'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { CustardKeyboard, Key } from '@/types/custard'
import { normalizeForAzooKey } from '@/lib/normalize'
// Presets are now loaded dynamically from /api/templates (src/lib/templates)
import { loadTemplates } from '@/lib/loadTemplatesClient'
import KeyboardPreview from './KeyboardPreview'
import KeyInspector from './KeyInspector'
import KeyboardSettings from './KeyboardSettings'
import AIAssistant from './AIAssistant'
import FileUpload from './FileUpload'
import JSONEditor from './JSONEditor'
import KeyFocus from './KeyFocus'

// Dynamic presets loaded from API
// Fallback keyboard for initial render to avoid hydration mismatch
const emptyKeyboard: CustardKeyboard = {
  identifier: 'new_keyboard',
  language: 'none',
  input_style: 'direct',
  metadata: { custard_version: '1.2', display_name: '新規キーボード' },
  interface: { key_layout: { type: 'grid_fit', row_count: 4, column_count: 10 }, key_style: 'tenkey_style', keys: [] }
} as CustardKeyboard

export default function KeyboardDesigner() {
  const [presets, setPresets] = useState<Record<string, CustardKeyboard>>({})
  const [showStartup, setShowStartup] = useState<boolean>(true) // Show startup screen initially
  const [selectedTemplate, setSelectedTemplate] = useState<string>('') 
  const [currentKeyboard, setCurrentKeyboard] = useState<CustardKeyboard>(emptyKeyboard)
  const [keyboardHistory, setKeyboardHistory] = useState<CustardKeyboard[]>([emptyKeyboard])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const [isNewCreation, setIsNewCreation] = useState<boolean>(true)
  const [recentFiles, setRecentFiles] = useState<Array<{name: string, keyboard: CustardKeyboard, timestamp: Date}>>([])
  const [isAICollapsed, setIsAICollapsed] = useState(true)
  const [jsonCollapsed, setJsonCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState<Key | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [savedNames, setSavedNames] = useState<string[]>([])
  const [showSaved, setShowSaved] = useState(false)
  // Hydration-safe default; load actual ratio after mount to avoid SSR/client mismatch
  const [leftRatio, setLeftRatio] = useState<number>(0.5)
  const [activeTab, setActiveTab] = useState<'key' | 'keyboard'>('keyboard')
  const splitRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  // Load presets (API in dev/Vercel; bundled JSON fallback on static export)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const loaded = await loadTemplates()
      if (!mounted) return
      setPresets(loaded)
      // If japanese_flick exists, use it for preview until user chooses
      const initial = loaded['japanese_flick'] || Object.values(loaded)[0] || emptyKeyboard
      setCurrentKeyboard(initial)
      setKeyboardHistory([initial])
    })()
    return () => { mounted = false }
  }, [])

  const startDrag = (e: React.MouseEvent) => {
    draggingRef.current = true
    e.preventDefault()
  }
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingRef.current || !splitRef.current) return
    const rect = splitRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = Math.min(0.85, Math.max(0.15, x / rect.width))
    setLeftRatio(ratio)
  }, [])
  const onMouseUp = useCallback(() => {
    if (draggingRef.current) {
      draggingRef.current = false
      try { localStorage.setItem('custard:leftRatio', String(leftRatio)) } catch {}
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

  // Load persisted split after mount (prevents hydration mismatch)
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem('custard:leftRatio'))
      if (Number.isFinite(v) && v > 0.1 && v < 0.9) setLeftRatio(v)
    } catch {}
  }, [])

  // Load JSON collapsed state
  useEffect(() => {
    try {
      const v = localStorage.getItem('custard:jsonCollapsed')
      if (v === '1') setJsonCollapsed(true)
    } catch {}
  }, [])
  const toggleJsonCollapsed = () => {
    setJsonCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem('custard:jsonCollapsed', next ? '1' : '0') } catch {}
      return next
    })
  }
  
  const handleStartupPresetSelection = (templateKey: string) => {
    const presetName = presets[templateKey]?.metadata?.display_name || templateKey
    const newKeyboard = JSON.parse(JSON.stringify(presets[templateKey])) // Deep copy
    
    // Generate automatic name and save immediately
    const autoName = generateNewName(presetName)
    
    // Sync identifier with filename
    newKeyboard.identifier = autoName
    
    setSelectedTemplate('') 
    setIsNewCreation(false) // Set as saved file immediately
    setCurrentKeyboard(newKeyboard)
    setKeyboardHistory([newKeyboard])
    setHistoryIndex(0)
    setCurrentFileName(autoName)
    setShowStartup(false) // Hide startup screen
    
    // Auto-save immediately
    saveKeyboardToLocal(autoName, newKeyboard)
    
    // Add to recent files
    const newRecentFile = { name: autoName, keyboard: newKeyboard, timestamp: new Date() }
    setRecentFiles(prev => [newRecentFile, ...prev.filter(f => f.name !== autoName)].slice(0, 5))
  }

  const handleTemplateChange = (templateKey: string) => {
    const presetName = presets[templateKey]?.metadata?.display_name || templateKey
    const newKeyboard = JSON.parse(JSON.stringify(presets[templateKey])) // Deep copy to avoid modifying preset
    
    // Reset identifier for new creation (will be set when saved)
    newKeyboard.identifier = 'new_keyboard'
    
    // Start new creation mode with selected preset as base
    setSelectedTemplate('') // Clear template selection - we're now in new creation mode
    setIsNewCreation(true)
    setCurrentKeyboard(newKeyboard)
    setKeyboardHistory([newKeyboard])
    setHistoryIndex(0)
    setCurrentFileName(null)
    
    // Show user feedback
    setTimeout(() => {
      alert(`📋 「${presetName}」をベースに新しいキーボードを作成中です！\n\n編集を開始してください。保存する時に名前を付けることができます。`)
    }, 100)
  }
  
  const handleFileLoad = (keyboard: CustardKeyboard, fileName: string) => {
    // Sync identifier with filename when loading
    const syncedKeyboard = { ...keyboard, identifier: fileName }
    
    setCurrentKeyboard(syncedKeyboard)
    setKeyboardHistory([syncedKeyboard])
    setHistoryIndex(0)
    setCurrentFileName(fileName)
    setSelectedTemplate('')
    setIsNewCreation(false) // Now editing an existing file
    setShowStartup(false) // Hide startup screen
    
    // Auto-save the synced version
    saveKeyboardToLocal(fileName, syncedKeyboard)
    
    // 最近開いたファイルに追加
    const newRecentFile = { name: fileName, keyboard: syncedKeyboard, timestamp: new Date() }
    setRecentFiles(prev => {
      const filtered = prev.filter(f => f.name !== fileName)
      return [newRecentFile, ...filtered].slice(0, 5) // 最新5件を保持
    })
  }

  const handleStartupFileLoad = (keyboard: CustardKeyboard, fileName: string) => {
    handleFileLoad(keyboard, fileName)
  }
  
  // ローカル保存関連
  const loadSavedNames = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('custard:savedList')
      const list = raw ? (JSON.parse(raw) as string[]) : []
      setSavedNames(Array.isArray(list) ? list : [])
    } catch {
      setSavedNames([])
    }
  }, [])

  const persistSavedNames = (names: string[]) => {
    try {
      localStorage.setItem('custard:savedList', JSON.stringify(names))
    } catch {}
  }

  const saveKeyboardToLocal = (name: string, kb: CustardKeyboard) => {
    try {
      localStorage.setItem(`custard:keyboard:${name}`, JSON.stringify(kb))
      setSavedNames(prev => {
        const next = Array.from(new Set([name, ...prev]))
        persistSavedNames(next)
        return next
      })
    } catch {}
  }

  const deleteSavedKeyboard = (name: string) => {
    try {
      localStorage.removeItem(`custard:keyboard:${name}`)
      setSavedNames(prev => {
        const next = prev.filter(n => n !== name)
        persistSavedNames(next)
        return next
      })
      if (currentFileName === name) {
        setCurrentFileName(null)
      }
    } catch {}
  }

  const generateNewName = (presetName?: string): string => {
    const baseName = presetName || 'Keyboard'
    let i = 1
    const set = new Set(savedNames)
    while (set.has(`${baseName}${i}`)) i++
    return `${baseName}${i}`
  }

  useEffect(() => {
    loadSavedNames()
  }, [loadSavedNames])

  const openSavedKeyboard = (name: string) => {
    try {
      const raw = localStorage.getItem(`custard:keyboard:${name}`)
      if (!raw) return
      const kb = JSON.parse(raw) as CustardKeyboard
      
      // Ensure identifier matches filename
      const syncedKeyboard = { ...kb, identifier: name }
      
      setCurrentKeyboard(syncedKeyboard)
      setKeyboardHistory([syncedKeyboard])
      setHistoryIndex(0)
      setCurrentFileName(name)
      setSelectedTemplate('')
      setIsNewCreation(false) // Now editing an existing file
      setShowStartup(false) // Hide startup screen
      
      // Re-save with synced identifier if it was different
      if (kb.identifier !== name) {
        saveKeyboardToLocal(name, syncedKeyboard)
      }
    } catch {}
  }

  const handleKeyboardUpdate = (keyboard: CustardKeyboard, message?: string) => {
    // Do NOT force-sync identifier to filename here.
    // Allow users to edit identifier freely in the GUI.
    // Synchronization (if desired) happens explicitly on Save/Save As.
    setCurrentKeyboard(keyboard)
    const newHistory = [...keyboardHistory.slice(0, historyIndex + 1), keyboard]
    setKeyboardHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    // Auto-save for existing saved files
    if (currentFileName && !isNewCreation) {
      saveKeyboardToLocal(currentFileName, keyboard)
    }
    
    // For new creation mode, don't auto-save - let user save manually when ready
  }
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setCurrentKeyboard(keyboardHistory[historyIndex - 1])
    }
  }
  
  const handleRedo = () => {
    if (historyIndex < keyboardHistory.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setCurrentKeyboard(keyboardHistory[historyIndex + 1])
    }
  }
  
  const downloadJSON = () => {
    const sanitizeIdentifier = (s: string) => {
      const base = (s || '').trim() || 'keyboard'
      // Allow only A-Z a-z 0-9 _
      let id = base.replace(/[^A-Za-z0-9_]/g, '_')
      // Avoid leading underscore-only names
      if (!/[A-Za-z0-9]/.test(id)) id = 'keyboard'
      return id
    }
    // Create a copy with identifier matching filename if available
    let keyboardToExport = { ...currentKeyboard }
    // Keep identifier stable; if current file name is set, use it for display_name only.
    if (!keyboardToExport.identifier || keyboardToExport.identifier === 'new_keyboard') {
      keyboardToExport.identifier = sanitizeIdentifier(currentFileName || currentKeyboard.metadata?.display_name || 'keyboard')
    } else {
      // Sanitize existing identifier just in case
      keyboardToExport.identifier = sanitizeIdentifier(keyboardToExport.identifier)
    }
      
    // Ensure metadata section exists and is complete
    if (!keyboardToExport.metadata) {
      keyboardToExport = {
        ...keyboardToExport,
        metadata: {
          custard_version: '1.2',
          display_name: keyboardToExport.identifier || 'カスタムキーボード'
        }
      }
    } else {
      // Ensure metadata has required fields
      keyboardToExport = {
        ...keyboardToExport,
        metadata: {
          custard_version: keyboardToExport.metadata.custard_version || '1.2',
          display_name: keyboardToExport.metadata.display_name || keyboardToExport.identifier || 'カスタムキーボード'
        }
      }
    }
    
    // Normalize to azooKey-compatible structure (wrap keys, label types, flick directions)
    const azooKeyJSON = normalizeForAzooKey(keyboardToExport)
    
    const dataStr = JSON.stringify(azooKeyJSON, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = currentFileName || `${keyboardToExport.identifier}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleSaveAs = () => {
    const baseName = currentFileName || currentKeyboard.metadata?.display_name || 'キーボード'
    const newName = prompt('キーボードの名前を入力:', baseName)
    if (newName && newName.trim()) {
      const trimmedName = newName.trim()
      
      // Create a copy with synchronized identifier
      const keyboardToSave = { ...currentKeyboard, identifier: trimmedName }
      
      saveKeyboardToLocal(trimmedName, keyboardToSave)
      setCurrentFileName(trimmedName)
      setCurrentKeyboard(keyboardToSave) // Update current keyboard with new identifier
      setSelectedTemplate('') // Clear any template selection
      setIsNewCreation(false) // Now editing a saved file
      alert(`"${trimmedName}" として保存しました`)
      
      // Add to recent files
      const newRecentFile = { name: trimmedName, keyboard: keyboardToSave, timestamp: new Date() }
      setRecentFiles(prev => [newRecentFile, ...prev.filter(f => f.name !== trimmedName)].slice(0, 5))
    }
  }

  const handleNewKeyboard = () => {
    if (confirm('新しい空のキーボードを作成しますか？\n\n通常はプリセットから作成することをお勧めします。')) {
      const emptyKeyboard: CustardKeyboard = {
        identifier: 'new_keyboard',
        language: 'ja_JP',
        input_style: 'flick',
        metadata: {
          custard_version: '1.2',
          display_name: '新しいキーボード'
        },
        interface: {
          key_style: 'tenkey_style',
          key_layout: {
            type: 'grid_fit',
            row_count: 10,
            column_count: 4
          },
          keys: []
        }
      }
      setCurrentKeyboard(emptyKeyboard)
      setKeyboardHistory([emptyKeyboard])
      setHistoryIndex(0)
      setCurrentFileName(null)
      setSelectedTemplate('')
      setIsNewCreation(true) // New creation mode
    }
  }

  const createKeyAt = (x: number, y: number) => {
    console.log('Creating key at:', x, y)
    const kb = JSON.parse(JSON.stringify(currentKeyboard)) as CustardKeyboard
    const newKey: any = {
      key_type: 'custom',
      specifier_type: 'grid_fit',
      specifier: { x, y, width: 1, height: 1 },
      key: {
        design: { label: { type: 'text', text: '' }, color: 'normal' },
        longpress_actions: { start: [], repeat: [], duration: 'normal' },
        press_actions: [],
        variations: []
      }
    }
    const idx = kb.interface.keys.length
    kb.interface.keys.push(newKey)
    console.log('New key added:', newKey, 'Total keys:', kb.interface.keys.length)
    // update state with history/autosave pipeline
    handleKeyboardUpdate(kb)
    setSelectedIndex(idx)
    setSelectedKey((newKey as any).key)
  }
  
  // Show startup screen if needed
  if (showStartup) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎹 CustardWeb
            </h1>
            <p className="text-gray-600">
              azooKeyカスタムキーボードエディター
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Preset Selection */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                📋 プリセットから新規作成
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(presets).map(([key, kb]) => (
                  <button
                    key={key}
                    onClick={() => handleStartupPresetSelection(key)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="font-medium text-gray-900">
                      {(kb as any)?.metadata?.display_name || key}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {key.replace('_', ' ')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Existing Files */}
            {savedNames.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                  💾 既存のキーボードを開く
                </h2>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {savedNames.slice(0, 5).map((name) => (
                    <button
                      key={name}
                      onClick={() => openSavedKeyboard(name)}
                      className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-left transition-colors"
                    >
                      <div className="font-medium text-gray-900">{name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* File Import */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                📁 JSONファイルをインポート
              </h2>
              <div className="flex justify-center">
                <FileUpload onFileLoad={handleStartupFileLoad} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Reorganized Header */}
      <div className="relative bg-white border-b border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold text-gray-900">CustardWeb</h1>
            
            {/* Undo/Redo */}
            <div className="flex items-center border-l pl-3 space-x-1">
              <button
                onClick={handleUndo}
                disabled={historyIndex === 0}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="元に戻す"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex === keyboardHistory.length - 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="やり直す"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>
            
            {/* Unified Creation Section */}
            <div className="flex items-center border-l pl-3 space-x-1">
              <div className="relative">
                <button
                  onClick={() => setShowSaved((v) => !v)}
                  className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded flex items-center"
                  title="新規作成・ファイル管理"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  新規作成
                </button>
                {showSaved && (
                  <div className="absolute z-20 top-full mt-1 left-0 bg-white border border-gray-200 rounded shadow-lg w-80 max-h-96 overflow-auto">
                    {/* 新規作成セクション */}
                    <div className="p-3 border-b bg-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">🎨 新規作成</span>
                        <button
                          onClick={() => setShowSaved(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* プリセットから作成 */}
                      <div className="space-y-2">
                        <p className="text-xs text-blue-600">プリセットから作成（推奨）</p>
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) { handleTemplateChange(e.target.value); setShowSaved(false) } }}
                          className="w-full text-sm border rounded px-2 py-1.5 bg-white"
                        >
                          <option value="">プリセットを選択...</option>
                          {Object.entries(presets).map(([key, kb]) => (
                            <option key={key} value={key}>
                              {(kb as any)?.metadata?.display_name ?? key}
                            </option>
                          ))}
                        </select>
                        
                        {/* 空のキーボード作成 */}
                        <button
                          onClick={() => { handleNewKeyboard(); setShowSaved(false) }}
                          className="w-full px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border"
                        >
                          📝 空のキーボードを作成
                        </button>
                      </div>
                    </div>
                    
                    {/* ファイル読み込みセクション */}
                    <div className="p-3 border-b">
                      <p className="text-sm font-medium text-gray-700 mb-2">📁 ファイルを開く</p>
                      <div className="flex space-x-2">
                        <FileUpload onFileLoad={(kb, name) => { handleFileLoad(kb, name); setShowSaved(false) }} />
                        <button
                          onClick={() => { handleSaveAs(); setShowSaved(false) }}
                          className={`px-2 py-1 text-xs rounded ${
                            isNewCreation 
                              ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' 
                              : 'bg-green-100 hover:bg-green-200 text-green-700'
                          }`}
                        >
                          💾 {isNewCreation ? '保存' : '別名保存'}
                        </button>
                      </div>
                    </div>
                    
                    {/* 保存済みファイル一覧 */}
                    <div className="p-2">
                      <div className="text-xs text-gray-500 mb-2">保存済みキーボード ({savedNames.length}件)</div>
                      {savedNames.length === 0 ? (
                        <div className="p-2 text-xs text-gray-500">まだ保存はありません</div>
                      ) : (
                        <ul className="divide-y max-h-40 overflow-y-auto">
                          {savedNames.map((name) => (
                            <li key={name} className="flex items-center justify-between px-2 py-1.5">
                              <button onClick={() => { openSavedKeyboard(name); setShowSaved(false) }} className="text-sm text-gray-700 hover:underline flex-1 text-left">
                                {name}
                              </button>
                              <button onClick={() => deleteSavedKeyboard(name)} className="text-gray-400 hover:text-red-500 ml-2" title="削除">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Current file indicator */}
            <div className="flex items-center border-l pl-3">
              <div className="flex items-center space-x-1 px-2 py-1 rounded border bg-gray-50">
                <span className={`w-2 h-2 rounded-full ${
                  isNewCreation 
                    ? 'bg-orange-400'   // New creation
                    : 'bg-green-400'  // Saved file
                }`}></span>
                <span className="text-xs font-medium text-gray-700">
                  {currentFileName || currentKeyboard.metadata?.display_name || '新しいキーボード'}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isNewCreation 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {isNewCreation ? '未保存' : '保存済み'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleJsonCollapsed}
              className={`px-2 py-1.5 rounded text-xs border ${jsonCollapsed ? 'bg-gray-50 text-gray-700 border-gray-300' : 'bg-blue-50 text-blue-700 border-blue-200'}`}
              title={jsonCollapsed ? 'JSONを表示' : 'JSONを非表示'}
            >
              JSON: {jsonCollapsed ? 'OFF' : 'ON'}
            </button>
            <button
              onClick={downloadJSON}
              className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded flex items-center"
              title="JSONファイルとしてエクスポート"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              エクスポート
            </button>
          </div>
        </div>
      </div>
      
      
      {/* Main Content - Preview | Properties | JSON (collapsible) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Split container for left (preview) and middle (properties) */}
        <div ref={splitRef} className="flex flex-1 overflow-hidden">
          {/* Left: Preview (resizable) */}
          <div
            className="flex flex-col bg-white border-r border-gray-200 relative overflow-hidden"
            style={{ flex: `0 0 ${Math.round(leftRatio * 100)}%` }}
          >
            <div className="flex-1 overflow-y-auto p-4">
              <KeyboardPreview 
                keyboard={currentKeyboard}
                onSelectKey={(key, index) => { setSelectedKey(key); setSelectedIndex(index) }}
                selectedKey={selectedKey}
                onCreateKey={createKeyAt}
              />
          </div>
        </div>
          {/* Resizer between Preview and Properties */}
          <div
            onMouseDown={startDrag}
            className="w-1 md:w-1.5 cursor-col-resize bg-gray-200 hover:bg-gray-300 active:bg-gray-400"
            title="ドラッグして幅を調整"
          >
            {/* Optional visual handle */}
            <div className="h-full w-px mx-auto bg-gray-300" />
          </div>
          {/* Middle: Properties (flexible width when JSON is hidden) */}
          <div className="flex flex-col bg-white border-r border-gray-200" style={{ width: jsonCollapsed ? 'auto' : '420px', flex: jsonCollapsed ? '1' : undefined }}>
            <div className="px-3 py-2 border-b border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('keyboard')}
                  className={`px-3 py-1 text-sm rounded ${activeTab === 'keyboard' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  キーボード設定
                </button>
                <button
                  onClick={() => setActiveTab('key')}
                  className={`px-3 py-1 text-sm rounded ${activeTab === 'key' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  キー設定
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-3">
              {activeTab === 'key' ? (
                selectedIndex !== null ? (
                  <KeyInspector 
                    keyboard={currentKeyboard}
                    selectedIndex={selectedIndex}
                    onChange={setCurrentKeyboard}
                  />
                ) : (
                  <div className="text-sm text-gray-500">キーを選択してください</div>
                )
              ) : (
                <KeyboardSettings
                  keyboard={currentKeyboard}
                  onChange={setCurrentKeyboard}
                />
              )}
            </div>
          </div>
          {/* Right: JSON Editor (collapsible) */}
          {jsonCollapsed ? null : (
            <div className="flex-1 flex flex-col bg-white border-l border-gray-200">
              <div className="flex-1 overflow-hidden">
                <JSONEditor 
                  keyboard={currentKeyboard} 
                  onUpdate={handleKeyboardUpdate}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
