'use client'

import React, { useState, useEffect } from 'react'
import { CustardKeyboard } from '@/types/custard'
import { ChevronRight, ChevronDown, File, Clock, Save, FolderOpen, Trash2, Download, Upload, RotateCcw, Plus, Copy, Edit3, Check, X, CheckSquare, Square } from 'lucide-react'

interface FileManagerProps {
  currentKeyboard: CustardKeyboard
  currentFileName: string | null
  savedNames: string[]
  historyStack: Array<{keyboard: CustardKeyboard, timestamp: Date, description: string}>
  currentHistoryIndex: number
  onSave: (name?: string) => void
  onSaveAs: () => void
  onOpen: (name: string) => void
  onDelete: (name: string) => void
  onBatchDelete: (names: string[]) => void
  onBatchExport: (names: string[]) => void
  onRename: (oldName: string, newName: string) => void
  onNewFile: () => void
  onDuplicate: () => void
  onExport: () => void
  onImport: (file: File) => void
  onHistoryJump: (index: number) => void
  onUndo: () => void
  onRedo: () => void
  hasUnsavedChanges: boolean
}

export default function FileManager({
  currentKeyboard,
  currentFileName,
  savedNames,
  historyStack,
  currentHistoryIndex,
  onSave,
  onSaveAs,
  onOpen,
  onDelete,
  onBatchDelete,
  onBatchExport,
  onRename,
  onNewFile,
  onDuplicate,
  onExport,
  onImport,
  onHistoryJump,
  onUndo,
  onRedo,
  hasUnsavedChanges
}: FileManagerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['files', 'history']))
  const [selectedFile, setSelectedFile] = useState<string | null>(currentFileName)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string>('')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState<boolean>(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => { setHasMounted(true) }, [])

  // Keep internal selection in sync with the actual current file
  useEffect(() => {
    setSelectedFile(currentFileName)
  }, [currentFileName])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const handleFileClick = (name: string) => {
    if (hasUnsavedChanges) {
      const confirmed = confirm(`現在のファイル「${currentFileName || '無題'}」には未保存の変更があります。保存しますか？`)
      if (confirmed) {
        onSave()
      }
    }
    onOpen(name)
    setSelectedFile(name)
  }

  const handleDelete = (name: string) => {
    setShowDeleteConfirm(name)
  }

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      onDelete(showDeleteConfirm)
      if (selectedFile === showDeleteConfirm) {
        setSelectedFile(null)
      }
      setShowDeleteConfirm(null)
    }
  }

  const startRename = (name: string) => {
    setEditingFile(name)
    setEditingName(name)
  }

  const cancelRename = () => {
    setEditingFile(null)
    setEditingName('')
  }

  const confirmRename = () => {
    if (editingFile && editingName.trim() && editingName.trim() !== editingFile) {
      onRename(editingFile, editingName.trim())
    }
    cancelRename()
  }

  const handleRenameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      confirmRename()
    } else if (e.key === 'Escape') {
      cancelRename()
    }
  }

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode)
    setSelectedFiles(new Set())
  }

  const toggleFileSelection = (name: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const selectAllFiles = () => {
    setSelectedFiles(new Set(savedNames))
  }

  const clearSelection = () => {
    setSelectedFiles(new Set())
  }

  const handleBatchDelete = () => {
    if (selectedFiles.size === 0) return
    
    const fileList = Array.from(selectedFiles)
    const confirmed = confirm(`選択した${fileList.length}個のファイルを削除しますか？この操作は取り消せません。`)
    
    if (confirmed) {
      onBatchDelete(fileList)
      setSelectedFiles(new Set())
      setSelectionMode(false)
    }
  }

  const handleBatchExport = () => {
    if (selectedFiles.size === 0) return
    
    const fileList = Array.from(selectedFiles)
    onBatchExport(fileList)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImport(file)
    }
  }

  const formatTime = (date: Date) => {
    // During SSR/first client render, use a deterministic string to avoid hydration mismatch.
    if (!hasMounted) return new Date(date).toISOString().slice(0, 10)
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    if (minutes < 1) return '今'
    if (minutes < 60) return `${minutes}分前`
    if (hours < 24) return `${hours}時間前`
    try { return new Date(date).toLocaleDateString('ja-JP') } catch { return new Date(date).toISOString().slice(0, 10) }
  }

  const getActionEmoji = (description: string) => {
    const desc = description.toLowerCase()
    if (desc.includes('初期') || desc.includes('作成') || desc.includes('新規')) return '🎯'
    if (desc.includes('キー') && desc.includes('追加')) return '➕'
    if (desc.includes('キー') && desc.includes('削除')) return '🗑️'
    if (desc.includes('キー') && desc.includes('編集')) return '✏️'
    if (desc.includes('設定') || desc.includes('キーボード設定')) return '⚙️'
    if (desc.includes('保存')) return '💾'
    if (desc.includes('開き')) return '📂'
    if (desc.includes('複製')) return '📋'
    if (desc.includes('json') || desc.includes('JSON')) return '📄'
    if (desc.includes('削除')) return '🗑️'
    if (desc.includes('編集')) return '✏️'
    if (desc.includes('変更')) return '🔄'
    return '📝'
  }

  const canUndo = currentHistoryIndex > 0
  const canRedo = currentHistoryIndex < historyStack.length - 1

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-blue-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900">ファイル管理</h3>
              <p className="text-xs text-gray-600">
                {currentFileName || '無題'}
                {hasUnsavedChanges && <span className="text-orange-600 ml-1">*</span>}
              </p>
            </div>
          </div>
        </div>
        
        {/* Primary Actions */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onNewFile}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg flex items-center space-x-2 text-sm font-medium text-gray-700 transition-colors"
              title="空のキーボード作成"
            >
              <Plus className="w-4 h-4" />
              <span>新規作成</span>
            </button>
            
            <button
              onClick={() => onSave()}
              disabled={!hasUnsavedChanges}
              className={`px-3 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium transition-colors ${
                hasUnsavedChanges
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title="保存 (Cmd/Ctrl+S)"
            >
              <Save className="w-4 h-4" />
              <span>保存</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onSaveAs}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg flex items-center space-x-2 text-sm text-gray-700 transition-colors"
              title="名前を付けて保存"
            >
              <Copy className="w-4 h-4" />
              <span>別名保存</span>
            </button>
            
            <button
              onClick={onDuplicate}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg flex items-center space-x-2 text-sm text-gray-700 transition-colors"
              title="現在のファイルを複製"
            >
              <Copy className="w-4 h-4" />
              <span>複製</span>
            </button>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Saved Files Section */}
        <div className={`${!expandedSections.has('files') ? '' : 'border-b border-gray-200 dark:border-gray-700'}`}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => toggleSection('files')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('files') }}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {expandedSections.has('files') ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
              <File className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-800">保存済みファイル</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{savedNames.length}</span>
            </div>
            
            {savedNames.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSelectionMode()
                }}
                className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${
                  selectionMode 
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={selectionMode ? '選択モード終了' : '複数選択'}
              >
                {selectionMode ? '完了' : '選択'}
              </button>
            )}
          </div>
          
          {expandedSections.has('files') && (
            <div className="px-2 pb-2">
              {/* Batch Actions */}
              {selectionMode && (
                <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-orange-700">
                      {selectedFiles.size > 0 ? `${selectedFiles.size}個のファイルを選択中` : '複数選択モード'}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={selectAllFiles}
                        className="px-2 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-full font-medium"
                      >
                        全選択
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-2 py-1 text-xs bg-white hover:bg-gray-50 border border-orange-200 text-orange-700 rounded-full font-medium"
                      >
                        解除
                      </button>
                    </div>
                  </div>
                  {selectedFiles.size > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleBatchExport}
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        一括出力
                      </button>
                      <button
                        onClick={handleBatchDelete}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        一括削除
                      </button>
                    </div>
                  )}
                </div>
              )}

              {savedNames.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <File className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-1">保存済みファイルがありません</p>
                  <p className="text-xs text-gray-400">「新規作成」または「読み込み」でファイルを作成してください</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {savedNames.map(name => (
                    <div
                      key={name}
                      className={`flex items-center justify-between px-3 py-2 mx-2 rounded-lg transition-all duration-200 ${
                        selectedFile === name 
                          ? 'bg-blue-100 border border-blue-200 shadow-sm' 
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {selectionMode ? (
                          <button
                            onClick={() => toggleFileSelection(name)}
                            className="flex-shrink-0"
                          >
                            {selectedFiles.has(name) ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            )}
                          </button>
                        ) : (
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            selectedFile === name ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                        )}
                        {editingFile === name ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={handleRenameKeyPress}
                            className="text-sm flex-1 min-w-0 px-1 py-0.5 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                            autoFocus
                            onBlur={confirmRename}
                          />
                        ) : (
                          <span 
                            className={`text-sm truncate cursor-pointer flex-1 font-medium ${
                              selectedFile === name ? 'text-blue-900' : 'text-gray-700'
                            }`}
                            onClick={() => handleFileClick(name)}
                          >
                            {name}
                          </span>
                        )}
                        {currentFileName === name && hasUnsavedChanges && (
                          <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0 animate-pulse" />
                            <span className="text-xs text-orange-600 font-medium">未保存</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {editingFile === name ? (
                          <>
                            <button
                              onClick={confirmRename}
                              className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded"
                              title="確定"
                            >
                              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </button>
                            <button
                              onClick={cancelRename}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              title="キャンセル"
                            >
                              <X className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                            </button>
                          </>
                        ) : (
                          !selectionMode && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startRename(name)
                                }}
                                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                                title="名前を変更"
                              >
                                <Edit3 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(name)
                                }}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                                title="削除"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                              </button>
                            </>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Spacer when files are collapsed */}
        {!expandedSections.has('files') && <div className="flex-1" />}
      </div>


      {/* Import/Export */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">ファイル操作</h4>
        <div className="space-y-2">
          <button
            onClick={handleImportClick}
            className="w-full px-3 py-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium text-green-700"
          >
            <Upload className="w-4 h-4" />
            <span>JSONファイルを読み込み</span>
          </button>
          <button
            onClick={onExport}
            className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium text-blue-700"
          >
            <Download className="w-4 h-4" />
            <span>現在のファイルを出力</span>
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-sm">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">ファイルを削除</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              「{showDeleteConfirm}」を削除してもよろしいですか？この操作は取り消せません。
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                キャンセル
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
