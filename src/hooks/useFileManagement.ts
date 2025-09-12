'use client'

import { useState, useCallback, useEffect } from 'react'
import { CustardKeyboard } from '@/types/custard'

export interface HistoryEntry {
  keyboard: CustardKeyboard
  timestamp: Date
  description: string
}

export interface FileManagementState {
  currentKeyboard: CustardKeyboard
  currentFileName: string | null
  savedNames: string[]
  historyStack: HistoryEntry[]
  currentHistoryIndex: number
  hasUnsavedChanges: boolean
  lastSavedState: CustardKeyboard | null
}

const MAX_HISTORY_SIZE = 50

// Fixed timestamp for initial state to avoid hydration mismatch
const INITIAL_TIMESTAMP = new Date('2025-01-01T00:00:00Z')

export function useFileManagement(initialKeyboard: CustardKeyboard) {
  const [currentKeyboard, setCurrentKeyboard] = useState<CustardKeyboard>(initialKeyboard)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const [savedNames, setSavedNames] = useState<string[]>([])
  const [historyStack, setHistoryStack] = useState<HistoryEntry[]>([
    { keyboard: initialKeyboard, timestamp: INITIAL_TIMESTAMP, description: '初期状態' }
  ])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0)
  const [lastSavedState, setLastSavedState] = useState<CustardKeyboard | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load saved file names from localStorage
  const loadSavedNames = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('custard:savedList')
      const list = raw ? (JSON.parse(raw) as string[]) : []
      console.log('Loaded saved names:', list)
      setSavedNames(Array.isArray(list) ? list : [])
    } catch {
      setSavedNames([])
    }
  }, [])

  useEffect(() => {
    loadSavedNames()
  }, [loadSavedNames])

  // Track unsaved changes
  useEffect(() => {
    if (lastSavedState) {
      const hasChanges = JSON.stringify(currentKeyboard) !== JSON.stringify(lastSavedState)
      setHasUnsavedChanges(hasChanges)
    }
  }, [currentKeyboard, lastSavedState])

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save: Cmd/Ctrl + S
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (hasUnsavedChanges) {
          save()
        }
      }
      // Save As: Cmd/Ctrl + Shift + S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 's') {
        e.preventDefault()
        saveAs()
      }
      // Undo: Cmd/Ctrl + Z
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        undo()
      }
      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') ||
          ((e.metaKey || e.ctrlKey) && e.key === 'y')) {
        e.preventDefault()
        redo()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasUnsavedChanges, currentHistoryIndex, historyStack.length])

  const persistSavedNames = (names: string[]) => {
    try {
      localStorage.setItem('custard:savedList', JSON.stringify(names))
    } catch {}
  }

  const saveKeyboardToLocal = (name: string, kb: CustardKeyboard) => {
    try {
      console.log(`Saving keyboard ${name}:`, kb)
      localStorage.setItem(`custard:keyboard:${name}`, JSON.stringify(kb))
      setSavedNames(prev => {
        const next = Array.from(new Set([name, ...prev]))
        persistSavedNames(next)
        return next
      })
      setLastSavedState(kb)
      setHasUnsavedChanges(false)
      return true
    } catch (error) {
      console.error(`Error saving keyboard ${name}:`, error)
      return false
    }
  }

  const generateNewName = (baseName?: string): string => {
    const base = baseName || 'Keyboard'
    let i = 1
    const set = new Set(savedNames)
    while (set.has(`${base}${i}`)) i++
    return `${base}${i}`
  }

  const addToHistory = (keyboard: CustardKeyboard, description: string) => {
    console.log(`Adding to history: ${description}, keyboard has ${keyboard.interface?.keys?.length || 0} keys`)
    const newEntry: HistoryEntry = {
      keyboard: JSON.parse(JSON.stringify(keyboard)), // Deep copy
      timestamp: new Date(),
      description
    }
    
    setHistoryStack(prev => {
      // Remove any history after current index (for branching)
      const trimmed = prev.slice(0, currentHistoryIndex + 1)
      const newStack = [...trimmed, newEntry]
      
      // Limit history size
      if (newStack.length > MAX_HISTORY_SIZE) {
        return newStack.slice(-MAX_HISTORY_SIZE)
      }
      return newStack
    })
    
    setCurrentHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1))
  }

  const updateKeyboard = (keyboard: CustardKeyboard, description?: string) => {
    // Do not auto-sync identifier to filename on every edit. Allow free edits.
    setCurrentKeyboard(keyboard)
    addToHistory(keyboard, description || '編集')
  }

  const save = (name?: string, kbOverride?: CustardKeyboard) => {
    // Use override keyboard if provided to avoid racing against async state updates
    const baseKb = kbOverride ?? currentKeyboard
    const saveName = name || currentFileName || generateNewName()
    
    if (!currentFileName && !name) {
      // First save - prompt for name
      const newName = prompt('ファイル名を入力してください:', saveName)
      if (!newName || !newName.trim()) return false
      
      const trimmedName = newName.trim()
      setCurrentFileName(trimmedName)
      
      // Sync identifier
      const syncedKeyboard = { ...baseKb, identifier: trimmedName }
      setCurrentKeyboard(syncedKeyboard)
      
      return saveKeyboardToLocal(trimmedName, syncedKeyboard)
    }
    
    // Regular save
    const syncedKeyboard = { ...baseKb, identifier: saveName }
    setCurrentKeyboard(syncedKeyboard)
    setCurrentFileName(saveName)
    
    return saveKeyboardToLocal(saveName, syncedKeyboard)
  }

  const saveAs = () => {
    const baseName = currentFileName || currentKeyboard.metadata?.display_name || 'キーボード'
    const newName = prompt('新しいファイル名を入力:', generateNewName(baseName))
    
    if (newName && newName.trim()) {
      const trimmedName = newName.trim()
      return save(trimmedName)
    }
    return false
  }

  const open = (name: string) => {
    console.log(`Opening file: ${name}`)
    try {
      const raw = localStorage.getItem(`custard:keyboard:${name}`)
      if (!raw) {
        console.log(`No data found for file: ${name}`)
        return false
      }
      
      const kb = JSON.parse(raw) as CustardKeyboard
      // Make sure to create a completely new object to trigger React updates
      const syncedKeyboard = {
        ...kb,
        identifier: name,
        // Force a new reference for interface to ensure re-renders
        interface: { ...kb.interface }
      }
      
      console.log(`Setting keyboard for ${name}:`, syncedKeyboard)
      console.log(`Current keyboard before change:`, currentKeyboard)
      setCurrentKeyboard(syncedKeyboard)
      setCurrentFileName(name)
      setLastSavedState(syncedKeyboard)
      setHasUnsavedChanges(false)
      
      // Reset history
      setHistoryStack([{
        keyboard: syncedKeyboard,
        timestamp: INITIAL_TIMESTAMP,
        description: `${name} を開きました`
      }])
      setCurrentHistoryIndex(0)
      
      return true
    } catch (error) {
      console.error(`Error opening file ${name}:`, error)
      return false
    }
  }

  const deleteFile = (name: string) => {
    try {
      localStorage.removeItem(`custard:keyboard:${name}`)
      setSavedNames(prev => {
        const next = prev.filter(n => n !== name)
        persistSavedNames(next)
        return next
      })
      
      if (currentFileName === name) {
        setCurrentFileName(null)
        setLastSavedState(null)
        setHasUnsavedChanges(false)
      }
      
      return true
    } catch {
      return false
    }
  }

  const renameFile = (oldName: string, newName: string) => {
    if (oldName === newName || !newName.trim()) return false
    
    try {
      // Get the keyboard data
      const raw = localStorage.getItem(`custard:keyboard:${oldName}`)
      if (!raw) return false
      
      const keyboard = JSON.parse(raw) as CustardKeyboard
      
      // Update identifier
      const updatedKeyboard = { ...keyboard, identifier: newName }
      
      // Save with new name
      localStorage.setItem(`custard:keyboard:${newName}`, JSON.stringify(updatedKeyboard))
      
      // Remove old entry
      localStorage.removeItem(`custard:keyboard:${oldName}`)
      
      // Update saved names list
      setSavedNames(prev => {
        const next = prev.map(n => n === oldName ? newName : n)
        persistSavedNames(next)
        return next
      })
      
      // Update current file if it's the one being renamed
      if (currentFileName === oldName) {
        setCurrentFileName(newName)
        setCurrentKeyboard(updatedKeyboard)
        setLastSavedState(updatedKeyboard)
      }
      
      return true
    } catch {
      return false
    }
  }

  const newFile = () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm(`現在のファイル「${currentFileName || '無題'}」には未保存の変更があります。保存しますか？`)
      if (confirmed) {
        save()
      }
    }
    
    const emptyKeyboard: CustardKeyboard = {
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
    
    setCurrentKeyboard(emptyKeyboard)
    setCurrentFileName(null)
    setLastSavedState(null)
    setHasUnsavedChanges(false)
    
    // Reset history
    setHistoryStack([{
      keyboard: emptyKeyboard,
      timestamp: INITIAL_TIMESTAMP,
      description: '新規作成'
    }])
    setCurrentHistoryIndex(0)
  }

  const duplicate = () => {
    const baseName = currentFileName || currentKeyboard.metadata?.display_name || 'キーボード'
    const newName = generateNewName(`${baseName}_コピー`)
    
    const duplicatedKeyboard = {
      ...JSON.parse(JSON.stringify(currentKeyboard)),
      identifier: newName
    }
    
    saveKeyboardToLocal(newName, duplicatedKeyboard)
    setCurrentKeyboard(duplicatedKeyboard)
    setCurrentFileName(newName)
    setLastSavedState(duplicatedKeyboard)
    setHasUnsavedChanges(false)
    
    // Reset history
    setHistoryStack([{
      keyboard: duplicatedKeyboard,
      timestamp: INITIAL_TIMESTAMP,
      description: `${baseName} を複製`
    }])
    setCurrentHistoryIndex(0)
  }

  const jumpToHistory = (index: number) => {
    if (index >= 0 && index < historyStack.length) {
      setCurrentHistoryIndex(index)
      setCurrentKeyboard(historyStack[index].keyboard)
    }
  }

  const undo = () => {
    if (currentHistoryIndex > 0) {
      jumpToHistory(currentHistoryIndex - 1)
    }
  }

  const redo = () => {
    if (currentHistoryIndex < historyStack.length - 1) {
      jumpToHistory(currentHistoryIndex + 1)
    }
  }

  const canUndo = currentHistoryIndex > 0
  const canRedo = currentHistoryIndex < historyStack.length - 1

  return {
    // State
    currentKeyboard,
    currentFileName,
    savedNames,
    historyStack,
    currentHistoryIndex,
    hasUnsavedChanges,
    lastSavedState,
    
    // Actions
    updateKeyboard,
    save,
    saveAs,
    open,
    deleteFile,
    renameFile,
    newFile,
    duplicate,
    jumpToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    
    // Batch operations
    batchDelete: (names: string[]) => {
      names.forEach(name => deleteFile(name))
    },
    batchExport: (names: string[]) => {
      names.forEach(name => {
        try {
          const raw = localStorage.getItem(`custard:keyboard:${name}`)
          if (raw) {
            const keyboard = JSON.parse(raw) as CustardKeyboard
            const dataStr = JSON.stringify(keyboard, null, 2)
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
            
            const linkElement = document.createElement('a')
            linkElement.setAttribute('href', dataUri)
            linkElement.setAttribute('download', `${name}.json`)
            linkElement.click()
          }
        } catch (error) {
          console.error(`Export failed for ${name}:`, error)
        }
      })
    },
    
    // Utilities
    loadSavedNames,
    generateNewName
  }
}
