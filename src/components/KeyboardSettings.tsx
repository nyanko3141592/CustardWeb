import React, { useState } from 'react'
import { CustardKeyboard } from '@/types/custard'

interface KeyboardSettingsProps {
  keyboard: CustardKeyboard
  onChange: (keyboard: CustardKeyboard) => void
}

export default function KeyboardSettings({ keyboard, onChange }: KeyboardSettingsProps) {
  const [openSections, setOpenSections] = useState({
    basic: true,
    layout: true,
    metadata: true,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const updateKeyboard = (updater: (kb: CustardKeyboard) => void) => {
    const newKeyboard = JSON.parse(JSON.stringify(keyboard))
    updater(newKeyboard)
    try {
      // Post-normalize all keys to keep CustardKit-required fields present
      // @ts-ignore
      newKeyboard.interface.keys = (newKeyboard.interface.keys as any[]).map((it: any) => ensureCustardRequired(it))
    } catch {}
    onChange(newKeyboard)
  }

  // Ensure required fields for CustardKit decoding: longpress_actions (object) and variations (array)
  const ensureCustardRequired = (item: any) => {
    if (!item) return item
    const isWrapper = !!item.key_type
    const k = isWrapper ? item.key : item
    if (item.key_type === 'system') return item
    if (!k.longpress_actions || typeof k.longpress_actions !== 'object') {
      k.longpress_actions = { duration: 'normal', start: [], repeat: [] }
    } else {
      k.longpress_actions.start = Array.isArray(k.longpress_actions.start) ? k.longpress_actions.start : []
      k.longpress_actions.repeat = Array.isArray(k.longpress_actions.repeat) ? k.longpress_actions.repeat : []
      k.longpress_actions.duration = k.longpress_actions.duration || 'normal'
    }
    if (!Array.isArray(k.variations)) {
      k.variations = []
    } else {
      k.variations = k.variations.map((v: any) => {
        if (v && v.key) {
          const vk = v.key
          if (!vk.longpress_actions || typeof vk.longpress_actions !== 'object') {
            vk.longpress_actions = { duration: 'normal', start: [], repeat: [] }
          } else {
            vk.longpress_actions.start = Array.isArray(vk.longpress_actions.start) ? vk.longpress_actions.start : []
            vk.longpress_actions.repeat = Array.isArray(vk.longpress_actions.repeat) ? vk.longpress_actions.repeat : []
            vk.longpress_actions.duration = vk.longpress_actions.duration || 'normal'
          }
          return { ...v, key: vk }
        }
        return v
      })
    }
    return item
  }

  return (
    <div className="space-y-4">
      {/* Basic Settings */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => toggleSection('basic')}
            className="text-left text-xs font-semibold text-gray-600"
          >
            基本設定 {openSections.basic ? '▾' : '▸'}
          </button>
        </div>
        {openSections.basic && (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">識別子 (identifier)</label>
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                type="text"
                value={keyboard.identifier}
                onChange={(e) => updateKeyboard(kb => { kb.identifier = e.target.value })}
                pattern="[a-zA-Z0-9_]+"
                placeholder="英数字とアンダースコアのみ"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">言語 (language)</label>
              <select
                className="w-full border rounded px-2 py-1 text-sm"
                value={keyboard.language}
                onChange={(e) => updateKeyboard(kb => { 
                  kb.language = e.target.value
                  // サポートされていない組み合わせの場合はdirectに変更
                  const validCombinations = [
                    { language: 'ja_JP', input_style: 'direct' },
                    { language: 'ja_JP', input_style: 'roman2kana' },
                    { language: 'ja_JP', input_style: 'flick' },
                    { language: 'en_US', input_style: 'direct' },
                    { language: 'en_US', input_style: 'roman2kana' },
                    { language: 'el_GR', input_style: 'direct' }
                  ]
                  const isValid = validCombinations.some(combo => 
                    combo.language === e.target.value && combo.input_style === kb.input_style
                  )
                  if (!isValid) {
                    kb.input_style = 'direct'
                  }
                })}
              >
                <option value="ja_JP">日本語 (ja_JP)</option>
                <option value="en_US">英語 (en_US)</option>
                <option value="zh_CN">中国語簡体字 (zh_CN)</option>
                <option value="zh_TW">中国語繁体字 (zh_TW)</option>
                <option value="ko_KR">韓国語 (ko_KR)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">入力スタイル (input_style)</label>
              <select
                className="w-full border rounded px-2 py-1 text-sm"
                value={keyboard.input_style}
                onChange={(e) => updateKeyboard(kb => { kb.input_style = e.target.value })}
              >
                <option value="direct">直接入力 (direct)</option>
                <option value="roman2kana">ローマ字→かな (roman2kana)</option>
                <option value="flick">フリック入力 (flick)</option>
              </select>
              {keyboard.language !== 'ja_JP' && keyboard.input_style !== 'direct' && (
                <div className="text-xs text-orange-600 mt-1">
                  ⚠️ {keyboard.language}では直接入力(direct)のみ対応
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Layout Settings */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => toggleSection('layout')}
            className="text-left text-xs font-semibold text-gray-600"
          >
            レイアウト設定 {openSections.layout ? '▾' : '▸'}
          </button>
        </div>
        {openSections.layout && (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">キースタイル (key_style)</label>
              <select
                className="w-full border rounded px-2 py-1 text-sm"
                value={keyboard.interface.key_style}
                onChange={(e) => updateKeyboard(kb => { kb.interface.key_style = e.target.value as 'pc_style' | 'tenkey_style' })}
              >
                <option value="pc_style">PCスタイル (pc_style)</option>
                <option value="tenkey_style">テンキースタイル (tenkey_style)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">レイアウトタイプ</label>
              <select
                className="w-full border rounded px-2 py-1 text-sm"
                value={keyboard.interface.key_layout.type}
                onChange={(e) => updateKeyboard(kb => { kb.interface.key_layout.type = e.target.value as 'grid_fit' | 'grid_scroll' })}
              >
                <option value="grid_fit">グリッドフィット (grid_fit)</option>
                <option value="grid_scroll">グリッドスクロール (grid_scroll)</option>
              </select>
            </div>
            {keyboard.interface.key_layout.type === 'grid_fit' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">横列数 (row_count)</label>
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      type="number"
                      min={1}
                      max={20}
                      value={keyboard.interface.key_layout.row_count || 10}
                      onChange={(e) => updateKeyboard(kb => { 
                        const newRowCount = Math.max(1, Math.min(20, Number(e.target.value)))
                        const oldRowCount = kb.interface.key_layout.row_count || 10
                        kb.interface.key_layout.row_count = newRowCount
                        
                        // 範囲外のキーを削除 (X軸・横方向チェック)
                        if (newRowCount < oldRowCount) {
                          const oldCount = kb.interface.keys.length
                          kb.interface.keys = kb.interface.keys.filter((item: any) => {
                            const spec = item.specifier || (item.key_type && item.specifier) || {}
                            const x = spec.x || 0
                            const width = spec.width || 1
                            return x + width <= newRowCount
                          })
                          const removedCount = oldCount - kb.interface.keys.length
                          if (removedCount > 0) {
                            console.log(`横列数縮小により${removedCount}個のキーを削除しました`)
                          }
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">縦行数 (column_count)</label>
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      type="number"
                      min={1}
                      max={30}
                      value={keyboard.interface.key_layout.column_count || 4}
                      onChange={(e) => updateKeyboard(kb => { 
                        const newColCount = Math.max(1, Math.min(30, Number(e.target.value)))
                        const oldColCount = kb.interface.key_layout.column_count || 4
                        kb.interface.key_layout.column_count = newColCount
                        
                        // 範囲外のキーを削除 (Y軸・縦方向チェック)
                        if (newColCount < oldColCount) {
                          const oldCount = kb.interface.keys.length
                          kb.interface.keys = kb.interface.keys.filter((item: any) => {
                            const spec = item.specifier || (item.key_type && item.specifier) || {}
                            const y = spec.y || 0
                            const height = spec.height || 1
                            return y + height <= newColCount
                          })
                          const removedCount = oldCount - kb.interface.keys.length
                          if (removedCount > 0) {
                            console.log(`縦行数縮小により${removedCount}個のキーを削除しました`)
                          }
                        }
                      })}
                    />
                  </div>
                </div>
                <div className="text-[10px] text-gray-400">
                  現在: 横{keyboard.interface.key_layout.row_count || 10}列 × 縦{keyboard.interface.key_layout.column_count || 4}行 グリッド
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Metadata */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => toggleSection('metadata')}
            className="text-left text-xs font-semibold text-gray-600"
          >
            メタデータ {openSections.metadata ? '▾' : '▸'}
          </button>
        </div>
        {openSections.metadata && (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">表示名 (display_name)</label>
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                type="text"
                value={keyboard.metadata?.display_name || ''}
                onChange={(e) => updateKeyboard(kb => { 
                  if (!kb.metadata) kb.metadata = { custard_version: '1.2', display_name: '' }
                  kb.metadata.display_name = e.target.value 
                })}
                placeholder="ユーザーに表示される名前"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-0.5">Custardバージョン</label>
              <input
                className="w-full border rounded px-2 py-1 text-sm bg-gray-50"
                type="text"
                value={keyboard.metadata?.custard_version || '1.2'}
                disabled
              />
            </div>
          </div>
        )}
      </section>

      {/* Keyboard Operations */}
      <section className="border-t pt-3">
        <div className="text-xs font-semibold text-gray-600 mb-2">キーボード操作</div>
        <div className="space-y-2">
          {/* 破壊的な操作 */}
          <div className="space-y-1.5">
            <button
              onClick={() => {
                if (confirm('すべてのキーをクリアしますか？')) {
                  updateKeyboard(kb => { kb.interface.keys = [] })
                }
              }}
              className="w-full px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100"
            >
              🗑️ すべてのキーをクリア
            </button>
            {/* 新: フリック方向を削除（基準キーのみ残す）*/}
            <button
              onClick={() => {
                if (confirm('全キーで「キーの形」はそのままに、フリック方向（variations）を削除し、メインのラベルとメインのアクションだけを残します。よろしいですか？')) {
                  updateKeyboard(kb => {
                    kb.interface.keys = kb.interface.keys.map((item: any) => {
                      const newItem = JSON.parse(JSON.stringify(item))

                      const simplifyBaseKey = (k: any) => {
                        // ラベル: メインのみを残す（system_imageは維持）
                        const curr = k.design?.label
                        let labelType = 'text'
                        let labelContent: any = { text: '' }
                        if (curr) {
                          if (typeof curr.system_image === 'string') {
                            labelType = 'system_image'
                            labelContent = { system_image: curr.system_image }
                          } else if (typeof curr.text === 'string') {
                            labelType = 'text'
                            labelContent = { text: curr.text }
                          } else if (typeof curr.main === 'string') {
                            labelType = 'text'
                            labelContent = { text: curr.main }
                          } else if (curr.main && typeof curr.main.text === 'string') {
                            labelType = 'text'
                            labelContent = { text: curr.main.text }
                          }
                        }
                        k.design = { label: { type: labelType, ...labelContent }, color: k.design?.color || 'normal' }

                        // メインアクションのみ保持
                        const pa = k.press_actions || []
                        k.press_actions = pa.length > 0 ? [pa[0]] : []

                        // フリックとロングプレスは削除
                        delete k.longpress_actions
                        delete k.variations
                      }

                      if (newItem.key_type) {
                        // KeyWrapper形式
                        if (newItem.key_type === 'custom' && newItem.key) simplifyBaseKey(newItem.key)
                        // systemキーはそのまま
                      } else {
                        // Key形式
                        simplifyBaseKey(newItem)
                      }
                      return ensureCustardRequired(newItem)
                    })
                  })
                }
              }}
              className="w-full px-3 py-1.5 text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 rounded hover:bg-yellow-100"
            >
              ➖ フリック方向を削除（基準キーのみ残す）
            </button>
          </div>
          
          {/* 部分的クリア操作 */}
          <div className="border-t pt-2 space-y-1.5">
            <div className="text-[10px] text-gray-500 mb-1">部分クリア (キーの形状を保持)</div>
            <button
              onClick={() => {
                if (confirm('全キーのメインラベルとメインアクションのみ残し、フリック構造は保持してアクションを簡素化しますか？')) {
                  updateKeyboard(kb => {
                    kb.interface.keys = kb.interface.keys.map((item: any) => {
                      const newItem = JSON.parse(JSON.stringify(item))
                      const setLPDefault = (obj: any) => {
                        obj.longpress_actions = { start: [], repeat: [], duration: 'normal' }
                      }
                      const simplifyKey = (k: any) => {
                        const currentLabel = k.design?.label
                        let labelType = 'text'
                        let labelContent: any = { text: '' }
                        if (currentLabel) {
                          if (typeof currentLabel.text === 'string') {
                            labelType = 'text'; labelContent = { text: currentLabel.text }
                          } else if (typeof currentLabel.main === 'string') {
                            labelType = 'text'; labelContent = { text: currentLabel.main }
                          } else if (currentLabel.main && typeof currentLabel.main.text === 'string') {
                            labelType = 'text'; labelContent = { text: currentLabel.main.text }
                          } else if (typeof currentLabel.system_image === 'string') {
                            labelType = 'system_image'; labelContent = { system_image: currentLabel.system_image }
                          }
                        }
                        k.design = { label: { type: labelType, ...labelContent }, color: k.design?.color || 'normal' }
                        const currentPressActions = k.press_actions || []
                        k.press_actions = currentPressActions.length > 0 ? [currentPressActions[0]] : []
                        setLPDefault(k)
                        // variations は保持し、中のキーも簡素化
                        if (Array.isArray(k.variations)) {
                          k.variations = k.variations.map((v: any) => {
                            if (v && v.key) {
                              const vk = JSON.parse(JSON.stringify(v.key))
                              const vpa = vk.press_actions || []
                              vk.press_actions = vpa.length > 0 ? [vpa[0]] : []
                              setLPDefault(vk)
                              return { ...v, key: vk }
                            }
                            return v
                          })
                        }
                      }
                      if (newItem.key_type) {
                        if (newItem.key_type === 'custom' && newItem.key) simplifyKey(newItem.key)
                      } else {
                        simplifyKey(newItem)
                      }
                      return ensureCustardRequired(newItem)
                    })
                  })
                }
              }}
              className="w-full px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
            >
              🎯 メインラベル/アクションのみ保持（フリック構造は保持）
            </button>
            <button
              onClick={() => {
                if (confirm('全キーのラベルとアクションをクリアしますか？')) {
                  updateKeyboard(kb => {
                    kb.interface.keys = kb.interface.keys.map((item: any) => {
                      const newItem = JSON.parse(JSON.stringify(item))
                      if (newItem.key_type) {
                        // KeyWrapper形式
                        if (newItem.key_type === 'custom' && newItem.key) {
                          newItem.key.design = { label: { type: 'text', text: '' }, color: newItem.key.design?.color || 'normal' }
                          newItem.key.press_actions = []
                          delete newItem.key.longpress_actions
                        }
                      } else {
                        // Key形式
                        newItem.design = { label: { type: 'text', text: '' }, color: newItem.design?.color || 'normal' }
                        newItem.press_actions = []
                        delete newItem.longpress_actions
                      }
                      return ensureCustardRequired(newItem)
                    })
                  })
                }
              }}
              className="w-full px-3 py-1.5 text-sm bg-orange-50 text-orange-700 border border-orange-200 rounded hover:bg-orange-100"
            >
              🏷️ ラベル・アクションを全クリア
            </button>

            {/* サブラベルを全クリア（基準＋フリック） */}
            <button
              onClick={() => {
                if (confirm('全キーのサブラベル（main_and_subのsub）を空にします。フリック側も対象です。よろしいですか？')) {
                  updateKeyboard(kb => {
                    const normalizeMainSub = (label: any) => {
                      if (!label) return label
                      // system_image や text はそのまま
                      if (typeof label.system_image === 'string' || typeof label.text === 'string') return label
                      const main = typeof label.main === 'string' ? label.main : (label.main?.text || '')
                      return { type: 'main_and_sub', main, sub: '' }
                    }
                    const clearForKey = (k: any) => {
                      k.design = k.design || {}
                      k.design.label = normalizeMainSub(k.design.label)
                      if (Array.isArray(k.variations)) {
                        k.variations = k.variations.map((v: any) => {
                          if (v && v.key) {
                            const vk = JSON.parse(JSON.stringify(v.key))
                            vk.design = vk.design || {}
                            vk.design.label = normalizeMainSub(vk.design.label)
                            return { ...v, key: vk }
                          }
                          return v
                        })
                      }
                    }
                    kb.interface.keys = kb.interface.keys.map((item: any) => {
                      const newItem = JSON.parse(JSON.stringify(item))
                      if (newItem.key_type) {
                        if (newItem.key_type === 'custom' && newItem.key) clearForKey(newItem.key)
                      } else {
                        clearForKey(newItem)
                      }
                      return ensureCustardRequired(newItem)
                    })
                  })
                }
              }}
              className="w-full px-3 py-1.5 text-sm bg-teal-50 text-teal-700 border border-teal-200 rounded hover:bg-teal-100"
            >
              🧹 サブラベルを全クリア（基準＋フリック）
            </button>

            {/* ラベルをTextに統一（main優先） */}
            <button
              onClick={() => {
                if (confirm('全キーのラベルをTextに統一します（main > text > system_imageの順で採用）。フリック側も対象です。よろしいですか？')) {
                  updateKeyboard(kb => {
                    const collapseToText = (label: any) => {
                      if (!label) return { type: 'text', text: '' }
                      if (typeof label.system_image === 'string') return { type: 'system_image', system_image: label.system_image }
                      if (typeof label.text === 'string') return { type: 'text', text: label.text }
                      const main = typeof label.main === 'string' ? label.main : (label.main?.text || '')
                      return { type: 'text', text: main }
                    }
                    const processKey = (k: any) => {
                      k.design = k.design || {}
                      k.design.label = collapseToText(k.design.label)
                      if (Array.isArray(k.variations)) {
                        k.variations = k.variations.map((v: any) => {
                          if (v && v.key) {
                            const vk = JSON.parse(JSON.stringify(v.key))
                            vk.design = vk.design || {}
                            vk.design.label = collapseToText(vk.design.label)
                            return { ...v, key: vk }
                          }
                          return v
                        })
                      }
                    }
                    kb.interface.keys = kb.interface.keys.map((item: any) => {
                      const newItem = JSON.parse(JSON.stringify(item))
                      if (newItem.key_type) {
                        if (newItem.key_type === 'custom' && newItem.key) processKey(newItem.key)
                      } else {
                        processKey(newItem)
                      }
                      return newItem
                    })
                  })
                }
              }}
              className="w-full px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-100"
            >
              🔤 ラベルをTextに統一（main優先）
            </button>
            <button
              onClick={() => {
                if (confirm('全キーのフリック内アクションをクリア（variation自体は保持）しますか？')) {
                  updateKeyboard(kb => {
                    kb.interface.keys = kb.interface.keys.map((item: any) => {
                      const newItem = JSON.parse(JSON.stringify(item))
                      const resetVarKey = (vk: any) => {
                        // ラベルは保持、アクションは先頭のみ、LPはデフォルト
                        const vpa = vk.press_actions || []
                        vk.press_actions = vpa.length > 0 ? [vpa[0]] : []
                        vk.longpress_actions = { start: [], repeat: [], duration: 'normal' }
                      }
                      const processKey = (k: any) => {
                        if (Array.isArray(k.variations)) {
                          k.variations = k.variations.map((v: any) => {
                            if (v && v.key) {
                              const vk = JSON.parse(JSON.stringify(v.key))
                              resetVarKey(vk)
                              return { ...v, key: vk }
                            }
                            return v
                          })
                        }
                      }
                      if (newItem.key_type) {
                        if (newItem.key_type === 'custom' && newItem.key) processKey(newItem.key)
                      } else {
                        processKey(newItem)
                      }
                      return newItem
                    })
                  })
                }
              }}
              className="w-full px-3 py-1.5 text-sm bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100"
            >
              🔄 フリック内アクションをクリア（構造は保持）
            </button>
            <button
              onClick={() => {
                if (confirm('全キーのロングプレスアクションをクリアしますか？')) {
                  updateKeyboard(kb => {
                    kb.interface.keys = kb.interface.keys.map((item: any) => {
                      const newItem = JSON.parse(JSON.stringify(item))
                      if (newItem.key_type) {
                        // KeyWrapper形式
                        if (newItem.key_type === 'custom' && newItem.key) {
                          newItem.key.longpress_actions = { duration: 'normal', start: [], repeat: [] }
                          if (!Array.isArray(newItem.key.variations)) newItem.key.variations = []
                        }
                      } else {
                        // Key形式
                        newItem.longpress_actions = { duration: 'normal', start: [], repeat: [] }
                        if (!Array.isArray(newItem.variations)) newItem.variations = []
                      }
                      return ensureCustardRequired(newItem)
                    })
                  })
                }
              }}
              className="w-full px-3 py-1.5 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100"
            >
              ⏳ ロングプレスを全クリア
            </button>
          </div>
          
          {/* ユーティリティ操作 */}
          <div className="border-t pt-2 space-y-1.5">
            <div className="text-[10px] text-gray-500 mb-1">ユーティリティ</div>
            <button
              onClick={() => {
                const rows = keyboard.interface.key_layout.column_count || 4  // 縦行数
                const cols = keyboard.interface.key_layout.row_count || 10     // 横列数
                const newKeys: any[] = []
                for (let y = 0; y < rows; y++) {
                  for (let x = 0; x < cols; x++) {
                    newKeys.push({
                      key_type: 'custom',
                      specifier_type: 'grid_fit',
                      specifier: { x, y, width: 1, height: 1 },
                      key: {
                        design: { 
                          label: { type: 'text', text: '' },
                          color: 'normal'
                        },
                        press_actions: [],
                        longpress_actions: { duration: 'normal', start: [], repeat: [] },
                        variations: []
                      }
                    })
                  }
                }
                updateKeyboard(kb => { kb.interface.keys = (newKeys as any).map((it:any)=>ensureCustardRequired(it)) })
              }}
              className="w-full px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
            >
              🎆 空のグリッドで埋める
            </button>
            <button
              onClick={() => {
                const json = JSON.stringify(keyboard, null, 2)
                navigator.clipboard.writeText(json)
                alert('JSONをクリップボードにコピーしました')
              }}
              className="w-full px-3 py-1.5 text-sm bg-gray-100 text-gray-700 border border-gray-200 rounded hover:bg-gray-200"
            >
              📎 JSONをコピー
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
